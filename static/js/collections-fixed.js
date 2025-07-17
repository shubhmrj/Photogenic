// Global variables
let currentPath = '';
let viewMode = 'grid'; // 'grid' or 'list'
let sortBy = 'name'; // 'name', 'date', 'size'
let collections = []; // Will store folders and files

// DOM elements - with null checks
const preloader = document.querySelector('.preloader');
const collectionsGrid = document.querySelector('.collections-grid');
const breadcrumbContainer = document.querySelector('.breadcrumb');
const newFolderBtn = document.getElementById('new-folder-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const gridViewBtn = document.getElementById('grid-view-btn');
const listViewBtn = document.getElementById('list-view-btn');
const sortSelect = document.getElementById('sort-select');
const folderModal = document.getElementById('folder-modal');
const folderNameInput = document.getElementById('folder-name-input');
const createFolderBtn = document.getElementById('create-folder-btn');
const cancelFolderBtn = document.getElementById('cancel-folder-btn');
const closeFolderModalBtn = document.querySelector('.modal-close');

// Helper functions
function getFileUrl(path, ownerId = null) {
    const encodedPath = encodeURIComponent(path);
    let url = `/api/collections/file/${encodedPath}`;
    const params = [];
    if (ownerId) {
        params.push(`owner_id=${ownerId}`);
    }
    // Add a timestamp to bypass browser cache and ensure latest permission checks
    params.push(`t=${Date.now()}`);
    if (params.length) {
        url += `?${params.join('&')}`;
    }
    return url;
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Initialize viewMode from localStorage or default to 'grid'
    viewMode = localStorage.getItem('viewMode') || 'grid';
    console.log('Initial viewMode:', viewMode);
    
    // Set initial view mode
    setViewMode(viewMode);
    
    // Set up event listeners for sidebar navigation
    setupSidebarNavigation();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load collections
    loadCollections();
});

// Set up sidebar navigation
function setupSidebarNavigation() {
    console.log('Setting up sidebar navigation');
    
    // Get all sidebar items
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    // Add click event to each sidebar item
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get section name
            const sectionName = this.querySelector('.sidebar-text').textContent.trim();
            console.log('Clicked on sidebar section:', sectionName);
            
            // Update path based on section
            if (sectionName === 'My Collections') {
                currentPath = '';
            } else if (sectionName === 'Recent') {
                currentPath = 'recent';
            } else if (sectionName === 'Favorites') {
                currentPath = 'favorites';
            } else if (sectionName === 'Permitted') {
                currentPath = 'shared';
            } else if (sectionName === 'Trash') {
                currentPath = 'trash';
            }
            
            // Load collections for the selected section
            loadCollections();
        });
    });
}

// Set up all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // New folder button
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', () => {
            openFolderModal();
        });
    }
    
    // Upload button
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                uploadFiles(e.target.files);
            }
        });
    }
    
    // View mode buttons
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            setViewMode('grid');
        });
    }
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            setViewMode('list');
        });
    }
    
    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortBy = sortSelect.value;
            sortCollections();
            displayCollections(collections);
        });
    }
    
    // Folder modal
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', createFolder);
    }
    
    if (cancelFolderBtn) {
        cancelFolderBtn.addEventListener('click', closeFolderModal);
    }
    
    if (closeFolderModalBtn) {
        closeFolderModalBtn.addEventListener('click', closeFolderModal);
    }
}

// Set view mode (grid or list)
function setViewMode(mode) {
    console.log('Setting view mode to:', mode);
    viewMode = mode;
    
    // Save to localStorage
    localStorage.setItem('viewMode', viewMode);
    
    // Update UI
    if (gridViewBtn && listViewBtn) {
        if (viewMode === 'grid') {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }
    }
    
    // If collections are already loaded, update display
    if (collections && collections.length > 0) {
        displayCollections(collections);
    }
}

// Load collections from API
function loadCollections() {
    console.log('Loading collections for path:', currentPath);
    
    // Show preloader
    if (preloader) preloader.style.display = 'flex';
    
    // Clear collections grid
    if (collectionsGrid) collectionsGrid.innerHTML = '';
    
    // Update breadcrumb
    updateBreadcrumb();
    
    // Fetch collections from API
    fetch(`/api/collections?path=${encodeURIComponent(currentPath)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Collections data received:', data);
            
            // Store collections
            collections = data;
            
            // Sort collections
            sortCollections();
            
            // Display collections
            displayCollections(collections);
            
            // Hide preloader
            if (preloader) preloader.style.display = 'none';
        })
        .catch(error => {
            console.error('Error loading collections:', error);
            
            // Show error message
            if (collectionsGrid) {
                collectionsGrid.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <h3>Error loading collections</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="loadCollections()">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                    </div>
                `;
            }
            
            // Hide preloader
            if (preloader) preloader.style.display = 'none';
        });
}

// Sort collections based on sortBy
function sortCollections() {
    console.log('Sorting collections by:', sortBy);
    
    collections.sort((a, b) => {
        // Folders first
        if ((a.isDir || a.type === 'folder') && !(b.isDir || b.type === 'folder')) {
            return -1;
        }
        if (!(a.isDir || a.type === 'folder') && (b.isDir || b.type === 'folder')) {
            return 1;
        }
        
        // Sort based on sortBy
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'date') {
            return b.modifiedTime - a.modifiedTime;
        } else if (sortBy === 'size') {
            return b.size - a.size;
        }
        
        return 0;
    });
}

// Update breadcrumb
function updateBreadcrumb() {
    if (!breadcrumbContainer) return;
    
    // Clear breadcrumb
    breadcrumbContainer.innerHTML = '';
    
    // Add home
    const homeItem = document.createElement('li');
    homeItem.className = 'breadcrumb-item';
    homeItem.innerHTML = '<i class="fas fa-home"></i>';
    homeItem.addEventListener('click', () => {
        currentPath = '';
        loadCollections();
    });
    breadcrumbContainer.appendChild(homeItem);
    
    // If we're in a special folder, add it
    if (['recent', 'favorites', 'shared', 'trash'].includes(currentPath)) {
        const specialItem = document.createElement('li');
        specialItem.className = 'breadcrumb-item';
        
        let icon = 'folder';
        let text = currentPath;
        
        if (currentPath === 'recent') {
            icon = 'clock';
            text = 'Recent';
        } else if (currentPath === 'favorites') {
            icon = 'star';
            text = 'Favorites';
        } else if (currentPath === 'shared') {
            icon = 'share-alt';
            text = 'Permitted';
        } else if (currentPath === 'trash') {
            icon = 'trash';
            text = 'Trash';
        }
        
        specialItem.innerHTML = `<i class="fas fa-${icon}"></i> ${text}`;
        breadcrumbContainer.appendChild(specialItem);
        return;
    }
    
    // Add path segments
    if (currentPath) {
        const segments = currentPath.split('/');
        let path = '';
        
        segments.forEach((segment, index) => {
            path += segment;
            
            const item = document.createElement('li');
            item.className = 'breadcrumb-item';
            item.textContent = segment;
            
            // Add click event to navigate to this path
            if (index < segments.length - 1) {
                item.addEventListener('click', () => {
                    currentPath = path;
                    loadCollections();
                });
            }
            
            breadcrumbContainer.appendChild(item);
            
            path += '/';
        });
    }
}

// Display collections in the grid
function displayCollections(collectionsData) {
    console.log('Displaying collections:', collectionsData);
    
    const container = document.querySelector('.collections-grid');
    if (!container) {
        console.error('Collections grid container not found');
        return;
    }
    
    // Clear previous content
    container.innerHTML = '';
    
    // Check if collections is empty
    if (!collectionsData || collectionsData.length === 0) {
        // Show empty state
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-folder-open"></i>
                </div>
                <h3>This folder is empty</h3>
                <p>Upload files or create a new folder to get started</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" id="upload-empty-btn">
                        <i class="fas fa-upload"></i> Upload Files
                    </button>
                    <button class="btn btn-secondary" id="new-folder-empty-btn">
                        <i class="fas fa-folder-plus"></i> New Folder
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners to empty state buttons
        const uploadEmptyBtn = document.getElementById('upload-empty-btn');
        const newFolderEmptyBtn = document.getElementById('new-folder-empty-btn');
        
        if (uploadEmptyBtn && fileInput) {
            uploadEmptyBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        if (newFolderEmptyBtn) {
            newFolderEmptyBtn.addEventListener('click', () => {
                openFolderModal();
            });
        }
        
        return;
    }
    
    // Store the collections for later use
    window.collections = collectionsData;
    collections = collectionsData;
    
    // Create items container based on view mode
    const itemsContainer = document.createElement('div');
    itemsContainer.className = viewMode === 'grid' ? 'collections-items-grid' : 'collections-items-list';
    container.appendChild(itemsContainer);
    
    // Add items to the container
    collectionsData.forEach((item, index) => {
        // Create item element
        const itemElement = document.createElement('div');
        itemElement.className = `collection-item ${item.isDir || item.type === 'folder' ? 'folder' : 'file'}`;
        if (viewMode === 'list') {
            itemElement.classList.add('list-view');
        }
        itemElement.setAttribute('data-path', item.path);
        itemElement.setAttribute('data-name', item.name);
        itemElement.setAttribute('data-type', item.isDir || item.type === 'folder' ? 'folder' : 'file');
        
        // Add animation delay for staggered appearance
        itemElement.style.animationDelay = `${index * 0.05}s`;
        
        // Create collection card
        const cardElement = document.createElement('div');
        cardElement.className = 'collection-card';
        
        // Create preview element
        const previewElement = document.createElement('div');
        previewElement.className = 'collection-preview';
        
        // Add icon or thumbnail
        if (item.isDir || item.type === 'folder') {
            previewElement.innerHTML = '<i class="fas fa-folder"></i>';
        } else if (item.isImage) {
            // For images, show a thumbnail with loading animation
            previewElement.innerHTML = `
                <div class="thumbnail-loading">
                    <div class="spinner"></div>
                </div>
                <img 
                    src="${getFileUrl(item.path, item.owner_id)}" 
                    alt="${item.name}" 
                    loading="lazy"
                    onload="this.parentNode.querySelector('.thumbnail-loading')?.remove()"
                    onerror="this.onerror=null; this.src='/static/images/image-error.png';"
                >
                <div class="image-overlay">
                    <button class="overlay-btn preview-btn" title="Preview"><i class="fas fa-eye"></i></button>
                    <button class="overlay-btn download-btn" title="Download"><i class="fas fa-download"></i></button>
                </div>
            `;
            
            // Add event listeners to overlay buttons
            setTimeout(() => {
                const overlayBtns = previewElement.querySelectorAll('.overlay-btn');
                overlayBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (btn.classList.contains('preview-btn')) {
                            previewImage(item.path, item.name, item.owner_id);
                        } else if (btn.classList.contains('download-btn')) {
                            downloadItem(item.path, item.name, item.owner_id);
                        }
                    });
                });
            }, 100);
        } else {
            // For other files, show an icon based on extension
            const extension = item.name.split('.').pop().toLowerCase();
            let iconClass = 'fas fa-file';
            
            // Set icon based on file type
            if (['pdf'].includes(extension)) {
                iconClass = 'fas fa-file-pdf';
            } else if (['doc', 'docx'].includes(extension)) {
                iconClass = 'fas fa-file-word';
            } else if (['xls', 'xlsx'].includes(extension)) {
                iconClass = 'fas fa-file-excel';
            } else if (['ppt', 'pptx'].includes(extension)) {
                iconClass = 'fas fa-file-powerpoint';
            } else if (['zip', 'rar', '7z'].includes(extension)) {
                iconClass = 'fas fa-file-archive';
            } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
                iconClass = 'fas fa-file-audio';
            } else if (['mp4', 'avi', 'mov'].includes(extension)) {
                iconClass = 'fas fa-file-video';
            } else if (['html', 'css', 'js', 'php', 'py', 'java', 'cpp'].includes(extension)) {
                iconClass = 'fas fa-file-code';
            } else if (['txt', 'md'].includes(extension)) {
                iconClass = 'fas fa-file-alt';
            }
            
            previewElement.innerHTML = `<i class="${iconClass}"></i>`;
        }
        
        cardElement.appendChild(previewElement);
        
        // Create info element
        const infoElement = document.createElement('div');
        infoElement.className = 'collection-info';
        
        // Add name
        const nameElement = document.createElement('div');
        nameElement.className = 'collection-name';
        nameElement.textContent = item.name;
        infoElement.appendChild(nameElement);
        
        // Add details for list view
        if (viewMode === 'list') {
            // Add size
            const sizeElement = document.createElement('div');
            sizeElement.className = 'collection-size';
            sizeElement.textContent = item.isDir || item.type === 'folder' ? '--' : formatSize(item.size || 0);
            infoElement.appendChild(sizeElement);
            
            // Add modified time
            const timeElement = document.createElement('div');
            timeElement.className = 'collection-time';
            timeElement.textContent = formatDate(item.modifiedTime);
            infoElement.appendChild(timeElement);
        }
        
        cardElement.appendChild(infoElement);
        
        // Add shared badge if the item is shared
        if (item.shared_by) {
            const sharedBadge = document.createElement('div');
            sharedBadge.className = 'shared-badge';
            sharedBadge.title = `Shared by ${item.shared_by}`;
            sharedBadge.innerHTML = `<i class="fas fa-user-friends"></i> ${item.shared_by}`;
            cardElement.appendChild(sharedBadge);
        }
        
        // Add the three-dot menu directly to the card
        const menuButton = document.createElement('button');
        menuButton.className = 'three-dot-menu';
        menuButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        menuButton.setAttribute('aria-label', 'Menu');
        menuButton.setAttribute('title', 'Click for options');
        menuButton.style.zIndex = '100'; // Ensure the menu is above other elements
        menuButton.style.position = 'absolute'; // Force absolute positioning
        menuButton.style.display = 'flex'; // Ensure it's visible
        cardElement.appendChild(menuButton);
        
        // Create the dropdown menu
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';
        dropdownMenu.style.zIndex = '101'; // Ensure the dropdown is above the menu button
        cardElement.appendChild(dropdownMenu);
        
        // Add menu options
        const menuOptions = [
            {
                icon: 'fas fa-edit',
                text: 'Rename',
                action: () => renameItem(item.path, item.name)
            },
            {
                icon: 'fas fa-trash',
                text: 'Delete',
                action: () => deleteItem(item.path, item.name, item.isDir || item.type === 'folder')
            },
            {
                icon: 'fas fa-share-alt',
                text: 'Share',
                action: () => shareItem(item.path, item.isDir || item.type === 'folder')
            }
        ];
        
        // Add download option for files
        if (!(item.isDir || item.type === 'folder')) {
            menuOptions.push({
                icon: 'fas fa-download',
                text: 'Download',
                action: () => downloadItem(item.path, item.name, item.owner_id)
            });
            
            // Add analyze option for images
            if (item.isImage) {
                menuOptions.push({
                    icon: 'fas fa-magic',
                    text: 'Analyze',
                    action: () => analyzeImage(item.path)
                });
            }
        }
        
        // Create menu items
        menuOptions.forEach(option => {
            const menuItem = document.createElement('button');
            menuItem.className = 'dropdown-item';
            menuItem.innerHTML = `<i class="${option.icon}"></i> ${option.text}`;
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                // Hide the dropdown
                dropdownMenu.classList.remove('show');
                // Execute the action
                option.action();
            });
            dropdownMenu.appendChild(menuItem);
        });
        
        // Toggle dropdown on menu button click
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Close all other open dropdowns
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.classList.remove('show');
                }
            });
            
            // Toggle this dropdown
            dropdownMenu.classList.toggle('show');
        });
        
        // Add the card to the item element
        itemElement.appendChild(cardElement);
        
        // Add click event to navigate to folder or preview file
        cardElement.addEventListener('click', (e) => {
            // Don't navigate if clicking on the menu
            if (e.target.closest('.three-dot-menu') || e.target.closest('.dropdown-menu')) {
                return;
            }
            
            if (item.isDir || item.type === 'folder') {
                navigateToFolder(item.path);
            } else if (item.isImage) {
                previewImage(item.path, item.name, item.owner_id);
            } else {
                // For other file types, download the file
                downloadItem(item.path, item.name, item.owner_id);
            }
        });
        
        // Add the item to the container
        itemsContainer.appendChild(itemElement);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.three-dot-menu') && !e.target.closest('.dropdown-menu')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// Navigate to folder
function navigateToFolder(path) {
    console.log('Navigating to folder:', path);
    currentPath = path;
    loadCollections();
}

// Preview image
function previewImage(path, name, ownerId = null) {
    console.log('Previewing image:', path);
    // Implementation depends on your image viewer
    const imageUrl = getFileUrl(path, ownerId);
    
    // Create image viewer
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    viewer.innerHTML = `
        <div class="image-viewer-overlay"></div>
        <div class="image-viewer-content">
            <div class="image-viewer-header">
                <h3>${name}</h3>
                <button class="image-viewer-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="image-viewer-body">
                <img src="${imageUrl}" alt="${name}">
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(viewer);
    
    // Add close event
    viewer.querySelector('.image-viewer-close').addEventListener('click', () => {
        viewer.remove();
    });
    
    // Close on overlay click
    viewer.querySelector('.image-viewer-overlay').addEventListener('click', () => {
        viewer.remove();
    });
}

// Share item
function shareItem(path, isFolder) {
    console.log('Sharing item:', path, 'isFolder:', isFolder);
    // Implementation depends on your sharing functionality
    // You might want to open a modal to select users to share with
    
    // Example: Open share modal
    const shareModal = document.getElementById('share-modal');
    if (shareModal) {
        // Set item path and type in the modal
        shareModal.setAttribute('data-path', path);
        shareModal.setAttribute('data-is-folder', isFolder);
        
        // Show modal
        shareModal.style.display = 'flex';
    }
}

// Delete item
function deleteItem(path, name, isFolder) {
    console.log('Deleting item:', path, 'isFolder:', isFolder);
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
        return;
    }
    
    // Send delete request
    fetch('/api/collections/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: path,
            isFolder: isFolder
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete item');
        }
        return response.json();
    })
    .then(data => {
        console.log('Item deleted:', data);
        
        // Reload collections
        loadCollections();
    })
    .catch(error => {
        console.error('Error deleting item:', error);
        alert('Failed to delete item: ' + error.message);
    });
}

// Download item
function downloadItem(path, name, ownerId = null) {
    console.log('Downloading item:', path);
    
    // Create a temporary link
    const link = document.createElement('a');
    link.href = getFileUrl(path, ownerId);
    link.download = name;
    link.target = '_blank';
    
    // Append to body
    document.body.appendChild(link);
    
    // Click the link
    link.click();
    
    // Remove the link
    document.body.removeChild(link);
}

// Open folder modal
function openFolderModal() {
    console.log('Opening folder modal');
    
    if (folderModal) {
        folderModal.style.display = 'flex';
        
        // Focus on input
        if (folderNameInput) {
            folderNameInput.value = '';
            folderNameInput.focus();
        }
    }
}

// Close folder modal
function closeFolderModal() {
    console.log('Closing folder modal');
    
    if (folderModal) {
        folderModal.style.display = 'none';
    }
}

// Create folder
function createFolder() {
    console.log('Creating folder');
    
    // Get folder name
    const folderName = folderNameInput ? folderNameInput.value.trim() : '';
    
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }
    
    // Create folder path
    const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    
    // Send create request
    fetch('/api/collections/create-folder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: folderPath
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create folder');
        }
        return response.json();
    })
    .then(data => {
        console.log('Folder created:', data);
        
        // Close modal
        closeFolderModal();
        
        // Reload collections
        loadCollections();
    })
    .catch(error => {
        console.error('Error creating folder:', error);
        alert('Failed to create folder: ' + error.message);
    });
}

// Upload files
function uploadFiles(files) {
    console.log('Uploading files:', files);
    
    // Create FormData
    const formData = new FormData();
    
    // Add files
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    // Add current path
    formData.append('path', currentPath);
    
    // Show upload progress
    // Implementation depends on your UI
    
    // Send upload request
    fetch('/api/collections/upload', {
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
        console.log('Files uploaded:', data);
        
        // Reload collections
        loadCollections();
    })
    .catch(error => {
        console.error('Error uploading files:', error);
        alert('Failed to upload files: ' + error.message);
    });
}

// Rename item
function renameItem(path, currentName) {
    console.log('Renaming item:', path);
    
    // Create modal for renaming
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'renameModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'renameModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="renameModalLabel">Rename Item</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="renameForm">
                        <div class="form-group">
                            <label for="newName">New Name</label>
                            <input type="text" class="form-control" id="newName" value="${currentName}" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="renameSubmit">Rename</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Initialize Bootstrap modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Focus on input
    const newNameInput = document.getElementById('newName');
    if (newNameInput) {
        newNameInput.focus();
        newNameInput.select();
    }
    
    // Handle rename submission
    const renameSubmit = document.getElementById('renameSubmit');
    if (renameSubmit) {
        renameSubmit.addEventListener('click', () => {
            const newName = newNameInput.value.trim();
            
            if (!newName) {
                alert('Please enter a valid name');
                return;
            }
            
            // Send rename request
            fetch('/api/collections/rename', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: path,
                    new_name: newName
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to rename item');
                }
                return response.json();
            })
            .then(data => {
                console.log('Rename successful:', data);
                
                // Close modal
                modalInstance.hide();
                
                // Remove modal from DOM after hiding
                modal.addEventListener('hidden.bs.modal', () => {
                    document.body.removeChild(modal);
                });
                
                // Reload collections
                loadCollections(currentPath);
                
                // Show success message
                showToast('Item renamed successfully', 'success');
            })
            .catch(error => {
                console.error('Error renaming item:', error);
                showToast('Failed to rename item', 'error');
            });
        });
    }
    
    // Handle form submission (Enter key)
    const renameForm = document.getElementById('renameForm');
    if (renameForm) {
        renameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            renameSubmit.click();
        });
    }
    
    // Remove modal from DOM when closed
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Get toast icon based on type
function getToastIcon(type) {
    switch (type) {
        case 'success':
            return 'fas fa-check-circle';
        case 'error':
            return 'fas fa-exclamation-circle';
        case 'warning':
            return 'fas fa-exclamation-triangle';
        default:
            return 'fas fa-info-circle';
    }
}

// Add to favorites
function addToFavorites(path) {
    console.log('Adding to favorites:', path);
    
    // Send request
    fetch('/api/collections/favorite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: path,
            action: 'add'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add to favorites');
        }
        return response.json();
    })
    .then(data => {
        console.log('Added to favorites:', data);
        
        // Show notification
        alert('Added to favorites');
    })
    .catch(error => {
        console.error('Error adding to favorites:', error);
        alert('Failed to add to favorites: ' + error.message);
    });
}

// Analyze image with AI
function analyzeImage(path) {
    console.log('Analyzing image:', path);
    
    // Show loading toast
    const toastId = showToast('info', 'Analyzing Image', 'Processing your image...', 0);
    
    // Create or get the analysis modal
    let analysisModal = document.getElementById('analysis-modal');
    if (!analysisModal) {
        analysisModal = document.createElement('div');
        analysisModal.id = 'analysis-modal';
        analysisModal.className = 'modal';
        
        analysisModal.innerHTML = `
            <div class="modal-content analysis-modal">
                <div class="modal-header">
                    <h3>Image Analysis</h3>
                    <button class="modal-close" id="close-analysis-btn">×</button>
                </div>
                <div class="modal-body">
                    <div class="analysis-loading">
                        <div class="analysis-spinner"></div>
                        <p>Analyzing your image...</p>
                    </div>
                    <div class="analysis-results" style="display: none;">
                        <div class="analysis-image-container">
                            <img src="" alt="Analyzed Image" id="analysis-image">
                        </div>
                        <div class="analysis-tags-container">
                            <h4>AI-Generated Tags</h4>
                            <div class="analysis-tags" id="analysis-tags"></div>
                            <button class="btn btn-primary" id="apply-tags-btn">Apply Tags</button>
                        </div>
                        <div class="analysis-details">
                            <h4>Image Details</h4>
                            <div id="analysis-details-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(analysisModal);
        
        // Add event listeners
        document.getElementById('close-analysis-btn').addEventListener('click', closeAnalysisModal);
        document.getElementById('apply-tags-btn').addEventListener('click', applyAITags);
    }
    
    // Show the modal
    analysisModal.style.display = 'flex';
    
    // Show loading state
    const loadingElement = document.querySelector('.analysis-loading');
    const resultsElement = document.querySelector('.analysis-results');
    if (loadingElement && resultsElement) {
        loadingElement.style.display = 'flex';
        resultsElement.style.display = 'none';
    }
    
    // Set the image source
    const analysisImage = document.getElementById('analysis-image');
    if (analysisImage) {
        analysisImage.src = getFileUrl(path);
    }
    
    // Call the API to analyze the image
    fetch(`/api/analyze?path=${encodeURIComponent(path)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to analyze image');
            }
            return response.json();
        })
        .then(data => {
            // Close the loading toast
            closeToast(document.getElementById(toastId));
            
            // Display the analysis results
            displayAnalysisResults(data, path);
        })
        .catch(error => {
            // Close the loading toast
            closeToast(document.getElementById(toastId));
            
            // Show error toast
            showToast('error', 'Analysis Failed', error.message, 5000);
            
            // Close the modal
            closeAnalysisModal();
        });
}

// Function to display analysis results with improved UI
function displayAnalysisResults(results, path) {
    // Hide loading, show results
    const loadingElement = document.querySelector('.analysis-loading');
    const resultsElement = document.querySelector('.analysis-results');
    if (loadingElement && resultsElement) {
        loadingElement.style.display = 'none';
        resultsElement.style.display = 'block';
    }
    
    // Display tags
    const tagsContainer = document.getElementById('analysis-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        
        if (results.tags && results.tags.length > 0) {
            results.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.setAttribute('data-tag', tag);
                tagsContainer.appendChild(tagElement);
                
                // Add click event to toggle tag selection
                tagElement.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
            });
        } else {
            tagsContainer.innerHTML = '<p>No tags found</p>';
        }
    }
    
    // Display details
    const detailsContainer = document.getElementById('analysis-details-content');
    if (detailsContainer) {
        let detailsHTML = '<table class="analysis-details-table">';
        
        // Add file details
        detailsHTML += `
            <tr>
                <td>Filename</td>
                <td>${path.split('/').pop()}</td>
            </tr>
        `;
        
        // Add dimensions if available
        if (results.dimensions) {
            detailsHTML += `
                <tr>
                    <td>Dimensions</td>
                    <td>${results.dimensions.width} × ${results.dimensions.height}</td>
                </tr>
            `;
        }
        
        // Add file size if available
        if (results.size) {
            detailsHTML += `
                <tr>
                    <td>File Size</td>
                    <td>${formatSize(results.size)}</td>
                </tr>
            `;
        }
        
        // Add other metadata
        if (results.metadata) {
            for (const [key, value] of Object.entries(results.metadata)) {
                detailsHTML += `
                    <tr>
                        <td>${key}</td>
                        <td>${value}</td>
                    </tr>
                `;
            }
        }
        
        detailsHTML += '</table>';
        detailsContainer.innerHTML = detailsHTML;
    }
    
    // Store the path for apply tags function
    document.getElementById('apply-tags-btn').setAttribute('data-path', path);
}

// Function to close analysis modal
function closeAnalysisModal() {
    const modal = document.getElementById('analysis-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to apply selected AI tags
function applyAITags() {
    const path = document.getElementById('apply-tags-btn').getAttribute('data-path');
    const selectedTags = Array.from(document.querySelectorAll('.tag.selected')).map(tag => tag.getAttribute('data-tag'));
    
    if (selectedTags.length === 0) {
        showToast('warning', 'No Tags Selected', 'Please select at least one tag to apply', 3000);
        return;
    }
    
    // Show loading toast
    const toastId = showToast('info', 'Applying Tags', 'Updating file metadata...', 0);
    
    // Call API to apply tags
    fetch('/api/apply-tags', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: path,
            tags: selectedTags
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to apply tags');
        }
        return response.json();
    })
    .then(data => {
        // Close the loading toast
        closeToast(document.getElementById(toastId));
        
        // Show success toast
        showToast('success', 'Tags Applied', 'Successfully applied tags to image', 3000);
        
        // Close the modal
        closeAnalysisModal();
        
        // Reload collections to show updated metadata
        loadCollections();
    })
    .catch(error => {
        // Close the loading toast
        closeToast(document.getElementById(toastId));
        
        // Show error toast
        showToast('error', 'Failed to Apply Tags', error.message, 5000);
    });
}

// Setup drag and drop
function setupDragAndDrop() {
    console.log('Setting up drag and drop');
    
    // Implementation depends on your requirements
}

// Setup multi-select
function setupMultiSelect() {
    console.log('Setting up multi-select');
    
    // Implementation depends on your requirements
}

// Setup context menu
function setupContextMenu() {
    console.log('Setting up context menu');
    
    // Implementation depends on your requirements
}

// Export functions for global access
window.loadCollections = loadCollections;
window.navigateToFolder = navigateToFolder;
window.previewImage = previewImage;
window.shareItem = shareItem;
window.deleteItem = deleteItem;
window.downloadItem = downloadItem;
window.openFolderModal = openFolderModal;
window.createFolder = createFolder;
