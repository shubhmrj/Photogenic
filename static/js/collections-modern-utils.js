/**
 * Collections Modern Utilities
 * Helper functions for collections functionality
 */

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date in human-readable format
 * @param {string} dateStr - Date string
 * @returns {string} - Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    
    const date = new Date(dateStr);
    const now = new Date();
    
    // Check if invalid date
    if (isNaN(date.getTime())) return 'Unknown';
    
    // Today
    if (date.toDateString() === now.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Within the last week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (date > oneWeekAgo) {
        const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleString([], options);
    }
    
    // This year
    if (date.getFullYear() === now.getFullYear()) {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleString([], options);
    }
    
    // Older
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleString([], options);
}

/**
 * Set the view mode for collections
 * @param {string} mode - View mode ('grid' or 'list')
 */
function setViewMode(mode) {
    if (mode !== 'grid' && mode !== 'list') return;
    
    viewMode = mode;
    localStorage.setItem('collections-view', mode);
    
    const collectionsGrid = document.getElementById('collections-grid');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    
    if (collectionsGrid) {
        collectionsGrid.className = mode === 'list' ? 'collections-list' : 'collections-grid';
    }
    
    if (gridViewBtn && listViewBtn) {
        if (mode === 'list') {
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        } else {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        }
    }
}

/**
 * Set the sort option for collections
 * @param {string} option - Sort option ('name' or 'date')
 */
function setSortOption(option) {
    if (option !== 'name' && option !== 'date') return;
    
    // Toggle sort order if selecting the same field
    if (sortBy === option) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy = option;
        sortOrder = 'asc';
    }
    
    // Save preferences
    localStorage.setItem('collections-sort', sortBy);
    localStorage.setItem('collections-sort-order', sortOrder);
    
    // Apply sorting
    if (collectionItems.length > 0) {
        sortCollectionItems();
        displayCollections();
    }
}

/**
 * Sort collection items based on current sort settings
 */
function sortCollectionItems() {
    // Always sort folders to the top
    collectionItems.sort((a, b) => {
        // Folders first
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        
        // Then apply selected sort
        if (sortBy === 'name') {
            return sortOrder === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        } else if (sortBy === 'date') {
            const dateA = new Date(a.modified || 0).getTime();
            const dateB = new Date(b.modified || 0).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        return 0;
    });
}

/**
 * Refresh collections from the server
 */
function refreshCollections() {
    loadCollections(currentPath);
}

/**
 * Toggle selection of all items
 */
function toggleSelectAll() {
    const collectionsGrid = document.getElementById('collections-grid');
    if (!collectionsGrid) return;
    
    const allItems = collectionsGrid.querySelectorAll('.collection-card');
    
    // If all items are already selected, deselect all
    if (selectedItems.size === allItems.length) {
        allItems.forEach(item => {
            item.classList.remove('selected');
        });
        selectedItems.clear();
    } else {
        // Otherwise, select all
        allItems.forEach(item => {
            const itemId = item.getAttribute('data-id');
            if (itemId) {
                item.classList.add('selected');
                selectedItems.add(itemId);
            }
        });
    }
    
    updateSelectionUI();
}

/**
 * Toggle selection of a single item
 * @param {HTMLElement} itemElement - Item element
 * @param {string} itemId - Item ID
 */
function toggleItemSelection(itemElement, itemId) {
    if (!itemElement || !itemId) return;
    
    if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
        itemElement.classList.remove('selected');
    } else {
        selectedItems.add(itemId);
        itemElement.classList.add('selected');
    }
    
    updateSelectionUI();
}

/**
 * Update the UI based on current selection state
 */
function updateSelectionUI() {
    const hasSelection = selectedItems.size > 0;
    
    // Show selection action bar if items are selected
    const selectionBar = document.querySelector('.selection-bar');
    if (selectionBar) {
        selectionBar.style.display = hasSelection ? 'flex' : 'none';
        
        // Update selection count
        const countElement = selectionBar.querySelector('.selection-count');
        if (countElement) {
            countElement.textContent = `${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''} selected`;
        }
    }
    
    // Hide the FAB when items are selected
    const fab = document.querySelector('.fab');
    if (fab) {
        fab.style.display = hasSelection ? 'none' : 'flex';
    }
}

/**
 * Create a new folder
 */
function createNewFolder() {
    const folderNameInput = document.getElementById('folder-name');
    if (!folderNameInput) return;
    
    const folderName = folderNameInput.value.trim();
    if (!folderName) {
        showToast('error', 'Invalid Name', 'Please enter a folder name', 3000);
        return;
    }
    
    // Show loading state
    const createBtn = document.getElementById('create-folder-btn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';
    }
    
    // API call to create folder
    fetch('/api/create-folder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: currentPath,
            name: folderName
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create folder');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('success', 'Folder Created', `${folderName} has been created successfully.`, 3000);
            
            // Close the modal and reset input
            closeModal('new-folder-modal');
            folderNameInput.value = '';
            
            // Refresh collections
            refreshCollections();
        } else {
            throw new Error(data.message || 'Failed to create folder');
        }
    })
    .catch(error => {
        console.error('Error creating folder:', error);
        showToast('error', 'Error', error.message || 'Failed to create folder. Please try again.', 5000);
    })
    .finally(() => {
        // Reset button state
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.innerHTML = 'Create';
        }
    });
}

/**
 * Preview an item
 * @param {Object} item - Item to preview
 */
function previewItem(item) {
    if (item.type === 'folder') return;
    
    if (item.type === 'image') {
        showImagePreview(item);
    } else if (item.type === 'video') {
        showVideoPreview(item);
    } else if (item.type === 'audio') {
        showAudioPreview(item);
    } else {
        // For other file types, try to download or open in a new tab
        window.open(`/api/download?path=${encodeURIComponent(item.path)}`, '_blank');
    }
}

/**
 * Show image preview in a modal
 * @param {Object} item - Image item to preview
 */
function showImagePreview(item) {
    // Create modal if it doesn't exist
    let previewModal = document.getElementById('image-preview-modal');
    
    if (!previewModal) {
        previewModal = document.createElement('div');
        previewModal.id = 'image-preview-modal';
        previewModal.className = 'modal-overlay image-preview-modal';
        
        previewModal.innerHTML = `
            <div class="modal-dialog fullscreen">
                <div class="modal-header">
                    <h3 class="modal-title" id="preview-title">Image Preview</h3>
                    <div class="preview-actions">
                        <button class="btn btn-icon" id="preview-download-btn" aria-label="Download">
                            <i class="ri-download-line"></i>
                        </button>
                        <button class="btn btn-icon" id="preview-share-btn" aria-label="Share">
                            <i class="ri-share-line"></i>
                        </button>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="image-container">
                        <img id="preview-image" src="" alt="">
                        <div class="image-loading">
                            <div class="spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewModal);
        
        // Close button functionality
        const closeBtn = previewModal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            closeModal('image-preview-modal');
        });
        
        // Download button functionality
        const downloadBtn = document.getElementById('preview-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const currentItem = previewModal.getAttribute('data-item-id');
                const item = collectionItems.find(i => i.id === currentItem);
                if (item) {
                    downloadItem(item);
                }
            });
        }
    }
    
    // Set the current item
    previewModal.setAttribute('data-item-id', item.id);
    
    // Update modal title
    const titleElement = document.getElementById('preview-title');
    if (titleElement) {
        titleElement.textContent = item.name;
    }
    
    // Show loading state
    const imageContainer = previewModal.querySelector('.image-container');
    const loadingElement = previewModal.querySelector('.image-loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    
    // Load the image
    const imgElement = document.getElementById('preview-image');
    if (imgElement) {
        imgElement.style.display = 'none';
        imgElement.src = `/api/download?path=${encodeURIComponent(item.path)}`;
        
        imgElement.onload = () => {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            imgElement.style.display = 'block';
        };
        
        imgElement.onerror = () => {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            imgElement.style.display = 'block';
            imgElement.src = '/static/images/image-error.png';
            
            showToast('error', 'Error', 'Failed to load image', 3000);
        };
    }
    
    // Show the modal
    showModal('image-preview-modal');
}

/**
 * Download an item
 * @param {Object} item - Item to download
 */
function downloadItem(item) {
    const downloadUrl = `/api/download?path=${encodeURIComponent(item.path)}`;
    
    // Create hidden link and trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = item.name;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
    }, 100);
}

/**
 * Rename an item
 * @param {Object} item - Item to rename
 */
function renameItem(item) {
    // Create modal if it doesn't exist
    let renameModal = document.getElementById('rename-modal');
    
    if (!renameModal) {
        renameModal = document.createElement('div');
        renameModal.id = 'rename-modal';
        renameModal.className = 'modal-overlay';
        
        renameModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">Rename Item</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="new-name" class="form-label">New Name</label>
                        <input type="text" id="new-name" class="form-control" placeholder="Enter new name">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-text" data-dismiss="modal">Cancel</button>
                    <button class="btn btn-primary" id="rename-btn">Rename</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(renameModal);
        
        // Close button functionality
        const closeBtn = renameModal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            closeModal('rename-modal');
        });
        
        const cancelBtn = renameModal.querySelector('[data-dismiss="modal"]');
        cancelBtn.addEventListener('click', () => {
            closeModal('rename-modal');
        });
    }
    
    // Set the current item
    renameModal.setAttribute('data-item-id', item.id);
    
    // Set current name as default value
    const nameInput = document.getElementById('new-name');
    if (nameInput) {
        nameInput.value = item.name;
    }
    
    // Handle rename action
    const renameBtn = document.getElementById('rename-btn');
    if (renameBtn) {
        // Remove any existing event listeners
        const newRenameBtn = renameBtn.cloneNode(true);
        renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);
        
        // Add new event listener
        newRenameBtn.addEventListener('click', () => {
            const newName = nameInput.value.trim();
            
            if (!newName) {
                showToast('error', 'Invalid Name', 'Please enter a valid name', 3000);
                return;
            }
            
            // Show loading state
            newRenameBtn.disabled = true;
            newRenameBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Renaming...';
            
            // API call to rename item
            fetch('/api/rename', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: item.path,
                    newName: newName
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to rename item');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showToast('success', 'Item Renamed', `Item has been renamed to ${newName}`, 3000);
                    
                    // Close the modal
                    closeModal('rename-modal');
                    
                    // Refresh collections
                    refreshCollections();
                } else {
                    throw new Error(data.message || 'Failed to rename item');
                }
            })
            .catch(error => {
                console.error('Error renaming item:', error);
                showToast('error', 'Error', error.message || 'Failed to rename item. Please try again.', 5000);
            })
            .finally(() => {
                // Reset button state
                newRenameBtn.disabled = false;
                newRenameBtn.innerHTML = 'Rename';
            });
        });
    }
    
    // Show the modal
    showModal('rename-modal');
}

/**
 * Delete an item
 * @param {Object} item - Item to delete
 */
function deleteItem(item) {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        // API call to delete item
        fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: item.path
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete item');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showToast('success', 'Item Deleted', `${item.name} has been moved to trash`, 3000);
                
                // Refresh collections
                refreshCollections();
            } else {
                throw new Error(data.message || 'Failed to delete item');
            }
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            showToast('error', 'Error', error.message || 'Failed to delete item. Please try again.', 5000);
        });
    }
}

/**
 * Delete multiple selected items
 */
function deleteSelectedItems() {
    if (selectedItems.size === 0) return;
    
    const count = selectedItems.size;
    if (confirm(`Are you sure you want to delete ${count} item${count !== 1 ? 's' : ''}?`)) {
        // Get paths of selected items
        const itemsToDelete = collectionItems.filter(item => selectedItems.has(item.id));
        const paths = itemsToDelete.map(item => item.path);
        
        // API call to delete items
        fetch('/api/delete-multiple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paths: paths
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete items');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showToast('success', 'Items Deleted', `${count} item${count !== 1 ? 's' : ''} moved to trash`, 3000);
                
                // Clear selection
                selectedItems.clear();
                updateSelectionUI();
                
                // Refresh collections
                refreshCollections();
            } else {
                throw new Error(data.message || 'Failed to delete items');
            }
        })
        .catch(error => {
            console.error('Error deleting items:', error);
            showToast('error', 'Error', error.message || 'Failed to delete items. Please try again.', 5000);
        });
    }
}

/**
 * Upload files
 */
function startFileUpload() {
    const fileInput = document.getElementById('file-upload');
    if (!fileInput || !fileInput.files.length) {
        showToast('error', 'No Files Selected', 'Please select files to upload', 3000);
        return;
    }
    
    const files = fileInput.files;
    const uploadItemsContainer = document.getElementById('upload-items');
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('path', currentPath);
    
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    // Update button state
    const uploadBtn = document.getElementById('upload-start-btn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading...';
    }
    
    // Start upload
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to upload files');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('success', 'Upload Complete', `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully`, 3000);
            
            // Close the modal and reset input
            closeModal('upload-modal');
            fileInput.value = '';
            
            // Clear upload progress
            if (uploadItemsContainer) {
                uploadItemsContainer.innerHTML = '';
            }
            
            // Refresh collections
            refreshCollections();
        } else {
            throw new Error(data.message || 'Failed to upload files');
        }
    })
    .catch(error => {
        console.error('Error uploading files:', error);
        showToast('error', 'Upload Error', error.message || 'Failed to upload files. Please try again.', 5000);
    })
    .finally(() => {
        // Reset button state
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = 'Upload';
        }
    });
}
