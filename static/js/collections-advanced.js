// // Advanced Collections UI/UX JavaScript - PhotoGeni
// // Author: Cascade AI

// (function() {
//     'use strict';
    
//     // Global state
//     let selectedItems = new Set();
//     let currentView = 'grid';
//     let currentSort = 'date-desc';
//     let isSelectionMode = false;
//     let draggedItem = null;
    
//     // Real collections data will be loaded from backend
//     let realCollections = [];
    
//     // Ensure advanced features initialize even if this script loads after DOMContentLoaded
//     function startAdvancedCollections() {
//         initializeAdvancedFeatures();
//         hookIntoExistingSystem();
//     }

//     if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', startAdvancedCollections);
//     } else {
//         // DOM is already ready
//         startAdvancedCollections();
//     }
    
//     function initializeAdvancedFeatures() {
//         initViewToggle();
//         initSortDropdown();
//         initFilterBar();
//         initBulkActions();
//         initContextMenu();
//         initInfoPanel();
//         initDragAndDrop();
//         initKeyboardShortcuts();
//         initToastSystem();
//         initShareModal();
//         initTagModal();
//         initInfiniteScroll();
//     }
    
//     // View Toggle Functionality
//     function initViewToggle() {
//         const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
//         const grid = document.getElementById('collections-grid');
        
//         viewToggleBtns.forEach(btn => {
//             btn.addEventListener('click', () => {
//                 const view = btn.dataset.view;
//                 currentView = view;
                
//                 viewToggleBtns.forEach(b => b.classList.remove('active'));
//                 btn.classList.add('active');
                
//                 grid.setAttribute('data-view', view);
//                 showToast('success', 'View Changed', `Switched to ${view} view`);
//             });
//         });
//     }
    
//     // Sort Dropdown
//     function initSortDropdown() {
//         const sortBtn = document.getElementById('sort-toggle');
//         const sortMenu = document.getElementById('sort-menu');
//         const sortOptions = document.querySelectorAll('.sort-option');
        
//         sortBtn?.addEventListener('click', (e) => {
//             e.stopPropagation();
//             sortBtn.parentElement.classList.toggle('show');
//         });
        
//         sortOptions.forEach(option => {
//             option.addEventListener('click', () => {
//                 const sort = option.dataset.sort;
//                 currentSort = sort;
                
//                 sortOptions.forEach(o => o.classList.remove('active'));
//                 option.classList.add('active');
                
//                 const sortText = option.textContent.trim();
//                 sortBtn.querySelector('span').textContent = sortText;
//                 sortBtn.parentElement.classList.remove('show');
                
//                 sortItems(sort);
//                 showToast('info', 'Sorted', `Items sorted by ${sortText}`);
//             });
//         });
        
//         document.addEventListener('click', () => {
//             sortBtn?.parentElement.classList.remove('show');
//         });
//     }
    
//     // Filter Bar
//     function initFilterBar() {
//         const tagInput = document.getElementById('tag-filter-input');
//         const dateFrom = document.getElementById('date-from');
//         const dateTo = document.getElementById('date-to');
//         const fileType = document.getElementById('file-type-filter');
//         const clearBtn = document.getElementById('filter-clear-btn');
        
//         tagInput?.addEventListener('input', debounce(handleTagFilter, 300));
//         dateFrom?.addEventListener('change', handleDateFilter);
//         dateTo?.addEventListener('change', handleDateFilter);
//         fileType?.addEventListener('change', handleFileTypeFilter);
//         clearBtn?.addEventListener('click', clearAllFilters);
//     }
    
//     function handleTagFilter(e) {
//         const query = e.target.value.toLowerCase();
        
//         // Show tag suggestions
//         const suggestionsContainer = document.getElementById('tag-suggestions');
//         if (query.length > 0) {
//             // Mock tag suggestions - in real app, fetch from backend
//             const mockTags = ['vacation', 'family', 'work', 'nature', 'portrait', 'landscape', 'event'];
//             const filteredTags = mockTags.filter(tag => tag.includes(query));
            
//             if (filteredTags.length > 0) {
//                 suggestionsContainer.innerHTML = filteredTags
//                     .map(tag => `<div class="tag-suggestion" data-tag="${tag}">${tag}</div>`)
//                     .join('');
//                 suggestionsContainer.style.display = 'block';
                
//                 // Add click handlers for suggestions
//                 suggestionsContainer.querySelectorAll('.tag-suggestion').forEach(suggestion => {
//                     suggestion.addEventListener('click', () => {
//                         addFilterChip('tag', suggestion.dataset.tag);
//                         e.target.value = '';
//                         suggestionsContainer.style.display = 'none';
//                         applyFilters();
//                     });
//                 });
//             } else {
//                 suggestionsContainer.style.display = 'none';
//             }
//         } else {
//             suggestionsContainer.style.display = 'none';
//         }
//     }
    
//     function handleDateFilter() {
//         const from = document.getElementById('date-from')?.value;
//         const to = document.getElementById('date-to')?.value;

//         if (from || to) {
//             const dateRange = `${from || 'Any'} - ${to || 'Any'}`;
//             addFilterChip('date', dateRange, { from, to });
//         } else {
//             // If both fields cleared, remove existing date filter chip & state
//             removeFilterChip('date');
//             activeFilters.dateRange = null;
//         }

//         applyFilters();
//     }

    
//     function handleFileTypeFilter(e) {
//         const type = e.target.value;
        
//         if (type !== 'all') {
//             addFilterChip('filetype', type);
//         } else {
//             removeFilterChip('filetype');
//         }
        
//         applyFilters();
//     }
    
//     // Filter chip management
//     let activeFilters = {
//         tags: [],
//         dateRange: null,
//         fileType: 'all'
//     };
    
//     function clearAllFilters() {
//         // Clear all filter inputs
//         const tagInput = document.getElementById('tag-filter-input');
//         const dateFrom = document.getElementById('date-from');
//         const dateTo = document.getElementById('date-to');
//         const fileType = document.getElementById('file-type-filter');
        
//         if (tagInput) tagInput.value = '';
//         if (dateFrom) dateFrom.value = '';
//         if (dateTo) dateTo.value = '';
//         if (fileType) fileType.value = 'all';
        
//         // Clear all filter chips
//         const filterChips = document.getElementById('filter-chips');
//         if (filterChips) filterChips.innerHTML = '';
        
//         // Hide tag suggestions
//         const suggestionsContainer = document.getElementById('tag-suggestions');
//         if (suggestionsContainer) suggestionsContainer.style.display = 'none';
        
//         // Reset active filters
//         activeFilters = {
//             tags: [],
//             dateRange: null,
//             fileType: 'all'
//         };
        
//         // Reapply filters (which will show all items)
//         applyFilters();
        
//         showToast('info', 'Filters Cleared', 'All filters have been removed');
//     }
    
//     function addFilterChip(type, value, data = null) {
//         const filterChips = document.getElementById('filter-chips');
//         if (!filterChips) return;
        
//         // Remove existing chip of same type (except tags)
//         if (type !== 'tag') {
//             removeFilterChip(type);
//         }
        
//         // Update active filters
//         switch (type) {
//             case 'tag':
//                 if (!activeFilters.tags.includes(value)) {
//                     activeFilters.tags.push(value);
//                 }
//                 break;
//             case 'date':
//                 activeFilters.dateRange = data;
//                 break;
//             case 'filetype':
//                 activeFilters.fileType = value;
//                 break;
//         }
        
//         // Create chip element
//         const chip = document.createElement('div');
//         chip.className = 'filter-chip';
//         chip.dataset.type = type;
//         chip.dataset.value = value;
//         chip.innerHTML = `
//             <span>${type === 'tag' ? '#' : ''}${value}</span>
//             <button class="filter-chip-remove" onclick="removeFilterChip('${type}', '${value}')">
//                 <i class="fas fa-times"></i>
//             </button>
//         `;
        
//         filterChips.appendChild(chip);
//     }
    
//     function removeFilterChip(type, value = null) {
//         const filterChips = document.getElementById('filter-chips');
//         if (!filterChips) return;
        
//         // Remove from DOM
//         const chips = filterChips.querySelectorAll(`.filter-chip[data-type="${type}"]`);
//         chips.forEach(chip => {
//             if (!value || chip.dataset.value === value) {
//                 chip.remove();
//             }
//         });
        
//         // Update active filters
//         switch (type) {
//             case 'tag':
//                 if (value) {
//                     activeFilters.tags = activeFilters.tags.filter(tag => tag !== value);
//                 } else {
//                     activeFilters.tags = [];
//                 }
//                 break;
//             case 'date':
//                 activeFilters.dateRange = null;
//                 // Clear date inputs
//                 const dateFrom = document.getElementById('date-from');
//                 const dateTo = document.getElementById('date-to');
//                 if (dateFrom) dateFrom.value = '';
//                 if (dateTo) dateTo.value = '';
//                 break;
//             case 'filetype':
//                 activeFilters.fileType = 'all';
//                 // Reset file type select
//                 const fileType = document.getElementById('file-type-filter');
//                 if (fileType) fileType.value = 'all';
//                 break;
//         }
        
//         applyFilters();
//     }
    
//     // Make removeFilterChip globally accessible
//     window.removeFilterChip = removeFilterChip;
    
//     function applyFilters() {
//         const grid = document.getElementById('collections-grid');
//         if (!grid) return;
        
//         const items = grid.querySelectorAll('.collection-item');
//         let visibleCount = 0;
        
//         items.forEach(item => {
//             let shouldShow = true;
            
//             // Get item data
//             const itemName = item.dataset.name || '';
//             const itemType = item.dataset.type || '';
//             const itemPath = item.dataset.path || '';
            
//             // Apply tag filters
//             if (activeFilters.tags.length > 0) {
//                 const hasMatchingTag = activeFilters.tags.some(tag => 
//                     itemName.toLowerCase().includes(tag.toLowerCase()) ||
//                     itemPath.toLowerCase().includes(tag.toLowerCase())
//                 );
//                 if (!hasMatchingTag) shouldShow = false;
//             }
            
//             // Apply file type filter
//             if (activeFilters.fileType !== 'all') {
//                 const extension = itemName.split('.').pop()?.toLowerCase() || '';
//                 let matchesType = false;
                
//                 switch (activeFilters.fileType) {
//                     case 'image':
//                         matchesType = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension);
//                         break;
//                     case 'video':
//                         matchesType = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension);
//                         break;
//                     case 'document':
//                         matchesType = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension);
//                         break;
//                 }
                
//                 if (!matchesType && itemType !== 'folder') shouldShow = false;
//             }
            
//             // Apply date range filter
//             if (activeFilters.dateRange && (activeFilters.dateRange.from || activeFilters.dateRange.to)) {
//                 // Prefer raw ISO date stored in data attribute for reliable parsing
//                 const itemDateStr = item.dataset.created || item.querySelector('.collection-date')?.textContent;
//                 let itemDateObj = null;
//                 if (itemDateStr) {
//                     itemDateObj = new Date(itemDateStr);
//                 }
//                 if (itemDateObj && !isNaN(itemDateObj)) {

//                     const fromDate = activeFilters.dateRange.from ? new Date(activeFilters.dateRange.from) : null;
//                     const toDate = activeFilters.dateRange.to ? new Date(activeFilters.dateRange.to) : null;
                    
//                     if (fromDate && itemDateObj < fromDate) shouldShow = false;
//                     if (toDate && itemDateObj > toDate) shouldShow = false;
//                 }
//             }
            
//             // Show/hide item
//             if (shouldShow) {
//                 item.style.display = '';
//                 visibleCount++;
//             } else {
//                 item.style.display = 'none';
//             }
//         });
        
//         // Update folder stats
//         updateFilteredStats(visibleCount);
        
//         // Show empty state if no items visible
//         const emptyState = document.getElementById('empty-state');
//         if (emptyState) {
//             emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
//         }
//     }
    
//     function updateFilteredStats(visibleCount) {
//         const statsCount = document.querySelector('.stats-count');
//         if (statsCount) {
//             const totalItems = document.querySelectorAll('.collection-item').length;
//             statsCount.textContent = visibleCount < totalItems ? 
//                 `${visibleCount} of ${totalItems} items` : 
//                 `${totalItems} items`;
//         }
//     }
    
//     // Bulk Actions
//     function initBulkActions() {
//         const selectAllBtn = document.getElementById('select-all-btn');
//         const bulkDownloadBtn = document.getElementById('bulk-download-btn');
//         const bulkShareBtn = document.getElementById('bulk-share-btn');
//         const bulkTagBtn = document.getElementById('bulk-tag-btn');
//         const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
//         const bulkClearBtn = document.getElementById('bulk-clear-btn');
        
//         selectAllBtn?.addEventListener('click', toggleSelectAll);
//         bulkDownloadBtn?.addEventListener('click', downloadSelected);
//         bulkShareBtn?.addEventListener('click', shareSelected);
//         bulkTagBtn?.addEventListener('click', tagSelected);
//         bulkDeleteBtn?.addEventListener('click', deleteSelected);
//         bulkClearBtn?.addEventListener('click', clearSelection);
//     }
    
//     function toggleSelectAll() {
//         const items = document.querySelectorAll('.collection-item');
//         const allSelected = selectedItems.size === items.length;
        
//         if (allSelected) {
//             clearSelection();
//         } else {
//             items.forEach(item => {
//                 const id = item.dataset.id;
//                 selectedItems.add(id);
//                 item.classList.add('selected');
//                 item.querySelector('.item-checkbox').classList.add('checked');
//             });
//             updateBulkActions();
//         }
//     }
    
//     function clearSelection() {
//         selectedItems.clear();
//         document.querySelectorAll('.collection-item').forEach(item => {
//             item.classList.remove('selected');
//             item.querySelector('.item-checkbox')?.classList.remove('checked');
//         });
//         updateBulkActions();
//     }
    
//     function updateBulkActions() {
//         const toolbar = document.getElementById('bulk-actions-toolbar');
//         const count = document.getElementById('bulk-selection-count');
        
//         if (selectedItems.size > 0) {
//             toolbar?.classList.add('show');
//             isSelectionMode = true;
//             count.textContent = `${selectedItems.size} items selected`;
//         } else {
//             toolbar?.classList.remove('show');
//             isSelectionMode = false;
//         }
//     }
    
//     // Context Menu
//     function initContextMenu() {
//         const contextMenu = document.getElementById('context-menu');
//         let currentTarget = null;
        
//         document.addEventListener('contextmenu', (e) => {
//             const item = e.target.closest('.collection-item');
//             if (item) {
//                 e.preventDefault();
//                 currentTarget = item;
//                 showContextMenu(e.clientX, e.clientY);
//             }
//         });
        
//         document.addEventListener('click', () => {
//             hideContextMenu();
//         });
        
//         contextMenu?.addEventListener('click', (e) => {
//             const action = e.target.closest('.context-menu-item')?.dataset.action;
//             if (action && currentTarget) {
//                 handleContextAction(action, currentTarget);
//                 hideContextMenu();
//             }
//         });
//     }
    
//     function showContextMenu(x, y) {
//         const menu = document.getElementById('context-menu');
//         menu.style.left = `${x}px`;
//         menu.style.top = `${y}px`;
//         menu.classList.add('show');
//     }
    
//     function hideContextMenu() {
//         document.getElementById('context-menu')?.classList.remove('show');
//     }
    
//     function handleContextAction(action, target) {
//         const itemName = target.querySelector('.item-title')?.textContent;
        
//         switch (action) {
//             case 'open':
//                 openItem(target);
//                 break;
//             case 'preview':
//                 showInfoPanel(target);
//                 break;
//             case 'download':
//                 downloadItem(target);
//                 break;
//             case 'share':
//                 shareItem(target);
//                 break;
//             case 'select':
//                 toggleItemSelection(target);
//                 break;
//             case 'rename':
//                 renameItem(target);
//                 break;
//             case 'delete':
//                 deleteItem(target);
//                 break;
//         }
//     }
    
//     // Info Panel
//     function initInfoPanel() {
//         const closeBtn = document.getElementById('info-panel-close');
//         closeBtn?.addEventListener('click', hideInfoPanel);
//     }
    
//     function showInfoPanel(item) {
//         const panel = document.getElementById('info-panel');
//         const content = document.getElementById('info-panel-content');
//         const title = document.getElementById('info-panel-title');
        
//         const itemData = getItemData(item);
//         title.textContent = itemData.name;
        
//         content.innerHTML = `
//             <div class="info-preview">
//                 <img src="/static/images/placeholder.jpg" alt="${itemData.name}" style="width: 100%; border-radius: 8px;">
//             </div>
//             <div class="info-details">
//                 <h4>Details</h4>
//                 <p><strong>Type:</strong> ${itemData.type}</p>
//                 <p><strong>Size:</strong> ${itemData.size}</p>
//                 <p><strong>Date:</strong> ${itemData.date}</p>
//                 <p><strong>Tags:</strong> ${itemData.tags.join(', ')}</p>
//             </div>
//         `;
        
//         panel.classList.add('show');
//     }
    
//     function hideInfoPanel() {
//         document.getElementById('info-panel')?.classList.remove('show');
//     }
    
//     // Drag and Drop
//     function initDragAndDrop() {
//         const dropZone = document.getElementById('content-area');
//         const overlay = document.getElementById('drop-zone-overlay');
        
//         ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
//             dropZone?.addEventListener(eventName, preventDefaults, false);
//         });
        
//         ['dragenter', 'dragover'].forEach(eventName => {
//             dropZone?.addEventListener(eventName, () => overlay?.classList.add('active'), false);
//         });
        
//         ['dragleave', 'drop'].forEach(eventName => {
//             dropZone?.addEventListener(eventName, () => overlay?.classList.remove('active'), false);
//         });
        
//         dropZone?.addEventListener('drop', handleDrop, false);
//     }
    
//     function preventDefaults(e) {
//         e.preventDefault();
//         e.stopPropagation();
//     }
    
//     function handleDrop(e) {
//         const files = e.dataTransfer.files;
//         handleFiles(files);
//     }
    
//     function handleFiles(files) {
//         Array.from(files).forEach(file => {
//             console.log('Uploading:', file.name);
//             showToast('success', 'Upload Started', `Uploading ${file.name}`);
//         });
//     }
    
//     // Keyboard Shortcuts
//     function initKeyboardShortcuts() {
//         document.addEventListener('keydown', (e) => {
//             // Selection shortcuts
//             if (e.ctrlKey && e.key === 'a') {
//                 e.preventDefault();
//                 toggleSelectAll();
//             }
            
//             if (e.key === 'Escape') {
//                 clearSelection();
//                 hideContextMenu();
//                 hideInfoPanel();
//             }
            
//             if (e.key === 'Delete' && selectedItems.size > 0) {
//                 deleteSelected();
//             }
            
//             // Navigation shortcuts
//             if (e.key === 'F2' && selectedItems.size === 1) {
//                 const item = document.querySelector('.collection-item.selected');
//                 renameItem(item);
//             }
//         });
//     }
    
//     // Toast Notification System
//     function initToastSystem() {
//         window.showToast = showToast;
//     }
    
//     function showToast(type, title, message, actions = []) {
//         const container = document.getElementById('toast-container');
//         const toast = document.createElement('div');
//         toast.className = `toast ${type}`;
        
//         toast.innerHTML = `
//             <div class="toast-content">
//                 <div class="toast-title">${title}</div>
//                 <div class="toast-message">${message}</div>
//                 ${actions.length > 0 ? `<div class="toast-actions">${actions.map(action => 
//                     `<button class="toast-action ${action.type || ''}">${action.text}</button>`
//                 ).join('')}</div>` : ''}
//             </div>
//             <button class="toast-close">×</button>
//         `;
        
//         container.appendChild(toast);
        
//         // Auto remove after 5 seconds
//         setTimeout(() => {
//             toast.style.animation = 'slideOutToast 0.3s ease forwards';
//             setTimeout(() => toast.remove(), 300);
//         }, 5000);
        
//         // Close button
//         toast.querySelector('.toast-close').addEventListener('click', () => {
//             toast.remove();
//         });
//     }
    
//     // Share Modal
//     function initShareModal() {
//         const modal = document.getElementById('share-modal');
//         const closeBtn = document.getElementById('close-share-modal');
//         const createBtn = document.getElementById('create-share-btn');
//         const copyBtn = document.getElementById('copy-link-btn');
        
//         closeBtn?.addEventListener('click', () => modal?.classList.remove('show'));
//         createBtn?.addEventListener('click', createShareLink);
//         copyBtn?.addEventListener('click', copyShareLink);
//     }
    
//     function shareSelected() {
//         if (selectedItems.size === 0) return;
//         document.getElementById('share-modal')?.classList.add('show');
//     }
    
//     function shareItem(item) {
//         selectedItems.clear();
//         selectedItems.add(item.dataset.id);
//         document.getElementById('share-modal')?.classList.add('show');
//     }
    
//     function createShareLink() {
//         const linkInput = document.getElementById('share-link-input');
//         const shareLink = `${window.location.origin}/share/${generateShareId()}`;
//         linkInput.value = shareLink;
//         showToast('success', 'Share Link Created', 'Share link generated successfully');
//     }
    
//     function copyShareLink() {
//         const linkInput = document.getElementById('share-link-input');
//         linkInput.select();
//         document.execCommand('copy');
//         showToast('success', 'Copied', 'Share link copied to clipboard');
//     }
    
//     // Tag Modal
//     function initTagModal() {
//         const modal = document.getElementById('bulk-tag-modal');
//         const closeBtn = document.getElementById('close-tag-modal');
//         const applyBtn = document.getElementById('apply-tags-btn');
        
//         closeBtn?.addEventListener('click', () => modal?.classList.remove('show'));
//         applyBtn?.addEventListener('click', applyTags);
//     }
    
//     function tagSelected() {
//         if (selectedItems.size === 0) return;
//         document.getElementById('bulk-tag-modal')?.classList.add('show');
//     }
    
//     function applyTags() {
//         const tagInput = document.getElementById('bulk-tag-input');
//         const tags = tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
//         showToast('success', 'Tags Applied', `Added ${tags.length} tags to ${selectedItems.size} items`);
//         document.getElementById('bulk-tag-modal')?.classList.remove('show');
//     }
    
//     // Infinite Scroll
//     function initInfiniteScroll() {
//         const loadingMore = document.getElementById('loading-more');
        
//         const observer = new IntersectionObserver((entries) => {
//             entries.forEach(entry => {
//                 if (entry.isIntersecting) {
//                     loadMoreItems();
//                 }
//             });
//         });
        
//         if (loadingMore) {
//             observer.observe(loadingMore);
//         }
//     }
    
//     function loadMoreItems() {
//         const loadingMore = document.getElementById('loading-more');
//         loadingMore.style.display = 'flex';
        
//         // Simulate loading
//         setTimeout(() => {
//             loadingMore.style.display = 'none';
//             showToast('info', 'Loaded', 'More items loaded');
//         }, 2000);
//     }
    
//     // Utility Functions
//     function debounce(func, wait) {
//         let timeout;
//         return function executedFunction(...args) {
//             const later = () => {
//                 clearTimeout(timeout);
//                 func(...args);
//             };
//             clearTimeout(timeout);
//             timeout = setTimeout(later, wait);
//         };
//     }
    
//     function generateShareId() {
//         return Math.random().toString(36).substr(2, 9);
//     }
    
//     function getItemData(item) {
//         const path = item.dataset.path;
//         return realCollections.find(i => i.path === path || i.name === path) || {};
//     }
    
//     function sortItems(sortType) {
//         if (!realCollections || realCollections.length === 0) return;
        
//         realCollections.sort((a, b) => {
//             // Folders first
//             if ((a.isDir || a.type === 'folder') && !(b.isDir || b.type === 'folder')) {
//                 return -1;
//             }
//             if (!(a.isDir || a.type === 'folder') && (b.isDir || b.type === 'folder')) {
//                 return 1;
//             }
            
//             // Sort based on type
//             switch (sortType) {
//                 case 'name-asc':
//                     return a.name.localeCompare(b.name);
//                 case 'name-desc':
//                     return b.name.localeCompare(a.name);
//                 case 'date-asc':
//                     return new Date(a.createdTime || a.modifiedTime || 0) - new Date(b.createdTime || b.modifiedTime || 0);
//                 case 'date-desc':
//                     return new Date(b.createdTime || b.modifiedTime || 0) - new Date(a.createdTime || a.modifiedTime || 0);
//                 case 'size-asc':
//                     return (a.size || 0) - (b.size || 0);
//                 case 'size-desc':
//                     return (b.size || 0) - (a.size || 0);
//                 default:
//                     return 0;
//             }
//         });
        
//         // Re-render the collections
//         displayRealCollections();
//     }
    
//     function toggleItemSelection(item) {
//         const id = item.dataset.id;
//         const checkbox = item.querySelector('.item-checkbox');
        
//         if (selectedItems.has(id)) {
//             selectedItems.delete(id);
//             item.classList.remove('selected');
//             checkbox?.classList.remove('checked');
//         } else {
//             selectedItems.add(id);
//             item.classList.add('selected');
//             checkbox?.classList.add('checked');
//         }
        
//         updateBulkActions();
//     }
    
//     function downloadSelected() {
//         if (selectedItems.size === 0) return;
        
//         // For single item, direct download
//         if (selectedItems.size === 1) {
//             const path = Array.from(selectedItems)[0];
//             const downloadUrl = getFileUrl(path);
//             window.open(downloadUrl, '_blank');
//         } else {
//             // For multiple items, show info about bulk download
//             showToast('info', 'Bulk Download', 'Multiple file download will be available soon');
//         }
        
//         showToast('info', 'Download Started', `Downloading ${selectedItems.size} items`);
//     }
    
//     function downloadItem(item) {
//         const path = item.dataset.path;
//         const name = item.querySelector('.item-title')?.textContent;
        
//         // Use the real download URL
//         const downloadUrl = getFileUrl(path);
//         window.open(downloadUrl, '_blank');
//         showToast('info', 'Download Started', `Downloading ${name}`);
//     }
    
//     async function deleteSelected() {
//         if (selectedItems.size === 0) return;

//         const ids = Array.from(selectedItems);
//         // Map ids back to paths
//         const paths = ids.map(id => {
//             const item = document.querySelector(`.collection-item[data-id="${id}"]`);
//             return item?.dataset.path;
//         }).filter(Boolean);

//         let successCount = 0;
//         for (const path of paths) {
//             try {
//                 const res = await fetch('/api/collections/delete', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ path })
//                 });
//                 if (res.ok) {
//                     successCount++;
//                     // Remove from state & DOM
//                     document.querySelector(`.collection-item[data-path="${path}"]`)?.remove();
//                     realCollections = realCollections.filter(i => i.path !== path && i.name !== path);
//                 }
//             } catch (e) {
//                 console.error('Failed to delete', path, e);
//             }
//         }

//         updateFolderStats();
//         clearSelection();

//         if (successCount > 0) {
//             showToast('success', 'Deleted', `${successCount} items moved to trash`);
//         } else {
//             showToast('error', 'Delete Failed', 'Could not delete selected items');
//         }
//     }
    
//     async function deleteItem(item) {
//         const path = item.dataset.path;
//         const name = item.querySelector('.item-title')?.textContent;

//         try {
//             const res = await fetch('/api/collections/delete', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ path })
//             });
//             const data = await res.json();
//             if (!res.ok || data.error) {
//                 throw new Error(data.error || 'Failed to delete');
//             }

//             // Remove from DOM & state
//             item.remove();
//             realCollections = realCollections.filter(i => i.path !== path && i.name !== path);
//             selectedItems.delete(item.dataset.id);
//             updateFolderStats();
//             showToast('success', 'Deleted', `${name} moved to trash`);
//         } catch (err) {
//             console.error(err);
//             showToast('error', 'Delete Failed', err.message || 'Could not delete item');
//         }
//     }
    
//     function renameItem(item) {
//         const titleEl = item.querySelector('.item-title');
//         const currentName = titleEl.textContent;
        
//         const input = document.createElement('input');
//         input.type = 'text';
//         input.value = currentName;
//         input.className = 'rename-input';
        
//         titleEl.replaceWith(input);
//         input.focus();
//         input.select();
        
//         function finishRename() {
//             const newName = input.value.trim() || currentName;
//             const newTitle = document.createElement('div');
//             newTitle.className = 'item-title';
//             newTitle.textContent = newName;
//             input.replaceWith(newTitle);
            
//             if (newName !== currentName) {
//                 showToast('success', 'Renamed', `Item renamed to "${newName}"`);
//             }
//         }
        
//         input.addEventListener('blur', finishRename);
//         input.addEventListener('keydown', (e) => {
//             if (e.key === 'Enter') finishRename();
//             if (e.key === 'Escape') {
//                 input.value = currentName;
//                 finishRename();
//             }
//         });
//     }
    
//     // Open or preview an item (file/folder)
//     function openItem(item) {
//     // Decide behaviour based on file type
//     const isFolder = item.dataset.type === 'folder';
//     const path = item.dataset.path;
//     const ownerId = item.dataset.owner || null;
//     const name = item.dataset.name || getItemData(item)?.name || '';

//     if (isFolder) {
//         navigateToFolder(path, ownerId);
//         return;
//     }

//     // File: decide by extension
//     const ext = name.split('.').pop().toLowerCase();
//     const imageExts = ['jpg','jpeg','png','gif','webp','bmp','svg'];
//     const videoExts = ['mp4','mov','avi','mkv','webm'];

//     if (imageExts.includes(ext) && typeof previewFile === 'function') {
//         // Use existing image preview modal
//         previewFile(path);
//     } else if (videoExts.includes(ext)) {
//         // Open in a basic video modal or new tab
//         window.open(getFileUrl(path), '_blank');
//         showToast('info', 'Opening Video', 'Video opened in new tab');
//     } else {
//         // For docs or unknown, open in new tab and let browser handle
//         window.open(getFileUrl(path), '_blank');
//     }
// }

//     // Hook into existing system
//     function hookIntoExistingSystem() {
//     // Integrate with legacy loadCollections so advanced UI shows on first page load
//     const originalLoadCollections = window.loadCollections;
//     if (typeof originalLoadCollections === 'function') {
//         // Wrap the existing function so we can refresh advanced UI each time it runs
//         window.loadCollections = function(...args) {
//             originalLoadCollections.apply(this, args);
//             // Start a short polling loop to detect when window.collections is populated
//             let attempts = 0;
//             const pollInterval = setInterval(() => {
//                 if (syncCollectionsState()) {
//                     clearInterval(pollInterval);
//                 } else if (++attempts > 20) {
//                     // Stop polling after ~2 s to avoid infinite loop
//                     clearInterval(pollInterval);
//                 }
//             }, 100);
//         };
//         // Call it once now (initial page load)
//         originalLoadCollections();

//     // Also hook into legacy displayCollections if it exists to ensure sync after render
//     const originalDisplayCollections = window.displayCollections;
//     if (typeof originalDisplayCollections === 'function' && !originalDisplayCollections.__advancedHooked) {
//         window.displayCollections = function(...dArgs) {
//             const result = originalDisplayCollections.apply(this, dArgs);
//             // Ensure we pick up the latest data once legacy view finishes
//             syncCollectionsState();
//             return result;
//         };
//         // Mark to avoid double-wrapping
//         window.displayCollections.__advancedHooked = true;
//     }
//     } else {
//         // If legacy loader not present, try to sync immediately
//         syncCollectionsState();
//     }

//     // Fallback: if collections already present before our script, sync now
//     syncCollectionsState();

//     function syncCollectionsState() {
//         let legacyData = null;
//     if (Array.isArray(window.collections)) {
//         legacyData = window.collections;
//     } else if (typeof collections !== 'undefined' && Array.isArray(collections)) {
//         // Fallback for legacy script where 'collections' is a module-level let, not attached to window
//         legacyData = collections;
//     }
//     if (legacyData !== null) {
//             realCollections = legacyData;
//             displayRealCollections();
//             updateFolderStats();
//             return true; // synced successfully
//         }
//         return false;
//     }
// }
//         // End hookIntoExistingSystem

    
//     function createItemElement(item) {
//         const div = document.createElement('div');
//         div.className = 'collection-item';
//         const itemId = item.id || item.path || item.name;
//         div.dataset.id = itemId; // unique identifier for selection
//         div.dataset.path = item.path || item.fullPath || item.name;
//         div.dataset.type = item.isDir ? 'folder' : 'file';
//         div.dataset.name = item.name;
//     if (item.owner_id) {
//         div.dataset.owner = item.owner_id;
//     }
//     // Store raw creation time for reliable filtering
//     if (item.createdTime) {
//         div.dataset.created = item.createdTime; // ISO 8601 string
//     }
        
//         const isFolder = item.isDir || item.type === 'folder';
//         const thumbnailSrc = isFolder ? '/static/images/folder-icon.png' : getFileUrl(item.path || item.name);
//         const fileIcon = isFolder ? 'fas fa-folder' : getFileIcon(item.name);
        
//         div.innerHTML = `
//             <div class="item-checkbox">
//                 <i class="fas fa-check"></i>
//             </div>
//             ${isFolder ? 
//                 `<div class="item-thumbnail folder-thumbnail"><i class="${fileIcon}"></i></div>` :
//                 `<img src="${thumbnailSrc}" alt="${item.name}" class="item-thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
//                  <div class="item-thumbnail file-icon" style="display:none;"><i class="${fileIcon}"></i></div>`
//             }
//             <div class="item-info">
//                 <div class="item-title">${item.name}</div>
//                 <div class="item-meta">
//                     <span>${formatSize(item.size || 0)}</span>
//                     <span class="collection-date">${formatDate(item.createdTime)}</span>
//                 </div>
//                 <div class="item-tags">
//                     ${(item.tags || []).map(tag => `<span class="item-tag">${tag}</span>`).join('')}
//                 </div>
//             </div>
//         `;
        
//         // Add click handlers
//         div.addEventListener('dblclick', (e) => {
//         // Double-click always opens the item and exits selection mode
//         openItem(div);
//         clearSelection();
//     });

//         div.addEventListener('click', (e) => {
//             if (e.target.closest('.item-checkbox')) {
//                 toggleItemSelection(div);
//             } else if (!isSelectionMode) {
//                 // Single-click shows info panel but keeps selection logic intact.
//                 showInfoPanel(div);
//             }
//         });
        
//         return div;
//     }
    
//     function updateFolderStats() {
//         const statsCount = document.getElementById('folder-stats')?.querySelector('.stats-count');
//         const statsSize = document.getElementById('folder-stats')?.querySelector('.stats-size');
        
//         if (statsCount) statsCount.textContent = `${realCollections.length} items`;
//         if (statsSize) {
//             const totalSize = realCollections.reduce((sum, item) => sum + (item.size || 0), 0);
//             statsSize.textContent = formatSize(totalSize);
//         }
//     }
    
//     // Display real collections with advanced UI
//     function displayRealCollections() {
//         const grid = document.getElementById('collections-grid');
//         if (!grid) return;
        
//         // Clear any previous content rendered by legacy UI (including skeletons)
//         grid.innerHTML = '';
        
//         // Debug: log collection count
//         console.log('[Advanced] Rendering', realCollections.length, 'items');
        
//         // Add real items
//         realCollections.forEach(item => {
//             const itemEl = createItemElement(item);
//             grid.appendChild(itemEl);
//         });
        
//         // Show empty state if no items
//         if (realCollections.length === 0) {
//             const emptyState = document.getElementById('empty-state');
//             if (emptyState) emptyState.style.display = 'block';
//         } else {
//             const emptyState = document.getElementById('empty-state');
//             if (emptyState) emptyState.style.display = 'none';
//         }
//     }
    
//     // Helper functions from existing system
//     function getFileUrl(path, ownerId = null) {
//         const encodedPath = encodeURIComponent(path);
//         let url = `/api/collections/file/${encodedPath}`;
//         const params = [];
//         if (ownerId) {
//             params.push(`owner_id=${ownerId}`);
//         }
//         params.push(`t=${Date.now()}`);
//         if (params.length) {
//             url += `?${params.join('&')}`;
//         }
//         return url;
//     }
    
//     function formatSize(bytes) {
//         if (bytes === 0) return '0 Bytes';
//         const k = 1024;
//         const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//         const i = Math.floor(Math.log(bytes) / Math.log(k));
//         return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//     }
    
//     function formatDate(timestamp) {
//         if (!timestamp) return 'Unknown';
//         // Accept both ISO strings and Unix seconds
//         let date;
//         if (typeof timestamp === 'string') {
//             date = new Date(timestamp);
//         } else {
//             // Assume seconds if numeric
//             date = new Date(timestamp * 1000);
//         }
//         if (isNaN(date)) return 'Unknown';
//         return date.toLocaleDateString();
//     }
    
//     function getFileIcon(filename) {
//         const extension = filename.split('.').pop().toLowerCase();
//         const iconMap = {
//             'jpg': 'fas fa-image', 'jpeg': 'fas fa-image', 'png': 'fas fa-image', 'gif': 'fas fa-image',
//             'pdf': 'fas fa-file-pdf', 'doc': 'fas fa-file-word', 'docx': 'fas fa-file-word',
//             'xls': 'fas fa-file-excel', 'xlsx': 'fas fa-file-excel',
//             'mp4': 'fas fa-file-video', 'avi': 'fas fa-file-video', 'mov': 'fas fa-file-video',
//             'mp3': 'fas fa-file-audio', 'wav': 'fas fa-file-audio',
//             'zip': 'fas fa-file-archive', 'rar': 'fas fa-file-archive'
//         };
//         return iconMap[extension] || 'fas fa-file';
//     }
    
//     /**
//      * Navigate into a folder and refresh the collections grid.
//      * Keeps both the legacy `currentPath` variable (declared with `let` in
//      * collections-fixed.js) and the `window.currentPath` property in sync so
//      * that whichever reference other scripts use remains accurate.
//      */
//     function navigateToFolder(path, ownerId = null) {
//     // Store owner info for shared browsing
//     if (ownerId) {
//         window.currentOwnerId = ownerId;
//     } else {
//         delete window.currentOwnerId;
//     }
//         // Update legacy global (block-scoped) variable if it exists
//         if (typeof currentPath !== 'undefined') {
//             currentPath = path;
//         }
//         // Always store path on the window object for advanced modules
//         window.currentPath = path;

//         // Reload the view using the existing loader
//         if (typeof window.loadCollections === 'function') {
//             window.loadCollections();
//         }
//     }
    
//     })();
