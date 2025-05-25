import os
import sys
import json
import requests
from getpass import getpass
from pprint import pprint

"""
User Isolation Test Script
--------------------------
This script helps verify that users can only see their own collections.
It logs in as multiple users and checks that they can only access their own files.
"""

# Base URL of the application when running
BASE_URL = "http://localhost:5000"  # Change if your app runs on a different port

# Session to maintain cookies
session = requests.Session()

def login(username, password):
    """Log in as a specific user and return success status"""
    login_url = f"{BASE_URL}/login"
    
    # First, get the login page to capture any CSRF token if needed
    response = session.get(login_url)
    
    # Now login with credentials
    data = {
        "username": username,
        "password": password,
        "remember": "y"
    }
    
    response = session.post(login_url, data=data, allow_redirects=True)
    
    # Check if login was successful
    if "Invalid" in response.text or "incorrect" in response.text.lower():
        print(f"❌ Login failed for user {username}")
        return False
    
    print(f"✅ Successfully logged in as {username}")
    return True

def get_collections(path=""):
    """Get collections at the specified path"""
    url = f"{BASE_URL}/api/collections"
    if path:
        url += f"?path={path}"
    
    response = session.get(url)
    
    if response.status_code != 200:
        print(f"❌ Failed to get collections: {response.status_code} - {response.text}")
        return None
    
    return response.json()

def attempt_access_by_direct_url(path):
    """Try to access a file directly by URL"""
    url = f"{BASE_URL}/api/collections/file/{path}"
    response = session.get(url)
    
    return {
        "status_code": response.status_code,
        "success": response.status_code == 200,
        "content_type": response.headers.get("Content-Type", ""),
        "content_length": len(response.content) if response.status_code == 200 else 0
    }

def test_user_collections_isolation():
    """Test that users can only see their own collections"""
    # Dictionary to store paths from each user
    user_paths = {}
    
    # Test with multiple users
    users = [
        {"username": "admin", "password": "password"},
        {"username": "testuser", "password": "password"}
    ]
    
    for user in users:
        print(f"\n======= Testing as {user['username']} =======")
        
        # Login as this user
        if not login(user["username"], user["password"]):
            continue
        
        # Get user's collections
        result = get_collections()
        if not result:
            continue
        
        collections = result.get("collections", [])
        print(f"Found {len(collections)} collections for {user['username']}")
        
        # Store paths for cross-testing later
        paths = []
        for item in collections:
            if item.get("type") == "file":
                paths.append(item.get("path"))
                print(f"  - {item.get('path')} ({item.get('type')})")
        
        user_paths[user["username"]] = paths
        
        # Log out
        session.get(f"{BASE_URL}/logout")
    
    # Now test cross-access (each user trying to access other users' files)
    print("\n======= Testing Cross-User Access =======")
    
    for user in users:
        print(f"\nLogging in as {user['username']} to test access to other users' files")
        if not login(user["username"], user["password"]):
            continue
        
        # Try to access other users' files
        for other_user, paths in user_paths.items():
            if other_user == user["username"]:
                continue
            
            print(f"Attempting to access {other_user}'s files as {user['username']}:")
            
            for path in paths:
                result = attempt_access_by_direct_url(path)
                success_indicator = "❌" if result["success"] else "✅"
                
                print(f"{success_indicator} Access to {path}: {result['status_code']}")
                
                # This should fail with 403 Forbidden for proper isolation
                if result["success"]:
                    print(f"  WARNING: {user['username']} can access {other_user}'s file {path}!")
        
        # Log out
        session.get(f"{BASE_URL}/logout")

def interactive_test():
    """Run an interactive testing session"""
    print("PhotoGeni User Isolation Test Tool")
    print("=================================")
    
    while True:
        print("\nOptions:")
        print("1. Login as a user")
        print("2. Get current user's collections")
        print("3. Test access to a specific path")
        print("4. Run full isolation test")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == "1":
            username = input("Username: ")
            password = getpass("Password: ")
            login(username, password)
            
        elif choice == "2":
            path = input("Path (leave empty for root): ")
            result = get_collections(path)
            if result:
                pprint(result)
                
        elif choice == "3":
            path = input("Path to access: ")
            result = attempt_access_by_direct_url(path)
            print(f"Access result: {result}")
            
        elif choice == "4":
            test_user_collections_isolation()
            
        elif choice == "5":
            print("Exiting...")
            break
            
        else:
            print("Invalid choice, please try again")

if __name__ == "__main__":
    print("PhotoGeni User Isolation Test")
    print("============================")
    
    # Check if the app is running
    try:
        response = requests.get(BASE_URL)
        print(f"✅ Application is running at {BASE_URL}")
    except requests.ConnectionError:
        print(f"❌ Cannot connect to {BASE_URL}. Make sure the application is running.")
        sys.exit(1)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        interactive_test()
    else:
        test_user_collections_isolation()
