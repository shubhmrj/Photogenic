import os
import sys

# Add the parent directory to sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Import Flask app and database objects
from main import app, db, User

def recreate_database():
    """Completely recreate the database with all tables."""
    db_path = os.path.join(parent_dir, 'photogenic.db')
    
    # Delete the database file if it exists
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"Deleted existing database: {db_path}")
        except Exception as e:
            print(f"Error deleting database: {e}")
    
    with app.app_context():
        # Create all tables from scratch
        db.create_all()
        print("Database tables created successfully")
        
        # Verify the table structure
        print("Database initialized successfully!")

if __name__ == "__main__":
    print(f"Recreating database...")
    recreate_database()
