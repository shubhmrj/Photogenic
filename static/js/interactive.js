/**
 * PhotoGenic Interactive Page JavaScript
 * Provides enhanced interactivity for the accommodations/interactive page
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Interactive page JS loaded');
    
    // Initialize all components
    initializeRippleEffects();
    initializeCardInteractions();
    setupToastSystem();
    setupScrollAnimation();
    
    // Remove preloader when everything is loaded
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    }, 500);
});

/**
 * Initialize ripple effect for buttons
 */
function initializeRippleEffects() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            // Add loading state for buttons that trigger actions
            if (this.classList.contains('btn-generate') || this.classList.contains('btn-browse')) {
                this.classList.add('loading');
                
                // If it's not a disabled button
                if (!this.classList.contains('disabled-btn')) {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                    
                    // Restore original text after animation (unless navigating away)
                    if (!this.getAttribute('href')) {
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.classList.remove('loading');
                        }, 1500);
                    }
                }
            }
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * Setup interactive card effects
 */
function initializeCardInteractions() {
    const cards = document.querySelectorAll('.room-card');
    
    cards.forEach(card => {
        // Add 3D hover effect
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover');
        });
        
        // Add 3D tilt effect
        card.addEventListener('mousemove', function(e) {
            if (window.innerWidth < 768) return; // Disable on mobile
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const deltaX = (x - centerX) / 20;
            const deltaY = (y - centerY) / 20;
            
            this.style.transform = `perspective(1000px) rotateY(${deltaX}deg) rotateX(${-deltaY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        // Reset transform on mouse leave
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
        
        // Add "How it works" preview
        const cardContent = card.querySelector('.room-content');
        if (cardContent) {
            const roomName = cardContent.querySelector('.room-name').textContent;
            let stepsContent;
            
            // Create different steps based on card type
            if (roomName.includes('AI Driven')) {
                stepsContent = `
                    <div class="preview-step"><span>1</span> Upload your photo</div>
                    <div class="preview-step"><span>2</span> Add optional prompts</div>
                    <div class="preview-step"><span>3</span> Generate your story</div>
                    <div class="preview-step"><span>4</span> Edit and save</div>
                `;
            } else if (roomName.includes('Generic')) {
                stepsContent = `
                    <div class="preview-step"><span>1</span> Browse collection</div>
                    <div class="preview-step"><span>2</span> Select a template</div>
                    <div class="preview-step"><span>3</span> Customize content</div>
                    <div class="preview-step"><span>4</span> Save your creation</div>
                `;
            } else {
                stepsContent = `
                    <div class="preview-step"><span>1</span> Coming soon!</div>
                    <div class="preview-step"><span>2</span> Feature in development</div>
                    <div class="preview-step"><span>3</span> Stay tuned for updates</div>
                `;
            }
            
            const previewOverlay = document.createElement('div');
            previewOverlay.className = 'preview-overlay';
            previewOverlay.innerHTML = `
                <div class="preview-content">
                    <h4>How it works</h4>
                    <div class="preview-steps">
                        ${stepsContent}
                    </div>
                </div>
            `;
            
            card.appendChild(previewOverlay);
            
            // Add "View process" button that shows the overlay
            const viewProcessBtn = document.createElement('button');
            viewProcessBtn.className = 'view-process-btn';
            viewProcessBtn.innerHTML = '<i class="fas fa-info-circle"></i> How it works';
            viewProcessBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                previewOverlay.classList.toggle('active');
            });
            
            // Add close button to overlay
            const closeBtn = document.createElement('button');
            closeBtn.className = 'preview-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                previewOverlay.classList.remove('active');
            });
            previewOverlay.querySelector('.preview-content').appendChild(closeBtn);
            
            cardContent.appendChild(viewProcessBtn);
        }
    });
}

/**
 * Setup toast notification system
 */
function setupToastSystem() {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Add example toast on page load
    setTimeout(() => {
        showToast('Welcome!', 'Explore our AI-powered story generation options', 'info');
    }, 2000);
    
    // Add event listeners to buttons to show toasts
    document.querySelectorAll('.btn-browse').forEach(btn => {
        if (!btn.classList.contains('disabled-btn')) {
            btn.addEventListener('click', function(e) {
                // Only show toast if we're not navigating away
                if (!this.getAttribute('href')) {
                    e.preventDefault();
                    const cardTitle = this.closest('.room-content').querySelector('.room-name').textContent;
                    showToast('Selection', `You selected ${cardTitle}`, 'success');
                }
            });
        }
    });
}

/**
 * Show a toast notification
 */
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add close functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
    
    // Auto close after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

/**
 * Setup scroll animation effects
 */
function setupScrollAnimation() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
    
    // Add animation classes to elements
    document.querySelectorAll('.section-title').forEach(element => {
        element.classList.add('animate-on-scroll');
    });
    
    document.querySelectorAll('.amenity-item').forEach(element => {
        element.classList.add('animate-on-scroll');
    });
}
