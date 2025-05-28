/**
 * Modern Drag and Drop functionality for collections
 * Allows users to drag files and folders between directories with enhanced visual feedback
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing modern drag and drop functionality');
    setupDragAndDrop();
});

function setupDragAndDrop() {
    // Set up a mutation observer to watch for new collection items
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('collection-card')) {
                        setupDraggableItem(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('.collection-card').forEach(item => {
                            setupDraggableItem(item);
                        });
                    }
                });
            }
        });
    });

    // Start observing the collections grid
    const collectionsGrid = document.getElementById('collections-grid');
    if (collectionsGrid) {
        observer.observe(collectionsGrid, { childList: true, subtree: true });
        
        // Set up drop zones for the current directory
        collectionsGrid.addEventListener('dragover', handleDragOver);
        collectionsGrid.addEventListener('dragenter', function(e) {
            collectionsGrid.classList.add('drag-over');
        });
        collectionsGrid.addEventListener('dragleave', function(e) {
            // Only remove the class if we're leaving the grid itself, not just moving between its children
            if (e.relatedTarget === null || !collectionsGrid.contains(e.relatedTarget)) {
                collectionsGrid.classList.remove('drag-over');
            }
        });
        collectionsGrid.addEventListener('drop', function(e) {
            collectionsGrid.classList.remove('drag-over');
            handleDrop.call(this, e);
        });
    }
    
    // Initially set up any existing items
    document.querySelectorAll('.collection-card').forEach(item => {
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
    if (item.getAttribute('data-type') === 'folder') {
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
        type: this.getAttribute('data-type'),
        id: this.getAttribute('data-id')
    }));
    
    // Create a custom drag image that looks better
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-ghost';
    
    // Add appropriate icon based on type
    const iconClass = this.getAttribute('data-type') === 'folder' ? 'ri-folder-line' : 'ri-file-line';
    dragImage.innerHTML = `
        <i class="${iconClass}"></i>
        <span>${this.getAttribute('data-name')}</span>
    `;
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 30, 20);
    
    // Remove the drag image after a short delay
    setTimeout(() => {
        document.body.removeChild(dragImage);
    }, 100);
    
    // Show visual feedback
    showToast('info', 'Moving Item', `Drag to a folder to move ${this.getAttribute('data-name')}`, 5000);
}

function handleDragEnd(e) {
    // Remove dragging class
    this.classList.remove('dragging');
    
    // Remove any drop target highlights
    document.querySelectorAll('.drop-target').forEach(item => {
        item.classList.remove('drop-target');
    });
    
    // Remove drag-over class from collections grid
    const collectionsGrid = document.getElementById('collections-grid');
    if (collectionsGrid) {
        collectionsGrid.classList.remove('drag-over');
    }
}

function handleDragOver(e) {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    // Prevent default
    e.preventDefault();
    
    // Add drop target class for visual feedback
    this.classList.add('drop-target');
    
    // Create hover animation
    this.style.animation = 'pulse 1.2s infinite';
}

function handleDragLeave(e) {
    // Only remove classes if we're actually leaving this element
    // and not just entering a child element
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drop-target');
        this.style.animation = '';
    }
}

function handleDrop(e) {
    // Prevent default action
    e.preventDefault();
    
    // Remove drop target class and animation
    if (this.classList) {
        this.classList.remove('drop-target');
        this.style.animation = '';
    }
    
    try {
        // Get the dragged item data
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Get the target folder path
        let targetPath;
        
        if (this.classList && this.getAttribute('data-type') === 'folder') {
            // Dropped on a folder
            targetPath = this.getAttribute('data-path');
        } else if (this === document.getElementById('collections-grid')) {
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
        showToast('error', 'Error', 'Failed to process drag and drop operation', 3000);
    }
}

function moveItem(sourcePath, targetPath) {
    // Create a progress indicator for the item being moved
    const itemName = sourcePath.split('/').pop();
    const toastId = showToast('info', 'Moving Item', `Moving ${itemName} to ${targetPath.split('/').pop() || 'root folder'}...`, 0);
    
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
        
        if (data.success) {
            // Show success toast
            showToast('success', 'Item Moved', `Successfully moved ${itemName} to ${targetPath.split('/').pop() || 'root folder'}`, 3000);
            
            // Add move animation to the item
            animateItemMove(sourcePath);
            
            // Reload the collections after animation
            setTimeout(() => {
                refreshCollections();
            }, 500);
        } else {
            throw new Error(data.message || 'Failed to move item');
        }
    })
    .catch(error => {
        // Close the loading toast
        closeToast(document.getElementById(toastId));
        
        // Show error toast
        showToast('error', 'Move Failed', error.message || 'Failed to move item', 5000);
        console.error('Error moving item:', error);
    });
}

function animateItemMove(sourcePath) {
    // Find the item by path
    const item = document.querySelector(`.collection-card[data-path="${sourcePath}"]`);
    if (!item) return;
    
    // Add animation class
    item.classList.add('item-moving');
    
    // Remove the item after animation completes
    item.addEventListener('animationend', function() {
        item.remove();
    }, { once: true });
}

// Add CSS for drag and drop
const style = document.createElement('style');
style.textContent = `
    .collection-card {
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .collection-card.dragging {
        opacity: 0.4;
        transform: scale(0.95);
    }
    
    .collection-card.drop-target {
        box-shadow: 0 0 0 2px var(--color-primary), 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10;
        transform: scale(1.05);
    }
    
    #collections-grid.drag-over {
        background-color: var(--color-surface-hover);
        box-shadow: inset 0 0 0 2px var(--color-primary-light);
    }
    
    .drag-ghost {
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        font-size: 14px;
        max-width: 200px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    
    .drag-ghost i {
        font-size: 18px;
        color: var(--color-primary);
    }
    
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.7);
        }
        70% {
            box-shadow: 0 0 0 6px rgba(var(--color-primary-rgb), 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0);
        }
    }
    
    @keyframes item-move-out {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(0.5) translateY(-30px);
            opacity: 0;
        }
    }
    
    .item-moving {
        animation: item-move-out 0.4s ease-out forwards;
        pointer-events: none;
    }
`;

document.head.appendChild(style);
