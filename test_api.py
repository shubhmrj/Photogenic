import requests
import os
from bs4 import BeautifulSoup

def get_csrf_token(session, url='http://localhost:5000/login'):
    # Get the CSRF token from the login page
    response = session.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    csrf_token = soup.find('input', {'name': 'csrf_token'})
    if csrf_token:
        return csrf_token['value']
    return None

def test_functionality():
    with requests.Session() as session:
        # Get initial CSRF token from login page
        csrf_token = get_csrf_token(session)
        if not csrf_token:
            print("Could not get CSRF token")
            return

        # Login
        print("Logging in...")
        login_data = {
            'username': 'testuser',
            'password': 'password',
            'remember': 'true',
            'csrf_token': csrf_token
        }
        response = session.post('http://localhost:5000/login', data=login_data)
        print(f"Login response: {response.status_code}")
        
        # Get CSRF token for authenticated requests
        csrf_token = get_csrf_token(session, 'http://localhost:5000/collections')
        if not csrf_token:
            print("Could not get CSRF token after login")
            return
            
        headers = {'X-CSRFToken': csrf_token}
        
        print("\nTesting folder creation...")
        # Create a test folder
        folder_data = {
            'name': 'TestFolder',
            'path': ''
        }
        response = session.post('http://localhost:5000/api/collections/folder', 
                              json=folder_data, 
                              headers=headers)
        print(f"Create folder response: {response.status_code}")
        print(response.json())
        
        print("\nTesting file upload...")
        # Upload a test file
        files = {
            'files[]': ('test_upload.txt', open('test_upload.txt', 'rb'))
        }
        data = {
            'path': 'TestFolder',
            'csrf_token': csrf_token
        }
        response = session.post('http://localhost:5000/api/collections/upload',
                              files=files,
                              data=data,
                              headers=headers)
        print(f"Upload response: {response.status_code}")
        print(response.json())
        
        print("\nTesting collections listing...")
        # List collections
        response = session.get('http://localhost:5000/api/collections?path=TestFolder',
                             headers=headers)
        print(f"List collections response: {response.status_code}")
        print(response.json())

if __name__ == '__main__':
    test_functionality()
