import os
import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime

# Configuration
db_path = os.path.join(os.path.dirname(__file__), 'photogenic.db')
print(f"Database path: {db_path}")

# Delete existing database
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f"Deleted existing database: {db_path}")
    except Exception as e:
        print(f"Error deleting database: {e}")

# Create new database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create user table with TEXT types for all columns (most compatible with SQLite)
cursor.execute('''
CREATE TABLE user (
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

# Create test user
cursor.execute('''
INSERT INTO user (username, email, password_hash, api_keys)
VALUES (?, ?, ?, ?)
''', (
    'testuser', 
    'test@example.com', 
    generate_password_hash('password123'), 
    '{}'
))

conn.commit()

# Verify database
cursor.execute("SELECT * FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("\nTables in database:")
for table in tables:
    print(f"  - {table[1]}")

cursor.execute("PRAGMA table_info(user)")
columns = cursor.fetchall()
print("\nUser table columns:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

cursor.execute("SELECT id, username, email FROM user")
users = cursor.fetchall()
print("\nUsers in database:")
for user in users:
    print(f"  - ID: {user[0]}, Username: {user[1]}, Email: {user[2]}")

conn.close()
print("\nDatabase reset and verification complete!")
print("You can now log in with: testuser / password123")
