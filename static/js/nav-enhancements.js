// Advanced Pro navigation bar enhancements for PhotoGeni collections page
// Author: Cascade AI

(function () {
    let selectedCommandIndex = 0;
    let filteredCommands = [];
    
    // Sample data for search suggestions
    const searchData = [
        { name: 'Vacation 2024', type: 'folder', icon: 'fas fa-folder' },
        { name: 'Family Photos', type: 'folder', icon: 'fas fa-folder' },
        { name: 'IMG_001.jpg', type: 'image', icon: 'fas fa-image' },
        { name: 'Wedding Album', type: 'folder', icon: 'fas fa-folder' },
        { name: 'Screenshot_2024.png', type: 'image', icon: 'fas fa-image' },
        { name: 'Birthday Party', type: 'folder', icon: 'fas fa-folder' }
    ];
    
    // Command palette actions
    const commands = [
        { action: 'upload', name: 'Upload Files', icon: 'fas fa-upload', shortcut: 'Ctrl+U' },
        { action: 'new-folder', name: 'New Folder', icon: 'fas fa-folder-plus', shortcut: 'Ctrl+Shift+N' },
        { action: 'search', name: 'Search', icon: 'fas fa-search', shortcut: 'Ctrl+F' },
        { action: 'goto-collections', name: 'Go to Collections', icon: 'fas fa-images' },
        { action: 'goto-recent', name: 'Go to Recent', icon: 'fas fa-clock' },
        { action: 'goto-favorites', name: 'Go to Favorites', icon: 'fas fa-star' },
        { action: 'toggle-theme', name: 'Toggle Theme', icon: 'fas fa-palette', shortcut: 'Ctrl+Shift+T' },
        { action: 'toggle-view', name: 'Toggle View Mode', icon: 'fas fa-th', shortcut: 'Ctrl+Shift+V' }
    ];

    document.addEventListener('DOMContentLoaded', () => {
        initStickyHeader();
        initUserDropdown();
        initThemeToggle();
        initNotifications();
        initCommandPalette();
        initSearchSuggestions();
        initBreadcrumbs();
        initKeyboardShortcuts();
        initLoadingBar();
    });

    /* ===== Sticky header shrink & blur on scroll ===== */
    function initStickyHeader() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        const onScroll = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        
        window.addEventListener('scroll', onScroll);
        onScroll(); // Call once in case the user reloads mid-scroll
    }

    /* ===== User dropdown click-toggle ===== */
    function initUserDropdown() {
        const userNav = document.querySelector('.user-nav-info');
        if (!userNav) return;
        
        const dropdown = userNav.querySelector('.user-dropdown');
        if (!dropdown) return;
        
        userNav.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            // Close notifications if open
            const notificationsDropdown = document.getElementById('notifications-dropdown');
            if (notificationsDropdown) {
                notificationsDropdown.classList.remove('show');
            }
        });
        
        document.addEventListener('click', () => dropdown.classList.remove('show'));
    }

    /* ===== Dark / Light theme toggle ===== */
    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            themeToggle.innerHTML = theme === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        };

        const preferred = localStorage.getItem('theme') || 'dark';
        applyTheme(preferred);

        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const current = localStorage.getItem('theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }

    /* ===== Notifications System ===== */
    function initNotifications() {
        const notificationsToggle = document.getElementById('notifications-toggle');
        const notificationsDropdown = document.getElementById('notifications-dropdown');
        const markAllReadBtn = document.getElementById('mark-all-read');
        
        if (!notificationsToggle || !notificationsDropdown) return;
        
        notificationsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('show');
            // Close user dropdown if open
            const userDropdown = document.querySelector('.user-dropdown');
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }
        });
        
        document.addEventListener('click', () => {
            notificationsDropdown.classList.remove('show');
        });
        
        // Prevent dropdown from closing when clicking inside
        notificationsDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Mark all as read functionality
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                const unreadItems = document.querySelectorAll('.notification-item.unread');
                unreadItems.forEach(item => item.classList.remove('unread'));
                updateNotificationCount(0);
            });
        }
        
        // Individual notification click
        const notificationItems = document.querySelectorAll('.notification-item');
        notificationItems.forEach(item => {
            item.addEventListener('click', () => {
                item.classList.remove('unread');
                updateNotificationCount();
            });
        });
    }
    
    function updateNotificationCount(count) {
        const badge = document.getElementById('notification-count');
        if (!badge) return;
        
        if (count === undefined) {
            count = document.querySelectorAll('.notification-item.unread').length;
        }
        
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    /* ===== Command Palette ===== */
    function initCommandPalette() {
        const commandPalette = document.getElementById('command-palette');
        const commandInput = document.getElementById('command-input');
        const commandResults = document.getElementById('command-results');
        
        if (!commandPalette || !commandInput) return;
        
        // Show/hide command palette
        function toggleCommandPalette() {
            commandPalette.classList.toggle('show');
            if (commandPalette.classList.contains('show')) {
                commandInput.focus();
                selectedCommandIndex = 0;
                renderCommands(commands);
            } else {
                commandInput.value = '';
            }
        }
        
        // Close on escape or outside click
        commandPalette.addEventListener('click', (e) => {
            if (e.target === commandPalette) {
                toggleCommandPalette();
            }
        });
        
        // Search and filter commands
        commandInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filteredCommands = commands.filter(cmd => 
                cmd.name.toLowerCase().includes(query) ||
                cmd.action.toLowerCase().includes(query)
            );
            selectedCommandIndex = 0;
            renderCommands(filteredCommands);
        });
        
        // Keyboard navigation
        commandInput.addEventListener('keydown', (e) => {
            const currentCommands = filteredCommands.length > 0 ? filteredCommands : commands;
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedCommandIndex = Math.min(selectedCommandIndex + 1, currentCommands.length - 1);
                    updateSelection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
                    updateSelection();
                    break;
                case 'Enter':
                    e.preventDefault();
                    executeCommand(currentCommands[selectedCommandIndex]);
                    break;
                case 'Escape':
                    toggleCommandPalette();
                    break;
            }
        });
        
        function renderCommands(commandList) {
            if (!commandResults) return;
            
            const quickActions = commandList.filter(cmd => 
                ['upload', 'new-folder', 'search'].includes(cmd.action)
            );
            const navigation = commandList.filter(cmd => 
                cmd.action.startsWith('goto-') || ['toggle-theme', 'toggle-view'].includes(cmd.action)
            );
            
            let html = '';
            
            if (quickActions.length > 0) {
                html += '<div class="command-group">';
                html += '<div class="command-group-title">Quick Actions</div>';
                quickActions.forEach((cmd, index) => {
                    const globalIndex = commandList.indexOf(cmd);
                    html += `<div class="command-item ${globalIndex === selectedCommandIndex ? 'selected' : ''}" data-action="${cmd.action}">`;
                    html += `<i class="${cmd.icon}"></i>`;
                    html += `<span>${cmd.name}</span>`;
                    if (cmd.shortcut) {
                        html += `<kbd>${cmd.shortcut}</kbd>`;
                    }
                    html += '</div>';
                });
                html += '</div>';
            }
            
            if (navigation.length > 0) {
                html += '<div class="command-group">';
                html += '<div class="command-group-title">Navigation</div>';
                navigation.forEach((cmd, index) => {
                    const globalIndex = commandList.indexOf(cmd);
                    html += `<div class="command-item ${globalIndex === selectedCommandIndex ? 'selected' : ''}" data-action="${cmd.action}">`;
                    html += `<i class="${cmd.icon}"></i>`;
                    html += `<span>${cmd.name}</span>`;
                    if (cmd.shortcut) {
                        html += `<kbd>${cmd.shortcut}</kbd>`;
                    }
                    html += '</div>';
                });
                html += '</div>';
            }
            
            commandResults.innerHTML = html;
            
            // Add click handlers
            const commandItems = commandResults.querySelectorAll('.command-item');
            commandItems.forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.getAttribute('data-action');
                    const command = commandList.find(cmd => cmd.action === action);
                    executeCommand(command);
                });
            });
        }
        
        function updateSelection() {
            const items = commandResults.querySelectorAll('.command-item');
            items.forEach((item, index) => {
                item.classList.toggle('selected', index === selectedCommandIndex);
            });
        }
        
        function executeCommand(command) {
            if (!command) return;
            
            toggleCommandPalette();
            
            switch (command.action) {
                case 'upload':
                    document.getElementById('upload-btn')?.click();
                    break;
                case 'new-folder':
                    document.getElementById('new-folder-btn')?.click();
                    break;
                case 'search':
                    document.getElementById('search-input')?.focus();
                    break;
                case 'toggle-theme':
                    document.getElementById('theme-toggle')?.click();
                    break;
                case 'goto-collections':
                    document.querySelector('.sidebar-item[href="#"]')?.click();
                    break;
                case 'goto-recent':
                    document.querySelector('.sidebar-item:nth-child(2)')?.click();
                    break;
                case 'goto-favorites':
                    document.querySelector('.sidebar-item:nth-child(3)')?.click();
                    break;
            }
        }
        
        // Expose toggle function globally
        window.toggleCommandPalette = toggleCommandPalette;
    }

    /* ===== Search Suggestions ===== */
    function initSearchSuggestions() {
        const searchInput = document.getElementById('search-input');
        const searchSuggestions = document.getElementById('search-suggestions');
        
        if (!searchInput || !searchSuggestions) return;
        
        let debounceTimer;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();
                
                if (query.length < 2) {
                    searchSuggestions.classList.remove('show');
                    return;
                }
                
                const filtered = searchData.filter(item => 
                    item.name.toLowerCase().includes(query)
                ).slice(0, 5);
                
                if (filtered.length > 0) {
                    renderSuggestions(filtered);
                    searchSuggestions.classList.add('show');
                } else {
                    searchSuggestions.classList.remove('show');
                }
            }, 300);
        });
        
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                searchSuggestions.classList.remove('show');
            }, 200);
        });
        
        function renderSuggestions(suggestions) {
            const html = suggestions.map(item => `
                <div class="suggestion-item" data-name="${item.name}">
                    <i class="suggestion-icon ${item.icon}"></i>
                    <span class="suggestion-text">${item.name}</span>
                    <span class="suggestion-type">${item.type}</span>
                </div>
            `).join('');
            
            searchSuggestions.innerHTML = html;
            
            // Add click handlers
            const suggestionItems = searchSuggestions.querySelectorAll('.suggestion-item');
            suggestionItems.forEach(item => {
                item.addEventListener('click', () => {
                    const name = item.getAttribute('data-name');
                    searchInput.value = name;
                    searchSuggestions.classList.remove('show');
                    // Trigger search
                    searchInput.dispatchEvent(new Event('change'));
                });
            });
        }
    }

    /* ===== Breadcrumb Navigation ===== */
    function initBreadcrumbs() {
        const breadcrumbNav = document.getElementById('breadcrumb-nav');
        if (!breadcrumbNav) return;
        
        // Update breadcrumbs based on current path
        function updateBreadcrumbs(path = 'Collections') {
            const pathParts = path.split('/');
            let html = '';
            
            pathParts.forEach((part, index) => {
                const isLast = index === pathParts.length - 1;
                html += `<div class="breadcrumb-item ${isLast ? 'active' : ''}" data-path="${pathParts.slice(0, index + 1).join('/')}">`;
                if (index === 0) {
                    html += '<i class="fas fa-home"></i>';
                }
                html += `<span>${part}</span>`;
                html += '</div>';
            });
            
            breadcrumbNav.innerHTML = html;
            
            // Add click handlers
            const breadcrumbItems = breadcrumbNav.querySelectorAll('.breadcrumb-item');
            breadcrumbItems.forEach(item => {
                item.addEventListener('click', () => {
                    const path = item.getAttribute('data-path');
                    // Navigate to path (implement based on your routing)
                    console.log('Navigate to:', path);
                });
            });
        }
        
        // Expose function globally
        window.updateBreadcrumbs = updateBreadcrumbs;
    }

    /* ===== Keyboard Shortcuts ===== */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Command palette
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                window.toggleCommandPalette?.();
            }
            
            // Upload
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                document.getElementById('upload-btn')?.click();
            }
            
            // New folder
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                document.getElementById('new-folder-btn')?.click();
            }
            
            // Search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
            
            // Theme toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                document.getElementById('theme-toggle')?.click();
            }
        });
    }

    /* ===== Loading Bar ===== */
    function initLoadingBar() {
        const loadingBar = document.getElementById('loading-bar');
        if (!loadingBar) return;
        
        const loadingProgress = loadingBar.querySelector('.loading-progress');
        
        function showLoading() {
            loadingBar.classList.add('show');
            loadingProgress.style.width = '0%';
        }
        
        function updateLoading(percent) {
            loadingProgress.style.width = `${percent}%`;
        }
        
        function hideLoading() {
            loadingProgress.style.width = '100%';
            setTimeout(() => {
                loadingBar.classList.remove('show');
                loadingProgress.style.width = '0%';
            }, 300);
        }
        
        // Expose functions globally
        window.showLoading = showLoading;
        window.updateLoading = updateLoading;
        window.hideLoading = hideLoading;
        
        // Demo: Show loading on page transitions
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                showLoading();
                // Simulate loading
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 30;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                        hideLoading();
                    }
                    updateLoading(progress);
                }, 100);
            });
        });
    }
})();
