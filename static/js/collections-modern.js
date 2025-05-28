/**
 * Collections Modern JavaScript
 * Handles interaction with collections in the PhotoGeni interface
 */

let currentPath = '/';
let collectionItems = [];
let selectedItems = new Set();
let lastSelectedItem = null;
let viewMode = localStorage.getItem('collections-view') || 'grid';
let sortBy = localStorage.getItem('collections-sort') || 'name';
let sortOrder = localStorage.getItem('collections-sort-order') || 'asc';

// Advanced Search and Filters
let currentFilters = {
    search: '',
    types: ['image'],
    dateRange: 'any',
    customDateFrom: null,
    customDateTo: null,
    size: 'any',
    tags: []
};

let sortConfig = {
    by: 'name',
    direction: 'asc'
};

// Batch Operations
let isSelectionMode = false;

// Toast notifications
let toastContainer;

function initializeToasts() {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

function showToast(type, message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="ri-${type === 'success' ? 'check-line' : 'error-warning-line'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeToasts();
    initializeCollections();
    setupEventListeners();
    setupKeyboardShortcuts();
    setupContextMenu();
    setupUploadHandlers();
    setupNewFolderButton();
    setupUserInfoButton();
    initializeAdvancedSearch();
    initializeBatchOperations();
    setupCollectionItemHandlers();
    setupCollaborationHandlers();
});

/**
 * Initialize collections view
 */
function initializeCollections() {
    // Set initial view mode
    const collectionsGrid = document.getElementById('collections-grid');
    if (collectionsGrid) {
        collectionsGrid.className = viewMode === 'list' ? 'collections-list' : 'collections-grid';
        
        // Update view toggle buttons
        const gridViewBtn = document.getElementById('grid-view-btn');
        const listViewBtn = document.getElementById('list-view-btn');
        
        if (gridViewBtn && listViewBtn) {
            if (viewMode === 'list') {
                gridViewBtn.classList.remove('active');
                listViewBtn.classList.add('active');
            } else {
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            }
        }
    }
    
    // Load initial collections
    loadCollections(currentPath);
}

/**
 * Set up event listeners for collections functionality
 */
function setupEventListeners() {
    // View mode toggle
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => setViewMode('grid'));
    }
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => setViewMode('list'));
    }
    
    // Sorting options
    const sortByNameBtn = document.getElementById('sort-by-name-btn');
    const sortByDateBtn = document.getElementById('sort-by-date-btn');
    
    if (sortByNameBtn) {
        sortByNameBtn.addEventListener('click', () => {
            setSortOption('name');
            refreshCollections();
        });
    }
    
    if (sortByDateBtn) {
        sortByDateBtn.addEventListener('click', () => {
            setSortOption('date');
            refreshCollections();
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => refreshCollections());
    }
    
    // Select all button
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => toggleSelectAll());
    }
    
    // Empty state buttons
    const emptyUploadBtn = document.getElementById('empty-upload-btn');
    if (emptyUploadBtn) {
        emptyUploadBtn.addEventListener('click', () => showModal('upload-modal'));
    }
    
    const emptyNewFolderBtn = document.getElementById('empty-new-folder-btn');
    if (emptyNewFolderBtn) {
        emptyNewFolderBtn.addEventListener('click', () => showModal('new-folder-modal'));
    }
    
    // New folder creation
    const createFolderBtn = document.getElementById('create-folder-btn');
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', () => createNewFolder());
    }
    
    // Upload button
    const uploadStartBtn = document.getElementById('upload-start-btn');
    if (uploadStartBtn) {
        uploadStartBtn.addEventListener('click', () => startFileUpload());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore if we're in an input field
        if (e.target.matches('input, textarea, select, [contenteditable]')) return;
        
        // Select all: Ctrl+A
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            toggleSelectAll();
        }
        
        // Delete selected: Delete key
        if (e.key === 'Delete' && selectedItems.size > 0) {
            e.preventDefault();
            deleteSelectedItems();
        }
        
        // Grid view: G key
        if (e.key === 'g') {
            e.preventDefault();
            setViewMode('grid');
        }
        
        // List view: L key
        if (e.key === 'l') {
            e.preventDefault();
            setViewMode('list');
        }
        
        // Upload: U key
        if (e.key === 'u') {
            e.preventDefault();
            showModal('upload-modal');
        }
        
        // New folder: N key
        if (e.key === 'n') {
            e.preventDefault();
            showModal('new-folder-modal');
        }
        
        // Refresh: F5 key
        if (e.key === 'F5') {
            e.preventDefault();
            refreshCollections();
        }
        
        // Go to parent folder: Backspace key
        if (e.key === 'Backspace' && currentPath !== '/') {
            e.preventDefault();
            navigateToParent();
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Don't handle shortcuts if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'a':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    selectAllItems();
                }
                break;
            case 'Escape':
                clearSelection();
                break;
            case 'Delete':
                if (selectedItems.size > 0) {
                    e.preventDefault();
                    deleteSelectedItems();
                }
                break;
            case 'ArrowUp':
                if (e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    navigateToParent();
                }
                break;
            case '?':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    showKeyboardShortcuts();
                }
                break;
            case 'u':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    document.getElementById('upload-input').click();
                }
                break;
            case 'n':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    showNewFolderDialog();
                }
                break;
        }
    });
}

function selectAllItems() {
    const items = document.querySelectorAll('.collection-item');
    items.forEach(item => {
        selectItem(item);
    });
    updateSelectionUI();
}

function selectItem(item, addToSelection = false) {
    if (!addToSelection) {
        clearSelection();
    }
    
    item.classList.add('selected');
    selectedItems.add(item.dataset.path);
    lastSelectedItem = item;
    
    updateSelectionUI();
}

function clearSelection() {
    document.querySelectorAll('.collection-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    selectedItems.clear();
    lastSelectedItem = null;
    updateSelectionUI();
}

function updateSelectionUI() {
    const selectionCount = selectedItems.size;
    const actionBar = document.getElementById('action-bar');
    
    if (selectionCount > 0) {
        actionBar.classList.add('show');
        actionBar.querySelector('.selection-count').textContent = `${selectionCount} selected`;
    } else {
        actionBar.classList.remove('show');
    }
}

function selectItemRange(endItem) {
    if (!lastSelectedItem) return;
    
    const items = Array.from(document.querySelectorAll('.collection-item'));
    const startIndex = items.indexOf(lastSelectedItem);
    const endIndex = items.indexOf(endItem);
    
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    clearSelection();
    
    for (let i = start; i <= end; i++) {
        selectItem(items[i], true);
    }
}

function showKeyboardShortcuts() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Load collections from the server
 * @param {string} path - Path to load
 */
function loadCollections(path) {
    const collectionsGrid = document.getElementById('collections-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!collectionsGrid || !emptyState) return;
    
    // Show loading state
    collectionsGrid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'card skeleton-card';
        skeletonCard.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div class="card-body">
                <div class="skeleton skeleton-text" style="width: 70%;"></div>
                <div class="skeleton skeleton-text" style="width: 40%;"></div>
            </div>
        `;
        collectionsGrid.appendChild(skeletonCard);
    }
    
    // Update current path
    currentPath = path;
    updateBreadcrumbs(path);
    
    // Reset selected items
    selectedItems.clear();
    
    // Fetch collections data
    fetch(`/api/collections?path=${encodeURIComponent(path)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load collections');
            }
            return response.json();
        })
        .then(data => {
            collectionItems = data.items || [];
            
            // Apply sorting
            sortCollectionItems();
            
            // Display items
            displayCollections();
            
            // Show empty state if no items
            emptyState.style.display = collectionItems.length === 0 ? 'flex' : 'none';
        })
        .catch(error => {
            console.error('Error loading collections:', error);
            showToast('error', 'Error', 'Failed to load collections. Please try again.', 5000);
            
            // Show empty state with error
            emptyState.style.display = 'flex';
            const emptyTitle = emptyState.querySelector('.empty-state-title');
            const emptyText = emptyState.querySelector('.empty-state-text');
            
            if (emptyTitle) emptyTitle.textContent = 'Error Loading Content';
            if (emptyText) emptyText.textContent = 'There was a problem loading your files. Please try refreshing the page.';
        })
        .finally(() => {
            // Remove skeleton loaders
            collectionsGrid.querySelectorAll('.skeleton-card').forEach(skeleton => {
                skeleton.remove();
            });
        });
}

/**
 * Display collection items in the UI
 */
function displayCollections() {
    const collectionsGrid = document.getElementById('collections-grid');
    if (!collectionsGrid) return;
    
    collectionsGrid.innerHTML = '';
    
    // Get the template
    const template = document.getElementById('collection-item-template');
    if (!template) return;
    
    collectionItems.forEach(item => {
        // Clone the template
        const collectionItem = document.importNode(template.content, true).firstElementChild;
        
        // Set item attributes and data
        collectionItem.setAttribute('data-id', item.id);
        collectionItem.setAttribute('data-type', item.type);
        collectionItem.setAttribute('data-name', item.name);
        collectionItem.setAttribute('data-path', item.path);
        
        // Set item content
        const nameElement = collectionItem.querySelector('.collection-name');
        if (nameElement) nameElement.textContent = item.name;
        
        const dateElement = collectionItem.querySelector('.collection-date');
        if (dateElement) dateElement.textContent = formatDate(item.modified);
        
        const sizeElement = collectionItem.querySelector('.collection-size');
        if (sizeElement) {
            sizeElement.textContent = item.type === 'folder' ? 
                `${item.itemCount || 0} items` : 
                formatFileSize(item.size || 0);
        }
        
        // Set item thumbnail
        const imgElement = collectionItem.querySelector('.collection-preview img');
        if (imgElement) {
            if (item.type === 'folder') {
                imgElement.src = '/static/images/folder-icon.png';
                imgElement.alt = 'Folder';
                
                // Remove loading indicator and show image immediately for folders
                const loadingElement = collectionItem.querySelector('.thumbnail-loading');
                if (loadingElement) loadingElement.remove();
            } else {
                // For files, show appropriate thumbnail based on type
                let thumbnailUrl = '/static/images/file-icon.png';
                
                if (item.type === 'image') {
                    thumbnailUrl = `/api/thumbnail?path=${encodeURIComponent(item.path)}`;
                } else if (item.type === 'video') {
                    thumbnailUrl = '/static/images/video-icon.png';
                } else if (item.type === 'audio') {
                    thumbnailUrl = '/static/images/audio-icon.png';
                } else if (item.type === 'document') {
                    thumbnailUrl = '/static/images/document-icon.png';
                }
                
                // Set thumbnail with loading handler
                imgElement.src = thumbnailUrl;
                imgElement.alt = item.name;
                
                // Handle thumbnail loading
                const loadingElement = collectionItem.querySelector('.thumbnail-loading');
                imgElement.onload = () => {
                    if (loadingElement) loadingElement.remove();
                };
                
                imgElement.onerror = () => {
                    if (loadingElement) loadingElement.remove();
                    imgElement.src = '/static/images/file-icon.png';
                    imgElement.alt = 'File';
                };
            }
        }
        
        // Set up item click handler for navigation
        collectionItem.addEventListener('click', (e) => {
            // Don't navigate if clicking on buttons or in selection mode
            if (e.target.closest('.btn') || selectedItems.size > 0) return;
            
            if (item.type === 'folder') {
                navigateToFolder(item.path);
            } else {
                previewItem(item);
            }
        });
        
        // Add item selection handling
        collectionItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleItemSelection(collectionItem, item.id);
        });
        
        // Handle overlay buttons
        const previewBtn = collectionItem.querySelector('.preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                previewItem(item);
            });
        }
        
        const downloadBtn = collectionItem.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadItem(item);
            });
        }
        
        // Set up menu dropdown
        setupItemMenu(collectionItem, item);
        
        // Add to the grid
        collectionsGrid.appendChild(collectionItem);
    });
}

/**
 * Set up the context menu for a collection item
 * @param {HTMLElement} itemElement - The collection item element
 * @param {Object} item - The item data
 */
function setupItemMenu(itemElement, item) {
    const menuBtn = itemElement.querySelector('.card-menu-btn');
    if (!menuBtn) return;
    
    // Create dropdown menu if it doesn't exist
    let dropdownId = `dropdown-${item.id}`;
    let dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'dropdown-menu';
        
        // Common actions
        dropdown.innerHTML = `
            <a href="#" class="dropdown-item item-rename-btn">
                <i class="ri-pencil-line"></i> Rename
            </a>
            <a href="#" class="dropdown-item item-copy-btn">
                <i class="ri-file-copy-line"></i> Copy
            </a>
            <a href="#" class="dropdown-item item-move-btn">
                <i class="ri-folder-transfer-line"></i> Move
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item item-download-btn">
                <i class="ri-download-line"></i> Download
            </a>
            <a href="#" class="dropdown-item item-share-btn">
                <i class="ri-share-line"></i> Share
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item item-delete-btn text-danger">
                <i class="ri-delete-bin-line"></i> Delete
            </a>
        `;
        
        document.body.appendChild(dropdown);
        
        // Set up action event listeners
        const renameBtn = dropdown.querySelector('.item-rename-btn');
        if (renameBtn) {
            renameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                renameItem(item);
            });
        }
        
        const copyBtn = dropdown.querySelector('.item-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                copyItem(item);
            });
        }
        
        const moveBtn = dropdown.querySelector('.item-move-btn');
        if (moveBtn) {
            moveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                moveItem(item);
            });
        }
        
        const downloadBtn = dropdown.querySelector('.item-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                downloadItem(item);
            });
        }
        
        const shareBtn = dropdown.querySelector('.item-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                shareItem(item);
            });
        }
        
        const deleteBtn = dropdown.querySelector('.item-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                deleteItem(item);
            });
        }
    }
    
    // Set the dropdown trigger
    menuBtn.setAttribute('data-dropdown', dropdownId);
}

/**
 * Update breadcrumb navigation
 * @param {string} path - Current path
 */
function updateBreadcrumbs(path) {
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const currentLocation = document.getElementById('current-location');
    
    if (!breadcrumbsContainer) return;
    
    // Clear existing breadcrumbs except the first one (root)
    while (breadcrumbsContainer.children.length > 1) {
        breadcrumbsContainer.removeChild(breadcrumbsContainer.lastChild);
    }
    
    // Set current location text
    if (currentLocation) {
        const pathParts = path.split('/').filter(Boolean);
        currentLocation.textContent = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Collections';
    }
    
    // Build breadcrumb trail
    if (path !== '/') {
        const pathParts = path.split('/').filter(Boolean);
        let currentPath = '';
        
        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            
            const breadcrumbItem = document.createElement('div');
            breadcrumbItem.className = 'breadcrumb-item';
            
            if (index === pathParts.length - 1) {
                // Current location
                breadcrumbItem.innerHTML = `<span class="breadcrumb-current">${part}</span>`;
            } else {
                // Parent location (clickable)
                breadcrumbItem.innerHTML = `<a href="#" class="breadcrumb-link" data-path="${currentPath}">${part}</a>`;
                
                // Add click handler
                const link = breadcrumbItem.querySelector('.breadcrumb-link');
                if (link) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        navigateToFolder(currentPath);
                    });
                }
            }
            
            breadcrumbsContainer.appendChild(breadcrumbItem);
        });
    }
}

/**
 * Navigate to a folder
 * @param {string} path - Folder path
 */
function navigateToFolder(path) {
    loadCollections(path);
    
    // Add to recent folders (could be implemented with localStorage)
    addToRecentFolders(path);
}

/**
 * Navigate to parent folder
 */
function navigateToParent() {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = '/' + pathParts.join('/');
    
    navigateToFolder(parentPath);
}

/**
 * Add a folder to recent folders list
 * @param {string} path - Folder path
 */
function addToRecentFolders(path) {
    // Get path parts to extract folder name
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length === 0) return;
    
    const folderName = pathParts[pathParts.length - 1];
    
    // Get existing recent folders
    let recentFolders = JSON.parse(localStorage.getItem('recent-folders') || '[]');
    
    // Add this folder if not already in the list
    const existingIndex = recentFolders.findIndex(folder => folder.path === path);
    if (existingIndex !== -1) {
        // Remove existing entry to move it to the top
        recentFolders.splice(existingIndex, 1);
    }
    
    // Add to the beginning of the array
    recentFolders.unshift({
        name: folderName,
        path: path,
        timestamp: Date.now()
    });
    
    // Keep only the most recent 5 folders
    recentFolders = recentFolders.slice(0, 5);
    
    // Save to localStorage
    localStorage.setItem('recent-folders', JSON.stringify(recentFolders));
    
    // Update the UI
    updateRecentFoldersUI();
}

/**
 * Update the recent folders in the sidebar
 */
function updateRecentFoldersUI() {
    const recentFoldersList = document.getElementById('recent-folders');
    if (!recentFoldersList) return;
    
    // Get recent folders from localStorage
    const recentFolders = JSON.parse(localStorage.getItem('recent-folders') || '[]');
    
    // Clear current list
    recentFoldersList.innerHTML = '';
    
    // Add folders to the list
    recentFolders.forEach(folder => {
        const listItem = document.createElement('li');
        listItem.className = 'nav-item';
        
        listItem.innerHTML = `
            <a href="#" class="nav-link" data-path="${folder.path}">
                <span class="nav-icon"><i class="ri-folder-line"></i></span>
                <span class="nav-text">${folder.name}</span>
            </a>
        `;
        
        // Add click handler
        const link = listItem.querySelector('.nav-link');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToFolder(folder.path);
            });
        }
        
        recentFoldersList.appendChild(listItem);
    });
}

// Context menu functionality
let contextTarget = null;

function setupContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    
    document.addEventListener('contextmenu', function(e) {
        const collectionItem = e.target.closest('.collection-item');
        if (collectionItem) {
            e.preventDefault();
            contextTarget = collectionItem;
            
            // Position the menu
            const x = e.clientX;
            const y = e.clientY;
            positionContextMenu(x, y);
            
            // Show/hide appropriate menu items
            customizeContextMenu(collectionItem);
            
            // Show the menu
            contextMenu.classList.add('show');
        }
    });
    
    // Hide context menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#context-menu')) {
            hideContextMenu();
        }
    });
    
    // Hide context menu when scrolling
    document.addEventListener('scroll', hideContextMenu);
}

function positionContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    
    // Check if menu would go off screen
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Adjust position if needed
    if (x + menuWidth > windowWidth) {
        x = windowWidth - menuWidth;
    }
    if (y + menuHeight > windowHeight) {
        y = windowHeight - menuHeight;
    }
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
}

function customizeContextMenu(item) {
    const menu = document.getElementById('context-menu');
    const isFolder = item.classList.contains('folder');
    const isImage = item.dataset.type === 'image';
    
    // Show/hide menu items based on item type
    menu.querySelector('[data-action="open"]').style.display = isFolder ? 'block' : 'none';
    menu.querySelector('[data-action="preview"]').style.display = isImage ? 'block' : 'none';
    menu.querySelector('[data-action="analyze"]').style.display = isImage ? 'block' : 'none';
    menu.querySelector('[data-action="share"]').style.display = 'block';
    menu.querySelector('[data-action="download"]').style.display = !isFolder ? 'block' : 'none';
    menu.querySelector('[data-action="rename"]').style.display = 'block';
    menu.querySelector('[data-action="delete"]').style.display = 'block';
}

function hideContextMenu() {
    const menu = document.getElementById('context-menu');
    menu.classList.remove('show');
    contextTarget = null;
}

function handleContextMenuAction(action) {
    if (!contextTarget) return;
    
    const path = contextTarget.dataset.path;
    
    switch(action) {
        case 'open':
            if (contextTarget.classList.contains('folder')) {
                navigateToFolder(path);
            }
            break;
        case 'preview':
            if (contextTarget.dataset.type === 'image') {
                previewFile(path);
            }
            break;
        case 'analyze':
            if (contextTarget.dataset.type === 'image') {
                analyzeImage(path);
            }
            break;
        case 'share':
            showShareDialog(path);
            break;
        case 'download':
            downloadFile(path);
            break;
        case 'rename':
            showRenameDialog(path);
            break;
        case 'delete':
            confirmDelete(path);
            break;
    }
    
    hideContextMenu();
}

// File upload handling
function setupUploadHandlers() {
    const uploadInput = document.getElementById('upload-input');
    const uploadButton = document.getElementById('upload-button');
    const dropZone = document.getElementById('collections-grid');
    
    // Handle click upload
    uploadButton.addEventListener('click', () => {
        uploadInput.click();
    });
    
    uploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    });
    
    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    });
}

async function handleFileUpload(files) {
    const uploadProgress = document.getElementById('upload-progress');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    const progressText = uploadProgress.querySelector('.progress-text');
    
    uploadProgress.classList.add('show');
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
                    progressBar.style.width = percentComplete + '%';
                    progressText.textContent = `Uploading ${file.name} (${Math.round(percentComplete)}%)`;
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    showToast('success', 'Upload Complete', `${file.name} uploaded successfully`);
                } else {
                    showToast('error', 'Upload Failed', result.message);
                }
            } else {
                showToast('error', 'Upload Failed', 'Server error occurred');
            }
        } catch (error) {
            showToast('error', 'Upload Failed', error.message);
        }
    }
    
    uploadProgress.classList.remove('show');
    loadCollections(currentPath); // Refresh the view
}

// New folder functionality
function setupNewFolderButton() {
    const newFolderButton = document.getElementById('new-folder-button');
    const newFolderModal = document.getElementById('new-folder-modal');
    const newFolderForm = document.getElementById('new-folder-form');
    const newFolderInput = document.getElementById('new-folder-name');
    
    newFolderButton.addEventListener('click', () => {
        newFolderModal.classList.add('show');
        newFolderInput.value = '';
        newFolderInput.focus();
    });
    
    newFolderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const folderName = newFolderInput.value.trim();
        
        if (!folderName) {
            showToast('error', 'Invalid Name', 'Please enter a folder name');
            return;
        }
        
        try {
            const response = await fetch('/api/collections/create_folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: currentPath,
                    name: folderName
                })
            });
            
            const result = await response.json();
            if (result.success) {
                showToast('success', 'Folder Created', `Folder "${folderName}" created successfully`);
                newFolderModal.classList.remove('show');
                loadCollections(currentPath);
            } else {
                showToast('error', 'Creation Failed', result.message);
            }
        } catch (error) {
            showToast('error', 'Creation Failed', error.message);
        }
    });
}

// Thumbnail generation
function generateThumbnail(file) {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            resolve(null);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate thumbnail size (maintaining aspect ratio)
                const maxSize = 200;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxSize) {
                        height = height * (maxSize / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = width * (maxSize / height);
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw image with smooth scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// User info button functionality
function setupUserInfoButton() {
    const userButton = document.getElementById('user-info-button');
    const userMenu = document.getElementById('user-menu');
    
    userButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !userButton.contains(e.target)) {
            userMenu.classList.remove('show');
        }
    });
}

// Advanced Search and Filters
function initializeAdvancedSearch() {
    const searchInput = document.getElementById('search-input');
    const advancedSearchToggle = document.getElementById('advanced-search-toggle');
    const advancedSearchPanel = document.getElementById('advanced-search-panel');
    const dateFilter = document.getElementById('date-filter');
    const customDateRange = document.getElementById('custom-date-range');
    const tagInput = document.getElementById('tag-input');
    const sortBy = document.getElementById('sort-by');
    const sortDirection = document.getElementById('sort-direction');
    
    // Search input handler
    searchInput.addEventListener('input', debounce(() => {
        currentFilters.search = searchInput.value;
        applyFilters();
    }, 300));
    
    // Toggle advanced search panel
    advancedSearchToggle.addEventListener('click', () => {
        advancedSearchPanel.classList.toggle('show');
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            advancedSearchPanel.classList.remove('show');
        }
    });
    
    // File type checkboxes
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            currentFilters.types = [...document.querySelectorAll('.filter-group input[type="checkbox"]:checked')]
                .map(cb => cb.value);
            applyFilters();
        });
    });
    
    // Date filter
    dateFilter.addEventListener('change', () => {
        currentFilters.dateRange = dateFilter.value;
        customDateRange.style.display = dateFilter.value === 'custom' ? 'flex' : 'none';
        if (dateFilter.value !== 'custom') {
            applyFilters();
        }
    });
    
    // Custom date range
    document.getElementById('date-from').addEventListener('change', (e) => {
        currentFilters.customDateFrom = e.target.value;
        applyFilters();
    });
    
    document.getElementById('date-to').addEventListener('change', (e) => {
        currentFilters.customDateTo = e.target.value;
        applyFilters();
    });
    
    // Size filter
    document.getElementById('size-filter').addEventListener('change', (e) => {
        currentFilters.size = e.target.value;
        applyFilters();
    });
    
    // Tag input
    let tagSuggestions = [];
    tagInput.addEventListener('input', debounce(async () => {
        if (tagInput.value.length < 2) return;
        
        try {
            const response = await fetch(`/api/tags/suggest?q=${encodeURIComponent(tagInput.value)}`);
            if (response.ok) {
                tagSuggestions = await response.json();
                showTagSuggestions(tagSuggestions);
            }
        } catch (error) {
            console.error('Failed to fetch tag suggestions:', error);
        }
    }, 300));
    
    // Sort handlers
    sortBy.addEventListener('change', () => {
        sortConfig.by = sortBy.value;
        applySort();
    });
    
    sortDirection.addEventListener('click', () => {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        sortDirection.querySelector('i').className = `ri-sort-${sortConfig.direction}`;
        applySort();
    });
}

// Apply filters to the collection items
async function applyFilters() {
    const items = document.querySelectorAll('.collection-item');
    let visibleCount = 0;
    
    for (const item of items) {
        const matches = await matchesFilters(item);
        item.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    }
    
    updateEmptyState(visibleCount);
}

// Check if an item matches the current filters
async function matchesFilters(item) {
    // Search text
    const searchText = currentFilters.search.toLowerCase();
    const itemName = item.querySelector('.folder-name, .image-name').textContent.toLowerCase();
    if (searchText && !itemName.includes(searchText)) return false;
    
    // File type
    const isFolder = item.classList.contains('folder');
    const fileType = isFolder ? 'folder' : getFileType(item.dataset.filename);
    if (!isFolder && !currentFilters.types.includes(fileType)) return false;
    
    // Date range
    const modifiedDate = new Date(item.dataset.modified);
    if (!matchesDateFilter(modifiedDate)) return false;
    
    // Size filter
    if (!isFolder && !matchesSizeFilter(parseInt(item.dataset.size))) return false;
    
    // Tags
    if (currentFilters.tags.length > 0) {
        const itemTags = item.dataset.tags ? JSON.parse(item.dataset.tags) : [];
        if (!currentFilters.tags.every(tag => itemTags.includes(tag))) return false;
    }
    
    return true;
}

// Helper function to match date filters
function matchesDateFilter(date) {
    const now = new Date();
    
    switch (currentFilters.dateRange) {
        case 'any':
            return true;
        case 'today':
            return date.toDateString() === now.toDateString();
        case 'week':
            return date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        case 'month':
            return date >= new Date(now.setMonth(now.getMonth() - 1));
        case 'year':
            return date >= new Date(now.setFullYear(now.getFullYear() - 1));
        case 'custom':
            const from = currentFilters.customDateFrom ? new Date(currentFilters.customDateFrom) : null;
            const to = currentFilters.customDateTo ? new Date(currentFilters.customDateTo) : null;
            if (!from && !to) return true;
            if (from && !to) return date >= from;
            if (!from && to) return date <= to;
            return date >= from && date <= to;
        default:
            return true;
    }
}

// Helper function to match size filters
function matchesSizeFilter(size) {
    switch (currentFilters.size) {
        case 'any':
            return true;
        case 'tiny':
            return size < 100 * 1024; // < 100 KB
        case 'small':
            return size < 1024 * 1024; // < 1 MB
        case 'medium':
            return size >= 1024 * 1024 && size < 10 * 1024 * 1024; // 1-10 MB
        case 'large':
            return size >= 10 * 1024 * 1024 && size < 100 * 1024 * 1024; // 10-100 MB
        case 'huge':
            return size >= 100 * 1024 * 1024; // > 100 MB
        default:
            return true;
    }
}

// Show tag suggestions
function showTagSuggestions(suggestions) {
    const suggestionsEl = document.getElementById('tag-suggestions');
    
    if (suggestions.length === 0) {
        suggestionsEl.style.display = 'none';
        return;
    }
    
    suggestionsEl.innerHTML = suggestions
        .map(tag => `<div class="tag-suggestion">${tag}</div>`)
        .join('');
    
    suggestionsEl.style.display = 'block';
    
    // Handle suggestion clicks
    suggestionsEl.querySelectorAll('.tag-suggestion').forEach(el => {
        el.addEventListener('click', () => {
            addTag(el.textContent);
            document.getElementById('tag-input').value = '';
            suggestionsEl.style.display = 'none';
        });
    });
}

// Add a tag to the selected tags
function addTag(tag) {
    if (currentFilters.tags.includes(tag)) return;
    
    currentFilters.tags.push(tag);
    
    const selectedTags = document.getElementById('selected-tags');
    const tagEl = document.createElement('div');
    tagEl.className = 'tag';
    tagEl.innerHTML = `
        ${tag}
        <i class="ri-close-line" onclick="removeTag('${tag}')"></i>
    `;
    
    selectedTags.appendChild(tagEl);
    applyFilters();
}

// Remove a tag from the selected tags
function removeTag(tag) {
    currentFilters.tags = currentFilters.tags.filter(t => t !== tag);
    document.querySelector(`.tag:has(span:contains('${tag}')`).remove();
    applyFilters();
}

// Reset all filters
function resetFilters() {
    currentFilters = {
        search: '',
        types: ['image'],
        dateRange: 'any',
        customDateFrom: null,
        customDateTo: null,
        size: 'any',
        tags: []
    };
    
    // Reset UI
    document.getElementById('search-input').value = '';
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.value === 'image';
    });
    document.getElementById('date-filter').value = 'any';
    document.getElementById('custom-date-range').style.display = 'none';
    document.getElementById('size-filter').value = 'any';
    document.getElementById('selected-tags').innerHTML = '';
    
    applyFilters();
}

// Apply sorting to collection items
function applySort() {
    const grid = document.getElementById('collections-grid');
    const items = [...grid.children];
    
    items.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortConfig.by) {
            case 'name':
                valueA = a.querySelector('.folder-name, .image-name').textContent;
                valueB = b.querySelector('.folder-name, .image-name').textContent;
                break;
            case 'date':
                valueA = new Date(a.dataset.modified);
                valueB = new Date(b.dataset.modified);
                break;
            case 'size':
                valueA = parseInt(a.dataset.size || '0');
                valueB = parseInt(b.dataset.size || '0');
                break;
            case 'type':
                valueA = a.classList.contains('folder') ? 'folder' : getFileType(a.dataset.filename);
                valueB = b.classList.contains('folder') ? 'folder' : getFileType(b.dataset.filename);
                break;
        }
        
        const modifier = sortConfig.direction === 'asc' ? 1 : -1;
        return valueA > valueB ? modifier : -modifier;
    });
    
    // Reorder elements
    items.forEach(item => grid.appendChild(item));
}

// Helper function to get file type
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const docExts = ['pdf', 'doc', 'docx', 'txt'];
    const videoExts = ['mp4', 'webm', 'mov'];
    const audioExts = ['mp3', 'wav', 'ogg'];
    
    if (imageExts.includes(ext)) return 'image';
    if (docExts.includes(ext)) return 'document';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    return 'other';
}

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update empty state message
function updateEmptyState(visibleCount) {
    const emptyState = document.querySelector('.empty-state');
    if (!emptyState) return;
    
    if (visibleCount === 0) {
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
            <i class="ri-search-line"></i>
            <h3>No matching items found</h3>
            <p>Try adjusting your search filters</p>
            <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
        `;
    } else {
        emptyState.style.display = 'none';
    }
}

// Batch Operations
function initializeBatchOperations() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') {
            enterSelectionMode();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            exitSelectionMode();
        }
    });
}

function enterSelectionMode() {
    if (isSelectionMode) return;
    isSelectionMode = true;
    
    document.querySelectorAll('.collection-item').forEach(item => {
        item.classList.add('selectable');
    });
}

function exitSelectionMode() {
    if (!isSelectionMode || selectedItems.size > 0) return;
    isSelectionMode = false;
    
    document.querySelectorAll('.collection-item').forEach(item => {
        item.classList.remove('selectable');
    });
}

function toggleItemSelection(item) {
    if (!isSelectionMode) return;
    
    const itemId = item.dataset.id;
    if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
        item.classList.remove('selected');
    } else {
        selectedItems.add(itemId);
        item.classList.add('selected');
    }
    
    updateBatchOperations();
}

function updateBatchOperations() {
    const batchOps = document.querySelector('.batch-operations');
    const selectedCount = document.querySelector('.selected-count');
    
    if (selectedItems.size > 0) {
        batchOps.classList.add('show');
        selectedCount.textContent = `${selectedItems.size} item${selectedItems.size === 1 ? '' : 's'} selected`;
    } else {
        batchOps.classList.remove('show');
        exitSelectionMode();
    }
}

function clearSelection() {
    selectedItems.clear();
    document.querySelectorAll('.collection-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    updateBatchOperations();
}

// Batch Actions
async function moveSelected() {
    const modal = document.getElementById('move-modal');
    const folderTree = modal.querySelector('.folder-tree');
    
    // Load folder structure
    try {
        const response = await fetch('/api/folders/tree');
        if (response.ok) {
            const folders = await response.json();
            folderTree.innerHTML = buildFolderTree(folders);
            showModal('move-modal');
        }
    } catch (error) {
        console.error('Failed to load folder structure:', error);
        showToast('error', 'Failed to load folders');
    }
}

function buildFolderTree(folders, level = 0) {
    return folders.map(folder => `
        <div class="tree-item" data-path="${folder.path}" onclick="selectMoveTarget(this, event)">
            <i class="ri-folder-line"></i>
            <span>${folder.name}</span>
            ${folder.children ? `
                <div class="tree-item-children">
                    ${buildFolderTree(folder.children, level + 1)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function selectMoveTarget(item, event) {
    event.stopPropagation();
    document.querySelectorAll('.tree-item.selected').forEach(el => {
        el.classList.remove('selected');
    });
    item.classList.add('selected');
}

async function confirmMove() {
    const targetPath = document.querySelector('.tree-item.selected')?.dataset.path;
    if (!targetPath) {
        showToast('error', 'Please select a destination folder');
        return;
    }
    
    try {
        const response = await fetch('/api/collections/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: Array.from(selectedItems),
                destination: targetPath
            })
        });
        
        if (response.ok) {
            showToast('success', 'Items moved successfully');
            clearSelection();
            closeModal('move-modal');
            loadCollections(currentPath);
        } else {
            throw new Error('Failed to move items');
        }
    } catch (error) {
        console.error('Failed to move items:', error);
        showToast('error', 'Failed to move items');
    }
}

async function downloadSelected() {
    if (selectedItems.size === 0) return;
    
    try {
        const response = await fetch('/api/collections/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: Array.from(selectedItems)
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'collection.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            clearSelection();
        } else {
            throw new Error('Failed to download items');
        }
    } catch (error) {
        console.error('Failed to download items:', error);
        showToast('error', 'Failed to download items');
    }
}

function shareSelected() {
    showModal('share-modal');
}

async function confirmShare() {
    const shareType = document.querySelector('input[name="share-type"]:checked').value;
    const data = {
        items: Array.from(selectedItems),
        type: shareType
    };
    
    if (shareType === 'link') {
        data.expiry = document.getElementById('link-expiry').value;
        data.access = document.getElementById('link-access').value;
    } else {
        data.emails = document.getElementById('share-emails').value.split('\n').map(e => e.trim()).filter(Boolean);
        data.message = document.getElementById('share-message').value;
    }
    
    try {
        const response = await fetch('/api/collections/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (shareType === 'link') {
                // Copy link to clipboard
                navigator.clipboard.writeText(result.link);
                showToast('success', 'Share link copied to clipboard');
            } else {
                showToast('success', 'Shared successfully via email');
            }
            
            closeModal('share-modal');
            clearSelection();
        } else {
            throw new Error('Failed to share items');
        }
    } catch (error) {
        console.error('Failed to share items:', error);
        showToast('error', 'Failed to share items');
    }
}

async function deleteSelected() {
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} item${selectedItems.size === 1 ? '' : 's'}?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/collections/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: Array.from(selectedItems)
            })
        });
        
        if (response.ok) {
            showToast('success', 'Items deleted successfully');
            clearSelection();
            loadCollections(currentPath);
        } else {
            throw new Error('Failed to delete items');
        }
    } catch (error) {
        console.error('Failed to delete items:', error);
        showToast('error', 'Failed to delete items');
    }
}

function setupCollectionItemHandlers() {
    document.addEventListener('click', (e) => {
        const collectionItem = e.target.closest('.collection-item');
        if (!collectionItem) return;
        
        // If in selection mode, handle selection
        if (isSelectionMode) {
            toggleItemSelection(collectionItem);
            e.preventDefault();
            return;
        }
        
        // Handle button clicks
        if (e.target.closest('.btn')) {
            const btn = e.target.closest('.btn');
            
            if (btn.classList.contains('preview-btn')) {
                previewItem(collectionItem);
            } else if (btn.classList.contains('menu-btn')) {
                showContextMenu(collectionItem, e);
            }
            e.preventDefault();
            return;
        }
        
        // Handle folder navigation
        if (collectionItem.classList.contains('folder')) {
            const path = collectionItem.dataset.path;
            navigateToFolder(path);
        }
    });
    
    // Drag and drop handlers
    document.querySelectorAll('.collection-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
    });
}

// AI and Collaboration Features
async function analyzeSelectedImages() {
    if (selectedItems.size === 0) return;
    
    showToast('info', 'Analyzing images...', 5000);
    
    try {
        const response = await fetch('/api/collections/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: Array.from(selectedItems)
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                showToast('success', 'Images analyzed successfully');
                updateImageTags(data.results);
            } else {
                throw new Error(data.message);
            }
        } else {
            throw new Error('Failed to analyze images');
        }
    } catch (error) {
        console.error('Failed to analyze images:', error);
        showToast('error', 'Failed to analyze images');
    }
}

function updateImageTags(results) {
    for (const [itemId, tags] of Object.entries(results)) {
        const item = document.querySelector(`[data-id="${itemId}"]`);
        if (!item) continue;
        
        // Update tag display
        const tagContainer = item.querySelector('.image-tags') || createTagContainer(item);
        tagContainer.innerHTML = tags
            .map(tag => `
                <span class="tag" title="${tag.label} (${Math.round(tag.confidence * 100)}%)">
                    ${tag.label}
                </span>
            `)
            .join('');
    }
}

function createTagContainer(item) {
    const container = document.createElement('div');
    container.className = 'image-tags';
    item.querySelector('.image-info').appendChild(container);
    return container;
}

async function searchByTags(query) {
    try {
        const response = await fetch(`/api/collections/tags/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                highlightMatchingFiles(data.files);
            } else {
                throw new Error(data.message);
            }
        } else {
            throw new Error('Failed to search by tags');
        }
    } catch (error) {
        console.error('Failed to search by tags:', error);
        showToast('error', 'Failed to search by tags');
    }
}

function highlightMatchingFiles(files) {
    // Remove previous highlights
    document.querySelectorAll('.collection-item.highlight').forEach(item => {
        item.classList.remove('highlight');
    });
    
    // Add highlights to matching files
    files.forEach(fileId => {
        const item = document.querySelector(`[data-id="${fileId}"]`);
        if (item) {
            item.classList.add('highlight');
        }
    });
}

// Collaboration Features
async function inviteCollaborators() {
    const modal = document.getElementById('invite-modal');
    const emailInput = modal.querySelector('#collaborator-emails');
    const permissionSelect = modal.querySelector('#collaborator-permissions');
    
    const emails = emailInput.value.split('\n').map(e => e.trim()).filter(Boolean);
    const permission = permissionSelect.value;
    
    if (emails.length === 0) {
        showToast('error', 'Please enter at least one email address');
        return;
    }
    
    try {
        const response = await fetch('/api/collections/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emails: emails,
                permission: permission,
                items: Array.from(selectedItems)
            })
        });
        
        if (response.ok) {
            showToast('success', 'Invitations sent successfully');
            closeModal('invite-modal');
            clearSelection();
        } else {
            throw new Error('Failed to send invitations');
        }
    } catch (error) {
        console.error('Failed to send invitations:', error);
        showToast('error', 'Failed to send invitations');
    }
}

function setupCollaborationHandlers() {
    // Add collaboration button to batch operations
    const batchOps = document.querySelector('.batch-operations .actions');
    const collaborateBtn = document.createElement('button');
    collaborateBtn.className = 'btn btn-secondary';
    collaborateBtn.innerHTML = '<i class="ri-team-line"></i> Collaborate';
    collaborateBtn.onclick = () => showModal('invite-modal');
    batchOps.appendChild(collaborateBtn);
    
    // Add analyze button for images
    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'btn btn-secondary';
    analyzeBtn.innerHTML = '<i class="ri-ai-generate"></i> Analyze';
    analyzeBtn.onclick = analyzeSelectedImages;
    batchOps.appendChild(analyzeBtn);
    
    // Setup tag search in advanced search
    const tagSearch = document.createElement('div');
    tagSearch.className = 'search-group';
    tagSearch.innerHTML = `
        <label>Search by Tags</label>
        <input type="text" id="tag-search" placeholder="Search AI-generated tags...">
    `;
    
    document.querySelector('.advanced-search').appendChild(tagSearch);
    
    const tagSearchInput = document.getElementById('tag-search');
    let tagSearchTimeout;
    
    tagSearchInput.addEventListener('input', () => {
        clearTimeout(tagSearchTimeout);
        const query = tagSearchInput.value.trim();
        
        if (query) {
            tagSearchTimeout = setTimeout(() => {
                searchByTags(query);
            }, 500);
        } else {
            // Clear highlights if search is empty
            document.querySelectorAll('.collection-item.highlight').forEach(item => {
                item.classList.remove('highlight');
            });
        }
    });
}
