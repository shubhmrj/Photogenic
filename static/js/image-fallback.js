/**
 * PhotoGeni Image Fallback Handler
 * This script handles image loading errors by providing fallback images
 */

(function() {
    console.log("🖼️ Setting up image fallback system...");
    
    // Create a mapping of image URLs to data URI placeholders
    const imagePlaceholders = {
        // Avatar placeholder - gray person silhouette
        '/static/avatar.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzMzMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxOCIgZmlsbD0iIzU1NSIvPjxwYXRoIGQ9Ik0yNSw4NyBDMjUsNjggNzUsNjggNzUsODciIGZpbGw9IiM1NTUiLz48L3N2Zz4=',
        
        // Placeholder avatar - same as avatar but lighter gray
        '/static/placeholder-avatar.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM0NDQiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxOCIgZmlsbD0iIzY2NiIvPjxwYXRoIGQ9Ik0yNSw4NyBDMjUsNjggNzUsNjggNzUsODciIGZpbGw9IiM2NjYiLz48L3N2Zz4=',
        
        // Face placeholder - similar to avatar but rounded
        '/static/placeholder-face.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iIzMzMyIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMzAiIHI9IjE1IiBmaWxsPSIjNTU1Ii8+PHBhdGggZD0iTTIwLDY1IEMyMCw1MCA2MCw1MCA2MCw2NSIgZmlsbD0iIzU1NSIvPjwvc3ZnPg==',
        
        // Individual faces
        '/static/faces/john.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iIzM5NiIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMzAiIHI9IjE1IiBmaWxsPSIjNUI4Ii8+PHBhdGggZD0iTTIwLDY1IEMyMCw1MCA2MCw1MCA2MCw2NSIgZmlsbD0iIzVCOCIvPjx0ZXh0IHg9IjQwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj5Kb2huPC90ZXh0Pjwvc3ZnPg==',
        
        '/static/faces/emma.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iI2M5NiIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMzAiIHI9IjE1IiBmaWxsPSIjZWI4Ii8+PHBhdGggZD0iTTIwLDY1IEMyMCw1MCA2MCw1MCA2MCw2NSIgZmlsbD0iI2ViOCIvPjx0ZXh0IHg9IjQwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj5FbW1hPC90ZXh0Pjwvc3ZnPg==',
        
        '/static/faces/david.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iIzY2OCIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMzAiIHI9IjE1IiBmaWxsPSIjODhhIi8+PHBhdGggZD0iTTIwLDY1IEMyMCw1MCA2MCw1MCA2MCw2NSIgZmlsbD0iIzg4YSIvPjx0ZXh0IHg9IjQwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj5EYXZpZDwvdGV4dD48L3N2Zz4=',
        
        '/static/faces/sarah.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iI2I2NiIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMzAiIHI9IjE1IiBmaWxsPSIjZDg4Ii8+PHBhdGggZD0iTTIwLDY1IEMyMCw1MCA2MCw1MCA2MCw2NSIgZmlsbD0iI2Q4OCIvPjx0ZXh0IHg9IjQwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj5TYXJhaDwvdGV4dD48L3N2Zz4=',
        
        // General photo placeholders
        '/static/summer-vacation.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiM1ZDhlZWIiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIzMCIgcj0iMjAiIGZpbGw9IiNmZmQ3MDAiLz48cGF0aCBkPSJNMCwxMjAgTDUwLDk1IEwxMDAsMTEwIEwxNTAsOTAgTDIwMCwxMjAgTDIwMCwxNTAgTDAsMTUwIFoiIGZpbGw9IiNmZmM3M2YiLz48cGF0aCBkPSJNMTQwLDEyMCBMMTQwLDk1IEwxNjAsOTUgTDE2MCwxMjAiIGZpbGw9IiNiYjcwMDAiLz48cGF0aCBkPSJNMTM1LDk1IEwxNjUsOTUgTDE1MCw4MCBaIiBmaWxsPSIjODA0MDAwIi8+PHRleHQgeD0iMTAwIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5TdW1tZXIgVmFjYXRpb248L3RleHQ+PC9zdmc+',
        
        '/static/mountain-trip.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiM0NTYiLz48cGF0aCBkPSJNMCwxNTAgTDUwLDYwIEwxMDAsMTAwIEwxNTAsMzAgTDIwMCw5MCBMMjAwLDE1MCBaIiBmaWxsPSIjNzg5Ii8+PHBhdGggZD0iTTUwLDYwIEwxMDAsMTAwIEwxNTAsMzAgTDE3MCw1MCBMMTkwLDQwIEwyMDAsNjAgTDIwMCwxNTAgTDAsMTUwIEwwLDEyMCBMMjAsMTEwIEw0MCw5MCIgZmlsbD0iIzU2NyIvPjxwYXRoIGQ9Ik0xNTAsNjAgTDE3MCw0MCBMMTY1LDY1IFoiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgcj0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+TW91bnRhaW4gVHJpcDwvdGV4dD48L3N2Zz4=',
        
        '/static/family-reunion.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiM2Nzg5YWIiLz48Y2lyY2xlIGN4PSI0MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iIzg4YSIvPjxjaXJjbGUgY3g9IjgwIiBjeT0iNTAiIHI9IjE1IiBmaWxsPSIjOWJiIi8+PGNpcmNsZSBjeD0iMTIwIiBjeT0iNTAiIHI9IjE1IiBmaWxsPSIjYWNjIi8+PGNpcmNsZSBjeD0iMTYwIiBjeT0iNTAiIHI9IjE1IiBmaWxsPSIjYmRkIi8+PHBhdGggZD0iTTMwLDcwIEw1MCw3MCBMNTAsOTAgTDMwLDkwIFoiIGZpbGw9IiM4OGEiLz48cGF0aCBkPSJNNzAsNzAgTDkwLDcwIEw5MCw5MCBMNzAsOTAgWiIgZmlsbD0iIzliYiIvPjxwYXRoIGQ9Ik0xMTAsNzAgTDEzMCw3MCBMMTM1LDkwIEwxMTAsOTAgWiIgZmlsbD0iI2FjYyIvPjxwYXRoIGQ9Ik0xNTAsNzAgTDE3MCw3MCBMMTY1LDkwIEwxNTAsOTAgWiIgZmlsbD0iI2JkZCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkZhbWlseSBSZXVuaW9uPC90ZXh0Pjwvc3ZnPg==',
        
        '/static/john.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzNDU2NzgiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMzAiIGZpbGw9IiM1Njc4OWEiLz48cGF0aCBkPSJNNjUsOTAgQzY1LDEyMCAxMzUsMTIwIDEzNSw5MCIgZmlsbD0iIzU2Nzg5YSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkpvaG48L3RleHQ+PC9zdmc+',
        
        '/static/placeholder.jpg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIxMDAiIHk9Ijc1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCI+UGxhY2Vob2xkZXIgSW1hZ2U8L3RleHQ+PC9zdmc+',
    };
    
    // Apply fallbacks to any image that fails to load
    function applyImageFallbacks() {
        document.querySelectorAll('img').forEach(img => {
            // Skip if already handled
            if (img.dataset.fallbackApplied === 'true') return;
            
            // Mark as handled
            img.dataset.fallbackApplied = 'true';
            
            // Store original src
            const originalSrc = img.src;
            
            // Add error handler
            img.onerror = function() {
                // Check if we have a specific fallback for this image
                const path = new URL(originalSrc).pathname;
                if (imagePlaceholders[path]) {
                    this.src = imagePlaceholders[path];
                    console.log(`Applied fallback for: ${path}`);
                } else {
                    // Use generic placeholder if no specific one exists
                    this.src = imagePlaceholders['/static/placeholder.jpg'];
                    console.log(`Applied generic fallback for: ${path}`);
                }
                
                // Remove height/width restrictions that might distort placeholder
                if (this.style.height === '0px' || this.style.width === '0px') {
                    this.style.height = 'auto';
                    this.style.width = 'auto';
                }
            };
            
            // Force reload if already failed
            if (img.complete && img.naturalHeight === 0) {
                img.onerror();
            }
        });
    }
    
    // Run immediately
    applyImageFallbacks();
    
    // Run again after a short delay to catch dynamically loaded images
    setTimeout(applyImageFallbacks, 1000);
    
    // Also run when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyImageFallbacks);
    }
    
    // Run after window load to catch all images
    window.addEventListener('load', applyImageFallbacks);
    
    // Run one more time after everything else
    setTimeout(applyImageFallbacks, 3000);
    
    console.log("✅ Image fallback system ready");
})();
