from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date
import os
import models
from database import engine, get_db
from pydantic import BaseModel
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header, WebSocket, WebSocketDisconnect
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import CountVectorizer
import numpy as np

# Create Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Load AI Model (Small, fast)
model = SentenceTransformer('all-MiniLM-L6-v2')

# CONFIG
APP_PASSWORD = os.getenv("APP_PASSWORD", "secret")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# --- AUTHENTICATION ---
def verify_token(x_token: str = Header(None)):
    if x_token != "valid_token":
        raise HTTPException(status_code=401, detail="Invalid Value")

class LoginSchema(BaseModel):
    password: str

@app.post("/login")
def login(data: LoginSchema):
    if data.password == APP_PASSWORD:
        return {"token": "valid_token"}
    raise HTTPException(status_code=401, detail="Incorrect Password")

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
    title: str
    content: str
    folder: str
    mood: str
    completed_habit_ids: List[int] = [] 

class EntryResponse(BaseModel):
    id: int
    title: str
    content: str
    folder: str
    mood: str
    date: str
    completed_habits: List[HabitSchema] = []
    class Config:
        orm_mode = True

class ReminderSchema(BaseModel):
    text: str
    date: str

class SearchSchema(BaseModel):
    query: str

class AutoTagSchema(BaseModel):
    content: str

# --- ENDPOINTS ---

# 1. Habits (Meta)
@app.get("/habits/", response_model=List[HabitSchema], dependencies=[Depends(verify_token)])
def read_habits(db: Session = Depends(get_db)):
    return db.query(models.Habit).filter(models.Habit.is_active == True).all()

@app.post("/habits/", response_model=HabitSchema, dependencies=[Depends(verify_token)])
def create_habit(habit: HabitCreate, db: Session = Depends(get_db)):
    db_habit = models.Habit(name=habit.name, icon=habit.icon)
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

@app.delete("/habits/{habit_id}", dependencies=[Depends(verify_token)])
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if habit:
        habit.is_active = False # Soft delete
        db.commit()
    return {"ok": True}

# 2. Entries
@app.post("/entries/", response_model=EntryResponse, dependencies=[Depends(verify_token)])
def create_entry(entry: EntryCreate, db: Session = Depends(get_db)):
    
    # Create basic entry
    db_entry = models.Entry(
        title=entry.title, 
        content=entry.content, 
        folder=entry.folder, 
        mood=entry.mood,
        date=str(date.today())
    )
    
    # Associate habits
    if entry.completed_habit_ids:
        habits = db.query(models.Habit).filter(models.Habit.id.in_(entry.completed_habit_ids)).all()
        db_entry.completed_habits = habits

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.put("/entries/{entry_id}", response_model=EntryResponse, dependencies=[Depends(verify_token)])
def update_entry(entry_id: int, entry: EntryCreate, db: Session = Depends(get_db)):
    db_entry = db.query(models.Entry).filter(models.Entry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db_entry.title = entry.title
    db_entry.content = entry.content
    db_entry.folder = entry.folder
    db_entry.mood = entry.mood
    # Update habits (replace existing)
    if entry.completed_habit_ids is not None:
         habits = db.query(models.Habit).filter(models.Habit.id.in_(entry.completed_habit_ids)).all()
         db_entry.completed_habits = habits
         
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/entries/", response_model=List[EntryResponse], dependencies=[Depends(verify_token)])
def read_entries(db: Session = Depends(get_db)):
    return db.query(models.Entry).order_by(desc(models.Entry.id)).all()

@app.delete("/entries/{entry_id}", status_code=204, dependencies=[Depends(verify_token)])
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    return None

# 3. Reminders
@app.get("/reminders/", dependencies=[Depends(verify_token)])
def read_reminders(db: Session = Depends(get_db)):
    return db.query(models.Reminder).order_by(models.Reminder.date).all()

@app.post("/reminders/", dependencies=[Depends(verify_token)])
def create_reminder(reminder: ReminderSchema, db: Session = Depends(get_db)):
    db_reminder = models.Reminder(text=reminder.text, date=reminder.date)
    db.add(db_reminder)
    db.commit()
    return db_reminder

@app.delete("/reminders/{reminder_id}", dependencies=[Depends(verify_token)])
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    rem = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if rem:
        db.delete(rem)
        db.commit()
    return {"ok": True}

# 4. Real-time WebSocket
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo for now, or handle commands
            await manager.broadcast(f"Client #{client_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 5. Semantic Search
@app.post("/search/", response_model=List[EntryResponse], dependencies=[Depends(verify_token)])
def semantic_search(search: SearchSchema, db: Session = Depends(get_db)):
    # 1. Get all entries
    entries = db.query(models.Entry).all()
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
@app.post("/autotag/", dependencies=[Depends(verify_token)])
def auto_tag(data: AutoTagSchema):
    text = data.content
    if not text or len(text.split()) < 5:
        return {"tags": []}

    # 1. Extract candidates (1-gram and 2-grams)
    # Stop words are removed by default English list
    try:
        vectorizer = CountVectorizer(ngram_range=(1, 2), stop_words='english', top_max_features=20)
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