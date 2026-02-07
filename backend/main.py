from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, desc, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import date
import os
import secrets
from typing import List, Optional

# CONFIG
APP_PASSWORD = os.getenv("APP_PASSWORD", "secret")

SQLALCHEMY_DATABASE_URL = "sqlite:///./garden.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---

# Many-to-Many Association Table
entry_habits = Table('entry_habits', Base.metadata,
    Column('entry_id', Integer, ForeignKey('entries.id')),
    Column('habit_id', Integer, ForeignKey('habits.id'))
)

class Habit(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # e.g., "Run", "Code"
    icon = Column(String, default="✅") # e.g., "🏃", "💻"
    is_active = Column(Boolean, default=True)

class Entry(Base):
    __tablename__ = "entries"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    folder = Column(String, default="Journal")
    mood = Column(String, default="😐")
    date = Column(String, default=str(date.today()))
    
    # Relationship to Habits
    completed_habits = relationship("Habit", secondary=entry_habits)

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    date = Column(String) 
    completed = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# --- ENDPOINTS ---

# 1. Habits (Meta)
@app.get("/habits/", response_model=List[HabitSchema], dependencies=[Depends(verify_token)])
def read_habits():
    db = SessionLocal()
    return db.query(Habit).filter(Habit.is_active == True).all()

@app.post("/habits/", response_model=HabitSchema, dependencies=[Depends(verify_token)])
def create_habit(habit: HabitCreate):
    db = SessionLocal()
    db_habit = Habit(name=habit.name, icon=habit.icon)
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

@app.delete("/habits/{habit_id}", dependencies=[Depends(verify_token)])
def delete_habit(habit_id: int):
    db = SessionLocal()
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if habit:
        habit.is_active = False # Soft delete
        db.commit()
    return {"ok": True}

# 2. Entries
@app.post("/entries/", response_model=EntryResponse, dependencies=[Depends(verify_token)])
def create_entry(entry: EntryCreate):
    db = SessionLocal()
    
    # Create basic entry
    db_entry = Entry(
        title=entry.title, 
        content=entry.content, 
        folder=entry.folder, 
        mood=entry.mood,
        date=str(date.today())
    )
    
    # Associate habits
    if entry.completed_habit_ids:
        habits = db.query(Habit).filter(Habit.id.in_(entry.completed_habit_ids)).all()
        db_entry.completed_habits = habits

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/entries/", response_model=List[EntryResponse], dependencies=[Depends(verify_token)])
def read_entries():
    db = SessionLocal()
    return db.query(Entry).order_by(desc(Entry.id)).all()

@app.delete("/entries/{entry_id}", dependencies=[Depends(verify_token)])
def delete_entry(entry_id: int):
    db = SessionLocal()
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"ok": True}

# 3. Reminders
# ... (Keep existing reminder endpoints if they were there, or just placeholder)
@app.get("/reminders/", dependencies=[Depends(verify_token)])
def read_reminders():
    db = SessionLocal()
    return db.query(Reminder).all()

@app.post("/reminders/", dependencies=[Depends(verify_token)])
def create_reminder(reminder: ReminderSchema):
    db = SessionLocal()
    db_reminder = Reminder(text=reminder.text, date=reminder.date)
    db.add(db_reminder)
    db.commit()
    return db_reminder

@app.get("/reminders/", dependencies=[Depends(verify_token)])
def read_reminders():
    db = SessionLocal()
    return db.query(Reminder).order_by(Reminder.date).all()

@app.delete("/reminders/{reminder_id}", dependencies=[Depends(verify_token)])
def delete_reminder(reminder_id: int):
    db = SessionLocal()
    rem = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if rem:
        db.delete(rem)
        db.commit()
    return {"ok": True}