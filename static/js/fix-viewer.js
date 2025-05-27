/**
 * Fix Viewer - A direct fix for the PhotoGeni image viewer
 */
(function() {
    console.log('[FixViewer] Initializing...');
    
    // Run immediately
    fixImageViewer();
    
    // Also run when DOM is loaded
    document.addEventListener('DOMContentLoaded', fixImageViewer);
    
    // Also run when page is fully loaded
    window.addEventListener('load', fixImageViewer);
    
    function fixImageViewer() {
        console.log('[FixViewer] Applying fix...');
        
        // Override the openDirectImageViewer function
        window.openDirectImageViewer = function(path, name) {
            console.log('[FixViewer] Opening image:', path);
            
            const viewer = document.getElementById('direct-image-viewer');
            const image = document.getElementById('direct-image');
            const title = document.getElementById('direct-title');
            
            if (!viewer) {
                console.error('[FixViewer] Viewer element not found');
                return;
            }
            
            if (!image) {
                console.error('[FixViewer] Image element not found');
                return;
            }
            
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
        };
        
        // Fix click handlers for all image items
        fixImageClickHandlers();
        
        // Override displayCollections to fix handlers when new collections are loaded
        if (typeof window.displayCollections === 'function') {
            const originalDisplayCollections = window.displayCollections;
            window.displayCollections = function(collections) {
                // Call the original function first
                originalDisplayCollections(collections);
                
                // Then fix the click handlers
                setTimeout(fixImageClickHandlers, 200);
            };
        }
        
        console.log('[FixViewer] Fix applied');
    }
    
    function fixImageClickHandlers() {
        console.log('[FixViewer] Fixing image click handlers');
        
        // Find all collection items
        const collectionItems = document.querySelectorAll('.collection-item');
        console.log('[FixViewer] Found', collectionItems.length, 'collection items');
        
        collectionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemPath = item.getAttribute('data-path');
            
            if (itemType === 'file' && isImageFile(itemPath)) {
                const itemName = itemPath.split('/').pop();
                console.log('[FixViewer] Adding click handler for image:', itemName);
                
                // Fix the collection card click handler
                const card = item.querySelector('.collection-card');
                if (card) {
                    card.onclick = function(e) {
                        // Don't open if clicking on action buttons
                        if (e.target.closest('.collection-actions')) {
                            return;
                        }
                        
                        console.log('[FixViewer] Image clicked:', itemPath);
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
                        console.log('[FixViewer] Preview button clicked for:', itemPath);
                        openDirectImageViewer(itemPath, itemName);
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
            }
        });
    }
    
    function isImageFile(path) {
        if (!path) return false;
        const filename = path.split('/').pop();
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    }
})();
