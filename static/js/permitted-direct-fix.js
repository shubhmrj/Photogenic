// // Direct fix for the Permitted button functionality
// // This script bypasses all other event handlers and directly implements the functionality

// document.addEventListener('DOMContentLoaded', function() {
//     console.log('PERMITTED FIX: Script loaded');
    
//     // Direct fix implementation
//     function fixPermittedButton() {
//         console.log('PERMITTED FIX: Attempting to fix permitted button');
        
//         // Find all links with "Permitted" text
//         document.querySelectorAll('a').forEach(link => {
//             if (link.textContent.trim() === 'Permitted') {
//                 console.log('PERMITTED FIX: Found permitted link in sidebar');
                
//                 // Remove existing event listeners by cloning
//                 const newLink = link.cloneNode(true);
//                 link.parentNode.replaceChild(newLink, link);
                
//                 // Add our direct event handler
//                 newLink.addEventListener('click', function(e) {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     console.log('PERMITTED FIX: Permitted button clicked');
                    
//                     // Show loading state in the grid
//                     const collectionsGrid = document.querySelector('.collections-grid');
//                     if (collectionsGrid) {
//                         collectionsGrid.innerHTML = `
//                             <div style="text-align: center; padding: 20px;">
//                                 <div style="font-size: 24px; margin-bottom: 10px;">
//                                     <i class="fas fa-spinner fa-spin"></i>
//                                 </div>
//                                 <div>Loading shared files...</div>
//                             </div>
//                         `;
//                     }
                    
//                     // Call our API endpoint
//                     console.log('PERMITTED FIX: Calling API');
//                     fetchSharedFiles();
//                 });
                
//                 console.log('PERMITTED FIX: Added click event handler');
//             }
//         });
        
//         // Also fix the category button
//         document.querySelectorAll('.category-btn').forEach(btn => {
//             if (btn.getAttribute('data-category') === 'permitted') {
//                 console.log('PERMITTED FIX: Found permitted category button');
                
//                 // Remove existing event listeners
//                 const newBtn = btn.cloneNode(true);
//                 btn.parentNode.replaceChild(newBtn, btn);
                
//                 // Add our direct event handler
//                 newBtn.addEventListener('click', function(e) {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     console.log('PERMITTED FIX: Permitted category button clicked');
                    
//                     // Update active state
//                     document.querySelectorAll('.category-btn').forEach(b => {
//                         b.classList.remove('active');
//                     });
//                     newBtn.classList.add('active');
                    
//                     // Show loading state
//                     const collectionsGrid = document.querySelector('.collections-grid');
//                     if (collectionsGrid) {
//                         collectionsGrid.innerHTML = `
//                             <div style="text-align: center; padding: 20px;">
//                                 <div style="font-size: 24px; margin-bottom: 10px;">
//                                     <i class="fas fa-spinner fa-spin"></i>
//                                 </div>
//                                 <div>Loading shared files...</div>
//                             </div>
//                         `;
//                     }
                    
//                     // Call our API endpoint
//                     console.log('PERMITTED FIX: Calling API from category button');
//                     fetchSharedFiles();
//                 });
                
//                 console.log('PERMITTED FIX: Added click event handler to category button');
//             }
//         });
//     }
    
//     // Function to fetch shared files
//     function fetchSharedFiles() {
//         // Try multiple endpoints to ensure one works
//         const endpoints = [
//             '/api/collections/shared',
//             '/api/collections/list/permitted'
//         ];
        
//         let successfulFetch = false;
        
//         // Try each endpoint sequentially
//         tryNextEndpoint(0);
        
//         function tryNextEndpoint(index) {
//             if (index >= endpoints.length) {
//                 console.error('PERMITTED FIX: All endpoints failed');
//                 showError('Failed to load shared files');
//                 return;
//             }
            
//             const endpoint = endpoints[index];
//             console.log(`PERMITTED FIX: Trying endpoint ${endpoint}`);
            
//             fetch(endpoint)
//                 .then(response => {
//                     if (!response.ok) {
//                         console.log(`PERMITTED FIX: Endpoint ${endpoint} returned ${response.status}`);
//                         throw new Error(`Server returned ${response.status}`);
//                     }
//                     return response.json();
//                 })
//                 .then(data => {
//                     console.log(`PERMITTED FIX: Got data from ${endpoint}`, data);
//                     successfulFetch = true;
                    
//                     // Process and display the data
//                     processSharedData(data);
//                 })
//                 .catch(error => {
//                     console.error(`PERMITTED FIX: Error with ${endpoint}:`, error);
                    
//                     // Try next endpoint if this one failed
//                     if (!successfulFetch) {
//                         tryNextEndpoint(index + 1);
//                     }
//                 });
//         }
//     }
    
//     // Function to process and display shared data
//     function processSharedData(data) {
//         console.log('PERMITTED FIX: Processing shared data');
        
//         // Update breadcrumb
//         const breadcrumb = document.querySelector('.breadcrumb');
//         if (breadcrumb) {
//             breadcrumb.innerHTML = `
//                 <div class="breadcrumb-item">
//                     <a href="#" data-path="">Home</a>
//                 </div>
//                 <div class="breadcrumb-separator">/</div>
//                 <div class="breadcrumb-item active">
//                     Permitted Files
//                 </div>
//             `;
//         }
        
//         // Get items from appropriate property
//         let items = [];
//         if (data.items) {
//             items = data.items;
//         } else if (data.collections) {
//             items = data.collections;
//         }
        
//         console.log(`PERMITTED FIX: Found ${items.length} items to display`);
        
//         // Update collections grid
//         const collectionsGrid = document.querySelector('.collections-grid');
//         if (!collectionsGrid) {
//             console.error('PERMITTED FIX: Collections grid not found');
//             return;
//         }
        
//         if (items.length === 0) {
//             collectionsGrid.innerHTML = `
//                 <div style="text-align: center; padding: 50px 20px;">
//                     <div style="font-size: 48px; margin-bottom: 20px; color: #ccc;">
//                         <i class="fas fa-folder-open"></i>
//                     </div>
//                     <div style="font-size: 18px; color: #666;">No shared files found</div>
//                     <div style="font-size: 14px; color: #999; margin-top: 10px;">
//                         When other users share files with you, they will appear here.
//                     </div>
//                 </div>
//             `;
//             return;
//         }
        
//         // Create grid items for each shared file
//         const html = items.map(item => {
//             // Determine icon based on file type
//             let icon = 'fa-file';
//             if (item.isDir || item.type === 'folder') {
//                 icon = 'fa-folder';
//             } else if (item.isImage) {
//                 icon = 'fa-image';
//             }
            
//             // Create HTML for each item
//             return `
//                 <div class="collection-item" data-path="${item.path}" data-type="${item.type || 'file'}">
//                     <div class="item-icon">
//                         <i class="fas ${icon}"></i>
//                     </div>
//                     <div class="item-name">${item.name}</div>
//                     <div class="item-details">
//                         <div class="item-size">${formatFileSize(item.size || 0)}</div>
//                         <div class="item-date">${formatDate(item.modifiedTime)}</div>
//                     </div>
//                     <div class="item-shared-by">
//                         <span class="shared-by-label">Shared by:</span>
//                         <span class="shared-by-name">${item.shared_by || 'Unknown'}</span>
//                     </div>
//                 </div>
//             `;
//         }).join('');
        
//         collectionsGrid.innerHTML = html;
        
//         // Add event listeners to the new items
//         if (typeof initializeCollectionItems === 'function') {
//             initializeCollectionItems();
//         }
        
//         console.log('PERMITTED FIX: Shared files displayed successfully');
//     }
    
//     // Helper function to format file size
//     function formatFileSize(bytes) {
//         if (bytes === 0) return '0 bytes';
        
//         const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
//         const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
//         return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
//     }
    
//     // Helper function to format date
//     function formatDate(dateString) {
//         if (!dateString) return 'Unknown date';
        
//         const date = new Date(dateString);
//         return date.toLocaleDateString();
//     }
    
//     // Helper function to show error
//     function showError(message) {
//         const collectionsGrid = document.querySelector('.collections-grid');
//         if (collectionsGrid) {
//             collectionsGrid.innerHTML = `
//                 <div style="text-align: center; padding: 50px 20px;">
//                     <div style="font-size: 48px; margin-bottom: 20px; color: #f44336;">
//                         <i class="fas fa-exclamation-triangle"></i>
//                     </div>
//                     <div style="font-size: 18px; color: #666;">${message}</div>
//                 </div>
//             `;
//         }
//     }
    
//     // Apply our fix
//     fixPermittedButton();
    
//     // Also apply after a delay in case the DOM is manipulated by other scripts
//     setTimeout(fixPermittedButton, 1000);
// });

// // Execute immediately to catch DOM events even before DOMContentLoaded
// (function() {
//     console.log('PERMITTED FIX: Immediate execution');
    
//     // Monitor all click events to catch permitted button clicks
//     document.addEventListener('click', function(e) {
//         // Check if it's the permitted link or button
//         const target = e.target.closest('a, button');
//         if (target) {
//             const text = target.textContent.trim();
//             if (text === 'Permitted' || (target.classList.contains('category-btn') && target.getAttribute('data-category') === 'permitted')) {
//                 console.log('PERMITTED FIX: Intercepted click on permitted button');
                
//                 // We'll still let the event propagate, but log it
//                 console.log('Click target:', target);
//             }
//         }
//     }, true); // Use capture phase to intercept before other handlers
// })();
