import os
import sys
import sqlite3
import json
from datetime import datetime

# Path to the database file
db_path = os.path.join(os.path.dirname(__file__), 'photogenic.db')

# Delete existing database file
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    except Exception as e:
        print(f"Error removing database: {e}")

# Initialize the database from scratch
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create tables with proper schema matching exactly what's in main.py
cursor.execute('''
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_image TEXT DEFAULT 'default_profile.jpg',
    bio TEXT,
    api_keys TEXT DEFAULT '{}',
    reset_token TEXT,
    reset_token_expiration TIMESTAMP
)
''')

# Verify table structure
cursor.execute("PRAGMA table_info(user)")
columns = cursor.fetchall()
print("\nUser table structure:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

# Insert a test user
from werkzeug.security import generate_password_hash
test_password_hash = generate_password_hash("password123")

cursor.execute('''
INSERT INTO user (username, email, password_hash, api_keys)
VALUES (?, ?, ?, ?)
''', ('testuser', 'test@example.com', test_password_hash, '{}'))

conn.commit()
print(f"\nSuccessfully created user table and added test user")

# Verify the test user was created
cursor.execute("SELECT id, username, email FROM user")
users = cursor.fetchall()
print("\nUsers in database:")
for user in users:
    print(f"  - ID: {user[0]}, Username: {user[1]}, Email: {user[2]}")

conn.close()
print("\nDatabase initialization complete!")
