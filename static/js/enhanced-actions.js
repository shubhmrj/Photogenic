/**
 * Enhanced UI Actions for PhotoGeni
 * Implements direct folder creation and file upload functionality
 */

(function() {
    console.log("🚀 Enhanced UI actions loading...");
    
    // Collection view area selector
    const COLLECTION_CONTAINER = '.collections-grid, .items-grid, .main-content-area';
    
    // Counter for new folders
    let folderCounter = 1;
    
    /**
     * Create a new folder directly in the collection view
     */
    function createNewFolderDirectly() {
        console.log("📁 Creating new folder directly");
        
        // Default folder name (can be changed by user later)
        const folderName = `New Folder ${folderCounter}`;
        folderCounter++;
        
        // Create folder HTML
        const folderHtml = `
            <div class="collection-item folder" data-type="folder" data-name="${folderName}">
                <div class="item-preview folder-preview">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="item-details">
                    <div class="item-name" contenteditable="true">${folderName}</div>
                    <div class="item-meta">Just now</div>
                </div>
            </div>
        `;
        
        // Add to collections grid
        const collectionsGrid = document.querySelector(COLLECTION_CONTAINER);
        if (collectionsGrid) {
            // Create temporary container to parse HTML
            const temp = document.createElement('div');
            temp.innerHTML = folderHtml.trim();
            const folderElement = temp.firstChild;
            
            // Add to grid
            collectionsGrid.insertBefore(folderElement, collectionsGrid.firstChild);
            
            // Make folder name editable
            const nameElement = folderElement.querySelector('.item-name');
            if (nameElement) {
                // Focus on the name to allow immediate editing
                setTimeout(() => {
                    nameElement.focus();
                    // Select all text
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(nameElement);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }, 100);
                
                // Save on blur or Enter key
                nameElement.addEventListener('blur', function() {
                    if (this.textContent.trim() === '') {
                        this.textContent = folderName;
                    }
                    console.log(`Folder renamed to: ${this.textContent}`);
                });
                
                nameElement.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.blur();
                    }
                });
            }
            
            // Add folder functionality
            folderElement.addEventListener('dblclick', function() {
                // Simulate folder navigation
                simulateFolderNavigation(this.querySelector('.item-name').textContent);
            });
            
            // Show success notification
            showNotification('Folder created successfully', 'success');
            
            return folderElement;
        } else {
            console.error("Collection container not found");
            return null;
        }
    }
    
    /**
     * Simulate folder navigation (for demonstration)
     */
    function simulateFolderNavigation(folderName) {
        // Update breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb-container');
        if (breadcrumb) {
            const currentPath = breadcrumb.textContent.trim();
            const newPath = currentPath + ' > ' + folderName;
            breadcrumb.innerHTML = `
                <div class="breadcrumb-item home-crumb">
                    <i class="fas fa-home"></i>
                </div>
                <div class="breadcrumb-separator">/</div>
                <div class="breadcrumb-item">
                    ${folderName}
                </div>
            `;
        }
        
        // Clear current view and show empty state
        const collectionsGrid = document.querySelector(COLLECTION_CONTAINER);
        if (collectionsGrid) {
            collectionsGrid.innerHTML = `
                <div class="empty-folder-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>This folder is empty</h3>
                    <p>Add files or create folders to get started</p>
                    <div class="empty-actions">
                        <button class="btn primary-btn upload-btn-empty">
                            <i class="fas fa-upload"></i> Upload files
                        </button>
                        <button class="btn secondary-btn new-folder-btn-empty">
                            <i class="fas fa-folder-plus"></i> New folder
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners to empty state buttons
            const uploadBtn = collectionsGrid.querySelector('.upload-btn-empty');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', directFileUpload);
            }
            
            const newFolderBtn = collectionsGrid.querySelector('.new-folder-btn-empty');
            if (newFolderBtn) {
                newFolderBtn.addEventListener('click', createNewFolderDirectly);
            }
        }
        
        // Update page title
        document.title = `${folderName} - PhotoGeni`;
    }
    
    /**
     * Directly trigger file upload from device
     */
    function directFileUpload() {
        console.log("📤 Initiating direct file upload");
        
        // Create and trigger hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = 'image/*';
        
        // Handle file selection
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                processUploadedFiles(this.files);
            }
        });
        
        // Trigger file selection dialog
        fileInput.click();
    }
    
    /**
     * Process uploaded files and add them to the UI
     */
    function processUploadedFiles(files) {
        console.log(`Processing ${files.length} uploaded files`);
        
        // Show upload progress
        showNotification(`Uploading ${files.length} files...`, 'info');
        
        // Process each file
        Array.from(files).forEach((file, index) => {
            // Create file preview
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Add image to the grid
                addImageToGrid(file.name, e.target.result, new Date());
                
                // Show completion when all files are processed
                if (index === files.length - 1) {
                    showNotification('Upload complete!', 'success');
                }
            };
            
            // Start reading the file as data URL
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Add an image to the collections grid
     */
    function addImageToGrid(fileName, imageUrl, date) {
        const collectionsGrid = document.querySelector(COLLECTION_CONTAINER);
        if (!collectionsGrid) return;
        
        // Format date
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Create HTML for image item
        const imageHtml = `
            <div class="collection-item" data-type="image" data-name="${fileName}">
                <div class="item-preview">
                    <img src="${imageUrl}" alt="${fileName}">
                </div>
                <div class="item-details">
                    <div class="item-name">${fileName}</div>
                    <div class="item-meta">${formattedDate}</div>
                </div>
            </div>
        `;
        
        // Add to grid
        const temp = document.createElement('div');
        temp.innerHTML = imageHtml.trim();
        const imageElement = temp.firstChild;
        
        collectionsGrid.insertBefore(imageElement, collectionsGrid.firstChild);
        
        // Add click behavior
        imageElement.addEventListener('click', function() {
            // Show image preview
            showImagePreview(fileName, imageUrl);
        });
        
        return imageElement;
    }
    
    /**
     * Show image preview (lightbox style)
     */
    function showImagePreview(fileName, imageUrl) {
        // Create preview overlay
        const previewHtml = `
            <div class="image-preview-overlay">
                <div class="preview-header">
                    <div class="preview-title">${fileName}</div>
                    <button class="close-preview">&times;</button>
                </div>
                <div class="preview-content">
                    <img src="${imageUrl}" alt="${fileName}">
                </div>
                <div class="preview-footer">
                    <button class="btn preview-action download-btn">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn preview-action share-btn">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    <button class="btn preview-action delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        // Add to body
        const temp = document.createElement('div');
        temp.innerHTML = previewHtml.trim();
        const previewElement = temp.firstChild;
        document.body.appendChild(previewElement);
        
        // Add close functionality
        const closeBtn = previewElement.querySelector('.close-preview');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                previewElement.remove();
            });
        }
        
        // Close on background click
        previewElement.addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
        
        // Handle actions
        previewElement.querySelector('.download-btn')?.addEventListener('click', function() {
            // Create a download link
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = fileName;
            a.click();
        });
        
        previewElement.querySelector('.delete-btn')?.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this image?')) {
                // Remove from grid
                const item = document.querySelector(`.collection-item[data-name="${fileName}"]`);
                if (item) item.remove();
                
                // Close preview
                previewElement.remove();
                
                // Show notification
                showNotification('Image deleted', 'success');
            }
        });
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Check if notifications container exists
        let notificationsContainer = document.querySelector('.notifications-container');
        
        if (!notificationsContainer) {
            // Create container
            notificationsContainer = document.createElement('div');
            notificationsContainer.className = 'notifications-container';
            document.body.appendChild(notificationsContainer);
            
            // Add styles if not already present
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    .notifications-container {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 9999;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        max-width: 300px;
                    }
                    
                    .notification {
                        padding: 12px 16px;
                        border-radius: 6px;
                        background-color: var(--bg-card);
                        color: var(--text-main);
                        box-shadow: var(--shadow-md);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        animation: notification-slide-in 0.3s ease-out forwards;
                        transition: transform 0.3s ease, opacity 0.3s ease;
                    }
                    
                    .notification.removing {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                    
                    .notification-icon {
                        font-size: 18px;
                    }
                    
                    .notification-info .notification-icon {
                        color: var(--info);
                    }
                    
                    .notification-success .notification-icon {
                        color: var(--success);
                    }
                    
                    .notification-warning .notification-icon {
                        color: var(--warning);
                    }
                    
                    .notification-error .notification-icon {
                        color: var(--error);
                    }
                    
                    .notification-content {
                        flex: 1;
                    }
                    
                    .notification-close {
                        cursor: pointer;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    }
                    
                    .notification-close:hover {
                        opacity: 1;
                    }
                    
                    @keyframes notification-slide-in {
                        from {
                            transform: translateX(120%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        if (type === 'error') icon = 'times-circle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-content">${message}</div>
            <div class="notification-close">&times;</div>
        `;
        
        // Add to container
        notificationsContainer.appendChild(notification);
        
        // Handle close
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            removeNotification(notification);
        });
        
        // Auto remove after delay
        setTimeout(() => {
            removeNotification(notification);
        }, 5000);
        
        return notification;
    }
    
    /**
     * Remove notification with animation
     */
    function removeNotification(notification) {
        notification.classList.add('removing');
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
    
    /**
     * Connect UI actions to buttons
     */
    function connectEnhancedActions() {
        console.log("🔌 Connecting enhanced UI actions to buttons");
        
        // New folder buttons
        document.querySelectorAll('#new-folder-btn, #new-folder-option, [data-tooltip="New folder"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                createNewFolderDirectly();
                
                // Close any open menus
                const menu = document.querySelector('#new-menu');
                if (menu) menu.style.display = 'none';
            });
        });
        
        // Upload buttons
        document.querySelectorAll('#upload-files-btn, #upload-photos-option, [data-tooltip="Upload files"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                directFileUpload();
                
                // Close any open menus
                const menu = document.querySelector('#new-menu');
                if (menu) menu.style.display = 'none';
            });
        });
        
        console.log("✅ Enhanced UI actions connected");
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connectEnhancedActions);
    } else {
        // DOM already loaded
        connectEnhancedActions();
    }
    
    // Also initialize after a short delay
    setTimeout(connectEnhancedActions, 1000);
    
    // Expose functions globally for direct testing
    window.createNewFolderDirectly = createNewFolderDirectly;
    window.directFileUpload = directFileUpload;
    
    console.log("✅ Enhanced UI actions loaded successfully");
})();
