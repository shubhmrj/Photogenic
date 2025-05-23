import os
import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime

# Path to the database file
db_path = os.path.join(os.path.dirname(__file__), 'photogenic.db')

# Delete the existing database if it exists
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f"Deleted existing database: {db_path}")
    except Exception as e:
        print(f"Error deleting database: {e}")

# Create a new database with the proper schema
conn = sqlite3.connect(db_path)
# Enable foreign keys
conn.execute("PRAGMA foreign_keys = ON")
cursor = conn.cursor()

# Create the user table with ALL required columns including reset_token fields
cursor.execute('''
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_image VARCHAR(200) DEFAULT 'default_profile.jpg',
    bio VARCHAR(500),
    api_keys TEXT DEFAULT '{}',
    reset_token VARCHAR(32),
    reset_token_expiration TIMESTAMP
)
''')

# Create a test user
test_username = "testuser"
test_email = "test@example.com"
test_password_hash = generate_password_hash("password123")
created_at = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

cursor.execute('''
INSERT INTO user (username, email, password_hash, created_at, api_keys)
VALUES (?, ?, ?, ?, '{}')
''', (test_username, test_email, test_password_hash, created_at))

# Commit changes and close connection
conn.commit()

# Verify the table structure
cursor.execute("PRAGMA table_info(user)")
columns = cursor.fetchall()
print("\nUser table structure:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

# Verify the test user was created
cursor.execute("SELECT id, username, email FROM user")
users = cursor.fetchall()
print("\nUsers in database:")
for user in users:
    print(f"  - ID: {user[0]}, Username: {user[1]}, Email: {user[2]}")

conn.close()

print("\nDatabase reset complete! You can now log in with:")
print("Username: testuser")
print("Password: password123")
