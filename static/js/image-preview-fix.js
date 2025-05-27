// Add CSS link to head
document.addEventListener('DOMContentLoaded', function() {
    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/static/css/modal-fix.css';
    
    // Append to head
    document.head.appendChild(link);
    
    // Initialize image preview controls
    initImagePreviewControls();
});

// Initialize image preview controls
function initImagePreviewControls() {
    // Zoom functionality
    let currentZoom = 1;
    const zoomStep = 0.1;
    
    document.getElementById('zoom-in-btn').addEventListener('click', function() {
        currentZoom += zoomStep;
        updateImageTransform();
    });
    
    document.getElementById('zoom-out-btn').addEventListener('click', function() {
        if (currentZoom > zoomStep) {
            currentZoom -= zoomStep;
            updateImageTransform();
        }
    });
    
    // Rotation functionality
    let currentRotation = 0;
    const rotationStep = 90;
    
    document.getElementById('rotate-left-btn').addEventListener('click', function() {
        currentRotation -= rotationStep;
        updateImageTransform();
    });
    
    document.getElementById('rotate-right-btn').addEventListener('click', function() {
        currentRotation += rotationStep;
        updateImageTransform();
    });
    
    // Reset functionality
    document.getElementById('reset-image-btn').addEventListener('click', function() {
        currentZoom = 1;
        currentRotation = 0;
        updateImageTransform();
    });
    
    // Update image transform
    function updateImageTransform() {
        const img = document.getElementById('preview-image');
        img.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
    }
    
    // Make image draggable
    const imgContainer = document.getElementById('image-preview-wrapper');
    const img = document.getElementById('preview-image');
    
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    
    imgContainer.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        imgContainer.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom}) rotate(${currentRotation}deg)`;
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
        imgContainer.style.cursor = 'grab';
    });
    
    // Reset transform when opening a new image
    const modal = document.getElementById('image-preview-modal');
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class' && modal.classList.contains('show')) {
                currentZoom = 1;
                currentRotation = 0;
                translateX = 0;
                translateY = 0;
                img.style.transform = '';
            }
        });
    });
    
    observer.observe(modal, { attributes: true });
}
