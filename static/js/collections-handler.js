// Enhanced collections handler
// This file provides improved handling for different collection types including shared files

// Load collections from the server - enhanced version to handle special categories
function loadCollectionsEnhanced() {
    // Show loading indicator
    const container = document.querySelector('.collections-grid');
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner"></i>
            <div>Loading collections...</div>
        </div>
    `;
    
    // Get the current path
    const path = currentPath || '';
    console.log('Enhanced loader - Loading collections for path:', path);
    
    // Special categories use a different endpoint
    const specialCategories = ['recent', 'favorites', 'permitted', 'trash', 'shared'];
    
    let endpoint;
    let categoryName = path;
    
    // Convert 'shared' path to 'permitted' category for the API
    if (path === 'shared') {
        categoryName = 'permitted';
    }
    
    if (specialCategories.includes(categoryName)) {
        endpoint = `/api/collections/list/${categoryName}`;
        console.log('Using special category endpoint:', endpoint);
    } else {
        endpoint = `/api/collections?path=${encodeURIComponent(path)}`;
        console.log('Using regular collections endpoint:', endpoint);
    }
    
    // Fetch collections from server
    fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Collections data received:', data);
            
            // Update breadcrumbs for regular paths, not for special categories
            if (!specialCategories.includes(categoryName)) {
                updateBreadcrumbs(path);
            } else {
                // For special categories, set a simple breadcrumb with just the category name
                const breadcrumbContainer = document.querySelector('.breadcrumb');
                breadcrumbContainer.innerHTML = `
                    <div class="breadcrumb-item">
                        <a href="#" data-path="">Home</a>
                    </div>
                    <div class="breadcrumb-separator">/</div>
                    <div class="breadcrumb-item active">
                        ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                    </div>
                `;
            }
            
            // Update current path
            currentPath = path;
            
            // Display collections from the appropriate data field based on the endpoint
            if (specialCategories.includes(categoryName)) {
                if (data.items) {
                    displayCollections(data.items);
                } else if (data.collections) {
                    displayCollections(data.collections);
                } else {
                    console.error('No collections data in response:', data);
                    showError('Invalid server response');
                }
            } else {
                if (data.collections) {
                    displayCollections(data.collections);
                } else {
                    console.error('No collections data in response:', data);
                    showError('Invalid server response');
                }
            }
        })
        .catch(error => {
            console.error('Error loading collections:', error);
            showError(`Failed to load collections: ${error.message}`);
        });
}

// Immediately override the original loadCollections function
window.loadCollections = loadCollectionsEnhanced;

// Also ensure it's properly set when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - Overriding loadCollections function');
    
    // Store the original function reference if needed
    if (!window.originalLoadCollections) {
        window.originalLoadCollections = window.loadCollections;
    }
    
    // Replace with the enhanced version
    window.loadCollections = loadCollectionsEnhanced;
    
    // Also fix the category buttons to use the proper endpoint for permitted/shared
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            console.log('Category button clicked:', category);
            
            if (category === 'permitted') {
                currentPath = 'shared';
            } else {
                currentPath = category;
            }
            
            loadCollectionsEnhanced();
        });
    });
});
