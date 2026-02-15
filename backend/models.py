from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, Date, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import date, datetime

# Many-to-Many Association Table
entry_habits = Table('entry_habits', Base.metadata,
    Column('entry_id', Integer, ForeignKey('entries.id')),
    Column('habit_id', Integer, ForeignKey('habits.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    google_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    entries = relationship("Entry", back_populates="user")
    habits = relationship("Habit", back_populates="user")
    reminders = relationship("Reminder", back_populates="user")

class Habit(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # e.g., "Run", "Code"
    icon = Column(String, default="✅") # e.g., "🏃", "💻"
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Nullable for migration
    
    user = relationship("User", back_populates="habits")

class Entry(Base):
    __tablename__ = "entries"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    folder = Column(String, default="Journal")
    mood = Column(String, default="😐")
    date = Column(Date, default=date.today, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Nullable for migration
    
    # Relationships
    completed_habits = relationship("Habit", secondary=entry_habits)
    user = relationship("User", back_populates="entries")

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    date = Column(String) 
    completed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Nullable for migration
    
    user = relationship("User", back_populates="reminders")
