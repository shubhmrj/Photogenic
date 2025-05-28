// Global variables
let currentPath = '';
let viewMode = 'grid'; // 'grid' or 'list'
let sortBy = 'name'; // 'name', 'date', 'size'
let collections = []; // Will store folders and files

// DOM elements
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

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize viewMode from localStorage or default to 'grid'
    viewMode = localStorage.getItem('viewMode') || 'grid';
    
    // Set initial view mode
    setViewMode(viewMode);
    
    // Load collections
    loadCollections();

    // Set up event listeners
    setupEventListeners();

    // Set up drag and drop
    setupDragAndDrop();

    // Set up multi-select
    setupMultiSelect();

    // Set up context menu
    setupContextMenu();
});

// Set up all event listeners
function setupEventListeners() {
    // New folder button
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', () => {
            openFolderModal();
        });
    }

    // Close folder modal
    if (closeFolderModalBtn) {
        closeFolderModalBtn.addEventListener('click', () => {
            closeFolderModal();
        });
    }

    if (cancelFolderBtn) {
        cancelFolderBtn.addEventListener('click', () => {
            closeFolderModal();
        });
    }

    // Create folder
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', () => {
            createFolder();
        });
    }

    if (folderNameInput) {
        folderNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                createFolder();
            }
        });
    }

    // Upload button
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                console.log(`File input change detected: ${this.files.length} files selected`);
                uploadFiles(this.files);
                // Reset the input so the same file can be uploaded again if needed
                this.value = '';
            }
        });
    }

    // View mode toggles
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
            if (window.collections) {
                // Sort the collections
                window.collections.sort((a, b) => {
                    // Always put folders first
                    if ((a.isDir || a.type === 'folder') && !(b.isDir || b.type === 'folder')) {
                        return -1;
                    }
                    if (!(a.isDir || a.type === 'folder') && (b.isDir || b.type === 'folder')) {
                        return 1;
                    }
                    
                    // Sort by the selected criteria
                    if (sortBy === 'name') {
                        return a.name.localeCompare(b.name);
                    } else if (sortBy === 'date') {
                        return new Date(b.modifiedTime) - new Date(a.modifiedTime);
                    } else if (sortBy === 'size') {
                        if (a.isDir || a.type === 'folder') return -1;
                        if (b.isDir || b.type === 'folder') return 1;
                        return b.size - a.size;
                    }
                    return 0;
                });
                
                // Display the sorted collections
                displayCollections(window.collections);
            }
        });
    }

    // Sidebar navigation
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all sidebar items
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the text content of the sidebar item
            const sectionName = this.textContent.trim();
            
            // Update the header title
            document.querySelector('.collections-header h1').textContent = sectionName;
            
            // Handle different sections
            if (sectionName === 'My Collections') {
                currentPath = '';
                loadCollections();
            } else if (sectionName === 'Recent') {
                currentPath = 'recent';
                loadCollections();
            } else if (sectionName === 'Favorites') {
                currentPath = 'favorites';
                loadCollections();
            } else if (sectionName === 'Permitted') {
                currentPath = 'shared';
                loadCollections();
            } else if (sectionName === 'Trash') {
                currentPath = 'trash';
                loadCollections();
            }
        });
    });
}

// Set the view mode (grid or list)
function setViewMode(mode) {
    viewMode = mode;
    
    // Save to localStorage
    localStorage.setItem('viewMode', mode);

    // Update active button
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.classList.toggle('active', mode === 'grid');
        listViewBtn.classList.toggle('active', mode === 'list');
    }

    // Update collection items
    document.querySelectorAll('.collection-item').forEach(item => {
        item.classList.toggle('list-view', mode === 'list');
    });
}

// Load collections from the server
function loadCollections() {
    // Show loading indicator
    const container = document.querySelector('.collections-grid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner"></i>
            <div>Loading collections...</div>
        </div>
    `;
    
    // Get the current path
    const path = currentPath || '';
    console.log('Loading collections for path:', path);
    
    // Fetch collections from server
    fetch(`/api/collections?path=${encodeURIComponent(path)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Collections data received:', data);
            
            // Update breadcrumbs
            updateBreadcrumbs(path);
            
            // Update current path
            currentPath = path;
            
            // Display collections
            if (data.collections) {
                displayCollections(data.collections);
            } else {
                console.error('No collections data in response:', data);
                showError('Invalid server response');
            }
        })
        .catch(error => {
            console.error('Error loading collections:', error);
            showError(`Failed to load collections: ${error.message}`);
        });
}

// Display collections in the grid
function displayCollections(collectionsData) {
    const container = document.querySelector('.collections-grid');
    if (!container) return;
    
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
        document.getElementById('upload-empty-btn').addEventListener('click', () => {
            fileInput.click();
        });
        
        document.getElementById('new-folder-empty-btn').addEventListener('click', () => {
            openFolderModal();
        });
        
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
        itemElement.setAttribute('data-path', item.path);
        itemElement.setAttribute('data-name', item.name);
        itemElement.setAttribute('data-type', item.isDir || item.type === 'folder' ? 'folder' : 'file');
        
        // Add animation delay for staggered appearance
        itemElement.style.animationDelay = `${index * 0.05}s`;
        
        // Create preview element
        const previewElement = document.createElement('div');
        previewElement.className = 'collection-preview';
        
        // Add list-view class if in list view
        if (viewMode === 'list') {
            itemElement.classList.add('list-view');
        }
        
        // Add icon or thumbnail
        if (item.isDir || item.type === 'folder') {
            previewElement.innerHTML = '<i class="fas fa-folder"></i>';
        } else if (item.isImage) {
            // For images, show a thumbnail
            const thumbnailUrl = getFileUrl(item.path);
            previewElement.innerHTML = `<img src="${thumbnailUrl}" alt="${item.name}" loading="lazy">`;
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
        
        itemElement.appendChild(previewElement);
        
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
            sizeElement.textContent = item.isDir || item.type === 'folder' ? '--' : formatSize(item.size);
            infoElement.appendChild(sizeElement);
            
            // Add modified time
            const timeElement = document.createElement('div');
            timeElement.className = 'collection-time';
            timeElement.textContent = formatDate(item.modifiedTime);
            infoElement.appendChild(timeElement);
        }
        
        itemElement.appendChild(infoElement);
        
        // Add actions element
        const actionsElement = document.createElement('div');
        actionsElement.className = 'collection-actions';
        
        // Add action buttons
        const actionButtons = [];
        
        // Preview button for images
        if (item.isImage) {
            actionButtons.push({
                icon: 'fas fa-eye',
                title: 'Preview',
                click: () => previewImage(item.path, item.name)
            });
        }
        
        // Share button
        actionButtons.push({
            icon: 'fas fa-share-alt',
            title: 'Share',
            click: () => shareItem(item.path, item.isDir || item.type === 'folder')
        });
        
        // Delete button
        actionButtons.push({
            icon: 'fas fa-trash',
            title: 'Delete',
            click: () => deleteItem(item.path, item.name, item.isDir || item.type === 'folder')
        });
        
        // Add dropdown menu for more actions
        const dropdownElement = document.createElement('div');
        dropdownElement.className = 'item-dropdown';
        
        const dropdownToggle = document.createElement('button');
        dropdownToggle.className = 'item-dropdown-toggle';
        dropdownToggle.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        dropdownElement.appendChild(dropdownToggle);
        
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'item-dropdown-menu';
        
        // Add dropdown items
        const dropdownItems = [
            {
                icon: 'fas fa-download',
                text: 'Download',
                click: () => downloadItem(item.path, item.name)
            },
            {
                icon: 'fas fa-star',
                text: 'Add to Favorites',
                click: () => addToFavorites(item.path)
            },
            {
                icon: 'fas fa-edit',
                text: 'Rename',
                click: () => renameItem(item.path, item.name)
            }
        ];
        
        // Add AI Analysis option for images
        if (item.isImage) {
            dropdownItems.push({
                icon: 'fas fa-brain',
                text: 'AI Analysis',
                click: () => analyzeImage(item.path)
            });
        }
        
        // Create dropdown items
        dropdownItems.forEach(dropdownItem => {
            const itemElement = document.createElement('a');
            itemElement.href = '#';
            itemElement.className = 'item-dropdown-item';
            itemElement.innerHTML = `<i class="${dropdownItem.icon}"></i> ${dropdownItem.text}`;
            itemElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdownMenu.classList.remove('show');
                dropdownItem.click();
            });
            dropdownMenu.appendChild(itemElement);
        });
        
        dropdownElement.appendChild(dropdownMenu);
        
        // Add dropdown toggle event
        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        actionsElement.appendChild(dropdownElement);
        
        // Add action buttons
        actionButtons.forEach(button => {
            const buttonElement = document.createElement('button');
            buttonElement.className = 'action-button';
            buttonElement.title = button.title;
            buttonElement.innerHTML = `<i class="${button.icon}"></i>`;
            buttonElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.click();
            });
            actionsElement.appendChild(buttonElement);
        });
        
        itemElement.appendChild(actionsElement);
        
        // Add shared badge if the item is shared
        if (item.shared_by) {
            const sharedBadge = document.createElement('div');
            sharedBadge.className = 'shared-badge';
            sharedBadge.title = `Shared by ${item.shared_by}`;
            sharedBadge.innerHTML = `<i class="fas fa-user-friends"></i> ${item.shared_by}`;
            itemElement.appendChild(sharedBadge);
        }
        
        // Add click event to navigate to folder or preview file
        itemElement.addEventListener('click', () => {
            if (item.isDir || item.type === 'folder') {
                navigateToFolder(item.path);
            } else if (item.isImage) {
                previewImage(item.path, item.name);
            } else {
                // For other file types, download the file
                downloadItem(item.path, item.name);
            }
        });
        
        // Add the item to the container
        itemsContainer.appendChild(itemElement);
    });
}
