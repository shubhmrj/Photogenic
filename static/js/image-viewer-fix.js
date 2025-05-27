/**
 * Image Viewer Fix for PhotoGeni
 * This script fixes issues with the direct image viewer
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[ImageViewerFix] Script loaded');
    
    // Fix the image viewer functionality
    fixImageViewer();
    
    // Add event listener for when collections are loaded
    document.addEventListener('collectionsLoaded', fixImageViewer);
    
    // Also fix on window load to ensure everything is ready
    window.addEventListener('load', fixImageViewer);
});

// Main function to fix the image viewer
function fixImageViewer() {
    console.log('[ImageViewerFix] Applying fixes...');
    
    // Make sure the viewer elements exist
    ensureViewerElements();
    
    // Fix the click handlers for all images
    fixImageClickHandlers();
    
    // Override the image viewer functions
    overrideImageViewerFunctions();
}

// Ensure all necessary viewer elements exist
function ensureViewerElements() {
    console.log('[ImageViewerFix] Checking viewer elements');
    
    // Check if the direct image viewer exists
    const viewer = document.getElementById('direct-image-viewer');
    if (!viewer) {
        console.error('[ImageViewerFix] Direct image viewer not found, creating it');
        createDirectImageViewer();
    } else {
        console.log('[ImageViewerFix] Direct image viewer found');
    }
}

// Create the direct image viewer if it doesn't exist
function createDirectImageViewer() {
    const viewerHtml = `
        <div id="direct-image-viewer" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); z-index: 9999; overflow: hidden;">
            <div id="direct-close" style="position: absolute; top: 15px; right: 20px; color: white; font-size: 24px; cursor: pointer;"><i class="fas fa-times"></i></div>
            <div id="direct-title" style="position: absolute; top: 15px; left: 20px; color: white; font-size: 18px;"></div>
            <div id="direct-image-container" style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;">
                <img id="direct-image" src="" alt="Preview" data-scale="1" data-rotation="0" style="max-height: 90%; max-width: 90%; object-fit: contain; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />
                <div class="direct-image-loading" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">Loading image...</div>
                <div class="direct-image-error" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Failed to load image</div>
                    <button id="direct-retry" style="background: #4f46e5; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer; border-radius: 4px;">Retry</button>
                </div>
            </div>
            <div class="direct-viewer-controls" style="position: absolute; bottom: 20px; left: 0; width: 100%; display: flex; justify-content: center; gap: 10px;">
                <button id="direct-zoom-in" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
                    <i class="fas fa-search-plus"></i> Zoom In
                </button>
                <button id="direct-zoom-out" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
                    <i class="fas fa-search-minus"></i> Zoom Out
                </button>
                <button id="direct-rotate-left" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
                    <i class="fas fa-undo"></i> Rotate Left
                </button>
                <button id="direct-rotate-right" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
                    <i class="fas fa-redo"></i> Rotate Right
                </button>
                <button id="direct-download" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
                    <i class="fas fa-download"></i> Download
                </button>
                <button id="direct-analyze" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
                    <i class="fas fa-chart-bar"></i> Analyze
                </button>
            </div>
        </div>
    `;
    
    // Append the viewer to the body
    document.body.insertAdjacentHTML('beforeend', viewerHtml);
    console.log('[ImageViewerFix] Created direct image viewer');
}

// Fix click handlers for all images in the collections grid
function fixImageClickHandlers() {
    console.log('[ImageViewerFix] Fixing image click handlers');
    
    // Helper function to check if a file is an image
    function isImageFile(filename) {
        if (!filename) return false;
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    }
    
    // Find all collection items
    const collectionItems = document.querySelectorAll('.collection-item');
    console.log('[ImageViewerFix] Found ' + collectionItems.length + ' collection items');
    
    collectionItems.forEach(item => {
        const itemType = item.getAttribute('data-type');
        const itemPath = item.getAttribute('data-path');
        
        if (itemType === 'file') {
            const itemName = itemPath.split('/').pop();
            if (isImageFile(itemName)) {
                console.log('[ImageViewerFix] Adding click handler for image: ' + itemName);
                
                // Fix the collection card click handler
                const card = item.querySelector('.collection-card');
                if (card) {
                    card.onclick = function(e) {
                        // Don't open if clicking on action buttons
                        if (e.target.closest('.collection-actions')) {
                            return;
                        }
                        
                        console.log('[ImageViewerFix] Image clicked: ' + itemPath);
                        openImageViewer(itemPath, itemName);
                    };
                }
                
                // Fix the preview button click handler
                const previewBtn = item.querySelector('.preview-button');
                if (previewBtn) {
                    previewBtn.onclick = function(e) {
                        e.stopPropagation();
                        console.log('[ImageViewerFix] Preview button clicked for: ' + itemPath);
                        openImageViewer(itemPath, itemName);
                    };
                }
            }
        }
    });
}

// Override the image viewer functions
function overrideImageViewerFunctions() {
    console.log('[ImageViewerFix] Overriding image viewer functions');
    
    // Override the openDirectImageViewer function
    window.openDirectImageViewer = function(path, name) {
        openImageViewer(path, name);
    };
    
    // Set up event listeners for the viewer controls
    setupViewerControls();
}

// Open the image viewer
function openImageViewer(path, name) {
    console.log('[ImageViewerFix] Opening image: ' + path);
    
    const viewer = document.getElementById('direct-image-viewer');
    const image = document.getElementById('direct-image');
    const title = document.getElementById('direct-title');
    const loadingEl = document.querySelector('.direct-image-loading');
    const errorEl = document.querySelector('.direct-image-error');
    
    if (!viewer) {
        console.error('[ImageViewerFix] Viewer element not found');
        return;
    }
    
    if (!image) {
        console.error('[ImageViewerFix] Image element not found');
        return;
    }
    
    // Show loading state
    if (loadingEl) loadingEl.style.display = 'flex';
    
    // Hide error state
    if (errorEl) errorEl.style.display = 'none';
    
    // Hide image until it loads
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
    
    // Set up image load event
    image.onload = function() {
        console.log('[ImageViewerFix] Image loaded successfully');
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        image.style.display = 'block';
    };
    
    // Set up image error event
    image.onerror = function() {
        console.error('[ImageViewerFix] Failed to load image: ' + image.src);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        image.style.display = 'none';
    };
    
    console.log('[ImageViewerFix] Image viewer opened successfully');
}

// Close the image viewer
function closeImageViewer() {
    console.log('[ImageViewerFix] Closing image viewer');
    
    const viewer = document.getElementById('direct-image-viewer');
    if (!viewer) {
        console.error('[ImageViewerFix] Viewer element not found');
        return;
    }
    
    // Hide viewer
    viewer.style.display = 'none';
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Clear image src to stop any ongoing loads
    const image = document.getElementById('direct-image');
    if (image) {
        image.src = '';
    }
    
    console.log('[ImageViewerFix] Image viewer closed successfully');
}

// Set up event listeners for the viewer controls
function setupViewerControls() {
    console.log('[ImageViewerFix] Setting up viewer controls');
    
    // Close button
    const closeBtn = document.getElementById('direct-close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            closeImageViewer();
        };
    }
    
    // Retry button
    const retryBtn = document.getElementById('direct-retry');
    if (retryBtn) {
        retryBtn.onclick = function() {
            const image = document.getElementById('direct-image');
            if (!image) return;
            
            const path = image.getAttribute('data-path');
            if (path) {
                console.log('[ImageViewerFix] Retrying image load for: ' + path);
                
                const errorEl = document.querySelector('.direct-image-error');
                if (errorEl) errorEl.style.display = 'none';
                
                const loadingEl = document.querySelector('.direct-image-loading');
                if (loadingEl) loadingEl.style.display = 'flex';
                
                // Reload the image with a new timestamp to bypass cache
                image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
            }
        };
    }
    
    // Download button
    const downloadBtn = document.getElementById('direct-download');
    if (downloadBtn) {
        downloadBtn.onclick = function() {
            const image = document.getElementById('direct-image');
            if (!image) return;
            
            const path = image.getAttribute('data-path');
            if (path) {
                console.log('[ImageViewerFix] Downloading image: ' + path);
                
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
    
    // Analyze button
    const analyzeBtn = document.getElementById('direct-analyze');
    if (analyzeBtn) {
        analyzeBtn.onclick = function() {
            const image = document.getElementById('direct-image');
            if (!image) return;
            
            const path = image.getAttribute('data-path');
            if (path) {
                console.log('[ImageViewerFix] Analyzing image: ' + path);
                
                closeImageViewer();
                
                if (typeof analyzeImage === 'function') {
                    analyzeImage(path);
                } else {
                    window.location.href = `/collections?analyze=${encodeURIComponent(path)}`;
                }
            }
        };
    }
    
    // Zoom in button
    const zoomInBtn = document.getElementById('direct-zoom-in');
    if (zoomInBtn) {
        zoomInBtn.onclick = function() {
            zoomImage('in');
        };
    }
    
    // Zoom out button
    const zoomOutBtn = document.getElementById('direct-zoom-out');
    if (zoomOutBtn) {
        zoomOutBtn.onclick = function() {
            zoomImage('out');
        };
    }
    
    // Rotate left button
    const rotateLeftBtn = document.getElementById('direct-rotate-left');
    if (rotateLeftBtn) {
        rotateLeftBtn.onclick = function() {
            rotateImage('left');
        };
    }
    
    // Rotate right button
    const rotateRightBtn = document.getElementById('direct-rotate-right');
    if (rotateRightBtn) {
        rotateRightBtn.onclick = function() {
            rotateImage('right');
        };
    }
    
    // Keyboard events
    document.addEventListener('keydown', function(e) {
        const viewer = document.getElementById('direct-image-viewer');
        if (viewer && viewer.style.display === 'block') {
            // Escape key to close
            if (e.key === 'Escape') {
                closeImageViewer();
            }
            // Plus key to zoom in
            else if (e.key === '+' || e.key === '=') {
                zoomImage('in');
            }
            // Minus key to zoom out
            else if (e.key === '-' || e.key === '_') {
                zoomImage('out');
            }
            // Left arrow to rotate left
            else if (e.key === 'ArrowLeft') {
                rotateImage('left');
            }
            // Right arrow to rotate right
            else if (e.key === 'ArrowRight') {
                rotateImage('right');
            }
        }
    });
    
    console.log('[ImageViewerFix] Viewer controls set up successfully');
}

// Zoom the image
function zoomImage(direction) {
    console.log('[ImageViewerFix] Zooming image: ' + direction);
    
    const image = document.getElementById('direct-image');
    if (!image) return;
    
    let scale = parseFloat(image.getAttribute('data-scale') || '1');
    
    if (direction === 'in') {
        scale = Math.min(scale * 1.2, 5); // Max zoom 5x
    } else {
        scale = Math.max(scale / 1.2, 0.5); // Min zoom 0.5x
    }
    
    image.setAttribute('data-scale', scale.toString());
    updateImageTransform(image);
}

// Rotate the image
function rotateImage(direction) {
    console.log('[ImageViewerFix] Rotating image: ' + direction);
    
    const image = document.getElementById('direct-image');
    if (!image) return;
    
    let rotation = parseInt(image.getAttribute('data-rotation') || '0');
    
    if (direction === 'left') {
        rotation = (rotation - 90) % 360;
    } else {
        rotation = (rotation + 90) % 360;
    }
    
    image.setAttribute('data-rotation', rotation.toString());
    updateImageTransform(image);
}

// Update the image transform
function updateImageTransform(image) {
    if (!image) return;
    
    const scale = parseFloat(image.getAttribute('data-scale') || '1');
    const rotation = parseInt(image.getAttribute('data-rotation') || '0');
    
    image.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
}

// Override the original functions to use our fixed versions
window.openDirectImageViewer = openImageViewer;
window.closeDirectViewer = closeImageViewer;
window.zoomDirectImage = zoomImage;
window.rotateDirectImage = rotateImage;
