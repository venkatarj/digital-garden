from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime, timedelta

SQLALCHEMY_DATABASE_URL = "sqlite:///./garden.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Entry(Base):
    __tablename__ = "entries"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    folder = Column(String, default="Journal")
    mood = Column(String, default="😐")
    date = Column(String, default=str(date.today()))
    habit_exercise = Column(Boolean, default=False)
    habit_meditate = Column(Boolean, default=False)
    habit_read = Column(Boolean, default=False)

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

class EntrySchema(BaseModel):
    title: str
    content: str
    folder: str
    mood: str
    habit_exercise: bool
    habit_meditate: bool
    habit_read: bool

class ReminderSchema(BaseModel):
    text: str
    date: str

@app.post("/entries/")
def create_entry(entry: EntrySchema):
    db = SessionLocal()
    db_entry = Entry(**entry.dict(), date=str(date.today()))
    db.add(db_entry)
    db.commit()
    return db_entry

@app.get("/entries/")
def read_entries():
    db = SessionLocal()
    return db.query(Entry).order_by(desc(Entry.id)).all()

@app.delete("/entries/{entry_id}")
def delete_entry(entry_id: int):
    db = SessionLocal()
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"ok": True}

@app.post("/reminders/")
def create_reminder(reminder: ReminderSchema):
    db = SessionLocal()
    db_reminder = Reminder(text=reminder.text, date=reminder.date)
    db.add(db_reminder)
    db.commit()
    return db_reminder

@app.get("/reminders/")
def read_reminders():
    db = SessionLocal()
    return db.query(Reminder).order_by(Reminder.date).all()

@app.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int):
    db = SessionLocal()
    rem = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if rem:
        db.delete(rem)
        db.commit()
    return {"ok": True}