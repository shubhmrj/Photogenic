/**
 * PhotoGeni AI Features JavaScript
 * Handles all AI features interactions, animations, and functionality
 */

// Initialize when the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI Features JS loaded');
    
    try {
        // Initialize all components
        initializeButtons();
        setupCardInteractions();
        initializeCommandPalette();
        initializeContextMenu();
        setupAnimations();
        
        // Add feature badges
        addFeatureBadges();
    } catch (error) {
        console.error('Error initializing AI features:', error);
    }
});

/**
 * Initialize button interactions with enhanced effects
 */
function initializeButtons() {
    console.log('Initializing button handlers');
    
    // Get all feature buttons
    const featureButtons = document.querySelectorAll('.feature-action .btn');
    
    featureButtons.forEach(button => {
        // Add ripple effect
        button.addEventListener('click', createRippleEffect);
        
        // Set up specific button actions
        const action = button.getAttribute('data-action');
        
        if (action === 'try') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const featureId = this.closest('.feature-row-item')?.id;
                if (featureId) {
                    launchFeature(featureId);
                }
            });
        } else if (action === 'info') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const featureId = this.closest('.feature-row-item')?.id;
                if (featureId) {
                    showFeatureInfo(featureId);
                }
            });
        }
    });
}

/**
 * Create ripple effect on button click
 */
function createRippleEffect(event) {
    const button = event.currentTarget;
    
    // Remove any existing ripple
    const existingRipple = button.querySelector('.ripple-effect');
    if (existingRipple) {
        existingRipple.remove();
    }
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    
    // Calculate position
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    // Apply position and size
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // Add to button
    button.appendChild(ripple);
    
    // Clean up after animation completes
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

/**
 * Setup card interactions for better UX
 */
function setupCardInteractions() {
    const featureCards = document.querySelectorAll('.feature-row-item');
    
    featureCards.forEach(card => {
        // Add hover interactions
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover');
            const details = card.querySelector('.feature-details');
            if (details) details.classList.add('highlight');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover');
            const details = card.querySelector('.feature-details');
            if (details) details.classList.remove('highlight');
        });
        
        // Add 3D tilt effect
        card.addEventListener('mousemove', handleCardTilt);
        card.addEventListener('mouseleave', resetCardTilt);
        
        // Handle card click
        card.addEventListener('click', function(e) {
            // Prevent click if it's on a button or action element
            if (e.target.closest('.feature-action') || e.target.closest('.btn')) {
                return;
            }
            
            // Otherwise toggle details
            const details = this.querySelector('.feature-details');
            if (details) {
                details.classList.toggle('expanded');
            }
        });
    });
}

/**
 * Handle 3D card tilt effect
 */
function handleCardTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPercent = (x / rect.width - 0.5) * 2; // -1 to 1
    const yPercent = (y / rect.height - 0.5) * 2; // -1 to 1
    
    // Apply tilt
    card.style.transform = `perspective(1000px) rotateY(${xPercent * 5}deg) rotateX(${-yPercent * 5}deg) scale3d(1.02, 1.02, 1.02)`;
}

/**
 * Reset card tilt
 */
function resetCardTilt(e) {
    e.currentTarget.style.transform = '';
}

/**
 * Launch a specific AI feature
 */
function launchFeature(featureId) {
    // Map of feature IDs to their routes
    const featureRoutes = {
        'stories-card': '/ai/stories',
        'face-recognition-card': '/ai/faces',
        'style-transfer-card': '/ai/style-transfer',
        'image-generation-card': '/ai/generate',
        'video-enhancement-card': '/ai/video',
        'animation-card': '/ai/animation'
    };
    
    const route = featureRoutes[featureId];
    if (route) {
        showNotification('Loading Feature', `Launching ${featureId.replace('-card', '').replace(/-/g, ' ')}...`, 'info');
        
        // Add loading state to button
        const button = document.querySelector(`#${featureId} .btn[data-action="try"]`);
        if (button) {
            button.classList.add('loading');
            
            // Simulate loading time then navigate
            setTimeout(() => {
                window.location.href = route;
            }, 800);
        } else {
            window.location.href = route;
        }
    } else {
        showNotification('Feature Unavailable', 'This feature is coming soon!', 'warning');
    }
}

/**
 * Show detailed information about a feature
 */
function showFeatureInfo(featureId) {
    // Get feature name from ID
    const featureName = featureId.replace('-card', '').replace(/-/g, ' ');
    const featureTitle = featureName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    showNotification('Feature Info', `More information about ${featureTitle}`, 'info');
    
    // TODO: Show modal with detailed feature information
}

/**
 * Add feature badges to some cards for visual enhancement
 */
function addFeatureBadges() {
    const badges = {
        'stories-card': 'New',
        'face-recognition-card': 'Popular',
        'image-generation-card': 'Hot',
        'animation-card': 'Beta'
    };
    
    for (const [cardId, badgeText] of Object.entries(badges)) {
        const card = document.getElementById(cardId);
        if (card) {
            // Check if badge already exists
            if (!card.querySelector('.feature-badge')) {
                const badge = document.createElement('div');
                badge.className = `feature-badge badge-${badgeText.toLowerCase()}`;
                badge.textContent = badgeText;
                
                // Add after the image
                const image = card.querySelector('.feature-image');
                if (image) {
                    safeAppend(image, badge);
                } else {
                    safeAppend(card, badge);
                }
            }
        }
    }
}

// Make all DOM manipulations safe by checking for null elements
function safeAppend(parent, child) {
    if (parent && child) {
        parent.appendChild(child);
        return true;
    }
    return false;
}

/**
 * Initialize command palette functionality
 */
function initializeCommandPalette() {
    const commandPalette = {
        overlay: document.getElementById('command-palette-overlay'),
        input: document.getElementById('command-input'),
        resultsList: document.getElementById('command-results'),
        isOpen: false,
        
        init: function() {
            // Setup keyboard shortcuts
            document.addEventListener('keydown', e => {
                // Ctrl/Cmd + K to open command palette
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.toggle();
                }
                
                // Escape to close if open
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
            
            // Close button
            const closeBtn = document.getElementById('command-palette-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
            
            // Click outside to close
            this.overlay.addEventListener('click', e => {
                if (e.target === this.overlay) this.close();
            });
            
            // Input handling
            if (this.input) {
                this.input.addEventListener('input', () => this.filterCommands());
            }
        },
        
        toggle: function() {
            if (this.isOpen) this.close();
            else this.open();
        },
        
        open: function() {
            this.overlay.classList.add('show');
            this.isOpen = true;
            if (this.input) {
                this.input.value = '';
                this.input.focus();
                this.filterCommands();
            }
        },
        
        close: function() {
            this.overlay.classList.remove('show');
            this.isOpen = false;
        },
        
        filterCommands: function() {
            // TODO: Implement command filtering based on input
        }
    };
    
    // Initialize command palette
    commandPalette.init();
}

/**
 * Initialize context menu functionality
 */
function initializeContextMenu() {
    const contextMenu = {
        menu: document.getElementById('context-menu'),
        activeTarget: null,
        
        init: function() {
            // Add context menu event listeners
            document.querySelectorAll('.feature-row-item').forEach(card => {
                card.addEventListener('contextmenu', e => this.handleContextMenu(e, card));
            });
            
            // Close menu when clicking elsewhere
            document.addEventListener('click', () => this.hideMenu());
            document.addEventListener('contextmenu', e => {
                if (!e.target.closest('.feature-row-item')) {
                    this.hideMenu();
                }
            });
            
            // Handle menu item clicks
            this.menu.addEventListener('click', e => this.handleMenuItemClick(e));
        },
        
        handleContextMenu: function(e, target) {
            e.preventDefault();
            this.activeTarget = target;
            
            // Position menu at cursor
            this.menu.style.top = `${e.clientY}px`;
            this.menu.style.left = `${e.clientX}px`;
            this.menu.classList.add('show');
            
            // Adjust if menu goes off-screen
            const menuRect = this.menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (menuRect.right > viewportWidth) {
                this.menu.style.left = `${e.clientX - menuRect.width}px`;
            }
            
            if (menuRect.bottom > viewportHeight) {
                this.menu.style.top = `${e.clientY - menuRect.height}px`;
            }
        },
        
        hideMenu: function() {
            this.menu.classList.remove('show');
            this.activeTarget = null;
        },
        
        handleMenuItemClick: function(e) {
            e.preventDefault();
            const action = e.target.closest('[data-action]')?.getAttribute('data-action');
            
            if (action && this.activeTarget) {
                const featureId = this.activeTarget.id;
                
                switch (action) {
                    case 'open':
                        launchFeature(featureId);
                        break;
                    case 'info':
                        showFeatureInfo(featureId);
                        break;
                    case 'share':
                        this.shareFeature(featureId);
                        break;
                    case 'favorite':
                        this.toggleFavorite(featureId);
                        break;
                }
            }
            
            this.hideMenu();
        },
        
        shareFeature: function(featureId) {
            // Get feature name for sharing
            const featureName = featureId.replace('-card', '').replace(/-/g, ' ');
            const featureTitle = featureName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            showNotification('Share', `Sharing ${featureTitle}`, 'info');
            // TODO: Implement actual sharing functionality
        },
        
        toggleFavorite: function(featureId) {
            // Get feature name
            const featureName = featureId.replace('-card', '').replace(/-/g, ' ');
            const featureTitle = featureName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            showNotification('Favorites', `Added ${featureTitle} to favorites`, 'success');
            // TODO: Implement actual favorite functionality
        }
    };
    
    // Initialize context menu
    contextMenu.init();
}

/**
 * Setup card animations
 */
function setupAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all feature cards
    document.querySelectorAll('.feature-row-item').forEach(card => {
        observer.observe(card);
    });
}

/**
 * Show a toast notification
 */
function showNotification(title, message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        safeAppend(document.body, toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    // Set content
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    safeAppend(toastContainer, toast);
    
    // Add close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
    
    // Auto close after duration
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// For backward compatibility
function showToast(message, type = 'info') {
    showNotification(type.charAt(0).toUpperCase() + type.slice(1), message, type);
}

// Toggle like functionality
function toggleLike(element, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const icon = element.querySelector('i');
    const likeCount = element.querySelector('.like-count');
    
    if (icon.classList.contains('far')) {
        // Like
        icon.classList.replace('far', 'fas');
        icon.classList.add('liked');
        likeCount.textContent = parseInt(likeCount.textContent) + 1;
        showNotification('Liked', 'Added to your favorites', 'success');
    } else {
        // Unlike
        icon.classList.replace('fas', 'far');
        icon.classList.remove('liked');
        likeCount.textContent = parseInt(likeCount.textContent) - 1;
        showNotification('Removed', 'Removed from your favorites', 'info');
    }
}
