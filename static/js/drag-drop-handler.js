/**
 * Drag and Drop functionality for collections
 * Allows users to drag files and folders between directories
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing drag and drop functionality');
    setupDragAndDrop();
});

function setupDragAndDrop() {
    // Set up a mutation observer to watch for new collection items
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('collection-item')) {
                        setupDraggableItem(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('.collection-item').forEach(item => {
                            setupDraggableItem(item);
                        });
                    }
                });
            }
        });
    });

    // Start observing the collections grid
    const collectionsGrid = document.querySelector('.collections-grid');
    if (collectionsGrid) {
        observer.observe(collectionsGrid, { childList: true, subtree: true });
        
        // Set up drop zones for folders
        collectionsGrid.addEventListener('dragover', handleDragOver);
        collectionsGrid.addEventListener('drop', handleDrop);
    }
    
    // Initially set up any existing items
    document.querySelectorAll('.collection-item').forEach(item => {
        setupDraggableItem(item);
    });
}

function setupDraggableItem(item) {
    // Skip if already set up
    if (item.getAttribute('data-draggable') === 'true') return;
    
    // Mark as draggable
    item.setAttribute('draggable', 'true');
    item.setAttribute('data-draggable', 'true');
    
    // Add drag event listeners
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    
    // If it's a folder, make it a drop target
    if (item.classList.contains('folder')) {
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
    }
}

function handleDragStart(e) {
    // Add dragging class
    this.classList.add('dragging');
    
    // Store the dragged item data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
        path: this.getAttribute('data-path'),
        name: this.getAttribute('data-name'),
        type: this.getAttribute('data-type')
    }));
    
    // Create a custom drag image
    const dragImage = this.cloneNode(true);
    dragImage.style.width = '100px';
    dragImage.style.height = '100px';
    dragImage.style.opacity = '0.7';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 50);
    
    // Remove the drag image after a short delay
    setTimeout(() => {
        document.body.removeChild(dragImage);
    }, 100);
    
    // Show visual feedback
    showToast('info', 'Moving Item', `Drag to a folder to move ${this.getAttribute('data-name')}`, 3000);
}

function handleDragEnd(e) {
    // Remove dragging class
    this.classList.remove('dragging');
    
    // Remove any drop target highlights
    document.querySelectorAll('.drop-target').forEach(item => {
        item.classList.remove('drop-target');
    });
}

function handleDragOver(e) {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    // Prevent default
    e.preventDefault();
    
    // Add drop target class
    this.classList.add('drop-target');
}

function handleDragLeave(e) {
    // Remove drop target class
    this.classList.remove('drop-target');
}

function handleDrop(e) {
    // Prevent default action
    e.preventDefault();
    
    // Remove drop target class
    if (this.classList) {
        this.classList.remove('drop-target');
    }
    
    try {
        // Get the dragged item data
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Get the target folder path
        let targetPath;
        
        if (this.classList && this.classList.contains('folder')) {
            // Dropped on a folder
            targetPath = this.getAttribute('data-path');
        } else if (this === document.querySelector('.collections-grid')) {
            // Dropped on the grid (move to current directory)
            targetPath = currentPath;
        } else {
            // Not a valid drop target
            return;
        }
        
        // Don't move to the same directory
        if (data.path.split('/').slice(0, -1).join('/') === targetPath) {
            showToast('warning', 'Move Cancelled', 'Item is already in this folder', 3000);
            return;
        }
        
        // Don't move a folder into itself or its subdirectories
        if (data.type === 'folder' && targetPath.startsWith(data.path)) {
            showToast('error', 'Invalid Move', 'Cannot move a folder into itself', 3000);
            return;
        }
        
        // Move the item
        moveItem(data.path, targetPath);
    } catch (error) {
        console.error('Error handling drop:', error);
    }
}

function moveItem(sourcePath, targetPath) {
    // Show loading toast
    const toastId = showToast('info', 'Moving Item', `Moving ${sourcePath.split('/').pop()} to ${targetPath.split('/').pop() || 'root'}...`, 0);
    
    // Call the API to move the item
    fetch('/api/collections/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            source_path: sourcePath,
            target_path: targetPath
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to move item');
        }
        return response.json();
    })
    .then(data => {
        // Close the loading toast
        closeToast(document.getElementById(toastId));
        
        // Show success toast
        showToast('success', 'Item Moved', `Successfully moved ${sourcePath.split('/').pop()} to ${targetPath.split('/').pop() || 'root'}`, 3000);
        
        // Reload the collections
        loadCollections();
    })
    .catch(error => {
        // Close the loading toast
        closeToast(document.getElementById(toastId));
        
        // Show error toast
        showToast('error', 'Move Failed', error.message, 5000);
    });
}

// Add CSS for drag and drop
const style = document.createElement('style');
style.textContent = `
    .collection-item {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .collection-item.dragging {
        opacity: 0.5;
        transform: scale(0.95);
    }
    
    .collection-item.drop-target {
        box-shadow: 0 0 0 2px var(--primary, #4a6cf7);
        transform: scale(1.05);
        z-index: 10;
    }
    
    .collection-item.drop-target .collection-preview {
        background-color: rgba(74, 108, 247, 0.2);
    }
    
    .collection-item.drop-target .collection-preview i {
        color: var(--primary, #4a6cf7);
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
