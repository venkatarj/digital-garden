from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

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
