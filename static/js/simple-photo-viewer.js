/**
 * Simple Photo Viewer for PhotoGeni
 * A lightweight, reliable image viewer that works with the collections page
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[SimplePhotoViewer] Initializing...');
    
    // Get the direct image viewer elements
    const viewer = document.getElementById('direct-image-viewer');
    const image = document.getElementById('direct-image');
    const title = document.getElementById('direct-title');
    const closeBtn = document.getElementById('direct-close');
    
    // Check if the viewer elements exist
    if (!viewer) {
        console.error('[SimplePhotoViewer] Error: Viewer element not found');
        return;
    }
    
    if (!image) {
        console.error('[SimplePhotoViewer] Error: Image element not found');
        return;
    }
    
    // Set up the image load event
    image.onload = function() {
        console.log('[SimplePhotoViewer] Image loaded successfully');
        const loadingEl = document.querySelector('.direct-image-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        const errorEl = document.querySelector('.direct-image-error');
        if (errorEl) errorEl.style.display = 'none';
        
        image.style.display = 'block';
    };
    
    // Set up the image error event
    image.onerror = function() {
        console.error('[SimplePhotoViewer] Failed to load image:', image.src);
        const loadingEl = document.querySelector('.direct-image-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        const errorEl = document.querySelector('.direct-image-error');
        if (errorEl) errorEl.style.display = 'block';
        
        image.style.display = 'none';
    };
    
    // Set up the close button
    if (closeBtn) {
        closeBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Close button clicked');
            closeDirectViewer();
        };
    }
    
    // Set up the retry button
    const retryBtn = document.getElementById('direct-retry');
    if (retryBtn) {
        retryBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Retry button clicked');
            const path = image.getAttribute('data-path');
            if (path) {
                const errorEl = document.querySelector('.direct-image-error');
                if (errorEl) errorEl.style.display = 'none';
                
                const loadingEl = document.querySelector('.direct-image-loading');
                if (loadingEl) loadingEl.style.display = 'flex';
                
                // Reload the image with a new timestamp to bypass cache
                image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
            }
        };
    }
    
    // Set up the download button
    const downloadBtn = document.getElementById('direct-download');
    if (downloadBtn) {
        downloadBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Download button clicked');
            const path = image.getAttribute('data-path');
            if (path) {
                const downloadUrl = `/api/collections/download?path=${encodeURIComponent(path)}`;
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = path.split('/').pop();
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        };
    }
    
    // Set up the analyze button
    const analyzeBtn = document.getElementById('direct-analyze');
    if (analyzeBtn) {
        analyzeBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Analyze button clicked');
            const path = image.getAttribute('data-path');
            if (path) {
                closeDirectViewer();
                if (typeof analyzeImage === 'function') {
                    analyzeImage(path);
                } else {
                    window.location.href = `/collections?analyze=${encodeURIComponent(path)}`;
                }
            }
        };
    }
    
    // Set up the zoom buttons
    const zoomInBtn = document.getElementById('direct-zoom-in');
    if (zoomInBtn) {
        zoomInBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Zoom in button clicked');
            zoomDirectImage('in');
        };
    }
    
    const zoomOutBtn = document.getElementById('direct-zoom-out');
    if (zoomOutBtn) {
        zoomOutBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Zoom out button clicked');
            zoomDirectImage('out');
        };
    }
    
    // Set up the rotate buttons
    const rotateLeftBtn = document.getElementById('direct-rotate-left');
    if (rotateLeftBtn) {
        rotateLeftBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Rotate left button clicked');
            rotateDirectImage('left');
        };
    }
    
    const rotateRightBtn = document.getElementById('direct-rotate-right');
    if (rotateRightBtn) {
        rotateRightBtn.onclick = function() {
            console.log('[SimplePhotoViewer] Rotate right button clicked');
            rotateDirectImage('right');
        };
    }
    
    // Set up keyboard events
    document.addEventListener('keydown', function(e) {
        if (viewer && viewer.style.display === 'block') {
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
    
    // Override the openDirectImageViewer function
    window.openDirectImageViewer = function(path, name) {
        try {
            console.log('[SimplePhotoViewer] Opening image:', path);
            
            if (!viewer) {
                console.error('[SimplePhotoViewer] Error: Viewer element not found');
                return;
            }
            
            if (!image) {
                console.error('[SimplePhotoViewer] Error: Image element not found');
                return;
            }
            
            // Show loading state
            const loadingEl = document.querySelector('.direct-image-loading');
            if (loadingEl) loadingEl.style.display = 'flex';
            
            // Hide error state
            const errorEl = document.querySelector('.direct-image-error');
            if (errorEl) errorEl.style.display = 'none';
            
            // Initially hide the image until it loads
            image.style.display = 'none';
            
            // Set image data
            image.setAttribute('data-path', path);
            image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
            
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
            
            console.log('[SimplePhotoViewer] Image viewer opened successfully');
        } catch (error) {
            console.error('[SimplePhotoViewer] Error opening image viewer:', error);
        }
    };
    
    // Override the closeDirectViewer function
    window.closeDirectViewer = function() {
        try {
            console.log('[SimplePhotoViewer] Closing image viewer');
            
            if (!viewer) {
                console.error('[SimplePhotoViewer] Error: Viewer element not found');
                return;
            }
            
            // Hide viewer
            viewer.style.display = 'none';
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Clear image src to stop any ongoing loads
            if (image) {
                image.src = '';
            }
            
            console.log('[SimplePhotoViewer] Image viewer closed successfully');
        } catch (error) {
            console.error('[SimplePhotoViewer] Error closing image viewer:', error);
        }
    };
    
    // Override the zoomDirectImage function
    window.zoomDirectImage = function(direction) {
        try {
            if (!image) {
                console.error('[SimplePhotoViewer] Error: Image element not found');
                return;
            }
            
            let scale = parseFloat(image.getAttribute('data-scale') || '1');
            
            if (direction === 'in') {
                scale = Math.min(scale * 1.2, 5); // Max zoom 5x
                console.log('[SimplePhotoViewer] Zooming in to scale:', scale);
            } else {
                scale = Math.max(scale / 1.2, 0.5); // Min zoom 0.5x
                console.log('[SimplePhotoViewer] Zooming out to scale:', scale);
            }
            
            image.setAttribute('data-scale', scale.toString());
            updateDirectImageTransform(image);
        } catch (error) {
            console.error('[SimplePhotoViewer] Error zooming image:', error);
        }
    };
    
    // Override the rotateDirectImage function
    window.rotateDirectImage = function(direction) {
        try {
            if (!image) {
                console.error('[SimplePhotoViewer] Error: Image element not found');
                return;
            }
            
            let rotation = parseInt(image.getAttribute('data-rotation') || '0');
            
            if (direction === 'left') {
                rotation = (rotation - 90) % 360;
                console.log('[SimplePhotoViewer] Rotating left to:', rotation, 'degrees');
            } else {
                rotation = (rotation + 90) % 360;
                console.log('[SimplePhotoViewer] Rotating right to:', rotation, 'degrees');
            }
            
            image.setAttribute('data-rotation', rotation.toString());
            updateDirectImageTransform(image);
        } catch (error) {
            console.error('[SimplePhotoViewer] Error rotating image:', error);
        }
    };
    
    // Update the image transform
    function updateDirectImageTransform(image) {
        if (!image) return;
        
        const scale = parseFloat(image.getAttribute('data-scale') || '1');
        const rotation = parseInt(image.getAttribute('data-rotation') || '0');
        
        image.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
    }
    
    // Fix the click handlers for photos
    function fixPhotoClickHandlers() {
        console.log('[SimplePhotoViewer] Fixing photo click handlers');
        
        // Helper function to check if a file is an image
        function isImageFile(filename) {
            if (!filename) return false;
            const ext = filename.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
        }
        
        // Find all collection items
        const collectionItems = document.querySelectorAll('.collection-item');
        console.log('[SimplePhotoViewer] Found', collectionItems.length, 'collection items');
        
        collectionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemPath = item.getAttribute('data-path');
            
            if (itemType === 'file') {
                const itemName = itemPath.split('/').pop();
                if (isImageFile(itemName)) {
                    console.log('[SimplePhotoViewer] Adding click handler for image:', itemName);
                    
                    // Fix the collection card click handler
                    const card = item.querySelector('.collection-card');
                    if (card) {
                        card.onclick = function(e) {
                            // Don't open if clicking on action buttons
                            if (e.target.closest('.collection-actions')) {
                                return;
                            }
                            
                            console.log('[SimplePhotoViewer] Image clicked:', itemPath);
                            openDirectImageViewer(itemPath, itemName);
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        };
                    }
                    
                    // Fix the preview button click handler
                    const previewBtn = item.querySelector('.preview-button');
                    if (previewBtn) {
                        previewBtn.onclick = function(e) {
                            console.log('[SimplePhotoViewer] Preview button clicked for:', itemPath);
                            openDirectImageViewer(itemPath, itemName);
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        };
                    }
                }
            }
        });
    }
    
    // Fix photo click handlers after a short delay to ensure DOM is ready
    setTimeout(fixPhotoClickHandlers, 500);
    
    // Fix photo click handlers when new collections are loaded
    const originalDisplayCollections = window.displayCollections;
    if (typeof originalDisplayCollections === 'function') {
        window.displayCollections = function(collections) {
            // Call the original function first
            originalDisplayCollections(collections);
            
            // Then fix the click handlers
            setTimeout(fixPhotoClickHandlers, 200);
        };
    }
    
    console.log('[SimplePhotoViewer] Initialization complete');
});
