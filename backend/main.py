from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from datetime import date, datetime, timedelta
import models
from database import engine, get_db
from pydantic import BaseModel, Field
from typing import List, Optional
import auth
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import CountVectorizer
import logging
import time

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- HEALTH CHECK ---
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check DB connection
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

# Load AI Model (Small, fast)
model = SentenceTransformer('all-MiniLM-L6-v2')

app.add_middleware(
    CORSMiddleware,
    # Restrict to frontend origin (local + prod)
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://venkatarohithj.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Path: {request.url.path} Method: {request.method} Status: {response.status_code} Duration: {process_time:.4f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {request.url.path} Error: {str(e)} Duration: {process_time:.4f}s", exc_info=True)
        raise e

# --- AUTHENTICATION ---
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> models.User:
    """
    Dependency to get current authenticated user from JWT token.
    Supports both Authorization: Bearer <token> and x-token header for backward compatibility.
    """
    token = credentials.credentials if credentials else None
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Decode JWT
    payload = auth.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Load user from database
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# --- AUTH SCHEMAS ---
class GoogleAuthSchema(BaseModel):
    credential: str  # Google ID token from frontend

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# --- AUTH ROUTES ---
@app.post("/auth/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthSchema, db: Session = Depends(get_db)):
    """
    Authenticate with Google OAuth.
    Accepts Google ID token from frontend, verifies it, and returns JWT.
    Creates user if first-time login.
    """
    # Verify Google token
    google_user = await auth.verify_google_token(data.credential)

    if not google_user:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    if not google_user.get('email_verified'):
        raise HTTPException(status_code=401, detail="Email not verified with Google")

    # Check if user exists
    user = db.query(models.User).filter(
        models.User.google_id == google_user['sub']
    ).first()

    if not user:
        # Check if email already exists (edge case: user registered before migration)
        existing_email = db.query(models.User).filter(
            models.User.email == google_user['email']
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email already registered with different auth method"
            )

        # Create new user
        user = models.User(
            email=google_user['email'],
            google_id=google_user['sub'],
            name=google_user.get('name'),
            picture=google_user.get('picture')
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info if changed
        user.name = google_user.get('name')
        user.picture = google_user.get('picture')
        db.commit()
        db.refresh(user)

    # Create JWT token (same as before)
    access_token = auth.create_access_token(data={"sub": str(user.id)})

    return {
        "token": access_token,
        "user": user
    }

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Get current authenticated user info.
    """
    return current_user

# --- SCHEMAS ---

class HabitSchema(BaseModel):
    id: int
    name: str
    icon: str
    is_active: bool
    class Config:
        orm_mode = True

class HabitCreate(BaseModel):
    name: str
    icon: str

class EntryCreate(BaseModel):
    title: str = Field(..., max_length=255)
    content: str = Field(..., max_length=20000)
    folder: str = Field(..., max_length=50)
    mood: str
    completed_habit_ids: List[int] = [] 

class EntryResponse(BaseModel):
    id: int
    title: str
    content: str
    folder: str
    mood: str
    date: date
    completed_habits: List[HabitSchema] = []
    class Config:
        orm_mode = True

class ReminderCreate(BaseModel):
    text: str
    date: str

class ReminderUpdate(BaseModel):
    completed: Optional[bool] = None

class ReminderResponse(BaseModel):
    id: int
    text: str
    date: str
    completed: bool
    class Config:
        orm_mode = True

class SearchSchema(BaseModel):
    query: str

class AutoTagSchema(BaseModel):
    content: str

# --- Task Schemas ---
class TaskCreate(BaseModel):
    text: str = Field(..., max_length=500)
    color: str = Field(default="green")  # green | yellow | red

class TaskUpdate(BaseModel):
    text: Optional[str] = None
    color: Optional[str] = None
    completed: Optional[bool] = None

class TaskResponse(BaseModel):
    id: int
    text: str
    color: str
    completed: bool
    created_at: datetime
    completed_at: Optional[datetime] = None
    class Config:
        orm_mode = True

# --- ENDPOINTS ---

# 1. Habits (Meta)
@app.get("/habits/", response_model=List[HabitSchema])
def read_habits(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Habit).filter(
        models.Habit.is_active == True,
        models.Habit.user_id == current_user.id
    ).all()

@app.post("/habits/", response_model=HabitSchema)
def create_habit(habit: HabitCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_habit = models.Habit(name=habit.name, icon=habit.icon, user_id=current_user.id)
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(
        models.Habit.id == habit_id,
        models.Habit.user_id == current_user.id
    ).first()
    if habit:
        habit.is_active = False # Soft delete
        db.commit()
    return {"ok": True}

# 2. Entries
@app.post("/entries/", response_model=EntryResponse)
def create_entry(entry: EntryCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    # Create basic entry
    db_entry = models.Entry(
        title=entry.title, 
        content=entry.content, 
        folder=entry.folder, 
        mood=entry.mood,
        date=date.today(),
        user_id=current_user.id
    )
    
    # Associate habits (only user's own habits)
    if entry.completed_habit_ids:
        habits = db.query(models.Habit).filter(
            models.Habit.id.in_(entry.completed_habit_ids),
            models.Habit.user_id == current_user.id
        ).all()
        db_entry.completed_habits = habits

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.put("/entries/{entry_id}", response_model=EntryResponse)
def update_entry(entry_id: int, entry: EntryCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_entry = db.query(models.Entry).filter(
        models.Entry.id == entry_id,
        models.Entry.user_id == current_user.id
    ).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db_entry.title = entry.title
    db_entry.content = entry.content
    db_entry.folder = entry.folder
    db_entry.mood = entry.mood
    # Update habits (replace existing, only user's own habits)
    if entry.completed_habit_ids is not None:
         habits = db.query(models.Habit).filter(
             models.Habit.id.in_(entry.completed_habit_ids),
             models.Habit.user_id == current_user.id
         ).all()
         db_entry.completed_habits = habits
         
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/entries/", response_model=List[EntryResponse])
def read_entries(skip: int = 0, limit: int = 50, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Entry).filter(
        models.Entry.user_id == current_user.id
    ).order_by(desc(models.Entry.id)).offset(skip).limit(limit).all()

@app.delete("/entries/{entry_id}", status_code=204)
def delete_entry(entry_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(models.Entry).filter(
        models.Entry.id == entry_id,
        models.Entry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    return None

# 3. Reminders
@app.get("/reminders/", response_model=List[ReminderResponse])
def read_reminders(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id
    ).order_by(models.Reminder.date).all()

@app.post("/reminders/", response_model=ReminderResponse)
def create_reminder(reminder: ReminderCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_reminder = models.Reminder(text=reminder.text, date=reminder.date, user_id=current_user.id)
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@app.patch("/reminders/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: int, reminder: ReminderUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    if reminder.completed is not None:
        db_reminder.completed = reminder.completed
        
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@app.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rem = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()
    if rem:
        db.delete(rem)
        db.commit()
    return {"ok": True}

# --- Tasks ---
@app.get("/tasks/", response_model=List[TaskResponse])
def read_tasks(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all tasks for the current user, ordered by creation date."""
    # Auto-archive: delete completed tasks older than 24h
    cutoff = datetime.utcnow() - timedelta(hours=24)
    db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.completed == True,
        models.Task.completed_at != None,
        models.Task.completed_at < cutoff
    ).delete(synchronize_session=False)
    db.commit()

    return db.query(models.Task).filter(
        models.Task.user_id == current_user.id
    ).order_by(models.Task.created_at).all()

@app.post("/tasks/", response_model=TaskResponse)
def create_task(task: TaskCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new task."""
    db_task = models.Task(
        text=task.text,
        color=task.color,
        user_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: TaskUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a task (toggle completion, change text, change color)."""
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.text is not None:
        db_task.text = task.text
    if task.color is not None:
        db_task.color = task.color
    if task.completed is not None:
        db_task.completed = task.completed
        db_task.completed_at = datetime.utcnow() if task.completed else None

    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a task."""
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    if task:
        db.delete(task)
        db.commit()
    return {"ok": True}

# 4. Semantic Search
@app.post("/search/", response_model=List[EntryResponse])
def semantic_search(search: SearchSchema, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Get all entries for current user
    entries = db.query(models.Entry).filter(models.Entry.user_id == current_user.id).all()
    if not entries:
        return []

    # 2. Prepare corpus
    # Combine title + content for better context
    corpus = [f"{e.title} {e.content}" for e in entries]
    
    # 3. Encode
    corpus_embeddings = model.encode(corpus)
    query_embedding = model.encode([search.query])

    # 4. Calculate Similarity
    similarities = cosine_similarity(query_embedding, corpus_embeddings)[0]

    # 5. Rank and Sort
    # Get top 5 indices
    top_n = 5
    # sort indices by score descending
    related_docs_indices = similarities.argsort()[::-1][:top_n]

    results = []
    for i in related_docs_indices:
        if similarities[i] > 0.2: # Threshold for relevance
            results.append(entries[i])
            
    return results

# 6. Auto-Tagging (KeyBERT-lite)
@app.post("/autotag/")
def auto_tag(data: AutoTagSchema, current_user: models.User = Depends(get_current_user)):
    text = data.content
    if not text or len(text.split()) < 5:
        return {"tags": []}

    # 1. Extract candidates (1-gram and 2-grams)
    # Stop words are removed by default English list
    try:
        vectorizer = CountVectorizer(ngram_range=(1, 2), stop_words='english', max_features=20)
        X = vectorizer.fit_transform([text])
        candidates = vectorizer.get_feature_names_out()
    except ValueError:
        return {"tags": []} # Text might be too short or only stop words

    # 2. Encode document and candidates
    doc_embedding = model.encode([text])
    candidate_embeddings = model.encode(candidates)

    # 3. Calculate similarity
    distances = cosine_similarity(doc_embedding, candidate_embeddings)

    # 4. Get top 3 keywords
    keywords = []
    indices = distances.argsort()[0][-3:] # Top 3
    for i in indices:
        keywords.append(candidates[i])
    
    # Reverse to get most relevant first
    keywords.reverse()

    return {"tags": keywords}

# 7. Export Data
@app.get("/export/json")
def export_json(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Export all user data as JSON.
    Includes entries, habits, and reminders.
    """
    # Get all user data
    entries = db.query(models.Entry).filter(models.Entry.user_id == current_user.id).all()
    habits = db.query(models.Habit).filter(
        models.Habit.user_id == current_user.id,
        models.Habit.is_active == True
    ).all()
    reminders = db.query(models.Reminder).filter(models.Reminder.user_id == current_user.id).all()
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()

    # Format data for export
    export_data = {
        "export_date": datetime.utcnow().isoformat(),
        "user": {
            "id": current_user.id,
            "email": current_user.email
        },
        "entries": [
            {
                "id": e.id,
                "title": e.title,
                "content": e.content,
                "folder": e.folder,
                "mood": e.mood,
                "date": e.date.isoformat(),
                "completed_habits": [{"id": h.id, "name": h.name, "icon": h.icon} for h in e.completed_habits]
            }
            for e in entries
        ],
        "habits": [
            {
                "id": h.id,
                "name": h.name,
                "icon": h.icon
            }
            for h in habits
        ],
        "reminders": [
            {
                "id": r.id,
                "text": r.text,
                "date": r.date,
                "completed": r.completed
            }
            for r in reminders
        ],
        "tasks": [
            {
                "id": t.id,
                "text": t.text,
                "color": t.color,
                "completed": t.completed,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None
            }
            for t in tasks
        ]
    }

    return export_data