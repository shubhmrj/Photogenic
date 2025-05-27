/**
 * Direct Fix for PhotoGeni Image Viewer
 * This script directly fixes the image viewer functionality
 */

// Execute immediately
(function() {
    console.log('[DirectFix] Applying direct fix for image viewer...');
    
    // Fix image click handlers immediately
    fixImageClickHandlers();
    
    // Also fix when DOM is loaded
    document.addEventListener('DOMContentLoaded', fixImageClickHandlers);
    
    // Also fix when page is fully loaded
    window.addEventListener('load', fixImageClickHandlers);
    
    // Fix image click handlers
    function fixImageClickHandlers() {
        console.log('[DirectFix] Fixing image click handlers');
        
        // Helper function to check if a file is an image
        function isImageFile(filename) {
            if (!filename) return false;
            const ext = filename.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
        }
        
        // Find all collection items
        const collectionItems = document.querySelectorAll('.collection-item');
        console.log('[DirectFix] Found ' + collectionItems.length + ' collection items');
        
        collectionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemPath = item.getAttribute('data-path');
            
            if (itemType === 'file') {
                const itemName = itemPath.split('/').pop();
                if (isImageFile(itemName)) {
                    console.log('[DirectFix] Adding click handler for image: ' + itemName);
                    
                    // Fix the collection card click handler
                    const card = item.querySelector('.collection-card');
                    if (card) {
                        card.onclick = function(e) {
                            // Don't open if clicking on action buttons
                            if (e.target.closest('.collection-actions')) {
                                return;
                            }
                            
                            console.log('[DirectFix] Image clicked: ' + itemPath);
                            showImage(itemPath, itemName);
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        };
                    }
                    
                    // Fix the preview button click handler
                    const previewBtn = item.querySelector('.preview-button');
                    if (previewBtn) {
                        previewBtn.onclick = function(e) {
                            console.log('[DirectFix] Preview button clicked for: ' + itemPath);
                            showImage(itemPath, itemName);
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        };
                    }
                }
            }
        });
    }
    
    // Show image in a simple viewer
    function showImage(path, name) {
        console.log('[DirectFix] Showing image: ' + path);
        
        // Create a simple viewer
        const viewer = document.createElement('div');
        viewer.style.position = 'fixed';
        viewer.style.top = '0';
        viewer.style.left = '0';
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        viewer.style.backgroundColor = 'rgba(0,0,0,0.9)';
        viewer.style.zIndex = '9999';
        viewer.style.display = 'flex';
        viewer.style.justifyContent = 'center';
        viewer.style.alignItems = 'center';
        
        // Create close button
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '30px';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '30px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function() {
            document.body.removeChild(viewer);
            document.body.style.overflow = '';
        };
        
        // Create title
        const title = document.createElement('div');
        title.textContent = name || path.split('/').pop();
        title.style.position = 'absolute';
        title.style.top = '20px';
        title.style.left = '30px';
        title.style.color = 'white';
        title.style.fontSize = '18px';
        
        // Create loading indicator
        const loading = document.createElement('div');
        loading.textContent = 'Loading...';
        loading.style.color = 'white';
        loading.style.fontSize = '18px';
        
        // Create image
        const img = document.createElement('img');
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.display = 'none';
        
        // Set image source
        img.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
        
        // Image load event
        img.onload = function() {
            loading.style.display = 'none';
            img.style.display = 'block';
        };
        
        // Image error event
        img.onerror = function() {
            loading.textContent = 'Failed to load image';
        };
        
        // Add elements to viewer
        viewer.appendChild(closeBtn);
        viewer.appendChild(title);
        viewer.appendChild(loading);
        viewer.appendChild(img);
        
        // Add viewer to body
        document.body.appendChild(viewer);
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        // Add keyboard event for ESC key
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(viewer);
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleKeyDown);
            }
        }
        
        document.addEventListener('keydown', handleKeyDown);
    }
    
    // Override the displayCollections function to fix click handlers when new collections are loaded
    if (typeof window.displayCollections === 'function') {
        const originalDisplayCollections = window.displayCollections;
        window.displayCollections = function(collections) {
            // Call the original function first
            originalDisplayCollections(collections);
            
            // Then fix the click handlers
            setTimeout(fixImageClickHandlers, 200);
        };
    }
    
    console.log('[DirectFix] Direct fix applied');
})();
