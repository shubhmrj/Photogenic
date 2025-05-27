/**
 * Direct Image Viewer for PhotoGeni
 * This script provides a direct image viewing experience without page navigation
 */

// Initialize the direct image viewer when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    debugLog('ImageViewer', 'DOM content loaded, initializing direct image viewer');
    initializeDirectImageViewer();
});

// Function to initialize the direct image viewer
function initializeDirectImageViewer() {
    debugLog('ImageViewer', 'Initializing direct image viewer...');
    
    // Get elements
    const viewer = checkElement('#direct-image-viewer', 'Image Viewer Container');
    const image = checkElement('#direct-image', 'Image Element');
    const title = checkElement('#direct-title', 'Title Element');
    const closeBtn = checkElement('#direct-close', 'Close Button');
    const downloadBtn = checkElement('#direct-download', 'Download Button');
    const analyzeBtn = checkElement('#direct-analyze', 'Analyze Button');
    const zoomInBtn = checkElement('#direct-zoom-in', 'Zoom In Button');
    const zoomOutBtn = checkElement('#direct-zoom-out', 'Zoom Out Button');
    const rotateLeftBtn = checkElement('#direct-rotate-left', 'Rotate Left Button');
    const rotateRightBtn = checkElement('#direct-rotate-right', 'Rotate Right Button');
    
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
    addDebugEventListener(image, 'load', function() {
        hideLoadingState();
        hideErrorState();
        image.style.display = 'block';
    }, 'Image Load Event');
    
    addDebugEventListener(image, 'error', function() {
        hideLoadingState();
        showErrorState();
        image.style.display = 'none';
        debugError('ImageViewer', 'Failed to load image: ' + image.src);
    }, 'Image Error Event');
    
    // Retry button event
    const retryBtn = checkElement('#direct-retry', 'Retry Button');
    if (retryBtn) {
        addDebugEventListener(retryBtn, 'click', function() {
            const path = image.getAttribute('data-path');
            if (path) {
                debugLog('ImageViewer', 'Retrying image load for: ' + path);
                hideErrorState();
                showLoadingState();
                // Reload the image with a new timestamp to bypass cache
                image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
            }
        }, 'Retry Button Click');
    }
    
    // Close button event
    if (closeBtn) {
        addDebugEventListener(closeBtn, 'click', function() {
            closeDirectViewer();
        }, 'Close Button Click');
    } else {
        debugError('ImageViewer', 'Close button not found for direct image viewer');
    }
    
    // Download button event
    if (downloadBtn) {
        addDebugEventListener(downloadBtn, 'click', function() {
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
        }, 'Download Button Click');
    }
    
    // Analyze button event
    if (analyzeBtn) {
        addDebugEventListener(analyzeBtn, 'click', function() {
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
        }, 'Analyze Button Click');
    }
    
    // Zoom in button event
    if (zoomInBtn) {
        addDebugEventListener(zoomInBtn, 'click', function() {
            zoomDirectImage('in');
        }, 'Zoom In Button Click');
    }
    
    // Zoom out button event
    if (zoomOutBtn) {
        addDebugEventListener(zoomOutBtn, 'click', function() {
            zoomDirectImage('out');
        }, 'Zoom Out Button Click');
    }
    
    // Rotate left button event
    if (rotateLeftBtn) {
        addDebugEventListener(rotateLeftBtn, 'click', function() {
            rotateDirectImage('left');
        }, 'Rotate Left Button Click');
    }
    
    // Rotate right button event
    if (rotateRightBtn) {
        addDebugEventListener(rotateRightBtn, 'click', function() {
            rotateDirectImage('right');
        }, 'Rotate Right Button Click');
    }
    
    // Keyboard events
    addDebugEventListener(document, 'keydown', function(e) {
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
    }, 'Keyboard Events');
    
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
function openDirectImageViewer(path, name) {
    try {
        debugLog('ImageViewer', 'Opening direct image viewer for: ' + path);
        
        // Re-initialize the viewer to ensure all elements are properly set up
        initializeDirectImageViewer();
        
        const viewer = checkElement('#direct-image-viewer', 'Image Viewer Container');
        const image = checkElement('#direct-image', 'Image Element');
        const title = checkElement('#direct-title', 'Title Element');
        
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
}

// Close the direct image viewer
function closeDirectViewer() {
    try {
        debugLog('ImageViewer', 'Closing direct image viewer');
        
        const viewer = checkElement('#direct-image-viewer', 'Image Viewer Container');
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
}

// Function to zoom in the image
function zoomDirectImage(direction) {
    try {
        const image = checkElement('#direct-image', 'Image Element');
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
}

// Function to rotate the image
function rotateDirectImage(direction) {
    try {
        const image = checkElement('#direct-image', 'Image Element');
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
}

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

// Helper function to check if an element exists
function checkElement(selector, name) {
    const element = document.querySelector(selector);
    if (!element) {
        debugError('ImageViewer', `Element not found: ${name}`);
    }
    return element;
}

// Helper function to add event listeners with debug logging
function addDebugEventListener(element, event, callback, eventName) {
    if (element) {
        element.addEventListener(event, callback);
        debugLog('ImageViewer', `Added event listener for ${eventName}`);
    } else {
        debugError('ImageViewer', `Cannot add event listener for ${eventName}: element not found`);
    }
}

// Helper function to log debug messages
function debugLog(category, message) {
    if (window.debugLog) {
        window.debugLog(category, message);
    } else {
        console.log(`[${category}] ${message}`);
    }
}

// Helper function to log debug errors
function debugError(category, message, error) {
    if (window.debugError) {
        window.debugError(category, message, error);
    } else {
        console.error(`[${category}] ${message}`, error);
    }
}
