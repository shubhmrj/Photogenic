import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Setup minimal Flask app to access database
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///photogenic.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Collection model
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class Collection(db.Model):
    __tablename__ = 'collection'
    id = db.Column(db.Integer, primary_key=True)
    path = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    is_folder = db.Column(db.Boolean, default=False)
    size = db.Column(db.Integer, nullable=True)
    mime_type = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

def update_collections_ownership():
    print("Starting collections ownership verification...")
    
    with app.app_context():
        # Get list of users
        users = User.query.all()
        user_ids = [user.id for user in users]
        
        if not user_ids:
            print("No users found in the database!")
            return
            
        print(f"Found {len(user_ids)} users: {user_ids}")
        
        # Get collections without valid owner_id
        collections_without_owner = Collection.query.filter(~Collection.owner_id.in_(user_ids)).all()
        
        if not collections_without_owner:
            print("All collections have valid owners. No update needed.")
            return
            
        print(f"Found {len(collections_without_owner)} collections without valid owner.")
        
        # Default to first user
        default_user_id = user_ids[0]
        print(f"Setting owner_id to {default_user_id} for these collections.")
        
        # Update collections
        for collection in collections_without_owner:
            print(f"Updating collection {collection.id}: {collection.path} - was owner_id={collection.owner_id}")
            collection.owner_id = default_user_id
        
        # Commit changes
        db.session.commit()
        print("Database updated successfully.")
        
        # Verify all collections have valid owners now
        invalid_collections = Collection.query.filter(~Collection.owner_id.in_(user_ids)).count()
        print(f"Remaining invalid collections: {invalid_collections}")

if __name__ == "__main__":
    update_collections_ownership()
