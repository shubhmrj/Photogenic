// /**
//  * Pure Lightbox - A minimal, lightweight image viewer with no dependencies
//  */
// class PureLightbox {
//     constructor() {
//         this.init();
//     }
    
//     init() {
//         // Create lightbox HTML
//         this.createLightbox();
        
//         // Add event listeners
//         this.bindEvents();
        
//         // Find all image elements
//         this.setupImageLinks();
//     }
    
//     createLightbox() {
//         // Remove any existing lightbox
//         const existingLightbox = document.getElementById('pure-lightbox');
//         if (existingLightbox) {
//             existingLightbox.remove();
//         }
        
//         // Create lightbox elements
//         const lightbox = document.createElement('div');
//         lightbox.id = 'pure-lightbox';
//         lightbox.className = 'pure-lightbox';
        
//         // Create lightbox content
//         lightbox.innerHTML = `
//             <button class="pure-lightbox-close">&times;</button>
//             <div class="pure-lightbox-title"></div>
//             <div class="pure-lightbox-content">
//                 <img class="pure-lightbox-image" src="" alt="Image Preview">
//             </div>
//             <div class="pure-lightbox-controls">
//                 <button class="pure-lightbox-button" id="pure-lightbox-download">Download</button>
//                 <button class="pure-lightbox-button" id="pure-lightbox-analyze">Analyze with AI</button>
//             </div>
//         `;
        
//         // Add to document
//         document.body.appendChild(lightbox);
        
//         // Store references to elements
//         this.lightbox = lightbox;
//         this.image = lightbox.querySelector('.pure-lightbox-image');
//         this.title = lightbox.querySelector('.pure-lightbox-title');
//         this.closeBtn = lightbox.querySelector('.pure-lightbox-close');
//         this.downloadBtn = lightbox.querySelector('#pure-lightbox-download');
//         this.analyzeBtn = lightbox.querySelector('#pure-lightbox-analyze');
//     }
    
//     bindEvents() {
//         // Close button click
//         this.closeBtn.addEventListener('click', () => this.close());
        
//         // ESC key to close
//         document.addEventListener('keydown', (e) => {
//             if (e.key === 'Escape' && this.lightbox.classList.contains('active')) {
//                 this.close();
//             }
//         });
        
//         // Download button click
//         this.downloadBtn.addEventListener('click', () => {
//             if (this.currentPath) {
//                 const a = document.createElement('a');
//                 a.href = this.image.src;
//                 a.download = this.currentPath.split('/').pop();
//                 document.body.appendChild(a);
//                 a.click();
//                 document.body.removeChild(a);
//             }
//         });
        
//         // Analyze button click
//         this.analyzeBtn.addEventListener('click', () => {
//             if (this.currentPath && typeof window.analyzeImage === 'function') {
//                 window.analyzeImage(this.currentPath);
//             }
//         });
//     }
    
//     setupImageLinks() {
//         // Find all collection items that can be clicked to open an image
//         const collectionItems = document.querySelectorAll('.collection-item[data-type="file"]');
        
//         collectionItems.forEach(item => {
//             item.addEventListener('click', (e) => {
//                 // Only handle click if it's not from a context menu or action button
//                 if (!e.target.closest('.collection-actions') && !e.target.closest('.context-menu')) {
//                     const path = item.getAttribute('data-path');
//                     const name = item.querySelector('.collection-name')?.textContent || 'Image';
                    
//                     if (path && path.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
//                         e.preventDefault();
//                         this.open(path, name);
//                     }
//                 }
//             });
//         });
//     }
    
//     open(path, title) {
//         // Store current path
//         this.currentPath = path;
        
//         // Set title
//         this.title.textContent = title || path.split('/').pop();
        
//         // Create URL with timestamp to prevent caching
//         const encodedPath = encodeURIComponent(path);
//         const imageUrl = `/api/collections/file/${encodedPath}?t=${Date.now()}`;
        
//         // Preload image
//         const preloader = new Image();
//         preloader.onload = () => {
//             // Set image source
//             this.image.src = imageUrl;
            
//             // Show lightbox
//             this.lightbox.classList.add('active');
//             document.body.style.overflow = 'hidden'; // Prevent scrolling
//         };
        
//         // Start loading image
//         preloader.src = imageUrl;
//     }
    
//     close() {
//         // Hide lightbox
//         this.lightbox.classList.remove('active');
//         document.body.style.overflow = ''; // Restore scrolling
        
//         // Clear image source after transition
//         setTimeout(() => {
//             this.image.src = '';
//             this.currentPath = null;
//         }, 300);
//     }
// }

// // Initialize lightbox when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//     // Add CSS link to head
//     const link = document.createElement('link');
//     link.rel = 'stylesheet';
//     link.href = '/static/css/pure-lightbox.css';
//     document.head.appendChild(link);
    
//     // Initialize lightbox
//     window.pureLightbox = new PureLightbox();
// });
