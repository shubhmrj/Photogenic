// class CollectionsManager {
//     constructor() {
//         this.currentCategory = 'all';
//         this.initializeEventListeners();
//     }

//     async initializeEventListeners() {
//         // Category button clicks
//         document.querySelectorAll('.category-btn').forEach(btn => {
//             btn.addEventListener('click', () => {
//                 this.switchCategory(btn.dataset.category);
//             });
//         });

//         // Initial load
//         await this.loadCollections();
//     }

//     async switchCategory(category) {
//         // Update active button
//         document.querySelectorAll('.category-btn').forEach(btn => {
//             btn.classList.toggle('active', btn.dataset.category === category);
//         });

//         this.currentCategory = category;
//         await this.loadCollections();
//     }

//     async loadCollections(path = '') {
//         this.showLoading();
//         try {
//             let response;
//             if (this.currentCategory === 'all') {
//                 response = await fetch(`/api/collections/list?path=${encodeURIComponent(path)}`);
//             } else {
//                 response = await fetch(`/api/collections/list/${this.currentCategory}`);
//             }

//             const data = await response.json();
//             if (!data.success) throw new Error(data.error || 'Failed to load collections');

//             this.displayCollections(data.items);
//             this.updateBreadcrumb(path);
//             this.hideLoading();
//         } catch (error) {
//             console.error('Error loading collections:', error);
//             this.hideLoading();
//             this.showError('Failed to load collections');
//         }
//     }

//     displayCollections(items) {
//         const container = document.getElementById('items-container');
//         const template = document.getElementById('item-template');
//         container.innerHTML = '';

//         items.forEach(item => {
//             const clone = template.content.cloneNode(true);
//             const gridItem = clone.querySelector('.grid-item');
//             const img = clone.querySelector('img');
//             const itemName = clone.querySelector('.item-name');
//             const favoriteBtn = clone.querySelector('.favorite-btn');
//             const trashBtn = clone.querySelector('.trash-btn');

//             if (item.type === 'file' && item.isImage) {
//                 const thumbParams = [`t=${Date.now()}`];
//                 if (item.owner_id) thumbParams.unshift(`owner_id=${item.owner_id}`);
//                 img.src = `/api/collections/thumbnail/${encodeURIComponent(item.path)}?${thumbParams.join('&')}`;
//                 img.alt = item.name;
//                 itemName.textContent = item.name;
                
//                 gridItem.dataset.path = item.path;
//                 if (item.owner_id) gridItem.dataset.ownerId = item.owner_id;
//                 gridItem.dataset.type = 'file';

//                 // Setup favorite button
//                 if (item.is_favorite) {
//                     favoriteBtn.classList.add('active');
//                     favoriteBtn.querySelector('i').classList.replace('far', 'fas');
//                 }
//                 favoriteBtn.addEventListener('click', (e) => {
//                     e.stopPropagation();
//                     this.toggleFavorite(item.path, favoriteBtn);
//                 });

//                 // Setup trash button
//                 trashBtn.addEventListener('click', (e) => {
//                     e.stopPropagation();
//                     this.moveToTrash(item.path, gridItem);
//                 });

//                 // Image viewer
//                 gridItem.addEventListener('click', () => this.openImageViewer(item));
//             }

//             container.appendChild(clone);
//         });
//     }

//     async toggleFavorite(path, btn) {
//         try {
//             const response = await fetch('/api/collections/favorite', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ path })
//             });

//             const data = await response.json();
//             if (data.success) {
//                 btn.classList.toggle('active');
//                 const icon = btn.querySelector('i');
//                 icon.classList.toggle('far');
//                 icon.classList.toggle('fas');
//             }
//         } catch (error) {
//             console.error('Error toggling favorite:', error);
//             this.showError('Failed to update favorite');
//         }
//     }

//     async moveToTrash(path, gridItem) {
//         if (!confirm('Are you sure you want to move this item to trash?')) return;

//         try {
//             const response = await fetch('/api/collections/trash', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ path })
//             });

//             const data = await response.json();
//             if (data.success) {
//                 gridItem.remove();
//             }
//         } catch (error) {
//             console.error('Error moving to trash:', error);
//             this.showError('Failed to move item to trash');
//         }
//     }

//     openImageViewer(item) {
//         const viewer = document.createElement('div');
//         viewer.className = 'image-viewer';
//         viewer.innerHTML = `
//             <div class="viewer-content">
//                 <img src="/api/collections/file/${encodeURIComponent(item.path)}" alt="${item.name}">
//                 <div class="viewer-info">
//                     <h3>${item.name}</h3>
//                     <button class="close-viewer">Close</button>
//                 </div>
//             </div>
//         `;
        
//         document.body.appendChild(viewer);
        
//         viewer.querySelector('.close-viewer').onclick = () => viewer.remove();
//         viewer.onclick = (e) => {
//             if (e.target === viewer) viewer.remove();
//         };
//     }

//     showLoading() {
//         // Add loading indicator
//         const loading = document.createElement('div');
//         loading.className = 'loading-overlay';
//         loading.innerHTML = '<div class="spinner"></div>';
//         document.body.appendChild(loading);
//     }

//     hideLoading() {
//         const loading = document.querySelector('.loading-overlay');
//         if (loading) loading.remove();
//     }

//     showError(message) {
//         alert(message);
//     }

//     updateBreadcrumb(path) {
//         const parts = path.split('/').filter(Boolean);
//         const breadcrumb = document.querySelector('.breadcrumb');
//         if (!breadcrumb) return;

//         breadcrumb.innerHTML = `
//             <a href="#" data-path="">Home</a>
//             ${parts.map((part, index) => `
//                 <span>/</span>
//                 <a href="#" data-path="${parts.slice(0, index + 1).join('/')}">${part}</a>
//             `).join('')}
//         `;

//         // Add click handlers
//         breadcrumb.querySelectorAll('a').forEach(link => {
//             link.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 this.loadCollections(link.dataset.path);
//             });
//         });
//     }
// }

// // Initialize the collections manager
// document.addEventListener('DOMContentLoaded', () => {
//     window.collectionsManager = new CollectionsManager();
// });
