// // static/js/collections-fix.js (Superceded by permitted-super-fix.js logic)
// (function() {
//     const SCRIPT_VERSION = 'v1.2-' + new Date().toISOString().slice(0,19).replace('T',' ');
//     console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Script executing.`);

//     function visualCue(element, message) {
//         if (!element) return;
//         const originalBorderStyle = element.style.border;
//         const originalOutline = element.style.outline;
//         element.style.border = '2px solid gold';
//         element.style.outline = '2px solid orange';
//         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): ${message} Visual cue on element:`, element);
//         setTimeout(() => {
//             element.style.border = originalBorderStyle;
//             element.style.outline = originalOutline;
//         }, 1000);
//     }

//     function fixPermittedButton() {
//         try {
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): fixPermittedButton() called. Current window.currentPath:`, typeof window.currentPath !== 'undefined' ? window.currentPath : 'undefined');
//             let fixAppliedToSidebar = false;
//             let fixAppliedToCategoryBtn = false;

//             const sidebarLinks = document.querySelectorAll('.sidebar-item a, a.sidebar-item');
//             sidebarLinks.forEach(link => {
//                 if (link.textContent.trim().toLowerCase() === 'permitted') {
//                     console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Found 'Permitted' sidebar link.`);
//                     visualCue(link, "Sidebar 'Permitted' link found.");
//                     const newLink = link.cloneNode(true);
//                     link.parentNode.replaceChild(newLink, link);
//                     newLink.addEventListener('click', function(e) {
//                         e.preventDefault(); e.stopPropagation();
//                         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): 'Permitted' sidebar link clicked.`);
//                         document.querySelectorAll('.sidebar-item, .sidebar-item a').forEach(i => i.classList.remove('active'));
//                         newLink.classList.add('active');
//                         if (newLink.closest('.sidebar-item')) newLink.closest('.sidebar-item').classList.add('active');
//                         const collectionsGrid = document.querySelector('.collections-grid');
//                         if (collectionsGrid) {
//                             collectionsGrid.innerHTML = `<div style=\"text-align: center; padding: 20px; color: #ccc;\"><i class=\"fas fa-spinner fa-spin fa-2x\"></i><p>Loading Permitted Files...</p></div>`;
//                         }
//                         fetchSharedFiles();
//                     });
//                     fixAppliedToSidebar = true;
//                     console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Click handler ADDED to 'Permitted' sidebar link.`);
//                 }
//             });
//             if (!fixAppliedToSidebar) console.warn(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): 'Permitted' sidebar link NOT found or fix not applied.`);

//             const categoryButtons = document.querySelectorAll('button.category-btn');
//             categoryButtons.forEach(btn => {
//                 if (btn.getAttribute('data-category') && btn.getAttribute('data-category').toLowerCase() === 'permitted') {
//                     console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Found 'Permitted' category button.`);
//                     visualCue(btn, "Category 'Permitted' button found.");
//                     const newBtn = btn.cloneNode(true);
//                     btn.parentNode.replaceChild(newBtn, btn);
//                     newBtn.addEventListener('click', function(e) {
//                         e.preventDefault(); e.stopPropagation();
//                         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): 'Permitted' category button clicked.`);
//                         document.querySelectorAll('button.category-btn').forEach(b => b.classList.remove('active'));
//                         newBtn.classList.add('active');
//                         const collectionsGrid = document.querySelector('.collections-grid');
//                         if (collectionsGrid) {
//                              collectionsGrid.innerHTML = `<div style=\"text-align: center; padding: 20px; color: #ccc;\"><i class=\"fas fa-spinner fa-spin fa-2x\"></i><p>Loading Permitted Files...</p></div>`;
//                         }
//                         fetchSharedFiles();
//                     });
//                     fixAppliedToCategoryBtn = true;
//                     console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Click handler ADDED to 'Permitted' category button.`);
//                 }
//             });
//             if (!fixAppliedToCategoryBtn) console.warn(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): 'Permitted' category button NOT found or fix not applied.`);

//         } catch (error) {
//             console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Error in fixPermittedButton():`, error);
//         }
//     }

//     function fetchSharedFiles() {
//         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): fetchSharedFiles() called. currentPath:`, typeof window.currentPath !== 'undefined' ? window.currentPath : 'undefined');
//         const endpoints = ['/api/collections/shared', '/api/collections/list/permitted'];
//         let successfulFetch = false;

//         function tryNextEndpoint(index) {
//             if (index >= endpoints.length) {
//                 if (!successfulFetch) {
//                      console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): All API endpoints failed.`);
//                     showErrorInGrid('Failed to load shared files from all API endpoints.');
//                 }
//                 return;
//             }
//             const endpoint = endpoints[index];
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Trying API endpoint: ${endpoint}`);
//             fetch(endpoint)
//                 .then(response => {
//                     console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Response from ${endpoint}, status: ${response.status}`);
//                     if (!response.ok) {
//                         return response.text().then(text => {
//                             console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): API Error from ${endpoint}: ${response.status} - ${text}`);
//                             throw new Error(`Server error ${response.status}: ${text}`);
//                         });
//                     }
//                     return response.json();
//                 })
//                 .then(data => {
//                     console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Data received from ${endpoint}:`, data);
//                     if (data.success === false) {
//                         console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): API call to ${endpoint} reported failure:`, data.error);
//                         throw new Error(data.error || `API reported failure from ${endpoint}`);
//                     }
//                     successfulFetch = true;
//                     processSharedData(data);
//                 })
//                 .catch(error => {
//                     console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Catch block for ${endpoint}:`, error.message);
//                     tryNextEndpoint(index + 1);
//                 });
//         }
//         tryNextEndpoint(0);
//     }

//     function processSharedData(data) {
//         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): processSharedData() called. typeof window.displayCollections:`, typeof window.displayCollections, data);
//         const breadcrumb = document.querySelector('.breadcrumb');
//         if (breadcrumb) {
//             breadcrumb.innerHTML = `
//                 <div class=\"breadcrumb-item\"><a href=\"#\" onclick=\"window.currentPath=''; if(typeof window.loadCollections === 'function'){window.loadCollections();} else {console.error('loadCollections not found')}; return false;\">Home</a></div>
//                 <div class=\"breadcrumb-separator\">/</div>
//                 <div class=\"breadcrumb-item active\">Permitted Files</div>`;
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Breadcrumb updated.`);
//         } else {
//             console.warn(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Breadcrumb container not found.`);
//         }

//         let items = data.items || data.collections || [];
//         if (!Array.isArray(items)) {
//             console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Items data is not an array:`, items);
//             items = [];
//         }
//         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Found ${items.length} items to display.`);

//         const collectionsGrid = document.querySelector('.collections-grid');
//         if (!collectionsGrid) {
//             console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Collections grid container not found.`);
//             return;
//         }

//         if (items.length === 0) {
//             collectionsGrid.innerHTML = `
//                 <div style=\"text-align: center; padding: 50px 20px; color: #777;\">
//                     <i class=\"fas fa-folder-open fa-3x\" style=\"margin-bottom: 20px; color: #aaa;\"></i>
//                     <p style=\"font-size: 1.2em;\">No shared files found.</p>
//                     <p style=\"font-size: 0.9em;\">When other users share files with you, they will appear here.</p>
//                 </div>`;
//             return;
//         }

//         if (typeof window.displayCollections === 'function') {
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Using window.displayCollections to render items.`);
//             window.displayCollections(items);
//         } else {
//             console.warn(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): window.displayCollections not found. Using basic rendering.`);
//             const html = items.map(item => {
//                 let icon = 'fa-file';
//                 if (item.isDir || item.type === 'folder') icon = 'fa-folder';
//                 else if (item.isImage) icon = 'fa-image';
//                 return `
//                     <div class=\"collection-item\" data-path=\"${item.path || ''}\" data-type=\"${item.type || 'file'}\">
//                         <div class=\"item-icon\"><i class=\"fas ${icon}\"></i></div>
//                         <div class=\"item-name\">${item.name || 'Unnamed'}</div>
//                         <div class=\"item-details\"><div class=\"item-size\">${formatFileSize(item.size || 0)}</div><div class=\"item-date\">${formatDate(item.modifiedTime)}</div></div>
//                         <div class=\"item-shared-by\" style=\"font-size:0.8em; color:#888; margin-top:5px;\">
//                            Shared by: ${item.shared_by || 'Unknown'}
//                         </div>
//                     </div>`;
//             }).join('');
//             collectionsGrid.innerHTML = html;
//         }
        
//         if (typeof window.initializeCollectionItems === 'function') {
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Calling window.initializeCollectionItems.`);
//             window.initializeCollectionItems();
//         } else {
//             console.warn(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): window.initializeCollectionItems not found.`);
//         }
//         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Shared files display updated.`);
//     }

//     function formatFileSize(bytes) {
//         if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 Bytes';
//         const k = 1024;
//         const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//         const i = Math.floor(Math.log(bytes) / Math.log(k));
//         return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//     }

//     function formatDate(dateString) {
//         if (!dateString) return '';
//         try {
//             return new Date(dateString).toLocaleDateString();
//         } catch (e) {
//             return dateString;
//         }
//     }
    
//     function showErrorInGrid(message) {
//         const collectionsGrid = document.querySelector('.collections-grid');
//         if (collectionsGrid) {
//             collectionsGrid.innerHTML = `
//                 <div style=\"text-align: center; padding: 50px 20px; color: #c00;\">
//                     <i class=\"fas fa-exclamation-triangle fa-3x\" style=\"margin-bottom: 20px;\"></i>
//                     <p style=\"font-size: 1.2em;\">Error Loading Permitted Files</p>
//                     <p style=\"font-size: 0.9em;\">${message}</p>
//                 </div>`;
//         }
//         console.error(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): showErrorInGrid: ${message}`);
//     }

//     function robustDomReady(fn) {
//         console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): robustDomReady called for function:`, fn.name);
//         if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): DOM already ready or interactive.`);
//             fn();
//         } else {
//             document.addEventListener('DOMContentLoaded', function() {
//                 console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): DOMContentLoaded event fired.`);
//                 fn();
//             });
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): DOMContentLoaded listener attached.`);
//         }
//         window.addEventListener('load', function() {
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): window.load event fired.`);
//             fn();
//         });
//         setTimeout(function() {
//             console.log(`PERMITTED SUPER FIX (${SCRIPT_VERSION}): Fallback setTimeout executing fn.`);
//             fn();
//         }, 2500);
//     }

//     robustDomReady(fixPermittedButton);

// })();
