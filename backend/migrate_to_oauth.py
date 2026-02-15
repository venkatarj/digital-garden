"""
Migration script to add Google OAuth fields and remove password fields.
Run this ONCE after deploying the new code.

Usage: python migrate_to_oauth.py
"""
from sqlalchemy import text
from database import SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    db = SessionLocal()

    try:
        # Add new columns
        logger.info("Adding google_id, name, and picture columns to users table...")
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS picture VARCHAR"))
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)"))

        # Drop password-related tables and columns
        logger.info("Dropping password_reset_tokens table...")
        db.execute(text("DROP TABLE IF EXISTS password_reset_tokens"))

        logger.info("Dropping password_hash column from users table...")
        db.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS password_hash"))

        db.commit()
        logger.info("✅ Migration completed successfully!")
        logger.info("")
        logger.info("Next steps:")
        logger.info("1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env")
        logger.info("2. Set VITE_GOOGLE_CLIENT_ID in frontend/.env")
        logger.info("3. Install frontend dependencies: cd frontend && npm install")
        logger.info("4. Start the application and test Google Sign-In")

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting database migration to Google OAuth...")
    logger.info("This will:")
    logger.info("  - Add google_id, name, picture columns to users table")
    logger.info("  - Drop password_reset_tokens table")
    logger.info("  - Drop password_hash column from users table")
    logger.info("")

    response = input("Continue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        migrate()
    else:
        logger.info("Migration cancelled.")
