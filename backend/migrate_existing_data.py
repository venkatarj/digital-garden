"""
One-time migration script to assign existing data to a default user.
Run this after deploying the new authentication system.

Usage:
    python migrate_existing_data.py
"""
import os
import sys
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
import auth

def create_default_user(db: Session):
    """Create a default user for existing data"""
    default_email = os.getenv("DEFAULT_USER_EMAIL", "admin@lifeos.local")
    default_password = os.getenv("DEFAULT_USER_PASSWORD", "changeme123")
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == default_email).first()
    if existing_user:
        print(f"✓ Default user already exists: {default_email}")
        return existing_user
    
    # Create new default user
    password_hash = auth.hash_password(default_password)
    default_user = models.User(
        email=default_email,
        password_hash=password_hash
    )
    
    db.add(default_user)
    db.commit()
    db.refresh(default_user)
    
    print(f"✓ Created default user: {default_email}")
    print(f"  Password: {default_password}")
    print(f"  ⚠️  IMPORTANT: Change this password after logging in!")
    
    return default_user

def migrate_data(db: Session, user_id: int):
    """Assign all existing data to the default user"""
    
    # Migrate entries
    entries_updated = db.query(models.Entry).filter(
        models.Entry.user_id == None
    ).update({"user_id": user_id})
    print(f"✓ Migrated {entries_updated} entries")
    
    # Migrate habits
    habits_updated = db.query(models.Habit).filter(
        models.Habit.user_id == None
    ).update({"user_id": user_id})
    print(f"✓ Migrated {habits_updated} habits")
    
    # Migrate reminders
    reminders_updated = db.query(models.Reminder).filter(
        models.Reminder.user_id == None
    ).update({"user_id": user_id})
    print(f"✓ Migrated {reminders_updated} reminders")
    
    db.commit()
    
    return entries_updated + habits_updated + reminders_updated

def main():
    print("=" * 60)
    print("Life OS - Data Migration Script")
    print("=" * 60)
    print()
    
    # Create tables if they don't exist
    print("Creating database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("✓ Database tables ready")
    print()
    
    db = SessionLocal()
    try:
        # Create default user
        print("Step 1: Creating default user...")
        default_user = create_default_user(db)
        print()
        
        # Migrate existing data
        print("Step 2: Migrating existing data...")
        total_migrated = migrate_data(db, default_user.id)
        print()
        
        if total_migrated > 0:
            print("=" * 60)
            print("✓ Migration completed successfully!")
            print(f"  Total items migrated: {total_migrated}")
            print()
            print("Next steps:")
            print(f"  1. Log in with email: {default_user.email}")
            print("  2. Change your password immediately")
            print("  3. Create additional user accounts as needed")
            print("=" * 60)
        else:
            print("=" * 60)
            print("✓ No data to migrate (all data already has user_id)")
            print("=" * 60)
            
    except Exception as e:
        print(f"✗ Migration failed: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
