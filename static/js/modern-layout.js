/**
 * Modern Layout JavaScript
 * Handles core interactions for the modern PhotoGeni interface
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeSidebar();
  initializeThemeToggle();
  initializeFloatingActionButton();
  initializeTooltips();
  initializeDropdowns();
  initializeRippleEffect();
  initializeShortcutsListener();
});

/**
 * Initialize sidebar collapsible functionality
 */
function initializeSidebar() {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.app-sidebar');
  const sidebarCollapseState = localStorage.getItem('sidebar-collapsed');
  
  // Set initial state based on saved preference
  if (sidebarCollapseState === 'true') {
    sidebar.classList.add('collapsed');
  }
  
  // Toggle sidebar on button click
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    });
  }
  
  // Mobile sidebar toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('visible');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && 
          sidebar.classList.contains('visible') && 
          !sidebar.contains(e.target) && 
          !mobileMenuToggle.contains(e.target)) {
        sidebar.classList.remove('visible');
      }
    });
  }
}

/**
 * Initialize theme toggle functionality
 */
function initializeThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = localStorage.getItem('theme');
  
  // Set theme based on saved preference or system preference
  if (currentTheme === 'light') {
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
  } else if (currentTheme === 'dark') {
    document.body.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
  }
  
  // Toggle theme on button click
  if (themeToggle) {
    // Update icon based on current theme
    updateThemeIcon();
    
    themeToggle.addEventListener('click', () => {
      if (document.body.classList.contains('theme-light')) {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        localStorage.setItem('theme', 'light');
      }
      
      // Update icon after theme change
      updateThemeIcon();
    });
  }
  
  function updateThemeIcon() {
    const iconElement = themeToggle.querySelector('i');
    if (!iconElement) return;
    
    if (document.body.classList.contains('theme-light')) {
      iconElement.className = 'ri-moon-line';
      themeToggle.setAttribute('aria-label', 'Switch to dark mode');
      themeToggle.setAttribute('title', 'Switch to dark mode');
    } else {
      iconElement.className = 'ri-sun-line';
      themeToggle.setAttribute('aria-label', 'Switch to light mode');
      themeToggle.setAttribute('title', 'Switch to light mode');
    }
  }
}

/**
 * Initialize floating action button functionality
 */
function initializeFloatingActionButton() {
  const fab = document.querySelector('.fab');
  if (!fab) return;
  
  // Toggle the FAB menu on click
  fab.addEventListener('click', function(e) {
    if (e.target !== this && !e.target.classList.contains('fab-icon')) {
      return; // Don't toggle if clicking on an action
    }
    
    this.classList.toggle('open');
    
    // Toggle aria-expanded attribute for accessibility
    const isOpen = this.classList.contains('open');
    this.setAttribute('aria-expanded', isOpen);
    
    // Close the FAB menu when clicking outside
    if (isOpen) {
      const closeOnClickOutside = (event) => {
        if (!fab.contains(event.target)) {
          fab.classList.remove('open');
          fab.setAttribute('aria-expanded', false);
          document.removeEventListener('click', closeOnClickOutside);
        }
      };
      
      // Add the listener with a slight delay to avoid immediate triggering
      setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
      }, 10);
    }
  });
  
  // Handle fab action clicks
  const fabActions = document.querySelectorAll('.fab-action');
  fabActions.forEach(action => {
    action.addEventListener('click', function(e) {
      const actionType = this.getAttribute('data-action');
      
      switch(actionType) {
        case 'upload':
          showUploadModal();
          break;
        case 'new-folder':
          showNewFolderModal();
          break;
        case 'capture':
          showCaptureModal();
          break;
        case 'scan':
          showScanModal();
          break;
        default:
          console.log('Action not implemented:', actionType);
      }
      
      // Close the FAB menu after selecting an action
      fab.classList.remove('open');
      fab.setAttribute('aria-expanded', false);
    });
  });
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
  const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
  
  tooltipTriggers.forEach(trigger => {
    const tooltipText = trigger.getAttribute('data-tooltip');
    const tooltipPosition = trigger.getAttribute('data-tooltip-position') || 'top';
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip-content tooltip-${tooltipPosition}`;
    tooltip.textContent = tooltipText;
    
    // Add ARIA attributes for accessibility
    trigger.setAttribute('aria-label', tooltipText);
    
    // Add tooltip to trigger
    trigger.classList.add('tooltip');
    trigger.appendChild(tooltip);
  });
}

/**
 * Initialize dropdowns
 */
function initializeDropdowns() {
  const dropdownTriggers = document.querySelectorAll('[data-dropdown]');
  
  dropdownTriggers.forEach(trigger => {
    const dropdownId = trigger.getAttribute('data-dropdown');
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    // Toggle dropdown on click
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Close all other dropdowns first
      document.querySelectorAll('.dropdown.show').forEach(openDropdown => {
        if (openDropdown.id !== dropdownId) {
          openDropdown.classList.remove('show');
        }
      });
      
      // Toggle this dropdown
      dropdown.classList.toggle('show');
      
      // Toggle aria-expanded attribute for accessibility
      const isExpanded = dropdown.classList.contains('show');
      trigger.setAttribute('aria-expanded', isExpanded);
      
      if (isExpanded) {
        // Set position based on available space
        positionDropdown(dropdown, trigger);
        
        // Close dropdown when clicking outside
        const closeDropdown = (event) => {
          if (!dropdown.contains(event.target) && !trigger.contains(event.target)) {
            dropdown.classList.remove('show');
            trigger.setAttribute('aria-expanded', false);
            document.removeEventListener('click', closeDropdown);
          }
        };
        
        setTimeout(() => {
          document.addEventListener('click', closeDropdown);
        }, 10);
      }
    });
  });
  
  function positionDropdown(dropdown, trigger) {
    // Reset position to calculate proper dimensions
    dropdown.style.top = '';
    dropdown.style.bottom = '';
    dropdown.style.left = '';
    dropdown.style.right = '';
    
    const triggerRect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Check if dropdown would go off bottom of screen
    if (triggerRect.bottom + dropdownRect.height > viewportHeight) {
      dropdown.style.bottom = (viewportHeight - triggerRect.top) + 'px';
    } else {
      dropdown.style.top = triggerRect.bottom + 'px';
    }
    
    // Check if dropdown would go off right of screen
    if (triggerRect.left + dropdownRect.width > viewportWidth) {
      dropdown.style.right = '0';
    } else {
      dropdown.style.left = triggerRect.left + 'px';
    }
  }
}

/**
 * Add ripple effect to buttons
 */
function initializeRippleEffect() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Don't add ripple if button is disabled
      if (this.disabled) return;
      
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      this.appendChild(ripple);
      
      // Position the ripple
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      
      // Remove the ripple after animation completes
      ripple.addEventListener('animationend', function() {
        this.remove();
      });
    });
  });
}

/**
 * Show a toast notification
 * @param {string} type - Type of toast: success, error, warning, info
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in milliseconds (0 for persistent)
 * @returns {string} - Toast ID
 */
function showToast(type, title, message, duration = 5000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Generate unique ID
  const toastId = 'toast-' + Date.now();
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast toast-${type}`;
  
  // Toast content
  let iconClass = 'ri-information-line';
  if (type === 'success') iconClass = 'ri-check-line';
  if (type === 'error') iconClass = 'ri-error-warning-line';
  if (type === 'warning') iconClass = 'ri-alert-line';
  
  toast.innerHTML = `
    <div class="toast-icon"><i class="${iconClass}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <p class="toast-message">${message}</p>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;
  
  // Add progress bar for timed toasts
  if (duration > 0) {
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.style.width = '100%';
    progress.style.transition = `width ${duration}ms linear`;
    toast.appendChild(progress);
    
    // Start progress animation after a short delay
    setTimeout(() => {
      progress.style.width = '0%';
    }, 10);
  }
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Close toast on button click
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    closeToast(toast);
  });
  
  // Auto close after duration (if not persistent)
  if (duration > 0) {
    setTimeout(() => {
      closeToast(toast);
    }, duration);
  }
  
  // Add keyboard support (Esc to close)
  toast.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeToast(toast);
    }
  });
  
  return toastId;
}

/**
 * Close a toast notification
 * @param {HTMLElement} toast - Toast element to close
 */
function closeToast(toast) {
  if (!toast) return;
  
  // Add closing animation class
  toast.classList.add('toast-closing');
  
  // Remove after animation completes
  toast.addEventListener('animationend', function() {
    toast.remove();
    
    // Remove container if empty
    const container = document.querySelector('.toast-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, { once: true });
}

/**
 * Show a modal dialog
 * @param {string} id - Modal ID to show
 */
function showModal(id) {
  const modalOverlay = document.getElementById(id);
  if (!modalOverlay) return;
  
  // Show the modal
  modalOverlay.classList.add('active');
  
  // Find the dialog element and set focus to first focusable element
  const dialog = modalOverlay.querySelector('.modal-dialog');
  if (dialog) {
    // Set focus to first focusable element
    const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) {
      focusable[0].focus();
    }
    
    // Close with escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal(id);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Close when clicking outside dialog
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal(id);
      }
    });
    
    // Remove event listeners when modal is closed
    modalOverlay.addEventListener('transitionend', function onTransitionEnd() {
      if (!modalOverlay.classList.contains('active')) {
        document.removeEventListener('keydown', handleEscape);
        modalOverlay.removeEventListener('transitionend', onTransitionEnd);
      }
    });
  }
}

/**
 * Close a modal dialog
 * @param {string} id - Modal ID to close
 */
function closeModal(id) {
  const modalOverlay = document.getElementById(id);
  if (!modalOverlay) return;
  
  modalOverlay.classList.remove('active');
}

/**
 * Initialize keyboard shortcuts listener
 */
function initializeShortcutsListener() {
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts when inside input fields
    if (e.target.matches('input, textarea, select, [contenteditable]')) return;
    
    // ? key shows keyboard shortcuts help
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      showKeyboardShortcutsModal();
    }
    
    // Ctrl+/ toggles sidebar
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const sidebar = document.querySelector('.app-sidebar');
      if (sidebar) {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
      }
    }
    
    // Keyboard navigation for collection grid
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const grid = document.querySelector('.collections-grid');
      if (grid && document.activeElement.closest('.collections-grid')) {
        navigateCollectionGrid(e.key);
        e.preventDefault();
      }
    }
  });
}

/**
 * Navigate through collection grid with keyboard
 * @param {string} key - Arrow key pressed
 */
function navigateCollectionGrid(key) {
  const items = Array.from(document.querySelectorAll('.collection-card'));
  const currentItem = document.activeElement.closest('.collection-card');
  if (!currentItem || !items.length) return;
  
  const currentIndex = items.indexOf(currentItem);
  const columns = getComputedStyle(document.querySelector('.collections-grid'))
    .gridTemplateColumns.split(' ').length;
  
  let nextIndex;
  
  switch (key) {
    case 'ArrowRight':
      nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) nextIndex = 0;
      break;
    case 'ArrowLeft':
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = items.length - 1;
      break;
    case 'ArrowDown':
      nextIndex = currentIndex + columns;
      if (nextIndex >= items.length) nextIndex = nextIndex % items.length;
      break;
    case 'ArrowUp':
      nextIndex = currentIndex - columns;
      if (nextIndex < 0) nextIndex = items.length + nextIndex;
      break;
  }
  
  if (nextIndex !== undefined && items[nextIndex]) {
    items[nextIndex].focus();
  }
}

/**
 * Show keyboard shortcuts modal
 */
function showKeyboardShortcutsModal() {
  // Create modal if it doesn't exist
  let shortcutsModal = document.getElementById('shortcuts-modal');
  
  if (!shortcutsModal) {
    shortcutsModal = document.createElement('div');
    shortcutsModal.id = 'shortcuts-modal';
    shortcutsModal.className = 'modal-overlay shortcuts-dialog';
    
    shortcutsModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Keyboard Shortcuts</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-section">
            <h4 class="shortcuts-section-title">Navigation</h4>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <span>Toggle sidebar</span>
                <span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>/</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Show shortcuts</span>
                <span class="shortcut-keys"><kbd>?</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Navigate files</span>
                <span class="shortcut-keys"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Go to parent folder</span>
                <span class="shortcut-keys"><kbd>Backspace</kbd></span>
              </div>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h4 class="shortcuts-section-title">Actions</h4>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <span>Upload files</span>
                <span class="shortcut-keys"><kbd>U</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>New folder</span>
                <span class="shortcut-keys"><kbd>N</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Select all</span>
                <span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>A</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Delete selected</span>
                <span class="shortcut-keys"><kbd>Delete</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Rename</span>
                <span class="shortcut-keys"><kbd>F2</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Copy</span>
                <span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>C</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Cut</span>
                <span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>X</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Paste</span>
                <span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>V</kbd></span>
              </div>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h4 class="shortcuts-section-title">View</h4>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <span>Grid view</span>
                <span class="shortcut-keys"><kbd>G</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>List view</span>
                <span class="shortcut-keys"><kbd>L</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Refresh</span>
                <span class="shortcut-keys"><kbd>F5</kbd></span>
              </div>
              <div class="shortcut-item">
                <span>Search</span>
                <span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>F</kbd></span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary close-shortcuts-btn">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(shortcutsModal);
    
    // Add close functionality
    const closeBtn = shortcutsModal.querySelector('.modal-close');
    const closeFooterBtn = shortcutsModal.querySelector('.close-shortcuts-btn');
    
    closeBtn.addEventListener('click', () => {
      closeModal('shortcuts-modal');
    });
    
    closeFooterBtn.addEventListener('click', () => {
      closeModal('shortcuts-modal');
    });
  }
  
  // Show the modal
  showModal('shortcuts-modal');
}
