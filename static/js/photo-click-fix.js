/**
 * Photo Click Fix for PhotoGeni
 * This script ensures photos open correctly when clicked
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[PhotoClickFix] Initializing...');
    
    // Fix the openDirectImageViewer function
    function fixDirectImageViewer() {
        console.log('[PhotoClickFix] Setting up direct image viewer fix');
        
        // Override the openDirectImageViewer function
        window.openDirectImageViewer = function(path, name) {
            console.log('[PhotoClickFix] Opening image:', path);
            
            const viewer = document.getElementById('direct-image-viewer');
            const image = document.getElementById('direct-image');
            const title = document.getElementById('direct-title');
            
            if (!viewer) {
                console.error('[PhotoClickFix] Error: Viewer element not found');
                return;
            }
            
            if (!image) {
                console.error('[PhotoClickFix] Error: Image element not found');
                return;
            }
            
            // Show loading state if it exists
            const loadingEl = document.querySelector('.direct-image-loading');
            if (loadingEl) {
                loadingEl.style.display = 'flex';
            }
            
            // Hide error state if it exists
            const errorEl = document.querySelector('.direct-image-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
            
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
            
            // Add active class for animation
            setTimeout(() => {
                viewer.classList.add('active');
            }, 10);
            
            console.log('[PhotoClickFix] Image viewer opened successfully');
        };
        
        // Set up image load and error events
        const image = document.getElementById('direct-image');
        if (image) {
            image.onload = function() {
                console.log('[PhotoClickFix] Image loaded successfully');
                const loadingEl = document.querySelector('.direct-image-loading');
                if (loadingEl) loadingEl.style.display = 'none';
                
                const errorEl = document.querySelector('.direct-image-error');
                if (errorEl) errorEl.style.display = 'none';
                
                image.style.display = 'block';
            };
            
            image.onerror = function() {
                console.error('[PhotoClickFix] Failed to load image:', image.src);
                const loadingEl = document.querySelector('.direct-image-loading');
                if (loadingEl) loadingEl.style.display = 'none';
                
                const errorEl = document.querySelector('.direct-image-error');
                if (errorEl) errorEl.style.display = 'block';
                
                image.style.display = 'none';
            };
        }
        
        // Set up retry button
        const retryBtn = document.getElementById('direct-retry');
        if (retryBtn) {
            retryBtn.onclick = function() {
                console.log('[PhotoClickFix] Retry button clicked');
                const image = document.getElementById('direct-image');
                if (!image) return;
                
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
        
        // Set up close button
        const closeBtn = document.getElementById('direct-close');
        if (closeBtn) {
            closeBtn.onclick = function() {
                console.log('[PhotoClickFix] Close button clicked');
                closeDirectViewer();
            };
        }
        
        // Override the closeDirectViewer function
        window.closeDirectViewer = function() {
            console.log('[PhotoClickFix] Closing image viewer');
            
            const viewer = document.getElementById('direct-image-viewer');
            if (!viewer) {
                console.error('[PhotoClickFix] Error: Viewer element not found');
                return;
            }
            
            // Remove active class for animation
            viewer.classList.remove('active');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                viewer.style.display = 'none';
                document.body.style.overflow = '';
                
                // Clear image src to stop any ongoing loads
                const image = document.getElementById('direct-image');
                if (image) {
                    image.src = '';
                }
            }, 300);
        };
        
        // Add keyboard event listener for ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const viewer = document.getElementById('direct-image-viewer');
                if (viewer && getComputedStyle(viewer).display !== 'none') {
                    closeDirectViewer();
                }
            }
        });
    }
    
    // Fix the click handlers for photos
    function fixPhotoClickHandlers() {
        console.log('[PhotoClickFix] Fixing photo click handlers');
        
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
                    console.log('[PhotoClickFix] Adding click handler for image:', itemName);
                    
                    // Fix the collection card click handler
                    const card = item.querySelector('.collection-card');
                    if (card) {
                        card.onclick = function(e) {
                            // Don't open if clicking on action buttons
                            if (e.target.closest('.collection-actions')) {
                                return;
                            }
                            
                            console.log('[PhotoClickFix] Image clicked:', itemPath);
                            openDirectImageViewer(itemPath, itemName);
                        };
                    }
                    
                    // Fix the preview button click handler
                    const previewBtn = item.querySelector('.preview-button');
                    if (previewBtn) {
                        previewBtn.onclick = function(e) {
                            e.stopPropagation();
                            console.log('[PhotoClickFix] Preview button clicked for:', itemPath);
                            openDirectImageViewer(itemPath, itemName);
                        };
                    }
                }
            }
        });
    }
    
    // Initialize the fixes
    fixDirectImageViewer();
    
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
    
    console.log('[PhotoClickFix] Initialization complete');
});
