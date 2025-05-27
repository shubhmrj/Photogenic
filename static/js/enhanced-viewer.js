/**
 * Enhanced Image Viewer for PhotoGeni
 * A comprehensive solution that integrates with the existing UI
 */
(function() {
    console.log('[EnhancedViewer] Initializing...');
    
    // Apply fix immediately
    applyFix();
    
    // Also apply when DOM is loaded
    document.addEventListener('DOMContentLoaded', applyFix);
    
    // Also apply when page is fully loaded
    window.addEventListener('load', applyFix);
    
    function applyFix() {
        console.log('[EnhancedViewer] Applying fix...');
        
        // Set up direct image viewer event listeners
        setupDirectViewerEvents();
        
        // Add click handlers to all images
        addImageClickHandlers();
        
        // Override displayCollections to handle dynamically loaded content
        overrideDisplayCollections();
        
        // Add keyboard shortcuts
        setupKeyboardShortcuts();
        
        console.log('[EnhancedViewer] Fix applied successfully');
    }
    
    function setupDirectViewerEvents() {
        console.log('[EnhancedViewer] Setting up direct viewer events');
        
        // Get the viewer elements
        const viewer = document.getElementById('direct-image-viewer');
        const image = document.getElementById('direct-image');
        const closeBtn = document.getElementById('direct-close');
        const retryBtn = document.getElementById('direct-retry');
        const zoomInBtn = document.getElementById('direct-zoom-in');
        const zoomOutBtn = document.getElementById('direct-zoom-out');
        const rotateLeftBtn = document.getElementById('direct-rotate-left');
        const rotateRightBtn = document.getElementById('direct-rotate-right');
        const downloadBtn = document.getElementById('direct-download');
        const analyzeBtn = document.getElementById('direct-analyze');
        
        // Check if viewer exists
        if (!viewer) {
            console.error('[EnhancedViewer] Direct image viewer not found');
            return;
        }
        
        // Set up the image load event
        if (image) {
            image.onload = function() {
                console.log('[EnhancedViewer] Image loaded successfully');
                const loadingEl = viewer.querySelector('.direct-image-loading');
                if (loadingEl) loadingEl.style.display = 'none';
                
                const errorEl = viewer.querySelector('.direct-image-error');
                if (errorEl) errorEl.style.display = 'none';
                
                image.style.display = 'block';
                
                // Show toast notification
                if (typeof showToast === 'function') {
                    showToast('success', 'Image Loaded', 'Image loaded successfully', 2000);
                }
            };
            
            image.onerror = function() {
                console.error('[EnhancedViewer] Failed to load image:', image.src);
                const loadingEl = viewer.querySelector('.direct-image-loading');
                if (loadingEl) loadingEl.style.display = 'none';
                
                const errorEl = viewer.querySelector('.direct-image-error');
                if (errorEl) errorEl.style.display = 'flex';
                
                image.style.display = 'none';
                
                // Show toast notification
                if (typeof showToast === 'function') {
                    showToast('error', 'Error', 'Failed to load image', 3000);
                }
            };
        }
        
        // Set up the close button
        if (closeBtn) {
            closeBtn.onclick = function() {
                console.log('[EnhancedViewer] Close button clicked');
                closeDirectViewer();
            };
        }
        
        // Set up the retry button
        if (retryBtn) {
            retryBtn.onclick = function() {
                console.log('[EnhancedViewer] Retry button clicked');
                const path = image.getAttribute('data-path');
                if (path) {
                    const errorEl = viewer.querySelector('.direct-image-error');
                    if (errorEl) errorEl.style.display = 'none';
                    
                    const loadingEl = viewer.querySelector('.direct-image-loading');
                    if (loadingEl) loadingEl.style.display = 'flex';
                    
                    // Reload the image with a new timestamp to bypass cache
                    image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
                    
                    // Show toast notification
                    if (typeof showToast === 'function') {
                        showToast('info', 'Retrying', 'Retrying image load...', 2000);
                    }
                }
            };
        }
        
        // Set up the zoom in button
        if (zoomInBtn) {
            zoomInBtn.onclick = function() {
                console.log('[EnhancedViewer] Zoom in button clicked');
                zoomDirectImage(1);
            };
        }
        
        // Set up the zoom out button
        if (zoomOutBtn) {
            zoomOutBtn.onclick = function() {
                console.log('[EnhancedViewer] Zoom out button clicked');
                zoomDirectImage(-1);
            };
        }
        
        // Set up the rotate left button
        if (rotateLeftBtn) {
            rotateLeftBtn.onclick = function() {
                console.log('[EnhancedViewer] Rotate left button clicked');
                rotateDirectImage(-1);
            };
        }
        
        // Set up the rotate right button
        if (rotateRightBtn) {
            rotateRightBtn.onclick = function() {
                console.log('[EnhancedViewer] Rotate right button clicked');
                rotateDirectImage(1);
            };
        }
        
        // Set up the download button
        if (downloadBtn) {
            downloadBtn.onclick = function() {
                console.log('[EnhancedViewer] Download button clicked');
                const path = image.getAttribute('data-path');
                if (path) {
                    const downloadUrl = `/api/collections/download?path=${encodeURIComponent(path)}`;
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = path.split('/').pop();
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Show toast notification
                    if (typeof showToast === 'function') {
                        showToast('success', 'Download Started', 'Your download has started', 2000);
                    }
                }
            };
        }
        
        // Set up the analyze button
        if (analyzeBtn) {
            analyzeBtn.onclick = function() {
                console.log('[EnhancedViewer] Analyze button clicked');
                const path = image.getAttribute('data-path');
                if (path) {
                    closeDirectViewer();
                    if (typeof analyzeImage === 'function') {
                        analyzeImage(path);
                    }
                }
            };
        }
        
        console.log('[EnhancedViewer] Direct viewer events set up');
    }
    
    function addImageClickHandlers() {
        console.log('[EnhancedViewer] Adding image click handlers');
        
        // Find all collection items
        const collectionItems = document.querySelectorAll('.collection-item');
        console.log('[EnhancedViewer] Found', collectionItems.length, 'collection items');
        
        collectionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemPath = item.getAttribute('data-path');
            
            if (itemType === 'file' && isImageFile(itemPath)) {
                const itemName = itemPath.split('/').pop();
                console.log('[EnhancedViewer] Adding click handler for image:', itemName);
                
                // Fix the collection card click handler
                const card = item.querySelector('.collection-card');
                if (card) {
                    card.onclick = function(e) {
                        // Don't open if clicking on action buttons
                        if (e.target.closest('.collection-actions')) {
                            return;
                        }
                        
                        console.log('[EnhancedViewer] Image clicked:', itemPath);
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
                        console.log('[EnhancedViewer] Preview button clicked for:', itemPath);
                        openDirectImageViewer(itemPath, itemName);
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
                
                // Add a visual indicator that the item is clickable
                const thumbnail = item.querySelector('.collection-thumbnail');
                if (thumbnail && !thumbnail.classList.contains('image-item')) {
                    thumbnail.classList.add('image-item');
                    
                    // Add hover effect styles if not already present
                    const style = document.createElement('style');
                    style.textContent = `
                        .collection-thumbnail.image-item {
                            cursor: pointer;
                            transition: transform 0.2s ease;
                        }
                        .collection-thumbnail.image-item:hover {
                            transform: scale(1.05);
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        });
    }
    
    function overrideDisplayCollections() {
        // Override the displayCollections function to fix click handlers when new collections are loaded
        if (typeof window.displayCollections === 'function') {
            console.log('[EnhancedViewer] Overriding displayCollections function');
            
            const originalDisplayCollections = window.displayCollections;
            window.displayCollections = function(collections) {
                // Call the original function first
                originalDisplayCollections(collections);
                
                // Then add click handlers
                setTimeout(addImageClickHandlers, 200);
            };
        }
    }
    
    function setupKeyboardShortcuts() {
        console.log('[EnhancedViewer] Setting up keyboard shortcuts');
        
        document.addEventListener('keydown', function(e) {
            const viewer = document.getElementById('direct-image-viewer');
            
            if (viewer && (viewer.style.display === 'block' || viewer.classList.contains('active'))) {
                // Escape key to close
                if (e.key === 'Escape') {
                    closeDirectViewer();
                }
                
                // Plus key to zoom in
                if (e.key === '+' || e.key === '=') {
                    zoomDirectImage(1);
                }
                
                // Minus key to zoom out
                if (e.key === '-' || e.key === '_') {
                    zoomDirectImage(-1);
                }
                
                // Left arrow to rotate left
                if (e.key === 'ArrowLeft') {
                    rotateDirectImage(-1);
                }
                
                // Right arrow to rotate right
                if (e.key === 'ArrowRight') {
                    rotateDirectImage(1);
                }
                
                // 'D' key to download
                if (e.key === 'd' || e.key === 'D') {
                    const downloadBtn = document.getElementById('direct-download');
                    if (downloadBtn) {
                        downloadBtn.click();
                    }
                }
                
                // 'A' key to analyze
                if (e.key === 'a' || e.key === 'A') {
                    const analyzeBtn = document.getElementById('direct-analyze');
                    if (analyzeBtn) {
                        analyzeBtn.click();
                    }
                }
            }
        });
    }
    
    // Helper function to check if a file is an image
    function isImageFile(path) {
        if (!path) return false;
        const filename = path.split('/').pop();
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    }
    
    // Function to open the direct image viewer
    function openDirectImageViewer(path, name) {
        console.log('[EnhancedViewer] Opening direct image viewer for:', path);
        
        const viewer = document.getElementById('direct-image-viewer');
        const image = document.getElementById('direct-image');
        const title = document.getElementById('direct-title');
        
        if (!viewer) {
            console.error('[EnhancedViewer] Viewer element not found');
            return;
        }
        
        if (!image) {
            console.error('[EnhancedViewer] Image element not found');
            return;
        }
        
        // Show loading, hide error
        const loadingEl = viewer.querySelector('.direct-image-loading');
        const errorEl = viewer.querySelector('.direct-image-error');
        
        if (loadingEl) loadingEl.style.display = 'flex';
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
        
        // Add active class for animation
        setTimeout(() => {
            viewer.classList.add('active');
        }, 10);
    }
    
    // Function to close the direct image viewer
    function closeDirectViewer() {
        console.log('[EnhancedViewer] Closing direct image viewer');
        
        const viewer = document.getElementById('direct-image-viewer');
        if (!viewer) {
            console.error('[EnhancedViewer] Viewer element not found');
            return;
        }
        
        // Remove active class for animation
        viewer.classList.remove('active');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            viewer.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
    
    // Function to zoom the image
    function zoomDirectImage(direction) {
        console.log('[EnhancedViewer] Zooming image:', direction);
        
        const image = document.getElementById('direct-image');
        if (!image) return;
        
        let scale = parseFloat(image.getAttribute('data-scale') || '1');
        
        // Adjust scale
        if (direction > 0) {
            scale = Math.min(scale + 0.25, 3); // Max zoom: 3x
        } else {
            scale = Math.max(scale - 0.25, 0.5); // Min zoom: 0.5x
        }
        
        // Update scale attribute
        image.setAttribute('data-scale', scale.toString());
        
        // Update transform
        updateDirectImageTransform(image);
    }
    
    // Function to rotate the image
    function rotateDirectImage(direction) {
        console.log('[EnhancedViewer] Rotating image:', direction);
        
        const image = document.getElementById('direct-image');
        if (!image) return;
        
        let rotation = parseInt(image.getAttribute('data-rotation') || '0');
        
        // Adjust rotation
        rotation = (rotation + direction * 90) % 360;
        if (rotation < 0) rotation += 360;
        
        // Update rotation attribute
        image.setAttribute('data-rotation', rotation.toString());
        
        // Update transform
        updateDirectImageTransform(image);
    }
    
    // Function to update the image transform
    function updateDirectImageTransform(image) {
        if (!image) return;
        
        const scale = parseFloat(image.getAttribute('data-scale') || '1');
        const rotation = parseInt(image.getAttribute('data-rotation') || '0');
        
        // Apply transform
        image.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
    }
    
    // Override the global functions
    window.openDirectImageViewer = openDirectImageViewer;
    window.closeDirectViewer = closeDirectViewer;
    window.zoomDirectImage = zoomDirectImage;
    window.rotateDirectImage = rotateDirectImage;
    window.updateDirectImageTransform = updateDirectImageTransform;
})();
