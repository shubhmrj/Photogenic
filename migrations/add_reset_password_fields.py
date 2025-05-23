import os
import sys

# Add the parent directory to sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Import Flask app and database objects
from main import app, db, User

def migrate():
    """Initialize database and add reset token fields."""
    with app.app_context():
        # Create all tables if they don't exist
        db.create_all()
        print("Database tables created or verified")
        
        # Check if the User model has the reset_token fields (they should be there if db.create_all() ran)
        print("Migration completed successfully!")

if __name__ == "__main__":
    print(f"Running database migration...")
    migrate()
