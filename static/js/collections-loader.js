// Collections loader with optimizations
class CollectionsLoader {
    constructor() {
        this.currentPath = '';
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.loadingSpinner = document.querySelector('.loading-spinner');
        this.contentArea = document.querySelector('.collections-content');
        this.loadingText = document.querySelector('.loading-text');
    }

    async loadCollections(path = '') {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPath = path;
        this.showLoading();

        try {
            const response = await this.fetchWithRetry('/api/collections?path=' + encodeURIComponent(path));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to load collections');

            this.renderItems(data.items);
            this.updateBreadcrumb(path);
            this.hideLoading();
            
            // Update storage info if available
            if (data.storage) {
                this.updateStorageInfo(data.storage);
            }
        } catch (error) {
            console.error('Error loading collections:', error);
            this.showError('Failed to load collections. Please try again.');
        } finally {
            this.isLoading = false;
        }
    }

    async fetchWithRetry(url, retryCount = 0) {
        try {
            return await fetch(url, {
                headers: {
                    'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
                }
            });
        } catch (error) {
            if (retryCount < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
                return this.fetchWithRetry(url, retryCount + 1);
            }
            throw error;
        }
    }

    showLoading() {
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'block';
        if (this.loadingText) this.loadingText.textContent = 'Loading collections...';
        if (this.contentArea) this.contentArea.style.opacity = '0.5';
    }

    hideLoading() {
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
        if (this.contentArea) this.contentArea.style.opacity = '1';
    }

    showError(message) {
        if (this.loadingText) {
            this.loadingText.textContent = message;
            this.loadingText.style.color = 'red';
        }
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
        if (this.contentArea) this.contentArea.style.opacity = '1';
    }

    renderItems(items) {
        const container = document.querySelector('.collections-grid') || document.querySelector('.collections-list');
        if (!container) return;

        container.innerHTML = '';
        
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const itemElement = this.createItemElement(item);
            fragment.appendChild(itemElement);
        });

        container.appendChild(fragment);
        this.initializeEventListeners();
    }

    createItemElement(item) {
        const div = document.createElement('div');
        div.className = `collection-item ${item.type}`;
        div.dataset.path = item.path;
        div.dataset.type = item.type;
        div.dataset.name = item.name;

        const thumbnail = item.type === 'file' && item.thumbnail ? 
            `<img src="${item.thumbnail}" alt="${item.name}" loading="lazy">` :
            `<i class="${item.type === 'folder' ? 'fas fa-folder' : 'fas fa-file'}"></i>`;

        div.innerHTML = `
            <div class="item-preview">
                ${thumbnail}
            </div>
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                ${item.size ? `<span class="item-size">${this.formatSize(item.size)}</span>` : ''}
            </div>
        `;

        return div;
    }

    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    updateBreadcrumb(path) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;

        const parts = path.split('/').filter(Boolean);
        const crumbs = ['<a href="#" data-path="">Home</a>'];
        let currentPath = '';

        parts.forEach(part => {
            currentPath += '/' + part;
            crumbs.push(`<a href="#" data-path="${currentPath}">${part}</a>`);
        });

        breadcrumb.innerHTML = crumbs.join(' / ');
    }

    updateStorageInfo(storage) {
        const storageElement = document.querySelector('.storage-info');
        if (!storageElement) return;

        const usedGB = (storage.used / (1024 * 1024 * 1024)).toFixed(1);
        const totalGB = (storage.total / (1024 * 1024 * 1024)).toFixed(1);
        const usedPercentage = ((storage.used / storage.total) * 100).toFixed(1);

        storageElement.innerHTML = `
            <div class="storage-bar">
                <div class="storage-used" style="width: ${usedPercentage}%"></div>
            </div>
            <div class="storage-text">
                ${usedGB} GB used of ${totalGB} GB
            </div>
        `;
    }

    initializeEventListeners() {
        // Add event listeners for collection items
        document.querySelectorAll('.collection-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const path = item.dataset.path;
                const type = item.dataset.type;
                
                if (type === 'folder') {
                    e.preventDefault();
                    this.loadCollections(path);
                }
            });
        });

        // Add event listeners for breadcrumb navigation
        document.querySelectorAll('.breadcrumb a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.dataset.path;
                this.loadCollections(path);
            });
        });
    }
}

// Initialize the collections loader
document.addEventListener('DOMContentLoaded', () => {
    window.collectionsLoader = new CollectionsLoader();
    window.collectionsLoader.loadCollections('');
});
