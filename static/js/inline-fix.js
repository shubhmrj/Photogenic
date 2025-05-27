/**
 * Inline Fix for PhotoGeni Image Viewer
 */

// Execute immediately when script loads
(function() {
    console.log('[InlineFix] Script loaded');
    
    // Fix on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', applyFix);
    
    // Fix on window load
    window.addEventListener('load', applyFix);
    
    // Also run immediately
    setTimeout(applyFix, 100);
    
    function applyFix() {
        console.log('[InlineFix] Applying fix...');
        
        // Add click handlers to all images
        addImageClickHandlers();
        
        // Override displayCollections to handle dynamically loaded content
        overrideDisplayCollections();
        
        console.log('[InlineFix] Fix applied');
    }
    
    function addImageClickHandlers() {
        console.log('[InlineFix] Adding image click handlers');
        
        // Find all collection items
        const collectionItems = document.querySelectorAll('.collection-item');
        console.log('[InlineFix] Found ' + collectionItems.length + ' collection items');
        
        collectionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemPath = item.getAttribute('data-path');
            
            if (itemType === 'file' && isImageFile(itemPath)) {
                const itemName = itemPath.split('/').pop();
                console.log('[InlineFix] Adding click handler for image: ' + itemName);
                
                // Add click handler to the card
                const card = item.querySelector('.collection-card');
                if (card) {
                    card.onclick = function(e) {
                        // Don't open if clicking on action buttons
                        if (e.target.closest('.collection-actions')) {
                            return;
                        }
                        
                        console.log('[InlineFix] Image clicked: ' + itemPath);
                        showImageViewer(itemPath, itemName);
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
                
                // Add click handler to the preview button
                const previewBtn = item.querySelector('.preview-button');
                if (previewBtn) {
                    previewBtn.onclick = function(e) {
                        console.log('[InlineFix] Preview button clicked for: ' + itemPath);
                        showImageViewer(itemPath, itemName);
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
    
    function showImageViewer(path, name) {
        console.log('[InlineFix] Showing image viewer for: ' + path);
        
        // Create viewer if it doesn't exist
        let viewer = document.getElementById('inline-image-viewer');
        if (!viewer) {
            viewer = createImageViewer();
        }
        
        // Get viewer elements
        const image = document.getElementById('inline-viewer-image');
        const title = document.getElementById('inline-viewer-title');
        const loading = document.getElementById('inline-viewer-loading');
        const error = document.getElementById('inline-viewer-error');
        
        // Set title
        if (title) {
            title.textContent = name || path.split('/').pop();
        }
        
        // Show loading, hide error
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';
        if (image) image.style.display = 'none';
        
        // Set image source
        if (image) {
            image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
            image.setAttribute('data-path', path);
        }
        
        // Show viewer
        viewer.style.display = 'block';
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }
    
    function createImageViewer() {
        console.log('[InlineFix] Creating image viewer');
        
        // Create viewer container
        const viewer = document.createElement('div');
        viewer.id = 'inline-image-viewer';
        viewer.style.position = 'fixed';
        viewer.style.top = '0';
        viewer.style.left = '0';
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        viewer.style.backgroundColor = 'rgba(0,0,0,0.9)';
        viewer.style.zIndex = '9999';
        viewer.style.display = 'none';
        
        // Create title
        const title = document.createElement('div');
        title.id = 'inline-viewer-title';
        title.style.position = 'absolute';
        title.style.top = '20px';
        title.style.left = '30px';
        title.style.color = 'white';
        title.style.fontSize = '18px';
        
        // Create close button
        const closeBtn = document.createElement('div');
        closeBtn.id = 'inline-viewer-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '30px';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '30px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = closeImageViewer;
        
        // Create image container
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.height = '100%';
        container.style.width = '100%';
        
        // Create image
        const image = document.createElement('img');
        image.id = 'inline-viewer-image';
        image.style.maxHeight = '90%';
        image.style.maxWidth = '90%';
        image.style.display = 'none';
        
        // Create loading indicator
        const loading = document.createElement('div');
        loading.id = 'inline-viewer-loading';
        loading.textContent = 'Loading...';
        loading.style.color = 'white';
        loading.style.fontSize = '18px';
        loading.style.position = 'absolute';
        loading.style.top = '50%';
        loading.style.left = '50%';
        loading.style.transform = 'translate(-50%, -50%)';
        
        // Create error message
        const error = document.createElement('div');
        error.id = 'inline-viewer-error';
        error.innerHTML = '<div>Failed to load image</div><button style="background: #4f46e5; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer; border-radius: 4px;">Retry</button>';
        error.style.color = 'white';
        error.style.fontSize = '18px';
        error.style.position = 'absolute';
        error.style.top = '50%';
        error.style.left = '50%';
        error.style.transform = 'translate(-50%, -50%)';
        error.style.textAlign = 'center';
        error.style.display = 'none';
        
        // Create controls
        const controls = document.createElement('div');
        controls.style.position = 'absolute';
        controls.style.bottom = '20px';
        controls.style.left = '0';
        controls.style.width = '100%';
        controls.style.display = 'flex';
        controls.style.justifyContent = 'center';
        controls.style.gap = '10px';
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'inline-viewer-download';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        downloadBtn.style.background = 'rgba(0,0,0,0.5)';
        downloadBtn.style.color = 'white';
        downloadBtn.style.border = 'none';
        downloadBtn.style.padding = '8px 15px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.borderRadius = '4px';
        downloadBtn.onclick = downloadImage;
        
        // Create analyze button
        const analyzeBtn = document.createElement('button');
        analyzeBtn.id = 'inline-viewer-analyze';
        analyzeBtn.innerHTML = '<i class="fas fa-magic"></i> Analyze';
        analyzeBtn.style.background = 'rgba(0,0,0,0.5)';
        analyzeBtn.style.color = 'white';
        analyzeBtn.style.border = 'none';
        analyzeBtn.style.padding = '8px 15px';
        analyzeBtn.style.cursor = 'pointer';
        analyzeBtn.style.borderRadius = '4px';
        analyzeBtn.onclick = analyzeImage;
        
        // Add elements to controls
        controls.appendChild(downloadBtn);
        controls.appendChild(analyzeBtn);
        
        // Add elements to container
        container.appendChild(image);
        
        // Add elements to viewer
        viewer.appendChild(title);
        viewer.appendChild(closeBtn);
        viewer.appendChild(container);
        viewer.appendChild(loading);
        viewer.appendChild(error);
        viewer.appendChild(controls);
        
        // Add viewer to body
        document.body.appendChild(viewer);
        
        // Set up image events
        image.onload = function() {
            console.log('[InlineFix] Image loaded successfully');
            loading.style.display = 'none';
            error.style.display = 'none';
            image.style.display = 'block';
        };
        
        image.onerror = function() {
            console.error('[InlineFix] Failed to load image:', image.src);
            loading.style.display = 'none';
            error.style.display = 'block';
            image.style.display = 'none';
        };
        
        // Set up retry button
        const retryBtn = error.querySelector('button');
        if (retryBtn) {
            retryBtn.onclick = function() {
                const path = image.getAttribute('data-path');
                if (path) {
                    console.log('[InlineFix] Retrying image load for:', path);
                    error.style.display = 'none';
                    loading.style.display = 'block';
                    image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
                }
            };
        }
        
        // Add keyboard event for ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && viewer.style.display === 'block') {
                closeImageViewer();
            }
        });
        
        return viewer;
    }
    
    function closeImageViewer() {
        console.log('[InlineFix] Closing image viewer');
        
        const viewer = document.getElementById('inline-image-viewer');
        if (viewer) {
            viewer.style.display = 'none';
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Clear image src to stop any ongoing loads
            const image = document.getElementById('inline-viewer-image');
            if (image) {
                image.src = '';
            }
        }
    }
    
    function downloadImage() {
        console.log('[InlineFix] Downloading image');
        
        const image = document.getElementById('inline-viewer-image');
        if (image) {
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
        }
    }
    
    function analyzeImage() {
        console.log('[InlineFix] Analyzing image');
        
        const image = document.getElementById('inline-viewer-image');
        if (image) {
            const path = image.getAttribute('data-path');
            if (path) {
                closeImageViewer();
                
                // Use existing analyzeImage function if available
                if (typeof window.analyzeImage === 'function') {
                    window.analyzeImage(path);
                } else {
                    // Fallback to redirect
                    window.location.href = `/collections?analyze=${encodeURIComponent(path)}`;
                }
            }
        }
    }
    
    function overrideDisplayCollections() {
        // Override the displayCollections function to fix click handlers when new collections are loaded
        if (typeof window.displayCollections === 'function') {
            console.log('[InlineFix] Overriding displayCollections function');
            
            const originalDisplayCollections = window.displayCollections;
            window.displayCollections = function(collections) {
                // Call the original function first
                originalDisplayCollections(collections);
                
                // Then add click handlers
                setTimeout(addImageClickHandlers, 200);
            };
        }
    }
    
    // Override existing functions to use our viewer
    window.openDirectImageViewer = function(path, name) {
        showImageViewer(path, name);
    };
    
    window.closeDirectViewer = function() {
        closeImageViewer();
    };
})();
