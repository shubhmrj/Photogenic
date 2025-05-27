/**
 * Image Viewer Integration
 * Handles the integration between the dedicated image viewer and collections page
 */

// When the page loads, check for analyze parameter
document.addEventListener('DOMContentLoaded', function() {
    // Check for analyze parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const analyzePath = urlParams.get('analyze');
    
    if (analyzePath && typeof analyzeImage === 'function') {
        // If there's an analyze parameter, trigger the analyze function after collections are loaded
        const checkLoaded = setInterval(function() {
            // Check if collections are loaded by looking for collection items
            if (document.querySelectorAll('.collection-item').length > 0) {
                clearInterval(checkLoaded);
                analyzeImage(analyzePath);
                
                // Clear the URL parameter to prevent re-analyzing on refresh
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }, 500);
        
        // Set a timeout to stop checking after 10 seconds to prevent infinite loop
        setTimeout(function() {
            clearInterval(checkLoaded);
        }, 10000);
    }
});
