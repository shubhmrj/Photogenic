// /**
//  * Collections Analyze Handler
//  * Handles the analyze functionality when returning from the image viewer
//  */
// document.addEventListener('DOMContentLoaded', function() {
//     // Check for analyze parameter in URL
//     const urlParams = new URLSearchParams(window.location.search);
//     const analyzePath = urlParams.get('analyze');
    
//     if (analyzePath) {
//         // Wait for page to fully load before triggering analysis
//         window.addEventListener('load', function() {
//             // Wait a bit for collections to load
//             setTimeout(function() {
//                 if (typeof analyzeImage === 'function') {
//                     // Trigger the analyze function
//                     analyzeImage(analyzePath);
                    
//                     // Clean up URL to prevent re-analyzing on refresh
//                     const newUrl = window.location.pathname;
//                     history.replaceState({}, document.title, newUrl);
//                 }
//             }, 1000);
//         });
//     }
// });
