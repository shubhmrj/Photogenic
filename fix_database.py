import os
import sys
import sqlite3
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin, LoginManager
from datetime import datetime
import json

# Create a minimal app for database operations
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///photogenic.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define the User model exactly as it is in main.py
class User(db.Model, UserMixin):
    __tablename__ = 'user'  # Explicitly define the table name
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile_image = db.Column(db.String(200), nullable=True, default='default_profile.jpg')
    bio = db.Column(db.String(500), nullable=True)
    api_keys = db.Column(db.String(1000), nullable=True, default='{}')  # Match main.py - Store user's API keys as JSON string
    reset_token = db.Column(db.String(32), nullable=True)
    reset_token_expiration = db.Column(db.DateTime, nullable=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

def fix_database():
    """Completely recreate the database with proper schema"""
    db_path = os.path.join(os.path.dirname(__file__), 'photogenic.db')
    
    # Delete existing database
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print("Deleted existing database: {}".format(db_path))
        except Exception as e:
            print("Error deleting database: {}".format(e))
    
    # Create new database with proper schema
    with app.app_context():
        try:
            # Make sure we're creating all columns correctly
            db.create_all()
            print("Database tables created successfully with proper schema")
            
            # Verify database structure
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print("Tables created:", tables)
            
            if 'user' in tables:
                columns = [column['name'] for column in inspector.get_columns('user')]
                print("User table columns:", columns)
                
                # Check if any columns are missing
                required_columns = [
                    'id', 'username', 'email', 'password_hash', 'created_at', 
                    'profile_image', 'bio', 'api_keys', 'reset_token', 
                    'reset_token_expiration'
                ]
                
                missing = [col for col in required_columns if col not in columns]
                
                if missing:
                    print(f"Missing columns detected: {missing}")
                    print("Recreating the database with all required columns...")
                    
                    # Drop all tables and recreate from scratch
                    db.drop_all()
                    db.create_all()
                    
                    # Verify again after recreation
                    inspector = db.inspect(db.engine)
                    tables = inspector.get_table_names()
                    print("Tables recreated:", tables)
                    
                    if 'user' in tables:
                        columns = [column['name'] for column in inspector.get_columns('user')]
                        print("User table columns after recreation:", columns)
                else:
                    print("User table schema is correct!")
            else:
                print("User table not created properly!")
                
            print("\nDatabase initialization complete!")
            
            # Create a test user to verify everything works
            try:
                test_user = User(
                    username="testuser",
                    email="test@example.com",
                    created_at=datetime.utcnow(),
                    api_keys='{}',  # JSON string instead of dict
                    reset_token=None,
                    reset_token_expiration=None
                )
                test_user.set_password("password123")
                db.session.add(test_user)
                db.session.commit()
                print("Created test user: testuser / password123")
                
                # Verify user was created
                user = User.query.filter_by(username="testuser").first()
                if user:
                    print("Test user successfully created and retrieved from database!")
                else:
                    print("Error: Unable to retrieve test user from database!")
            except Exception as e:
                print("Error creating test user:", e)
                print("Traceback:", sys.exc_info())
        except Exception as e:
            print(f"Error during database initialization: {e}")
            print("Traceback:", sys.exc_info())

if __name__ == "__main__":
    print("Fixing database schema...")
    fix_database()
