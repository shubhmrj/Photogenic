// /**
//  * Photo Viewer for PhotoGeni
//  * A standalone solution for viewing photos in the collections page
//  */

// // Execute when the DOM is fully loaded
// document.addEventListener('DOMContentLoaded', function() {
//     console.log('[PhotoViewer] Initializing...');
    
//     // Create the viewer if it doesn't exist
//     createViewer();
    
//     // Add click handlers to all images
//     addImageClickHandlers();
    
//     // Set up event listener for when collections are loaded
//     document.addEventListener('DOMContentLoaded', addImageClickHandlers);
//     window.addEventListener('load', addImageClickHandlers);
    
//     // Override the displayCollections function to add click handlers when new collections are loaded
//     if (typeof window.displayCollections === 'function') {
//         const originalDisplayCollections = window.displayCollections;
//         window.displayCollections = function(collections) {
//             // Call the original function first
//             originalDisplayCollections(collections);
            
//             // Then add click handlers
//             setTimeout(addImageClickHandlers, 200);
//         };
//     }
    
//     console.log('[PhotoViewer] Initialization complete');
// });

// // Create the viewer if it doesn't exist
// function createViewer() {
//     console.log('[PhotoViewer] Creating viewer...');
    
//     // Check if the viewer already exists
//     if (document.getElementById('photo-viewer')) {
//         console.log('[PhotoViewer] Viewer already exists');
//         return;
//     }
    
//     // Create the viewer HTML
//     const viewerHtml = `
//         <div id="photo-viewer" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); z-index: 9999; overflow: hidden;">
//             <div id="photo-viewer-close" style="position: absolute; top: 15px; right: 20px; color: white; font-size: 24px; cursor: pointer;"><i class="fas fa-times"></i></div>
//             <div id="photo-viewer-title" style="position: absolute; top: 15px; left: 20px; color: white; font-size: 18px;"></div>
//             <div id="photo-viewer-container" style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;">
//                 <img id="photo-viewer-image" src="" alt="Preview" style="max-height: 90%; max-width: 90%; object-fit: contain; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />
//                 <div id="photo-viewer-loading" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">Loading image...</div>
//                 <div id="photo-viewer-error" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">
//                     <i class="fas fa-exclamation-triangle"></i>
//                     <div>Failed to load image</div>
//                     <button id="photo-viewer-retry" style="background: #4f46e5; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer; border-radius: 4px;">Retry</button>
//                 </div>
//             </div>
//             <div class="photo-viewer-controls" style="position: absolute; bottom: 20px; left: 0; width: 100%; display: flex; justify-content: center; gap: 10px;">
//                 <button id="photo-viewer-download" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
//                     <i class="fas fa-download"></i> Download
//                 </button>
//                 <button id="photo-viewer-analyze" style="background: rgba(0,0,0,0.5); color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
//                     <i class="fas fa-magic"></i> Analyze
//                 </button>
//             </div>
//         </div>
//     `;
    
//     // Append the viewer to the body
//     document.body.insertAdjacentHTML('beforeend', viewerHtml);
    
//     // Set up the viewer events
//     setupViewerEvents();
    
//     console.log('[PhotoViewer] Viewer created');
// }

// // Set up the viewer events
// function setupViewerEvents() {
//     console.log('[PhotoViewer] Setting up viewer events...');
    
//     // Get the viewer elements
//     const viewer = document.getElementById('photo-viewer');
//     const image = document.getElementById('photo-viewer-image');
//     const closeBtn = document.getElementById('photo-viewer-close');
//     const retryBtn = document.getElementById('photo-viewer-retry');
//     const downloadBtn = document.getElementById('photo-viewer-download');
//     const analyzeBtn = document.getElementById('photo-viewer-analyze');
    
//     // Set up the image load event
//     if (image) {
//         image.onload = function() {
//             console.log('[PhotoViewer] Image loaded successfully');
//             const loadingEl = document.getElementById('photo-viewer-loading');
//             if (loadingEl) loadingEl.style.display = 'none';
            
//             const errorEl = document.getElementById('photo-viewer-error');
//             if (errorEl) errorEl.style.display = 'none';
            
//             image.style.display = 'block';
//         };
        
//         image.onerror = function() {
//             console.error('[PhotoViewer] Failed to load image:', image.src);
//             const loadingEl = document.getElementById('photo-viewer-loading');
//             if (loadingEl) loadingEl.style.display = 'none';
            
//             const errorEl = document.getElementById('photo-viewer-error');
//             if (errorEl) errorEl.style.display = 'block';
            
//             image.style.display = 'none';
//         };
//     }
    
//     // Set up the close button
//     if (closeBtn) {
//         closeBtn.onclick = function() {
//             console.log('[PhotoViewer] Close button clicked');
//             closeViewer();
//         };
//     }
    
//     // Set up the retry button
//     if (retryBtn) {
//         retryBtn.onclick = function() {
//             console.log('[PhotoViewer] Retry button clicked');
//             const path = image.getAttribute('data-path');
//             if (path) {
//                 const errorEl = document.getElementById('photo-viewer-error');
//                 if (errorEl) errorEl.style.display = 'none';
                
//                 const loadingEl = document.getElementById('photo-viewer-loading');
//                 if (loadingEl) loadingEl.style.display = 'flex';
                
//                 // Reload the image with a new timestamp to bypass cache
//                 image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
//             }
//         };
//     }
    
//     // Set up the download button
//     if (downloadBtn) {
//         downloadBtn.onclick = function() {
//             console.log('[PhotoViewer] Download button clicked');
//             const path = image.getAttribute('data-path');
//             if (path) {
//                 const downloadUrl = `/api/collections/download?path=${encodeURIComponent(path)}`;
//                 const a = document.createElement('a');
//                 a.href = downloadUrl;
//                 a.download = path.split('/').pop();
//                 document.body.appendChild(a);
//                 a.click();
//                 document.body.removeChild(a);
//             }
//         };
//     }
    
//     // Set up the analyze button
//     if (analyzeBtn) {
//         analyzeBtn.onclick = function() {
//             console.log('[PhotoViewer] Analyze button clicked');
//             const path = image.getAttribute('data-path');
//             if (path) {
//                 closeViewer();
//                 if (typeof analyzeImage === 'function') {
//                     analyzeImage(path);
//                 } else {
//                     window.location.href = `/collections?analyze=${encodeURIComponent(path)}`;
//                 }
//             }
//         };
//     }
    
//     // Set up keyboard events
//     document.addEventListener('keydown', function(e) {
//         if (viewer && viewer.style.display === 'block') {
//             // Escape key to close
//             if (e.key === 'Escape') {
//                 closeViewer();
//             }
//         }
//     });
    
//     console.log('[PhotoViewer] Viewer events set up');
// }

// // Add click handlers to all images
// function addImageClickHandlers() {
//     console.log('[PhotoViewer] Adding image click handlers...');
    
//     // Helper function to check if a file is an image
//     function isImageFile(filename) {
//         if (!filename) return false;
//         const ext = filename.split('.').pop().toLowerCase();
//         return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
//     }
    
//     // Find all collection items
//     const collectionItems = document.querySelectorAll('.collection-item');
//     console.log('[PhotoViewer] Found', collectionItems.length, 'collection items');
    
//     collectionItems.forEach(item => {
//         const itemType = item.getAttribute('data-type');
//         const itemPath = item.getAttribute('data-path');
        
//         if (itemType === 'file') {
//             const itemName = itemPath.split('/').pop();
//             if (isImageFile(itemName)) {
//                 console.log('[PhotoViewer] Adding click handler for image:', itemName);
                
//                 // Fix the collection card click handler
//                 const card = item.querySelector('.collection-card');
//                 if (card) {
//                     card.onclick = function(e) {
//                         // Don't open if clicking on action buttons
//                         if (e.target.closest('.collection-actions')) {
//                             return;
//                         }
                        
//                         console.log('[PhotoViewer] Image clicked:', itemPath);
//                         openViewer(itemPath, itemName);
//                         e.preventDefault();
//                         e.stopPropagation();
//                         return false;
//                     };
//                 }
                
//                 // Fix the preview button click handler
//                 const previewBtn = item.querySelector('.preview-button');
//                 if (previewBtn) {
//                     previewBtn.onclick = function(e) {
//                         console.log('[PhotoViewer] Preview button clicked for:', itemPath);
//                         openViewer(itemPath, itemName);
//                         e.preventDefault();
//                         e.stopPropagation();
//                         return false;
//                     };
//                 }
//             }
//         }
//     });
    
//     console.log('[PhotoViewer] Image click handlers added');
// }

// // Open the viewer
// function openViewer(path, name) {
//     console.log('[PhotoViewer] Opening viewer for:', path);
    
//     // Create the viewer if it doesn't exist
//     createViewer();
    
//     // Get the viewer elements
//     const viewer = document.getElementById('photo-viewer');
//     const image = document.getElementById('photo-viewer-image');
//     const title = document.getElementById('photo-viewer-title');
//     const loadingEl = document.getElementById('photo-viewer-loading');
//     const errorEl = document.getElementById('photo-viewer-error');
    
//     if (!viewer) {
//         console.error('[PhotoViewer] Viewer element not found');
//         return;
//     }
    
//     if (!image) {
//         console.error('[PhotoViewer] Image element not found');
//         return;
//     }
    
//     // Show loading state
//     if (loadingEl) loadingEl.style.display = 'flex';
    
//     // Hide error state
//     if (errorEl) errorEl.style.display = 'none';
    
//     // Initially hide the image until it loads
//     image.style.display = 'none';
    
//     // Set image data
//     image.setAttribute('data-path', path);
//     image.src = `/api/collections/file/${encodeURIComponent(path)}?t=${Date.now()}`;
    
//     // Set title
//     if (title) title.textContent = name || path.split('/').pop();
    
//     // Show viewer
//     viewer.style.display = 'block';
    
//     // Prevent body scrolling
//     document.body.style.overflow = 'hidden';
    
//     console.log('[PhotoViewer] Viewer opened');
// }

// // Close the viewer
// function closeViewer() {
//     console.log('[PhotoViewer] Closing viewer');
    
//     // Get the viewer element
//     const viewer = document.getElementById('photo-viewer');
    
//     if (!viewer) {
//         console.error('[PhotoViewer] Viewer element not found');
//         return;
//     }
    
//     // Hide viewer
//     viewer.style.display = 'none';
    
//     // Restore body scrolling
//     document.body.style.overflow = '';
    
//     // Clear image src to stop any ongoing loads
//     const image = document.getElementById('photo-viewer-image');
//     if (image) {
//         image.src = '';
//     }
    
//     console.log('[PhotoViewer] Viewer closed');
// }

// // Make functions available globally
// window.openViewer = openViewer;
// window.closeViewer = closeViewer;

// // Override the existing functions to use our viewer
// window.openDirectImageViewer = function(path, name) {
//     openViewer(path, name);
// };

// window.closeDirectViewer = function() {
//     closeViewer();
// };
