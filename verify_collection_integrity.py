import os
import sys
import json
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

"""
Collection Integrity Verification Script
---------------------------------------
This script verifies that:
1. All files in the collections directory have corresponding database records
2. All database records point to existing files with correct ownership
3. No user can access another user's files through database inconsistencies
"""

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

# Base paths
COLLECTIONS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'collections')

def get_user_collections_dir(user_id):
    """Get the collections directory for a specific user"""
    return os.path.join(COLLECTIONS_ROOT, str(user_id))

def scan_filesystem():
    """Scan the filesystem for all collection files and return the paths"""
    print("Scanning filesystem for collection files...")
    
    fs_collections = {}
    
    # Check if collections directory exists
    if not os.path.exists(COLLECTIONS_ROOT):
        print(f"Error: Collections directory {COLLECTIONS_ROOT} does not exist!")
        return fs_collections
    
    # Get all user directories
    user_dirs = [d for d in os.listdir(COLLECTIONS_ROOT) 
                if os.path.isdir(os.path.join(COLLECTIONS_ROOT, d)) and d.isdigit()]
    
    print(f"Found {len(user_dirs)} user directories: {', '.join(user_dirs)}")
    
    # Scan each user directory
    for user_id in user_dirs:
        user_dir = get_user_collections_dir(user_id)
        fs_collections[user_id] = []
        
        # Walk through all files and directories
        for root, dirs, files in os.walk(user_dir):
            # Get relative path from user directory
            rel_root = os.path.relpath(root, user_dir)
            if rel_root == '.':
                rel_root = ''
            
            # Add directories
            for dir_name in dirs:
                rel_path = os.path.join(rel_root, dir_name) if rel_root else dir_name
                fs_collections[user_id].append({
                    'path': rel_path,
                    'name': dir_name,
                    'is_folder': True,
                    'fs_path': os.path.join(root, dir_name)
                })
            
            # Add files
            for file_name in files:
                rel_path = os.path.join(rel_root, file_name) if rel_root else file_name
                fs_collections[user_id].append({
                    'path': rel_path,
                    'name': file_name,
                    'is_folder': False,
                    'fs_path': os.path.join(root, file_name),
                    'size': os.path.getsize(os.path.join(root, file_name))
                })
    
    return fs_collections

def get_db_collections():
    """Get all collections from the database"""
    print("Getting collections from database...")
    
    with app.app_context():
        db_collections = {}
        
        # Get all users
        users = User.query.all()
        print(f"Found {len(users)} users in database")
        
        # Get collections for each user
        for user in users:
            collections = Collection.query.filter_by(owner_id=user.id).all()
            db_collections[str(user.id)] = collections
            print(f"User {user.username} (ID: {user.id}) has {len(collections)} collections")
        
        return db_collections

def verify_collection_integrity():
    """Verify collection integrity between filesystem and database"""
    print("\nVerifying collection integrity...")
    
    # Get collections from filesystem and database
    fs_collections = scan_filesystem()
    
    with app.app_context():
        db_collections = get_db_collections()
        
        # Issues counter
        issues = {
            'missing_in_db': 0,
            'missing_in_fs': 0,
            'wrong_owner': 0,
            'path_mismatch': 0
        }
        
        # Check each user's collections
        for user_id in fs_collections:
            print(f"\nChecking collections for user {user_id}...")
            
            # Skip if user doesn't exist in database
            if user_id not in db_collections:
                print(f"Warning: User {user_id} has files but no database records!")
                continue
            
            # Get user's collections from database
            user_db_collections = {c.path: c for c in db_collections[user_id]}
            
            # Check each filesystem collection
            for fs_item in fs_collections[user_id]:
                path = fs_item['path']
                
                # Check if item exists in database
                if path not in user_db_collections:
                    print(f"  Missing in DB: {path}")
                    issues['missing_in_db'] += 1
            
            # Check each database collection
            for path, db_item in user_db_collections.items():
                # Find corresponding filesystem item
                fs_item = next((i for i in fs_collections[user_id] if i['path'] == path), None)
                
                if not fs_item:
                    print(f"  Missing in FS: {path}")
                    issues['missing_in_fs'] += 1
                else:
                    # Check if folder/file type matches
                    if fs_item['is_folder'] != db_item.is_folder:
                        print(f"  Type mismatch for {path}: DB={db_item.is_folder}, FS={fs_item['is_folder']}")
                        issues['path_mismatch'] += 1
        
        # Check for wrong ownership (files accessible by wrong users)
        print("\nChecking for wrong ownership...")
        all_collections = Collection.query.all()
        
        for collection in all_collections:
            user_id = str(collection.owner_id)
            path = collection.path
            
            # Skip if user doesn't have a directory
            if user_id not in fs_collections:
                continue
                
            # Check if this file exists in another user's directory
            for other_user_id in fs_collections:
                if other_user_id == user_id:
                    continue
                
                other_user_items = fs_collections[other_user_id]
                wrong_owner_item = next((i for i in other_user_items if i['path'] == path), None)
                
                if wrong_owner_item:
                    print(f"  Wrong owner: {path} - DB owner={user_id}, FS found in user {other_user_id}")
                    issues['wrong_owner'] += 1
        
        # Print summary
        print("\nIntegrity check summary:")
        print(f"  Missing in database: {issues['missing_in_db']}")
        print(f"  Missing in filesystem: {issues['missing_in_fs']}")
        print(f"  Wrong owner: {issues['wrong_owner']}")
        print(f"  Path mismatches: {issues['path_mismatch']}")
        
        total_issues = sum(issues.values())
        if total_issues == 0:
            print("\n✅ No integrity issues found! Collection isolation is working correctly.")
        else:
            print(f"\n❌ Found {total_issues} integrity issues that need to be fixed.")

def fix_collection_integrity():
    """Fix collection integrity issues"""
    print("\nFixing collection integrity issues...")
    
    # Scan filesystem
    fs_collections = scan_filesystem()
    
    with app.app_context():
        # Find and fix issues
        fixes = {
            'added_to_db': 0,
            'removed_from_db': 0,
            'updated': 0
        }
        
        # Process each user's collections
        for user_id in fs_collections:
            user_dir = get_user_collections_dir(user_id)
            
            # Get user from database
            user = User.query.filter_by(id=int(user_id)).first()
            if not user:
                print(f"Warning: User {user_id} not found in database. Skipping...")
                continue
                
            print(f"\nProcessing collections for user {user_id} ({user.username})...")
            
            # Get existing database records for this user
            db_collections = {c.path: c for c in Collection.query.filter_by(owner_id=user.id).all()}
            
            # Add missing records to database
            for fs_item in fs_collections[user_id]:
                path = fs_item['path']
                
                if path not in db_collections:
                    # Add to database
                    new_collection = Collection(
                        path=path,
                        name=fs_item['name'],
                        is_folder=fs_item['is_folder'],
                        size=fs_item.get('size'),
                        owner_id=user.id
                    )
                    db.session.add(new_collection)
                    fixes['added_to_db'] += 1
                    print(f"  Added to database: {path}")
            
            # Remove records that don't exist in filesystem
            fs_paths = {item['path'] for item in fs_collections[user_id]}
            for db_path, db_item in db_collections.items():
                if db_path not in fs_paths:
                    # Remove from database
                    db.session.delete(db_item)
                    fixes['removed_from_db'] += 1
                    print(f"  Removed from database: {db_path}")
        
        # Commit changes
        if fixes['added_to_db'] > 0 or fixes['removed_from_db'] > 0 or fixes['updated'] > 0:
            db.session.commit()
            print("\nChanges committed to database")
        else:
            print("\nNo changes needed")
        
        # Print summary
        print("\nFix summary:")
        print(f"  Added to database: {fixes['added_to_db']}")
        print(f"  Removed from database: {fixes['removed_from_db']}")
        print(f"  Updated: {fixes['updated']}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--fix":
        fix_collection_integrity()
    else:
        verify_collection_integrity()
        print("\nRun with --fix to repair integrity issues")
