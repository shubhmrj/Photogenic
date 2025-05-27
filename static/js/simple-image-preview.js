// Simple Image Preview - A complete rewrite to fix the black overlay issue
document.addEventListener('DOMContentLoaded', function() {
    // Create the modal structure if it doesn't exist
    createImagePreviewModal();
    
    // Setup event listeners for image items
    setupImageClickHandlers();
});

// Create the modal structure
function createImagePreviewModal() {
    // Remove any existing modal to avoid conflicts
    const existingModal = document.getElementById('simple-image-preview-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create the new modal structure
    const modal = document.createElement('div');
    modal.id = 'simple-image-preview-modal';
    modal.className = 'simple-modal';
    modal.innerHTML = `
        <div class="simple-modal-content">
            <div class="simple-modal-header">
                <h3 id="simple-preview-title">Image Preview</h3>
                <button class="simple-close-btn">&times;</button>
            </div>
            <div class="simple-modal-body">
                <img id="simple-preview-image" src="" alt="Preview">
            </div>
            <div class="simple-modal-controls">
                <button id="simple-zoom-in" class="simple-control-btn"><i class="fas fa-search-plus"></i></button>
                <button id="simple-zoom-out" class="simple-control-btn"><i class="fas fa-search-minus"></i></button>
                <button id="simple-rotate-left" class="simple-control-btn"><i class="fas fa-undo"></i></button>
                <button id="simple-rotate-right" class="simple-control-btn"><i class="fas fa-redo"></i></button>
                <button id="simple-reset" class="simple-control-btn"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div class="simple-modal-footer">
                <button id="simple-download" class="simple-action-btn"><i class="fas fa-download"></i> Download</button>
                <button id="simple-analyze" class="simple-action-btn"><i class="fas fa-magic"></i> Analyze with AI</button>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    document.body.appendChild(modal);
    
    // Add styles for the modal
    const style = document.createElement('style');
    style.textContent = `
        .simple-modal {
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            overflow: auto;
        }
        
        .simple-modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .simple-modal-content {
            background-color: transparent;
            margin: auto;
            width: 90%;
            max-width: 1200px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .simple-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
        }
        
        .simple-close-btn {
            color: white;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
        }
        
        .simple-modal-body {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background-color: transparent;
            flex: 1;
            min-height: 300px;
        }
        
        #simple-preview-image {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
            background-color: transparent;
        }
        
        .simple-modal-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.5);
        }
        
        .simple-control-btn {
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .simple-control-btn:hover {
            background-color: rgba(79, 70, 229, 0.8);
        }
        
        .simple-modal-footer {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.5);
        }
        
        .simple-action-btn {
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .simple-action-btn:hover {
            background-color: rgba(79, 70, 229, 0.8);
        }
        
        @media (max-width: 768px) {
            .simple-modal-content {
                width: 95%;
            }
            
            #simple-preview-image {
                max-height: 60vh;
            }
            
            .simple-modal-footer {
                flex-direction: column;
                gap: 10px;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Setup event listeners for the modal
    setupModalEventListeners();
}

// Setup event listeners for the modal
function setupModalEventListeners() {
    const modal = document.getElementById('simple-image-preview-modal');
    const closeBtn = modal.querySelector('.simple-close-btn');
    const image = document.getElementById('simple-preview-image');
    
    // Close button
    closeBtn.addEventListener('click', closeModal);
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
    
    // Image controls
    let currentZoom = 1;
    let currentRotation = 0;
    
    // Zoom in
    document.getElementById('simple-zoom-in').addEventListener('click', function() {
        currentZoom += 0.1;
        updateImageTransform();
    });
    
    // Zoom out
    document.getElementById('simple-zoom-out').addEventListener('click', function() {
        if (currentZoom > 0.2) {
            currentZoom -= 0.1;
            updateImageTransform();
        }
    });
    
    // Rotate left
    document.getElementById('simple-rotate-left').addEventListener('click', function() {
        currentRotation -= 90;
        updateImageTransform();
    });
    
    // Rotate right
    document.getElementById('simple-rotate-right').addEventListener('click', function() {
        currentRotation += 90;
        updateImageTransform();
    });
    
    // Reset
    document.getElementById('simple-reset').addEventListener('click', function() {
        currentZoom = 1;
        currentRotation = 0;
        updateImageTransform();
    });
    
    // Download
    document.getElementById('simple-download').addEventListener('click', function() {
        if (image.src) {
            const a = document.createElement('a');
            a.href = image.src;
            a.download = image.getAttribute('data-filename') || 'image.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });
    
    // Analyze
    document.getElementById('simple-analyze').addEventListener('click', function() {
        const path = image.getAttribute('data-path');
        if (path && typeof analyzeImage === 'function') {
            analyzeImage(path);
        }
    });
    
    // Update image transform
    function updateImageTransform() {
        image.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
    }
}

// Setup click handlers for images in the collection
function setupImageClickHandlers() {
    const collectionItems = document.querySelectorAll('.collection-item[data-type="file"]');
    
    collectionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Only handle click if it's not from a context menu or action button
            if (!e.target.closest('.collection-actions') && !e.target.closest('.context-menu')) {
                const path = this.getAttribute('data-path');
                const name = this.querySelector('.collection-name').textContent;
                
                if (path && path.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                    e.preventDefault();
                    openImagePreview(path, name);
                }
            }
        });
    });
}

// Open the image preview modal
function openImagePreview(path, name) {
    const modal = document.getElementById('simple-image-preview-modal');
    const image = document.getElementById('simple-preview-image');
    const title = document.getElementById('simple-preview-title');
    
    // Set the title
    if (title) {
        title.textContent = name || 'Image Preview';
    }
    
    // Preload the image
    const preloader = new Image();
    preloader.onload = function() {
        // Set the image source
        image.src = preloader.src;
        image.setAttribute('data-path', path);
        image.setAttribute('data-filename', name);
        
        // Reset any transformations
        image.style.transform = '';
        
        // Show the modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };
    
    // Start loading the image
    preloader.src = getFileUrl(path);
}

// Close the modal
function closeModal() {
    const modal = document.getElementById('simple-image-preview-modal');
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Clear the image source after a delay
    setTimeout(() => {
        const image = document.getElementById('simple-preview-image');
        image.src = '';
    }, 300);
}

// Helper to get file URL
function getFileUrl(path) {
    const encodedPath = encodeURIComponent(path);
    return `/api/collections/file/${encodedPath}?t=${Date.now()}`;
}
