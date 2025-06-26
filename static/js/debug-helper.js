// Debug helper for collections
(function() {
    console.log('Debug helper loaded');
    
    // Watch for click events on all sidebar items
    document.addEventListener('click', function(e) {
        // Check if it's a sidebar item
        if (e.target.closest('.sidebar-item')) {
            const item = e.target.closest('.sidebar-item');
            console.log('Sidebar item clicked:', item.textContent.trim());
            
            // Track the value of currentPath before and after the click
            console.log('Before click - currentPath:', window.currentPath);
            
            // Set a timeout to check the value after the click handler runs
            setTimeout(() => {
                console.log('After click - currentPath:', window.currentPath);
                console.log('loadCollections function type:', typeof window.loadCollections);
                
                // Check if the enhanced version is being used
                if (window.loadCollections === window.loadCollectionsEnhanced) {
                    console.log('Enhanced loadCollections is active');
                } else {
                    console.error('Original loadCollections is still being used!');
                }
            }, 100);
        }
        
        // Check if it's a category button
        if (e.target.closest('.category-btn')) {
            const btn = e.target.closest('.category-btn');
            const category = btn.getAttribute('data-category');
            console.log('Category button clicked:', category);
        }
    });
    
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        console.log('Fetch request to:', url);
        return originalFetch.apply(this, arguments)
            .then(response => {
                console.log('Fetch response from:', url, 'Status:', response.status);
                return response;
            })
            .catch(error => {
                console.error('Fetch error for:', url, error);
                throw error;
            });
    };
})();
