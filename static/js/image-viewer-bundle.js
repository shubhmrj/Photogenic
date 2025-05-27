/**
 * Image Viewer Bundle for PhotoGeni
 * This script combines all image viewer functionality to ensure photos open correctly when clicked
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[ImageViewer] Initializing image viewer bundle...');
    
    // Debug helper functions
    const DEBUG_MODE = true;
    
    function debugLog(category, message, data) {
        if (!DEBUG_MODE) return;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `[${timestamp}][${category}]`;
        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }
    
    function debugError(category, message, error) {
        if (!DEBUG_MODE) return;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `[${timestamp}][${category}][ERROR]`;
        console.error(`${prefix} ${message}`);
        if (error) {
            console.error(error);
        }
    }
    
    // Initialize the direct image viewer
    function initializeDirectImageViewer() {
        debugLog('ImageViewer', 'Initializing direct image viewer...');
        
        // Get elements
        const viewer = document.getElementById('direct-image-viewer');
        const image = document.getElementById('direct-image');
        const title = document.getElementById('direct-title');
        const closeBtn = document.getElementById('direct-close');
        const downloadBtn = document.getElementById('direct-download');
        const analyzeBtn = document.getElementById('direct-analyze');
        const zoomInBtn = document.getElementById('direct-zoom-in');
        const zoomOutBtn = document.getElementById('direct-zoom-out');
        const rotateLeftBtn = document.getElementById('direct-rotate-left');
        const rotateRightBtn = document.getElementById('direct-rotate-right');
        const retryBtn = document.getElementById('direct-retry');
        
        // Only set up event listeners if elements exist
        if (!viewer) {
            debugError('ImageViewer', 'Direct image viewer container not found');
            return;
        }
        
        if (!image) {
            debugError('ImageViewer', 'Direct image element not found');
            return;
        }
        
        // Set up image load and error handlers
        image.addEventListener('load', function() {
            debugLog('ImageViewer', 'Image loaded successfully');
            hideLoadingState();
            hideErrorState();
            image.style.display = 'block';
        });
        
        image.addEventListener('error', function() {
            debugError('ImageViewer', 'Failed to load image: ' + image.src);
            hideLoadingState();
            showErrorState();
            image.style.display = 'none';
        });
        
        // Retry button event
        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                const path = image.getAttribute('data-path');
                if (path) {
                    debugLog('ImageViewer', 'Retrying image load for: ' + path);
                    hideErrorState();
                    showLoadingState();
                    // Reload the image with a new timestamp to bypass cache
                    image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
                }
            });
        }
        
        // Close button event
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeDirectViewer();
            });
        } else {
            debugError('ImageViewer', 'Close button not found for direct image viewer');
        }
        
        // Download button event
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                const imagePath = image.getAttribute('data-path');
                if (imagePath) {
                    debugLog('ImageViewer', 'Downloading image: ' + imagePath);
                    const imageUrl = `/api/collections/download?path=${encodeURIComponent(imagePath)}`;
                    const a = document.createElement('a');
                    a.href = imageUrl;
                    a.download = imagePath.split('/').pop();
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            });
        }
        
        // Analyze button event
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', function() {
                const imagePath = image.getAttribute('data-path');
                if (imagePath) {
                    debugLog('ImageViewer', 'Analyzing image: ' + imagePath);
                    closeDirectViewer();
                    if (typeof analyzeImage === 'function') {
                        analyzeImage(imagePath);
                    } else {
                        window.location.href = `/collections?analyze=${encodeURIComponent(imagePath)}`;
                    }
                }
            });
        }
        
        // Zoom in button event
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', function() {
                zoomDirectImage('in');
            });
        }
        
        // Zoom out button event
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', function() {
                zoomDirectImage('out');
            });
        }
        
        // Rotate left button event
        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', function() {
                rotateDirectImage('left');
            });
        }
        
        // Rotate right button event
        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', function() {
                rotateDirectImage('right');
            });
        }
        
        // Keyboard events
        document.addEventListener('keydown', function(e) {
            if (viewer && viewer.classList.contains('active')) {
                // Escape key to close
                if (e.key === 'Escape') {
                    closeDirectViewer();
                }
                // Plus key to zoom in
                else if (e.key === '+' || e.key === '=') {
                    zoomDirectImage('in');
                }
                // Minus key to zoom out
                else if (e.key === '-' || e.key === '_') {
                    zoomDirectImage('out');
                }
                // Left arrow to rotate left
                else if (e.key === 'ArrowLeft') {
                    rotateDirectImage('left');
                }
                // Right arrow to rotate right
                else if (e.key === 'ArrowRight') {
                    rotateDirectImage('right');
                }
            }
        });
        
        debugLog('ImageViewer', 'Direct image viewer initialized successfully');
    }
    
    // Show loading state
    function showLoadingState() {
        const loadingEl = document.querySelector('.direct-image-loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }
    }
    
    // Hide loading state
    function hideLoadingState() {
        const loadingEl = document.querySelector('.direct-image-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
    
    // Show error state
    function showErrorState() {
        const errorEl = document.querySelector('.direct-image-error');
        if (errorEl) {
            errorEl.style.display = 'block';
        }
    }
    
    // Hide error state
    function hideErrorState() {
        const errorEl = document.querySelector('.direct-image-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
    
    // Open the direct image viewer
    window.openDirectImageViewer = function(path, name) {
        try {
            debugLog('ImageViewer', 'Opening direct image viewer for: ' + path);
            
            // Re-initialize the viewer to ensure all elements are properly set up
            initializeDirectImageViewer();
            
            const viewer = document.getElementById('direct-image-viewer');
            const image = document.getElementById('direct-image');
            const title = document.getElementById('direct-title');
            
            if (!viewer) {
                debugError('ImageViewer', 'Cannot open direct image viewer: viewer element not found');
                showToast('error', 'Error', 'Could not open image viewer');
                return;
            }
            
            if (!image) {
                debugError('ImageViewer', 'Cannot open direct image viewer: image element not found');
                showToast('error', 'Error', 'Could not open image viewer');
                return;
            }
            
            // Reset any previous states
            hideErrorState();
            showLoadingState();
            image.style.display = 'none';
            
            // Set image data
            image.setAttribute('data-path', path);
            image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
            debugLog('ImageViewer', 'Image source set to: ' + image.src);
            
            // Reset any transforms
            image.style.transform = 'translate(-50%, -50%)';
            image.setAttribute('data-scale', '1');
            image.setAttribute('data-rotation', '0');
            
            // Set title
            if (title) title.textContent = name || path.split('/').pop();
            
            // Show viewer
            viewer.style.display = 'block';
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
            
            // Add active class for animation
            setTimeout(() => {
                if (viewer) viewer.classList.add('active');
                debugLog('ImageViewer', 'Viewer activated');
            }, 10);
            
            debugLog('ImageViewer', 'Direct image viewer opened successfully');
        } catch (error) {
            debugError('ImageViewer', 'Error opening direct image viewer', error);
            showToast('error', 'Error', 'Could not open image viewer');
        }
    };
    
    // Close the direct image viewer
    window.closeDirectViewer = function() {
        try {
            debugLog('ImageViewer', 'Closing direct image viewer');
            
            const viewer = document.getElementById('direct-image-viewer');
            if (!viewer) {
                debugError('ImageViewer', 'Cannot close direct image viewer: viewer element not found');
                return;
            }
            
            // Remove active class for animation
            viewer.classList.remove('active');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                if (viewer) {
                    viewer.style.display = 'none';
                    document.body.style.overflow = '';
                    
                    // Reset states
                    hideLoadingState();
                    hideErrorState();
                    
                    // Clear image src to stop any ongoing loads
                    const image = document.getElementById('direct-image');
                    if (image) {
                        image.src = '';
                    }
                    
                    debugLog('ImageViewer', 'Viewer hidden and states reset');
                }
            }, 300);
            
            debugLog('ImageViewer', 'Direct image viewer closed successfully');
        } catch (error) {
            debugError('ImageViewer', 'Error closing direct image viewer', error);
            // Fallback to ensure viewer is hidden
            const viewer = document.getElementById('direct-image-viewer');
            if (viewer) {
                viewer.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    };
    
    // Function to zoom in the image
    window.zoomDirectImage = function(direction) {
        try {
            const image = document.getElementById('direct-image');
            if (!image) {
                debugError('ImageViewer', 'Cannot zoom image: image element not found');
                return;
            }
            
            let scale = parseFloat(image.getAttribute('data-scale') || '1');
            
            if (direction === 'in') {
                scale = Math.min(scale * 1.2, 5); // Max zoom 5x
                debugLog('ImageViewer', `Zooming in to scale: ${scale}`);
            } else {
                scale = Math.max(scale / 1.2, 0.5); // Min zoom 0.5x
                debugLog('ImageViewer', `Zooming out to scale: ${scale}`);
            }
            
            image.setAttribute('data-scale', scale.toString());
            updateDirectImageTransform(image);
        } catch (error) {
            debugError('ImageViewer', 'Error zooming image', error);
        }
    };
    
    // Function to rotate the image
    window.rotateDirectImage = function(direction) {
        try {
            const image = document.getElementById('direct-image');
            if (!image) {
                debugError('ImageViewer', 'Cannot rotate image: image element not found');
                return;
            }
            
            let rotation = parseInt(image.getAttribute('data-rotation') || '0');
            
            if (direction === 'left') {
                rotation = (rotation - 90) % 360;
                debugLog('ImageViewer', `Rotating left to: ${rotation} degrees`);
            } else {
                rotation = (rotation + 90) % 360;
                debugLog('ImageViewer', `Rotating right to: ${rotation} degrees`);
            }
            
            image.setAttribute('data-rotation', rotation.toString());
            updateDirectImageTransform(image);
        } catch (error) {
            debugError('ImageViewer', 'Error rotating image', error);
        }
    };
    
    // Update the image transform based on scale and rotation
    function updateDirectImageTransform(image) {
        if (!image) return;
        
        const scale = parseFloat(image.getAttribute('data-scale') || '1');
        const rotation = parseInt(image.getAttribute('data-rotation') || '0');
        
        image.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
        debugLog('ImageViewer', `Updated image transform: scale=${scale}, rotation=${rotation}`);
    }
    
    // Helper function to show toast notifications if not defined elsewhere
    function showToast(type, title, message, duration = 3000) {
        if (window.showToast) {
            // Use the global showToast function if available
            window.showToast(type, title, message, duration);
        } else {
            // Create a simple toast if the global function is not available
            debugLog('Toast', `${type.toUpperCase()}: ${title} - ${message}`);
            
            // Create a simple toast element
            const toast = document.createElement('div');
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
            toast.style.color = 'white';
            toast.style.padding = '15px';
            toast.style.borderRadius = '4px';
            toast.style.zIndex = '10000';
            toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            toast.innerHTML = `<strong>${title}</strong>: ${message}`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                document.body.removeChild(toast);
            }, duration);
        }
    }
    
    // Fix the click handlers for photos
    function fixPhotoClickHandlers() {
        debugLog('ImageViewer', 'Fixing photo click handlers');
        
        // Helper function to check if a file is an image
        function isImageFile(filename) {
            if (!filename) return false;
            const ext = filename.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
        }
        
        // Find all collection items
        const collectionItems = document.querySelectorAll('.collection-item');
        collectionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemPath = item.getAttribute('data-path');
            
            if (itemType === 'file') {
                const itemName = itemPath.split('/').pop();
                if (isImageFile(itemName)) {
                    debugLog('ImageViewer', 'Adding click handler for image: ' + itemName);
                    
                    // Fix the collection card click handler
                    const card = item.querySelector('.collection-card');
                    if (card) {
                        card.onclick = function(e) {
                            // Don't open if clicking on action buttons
                            if (e.target.closest('.collection-actions')) {
                                return;
                            }
                            
                            debugLog('ImageViewer', 'Image clicked: ' + itemPath);
                            openDirectImageViewer(itemPath, itemName);
                        };
                    }
                    
                    // Fix the preview button click handler
                    const previewBtn = item.querySelector('.preview-button');
                    if (previewBtn) {
                        previewBtn.onclick = function(e) {
                            e.stopPropagation();
                            debugLog('ImageViewer', 'Preview button clicked for: ' + itemPath);
                            openDirectImageViewer(itemPath, itemName);
                        };
                    }
                }
            }
        });
    }
    
    // Override the displayCollections function to fix photo click handlers
    if (typeof window.displayCollections === 'function') {
        const originalDisplayCollections = window.displayCollections;
        window.displayCollections = function(collections) {
            // Call the original function first
            originalDisplayCollections(collections);
            
            // Then fix the click handlers
            setTimeout(fixPhotoClickHandlers, 200);
        };
    }
    
    // Initialize the image viewer
    initializeDirectImageViewer();
    
    // Fix photo click handlers after a short delay to ensure DOM is ready
    setTimeout(fixPhotoClickHandlers, 500);
    
    debugLog('ImageViewer', 'Image viewer bundle initialized successfully');
});
