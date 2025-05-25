import os
import shutil
import sys

# Path to the collections directory
COLLECTIONS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'collections')

def migrate_collections():
    print("Starting collections migration...")
    
    # Check if the collections directory exists
    if not os.path.exists(COLLECTIONS_ROOT):
        print(f"Collections directory {COLLECTIONS_ROOT} does not exist. Creating it...")
        os.makedirs(COLLECTIONS_ROOT, exist_ok=True)
        print("Done. No migration needed.")
        return
    
    # Get all existing directories in the collections folder
    existing_dirs = [d for d in os.listdir(COLLECTIONS_ROOT) 
                     if os.path.isdir(os.path.join(COLLECTIONS_ROOT, d))]
    
    print(f"Found {len(existing_dirs)} directories: {', '.join(existing_dirs)}")
    
    # Identify numeric user IDs (these are already in the correct format)
    numeric_user_dirs = [d for d in existing_dirs if d.isdigit()]
    other_dirs = [d for d in existing_dirs if not d.isdigit()]
    
    print(f"Already have {len(numeric_user_dirs)} user directories: {', '.join(numeric_user_dirs)}")
    print(f"Need to migrate {len(other_dirs)} directories: {', '.join(other_dirs)}")
    
    # Use default user ID 1
    user_id = "1"
    print(f"Using default user ID: {user_id}")
    
    user_dir = os.path.join(COLLECTIONS_ROOT, user_id)
    os.makedirs(user_dir, exist_ok=True)
    
    # Move all non-numeric directories into the user directory
    for dir_name in other_dirs:
        source_path = os.path.join(COLLECTIONS_ROOT, dir_name)
        target_path = os.path.join(user_dir, dir_name)
        
        print(f"Moving {source_path} to {target_path}...")
        
        # If the target already exists, we'll need to merge
        if os.path.exists(target_path):
            print(f"  Target {target_path} already exists, merging contents...")
            
            # Move contents instead of the directory itself
            for item in os.listdir(source_path):
                item_source = os.path.join(source_path, item)
                item_target = os.path.join(target_path, item)
                
                if os.path.exists(item_target):
                    print(f"  Skipping {item} as it already exists in the target")
                else:
                    try:
                        shutil.move(item_source, item_target)
                        print(f"  Moved {item}")
                    except Exception as e:
                        print(f"  Error moving {item}: {e}")
            
            # Remove the source directory if it's now empty
            if not os.listdir(source_path):
                os.rmdir(source_path)
                print(f"  Removed empty directory {source_path}")
        else:
            # Move the entire directory
            try:
                shutil.move(source_path, target_path)
                print(f"  Moved directory {dir_name}")
            except Exception as e:
                print(f"  Error moving directory {dir_name}: {e}")
    
    print("\nMigration completed.")
    print(f"All non-user directories have been moved into user directory {user_id}.")
    print("You may need to update database records separately if applicable.")

if __name__ == "__main__":
    migrate_collections()
