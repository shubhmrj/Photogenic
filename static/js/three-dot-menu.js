// Three-dot menu implementation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Three-dot menu script loaded');
    
    // Function to add three-dot menu to collection items
    function addThreeDotMenus() {
        console.log('Adding three-dot menus to collection items');
        
        // Find all collection items
        const collectionItems = document.querySelectorAll('.collection-item');
        console.log(`Found ${collectionItems.length} collection items`);
        
        // Add three-dot menu to each item
        collectionItems.forEach(item => {
            // Check if item already has a three-dot menu
            if (item.querySelector('.three-dot-menu')) {
                return;
            }
            
            // Create the three-dot menu button
            const menuButton = document.createElement('button');
            menuButton.className = 'three-dot-menu';
            menuButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
            menuButton.setAttribute('aria-label', 'Menu');
            menuButton.setAttribute('title', 'Click for options');
            menuButton.style.zIndex = '100'; // Ensure the menu is above other elements
            menuButton.style.position = 'absolute'; // Force absolute positioning
            menuButton.style.display = 'flex'; // Ensure it's visible
            
            // Create the dropdown menu
            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'dropdown-menu';
            dropdownMenu.style.zIndex = '101'; // Ensure the dropdown is above the menu button
            
            // Get item data
            const itemPath = item.getAttribute('data-path');
            const itemName = item.getAttribute('data-name');
            const itemType = item.getAttribute('data-type');
            const isFolder = itemType === 'folder';
            
            // Add menu options
            const menuOptions = [
                {
                    icon: 'fas fa-edit',
                    text: 'Rename',
                    action: () => {
                        if (typeof startRenameItem === 'function') {
                            startRenameItem(itemPath);
                        } else {
                            console.error('startRenameItem function not found');
                        }
                    }
                },
                {
                    icon: 'fas fa-trash',
                    text: 'Delete',
                    action: () => {
                        if (typeof confirmDeleteItem === 'function') {
                            confirmDeleteItem(itemPath);
                        } else {
                            console.error('confirmDeleteItem function not found');
                        }
                    }
                },
                {
                    icon: 'fas fa-share-alt',
                    text: 'Share',
                    action: () => {
                        if (typeof openShareModal === 'function') {
                            openShareModal(itemPath);
                        } else {
                            console.error('openShareModal function not found');
                        }
                    }
                }
            ];
            
            // Add download option for files
            if (!isFolder) {
                menuOptions.push({
                    icon: 'fas fa-download',
                    text: 'Download',
                    action: () => {
                        const link = document.createElement('a');
                        link.href = `/api/collections/file?path=${encodeURIComponent(itemPath)}`;
                        link.download = itemName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });
                
                // Add analyze option for images if it's an image
                const fileExt = itemName.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExt);
                
                if (isImage) {
                    menuOptions.push({
                        icon: 'fas fa-magic',
                        text: 'Analyze',
                        action: () => {
                            if (typeof analyzeImage === 'function') {
                                analyzeImage(itemPath);
                            } else {
                                console.error('analyzeImage function not found');
                            }
                        }
                    });
                }
            }
            
            // Create menu items
            menuOptions.forEach(option => {
                const menuItem = document.createElement('button');
                menuItem.className = 'dropdown-item';
                menuItem.innerHTML = `<i class="${option.icon}"></i> ${option.text}`;
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Hide the dropdown
                    dropdownMenu.classList.remove('show');
                    // Execute the action
                    option.action();
                });
                dropdownMenu.appendChild(menuItem);
            });
            
            // Toggle dropdown on menu button click
            menuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Close all other open dropdowns
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    if (menu !== dropdownMenu) {
                        menu.classList.remove('show');
                    }
                });
                
                // Toggle this dropdown
                dropdownMenu.classList.toggle('show');
            });
            
            // Add the menu button and dropdown to the item
            item.appendChild(menuButton);
            item.appendChild(dropdownMenu);
            
            console.log(`Added three-dot menu to item: ${itemName}`);
        });
    }
    
    // Add three-dot menus when the page loads
    addThreeDotMenus();
    
    // Monitor for changes to the DOM and add three-dot menus to new items
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                // Check if any collection items were added
                const hasCollectionItems = Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType === 1) { // Element node
                        return node.classList?.contains('collection-item') || 
                               node.querySelectorAll('.collection-item').length > 0;
                    }
                    return false;
                });
                
                if (hasCollectionItems) {
                    console.log('Collection items added, adding three-dot menus');
                    addThreeDotMenus();
                }
            }
        });
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.three-dot-menu') && !e.target.closest('.dropdown-menu')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
    
    // Expose the function globally
    window.addThreeDotMenus = addThreeDotMenus;
    
    console.log('Three-dot menu initialization complete');
});
