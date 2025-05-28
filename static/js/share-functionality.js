// Share modal functionality
let currentSharePath = '';
let selectedUsers = new Set();

// Get current user from the page
const currentUser = document.querySelector('.user-name')?.textContent.trim() || '';

// Open share modal
function openShareModal(path) {
    currentSharePath = path;
    selectedUsers.clear();
    updateSelectedUsersList();
    
    // Reset search
    document.getElementById('share-search-input').value = '';
    
    // Load users
    loadUsers();
    
    // Show modal
    const shareModal = document.getElementById('share-modal');
    shareModal.style.display = 'flex';
    setTimeout(() => {
        shareModal.classList.add('show');
        document.getElementById('share-search-input').focus();
    }, 10);
}

// Close share modal
function closeShareModal() {
    const shareModal = document.getElementById('share-modal');
    shareModal.classList.remove('show');
    setTimeout(() => {
        shareModal.style.display = 'none';
    }, 300);
}

// Load users from server
function loadUsers(searchTerm = '') {
    const shareUsersList = document.getElementById('share-users-list');
    
    // Show loading state
    shareUsersList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';
    
    // Fetch users from server
    fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            return response.json();
        })
        .then(response => {
            displayUsers(response);
        })
        .catch(error => {
            shareUsersList.innerHTML = `<div class="no-users-message"><i class="fas fa-exclamation-circle"></i> ${error.message}</div>`;
        });
}

// Display users in the list
function displayUsers(response) {
    const shareUsersList = document.getElementById('share-users-list');
    
    // Check if the API call was successful
    if (!response.success) {
        shareUsersList.innerHTML = `<div class="no-users-message"><i class="fas fa-exclamation-circle"></i> ${response.message || 'Error loading users'}</div>`;
        return;
    }
    
    const users = response.users;
    
    if (!users || users.length === 0) {
        shareUsersList.innerHTML = '<div class="no-users-message">No users found</div>';
        return;
    }
    
    shareUsersList.innerHTML = '';
    
    users.forEach(user => {
        // Skip current user if somehow included
        if (user.username === currentUser) {
            return;
        }
        
        const userItem = document.createElement('div');
        userItem.className = 'share-user-item';
        userItem.setAttribute('data-username', user.username);
        
        // Get initials for avatar
        const initials = user.username.charAt(0).toUpperCase();
        
        userItem.innerHTML = `
            <div class="share-user-avatar">${initials}</div>
            <div class="share-user-details">
                <div class="share-user-name">${user.username}</div>
                <div class="share-user-email">${user.email || ''}</div>
            </div>
            <div class="share-user-action">
                <button class="btn btn-sm ${selectedUsers.has(user.username) ? 'btn-primary' : 'btn-secondary'}">
                    ${selectedUsers.has(user.username) ? '<i class="fas fa-check"></i> Selected' : '<i class="fas fa-plus"></i> Select'}
                </button>
            </div>
        `;
        
        // Add click event
        userItem.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            toggleUserSelection(username);
        });
        
        shareUsersList.appendChild(userItem);
    });
}

// Toggle user selection
function toggleUserSelection(username) {
    if (selectedUsers.has(username)) {
        selectedUsers.delete(username);
    } else {
        selectedUsers.add(username);
    }
    
    // Update UI
    updateSelectedUsersList();
    
    // Update user list buttons
    const shareUsersList = document.getElementById('share-users-list');
    const userItems = shareUsersList.querySelectorAll('.share-user-item');
    userItems.forEach(item => {
        const itemUsername = item.getAttribute('data-username');
        const actionBtn = item.querySelector('.share-user-action button');
        
        if (selectedUsers.has(itemUsername)) {
            actionBtn.className = 'btn btn-sm btn-primary';
            actionBtn.innerHTML = '<i class="fas fa-check"></i> Selected';
        } else {
            actionBtn.className = 'btn btn-sm btn-secondary';
            actionBtn.innerHTML = '<i class="fas fa-plus"></i> Select';
        }
    });
}

// Update selected users list
function updateSelectedUsersList() {
    const selectedUsersList = document.getElementById('selected-users-list');
    selectedUsersList.innerHTML = '';
    
    if (selectedUsers.size === 0) {
        selectedUsersList.innerHTML = '<div class="no-users-message">No users selected</div>';
        return;
    }
    
    selectedUsers.forEach(username => {
        const userTag = document.createElement('div');
        userTag.className = 'selected-user-tag';
        userTag.innerHTML = `
            ${username}
            <span class="remove-user" data-username="${username}">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        // Add click event to remove button
        userTag.querySelector('.remove-user').addEventListener('click', function(e) {
            e.stopPropagation();
            const username = this.getAttribute('data-username');
            toggleUserSelection(username);
        });
        
        selectedUsersList.appendChild(userTag);
    });
}

// Share with selected users
function shareWithUsers() {
    if (selectedUsers.size === 0) {
        showToast('warning', 'No Users Selected', 'Please select at least one user to share with');
        return;
    }
    
    // Show loading state
    const confirmShareBtn = document.getElementById('confirm-share-btn');
    confirmShareBtn.disabled = true;
    confirmShareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing...';
    
    // Prepare data
    const data = {
        path: currentSharePath,
        users: Array.from(selectedUsers),
        timestamp: new Date().toISOString()
    };
    
    // Simulate API call - replace with actual API in production
    setTimeout(() => {
        // Close modal
        closeShareModal();
        
        // Show success message
        showToast('success', 'Shared Successfully', `Shared with ${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''}`);
        
        // Reload collections to show updated ownership badges
        loadCollections();
        
        // Reset button
        confirmShareBtn.disabled = false;
        confirmShareBtn.innerHTML = 'Share';
    }, 1000);
    
    // When API is ready, use this instead:
    /*
    fetch('/api/collections/share', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to share');
        }
        return response.json();
    })
    .then(result => {
        // Close modal
        closeShareModal();
        
        // Show success message
        showToast('success', 'Shared Successfully', `Shared with ${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''}`);
        
        // Reload collections to show updated ownership badges
        loadCollections();
    })
    .catch(error => {
        showToast('error', 'Sharing Failed', error.message);
    })
    .finally(() => {
        confirmShareBtn.disabled = false;
        confirmShareBtn.innerHTML = 'Share';
    });
    */
}

// Initialize share modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    const closeShareBtn = document.getElementById('close-share-btn');
    const cancelShareBtn = document.getElementById('cancel-share-btn');
    const confirmShareBtn = document.getElementById('confirm-share-btn');
    const shareSearchInput = document.getElementById('share-search-input');
    
    // Search users
    if (shareSearchInput) {
        shareSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            loadUsers(searchTerm);
        });
    }
    
    // Close share modal events
    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', closeShareModal);
    }
    
    if (cancelShareBtn) {
        cancelShareBtn.addEventListener('click', closeShareModal);
    }
    
    // Confirm share event
    if (confirmShareBtn) {
        confirmShareBtn.addEventListener('click', shareWithUsers);
    }
});
