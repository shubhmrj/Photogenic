import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from datetime import datetime

# Create a minimal app instance just for database initialization
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///photogenic.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Drop all existing database files
db_path = os.path.join(os.path.dirname(__file__), 'photogenic.db')
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Removed existing database file: {db_path}")

# Create all tables from scratch using SQLAlchemy
# Flask-SQLAlchemy will create all tables based on imported models
# Import models only AFTER creating db instance to avoid circular imports
from main import User

with app.app_context():
    # Create all tables based on models
    db.create_all()
    print("Created all database tables successfully")
    
    # Create a test user
    test_user = User(
        username="testuser", 
        email="test@example.com"
    )
    test_user.set_password("password123")
    
    db.session.add(test_user)
    db.session.commit()
    
    print("Created test user: testuser / password123")
    print("Database initialization completed successfully!")
