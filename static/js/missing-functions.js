/**
 * PhotoGenic Missing Functions
 * This script adds missing functions referenced in the codebase
 */

(function() {
    console.log("📦 Adding missing functions...");
    
    // Add missing initializeTheme function
    window.initializeTheme = function() {
        console.log("🎨 Theme initialized");
        // Check for dark/light mode preference
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Apply theme based on preference or saved setting
        const savedTheme = localStorage.getItem('theme') || (prefersDarkMode ? 'dark' : 'light');
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        document.body.classList.toggle('light-theme', savedTheme === 'light');
        
        return savedTheme;
    };
    
    // Add missing addModalStyles function
    window.addModalStyles = function() {
        console.log("🎨 Adding modal styles");
        
        // Check if styles already exist
        if (document.getElementById('modal-styles')) {
            return;
        }
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                justify-content: center;
                align-items: center;
            }
            
            .modal.show, .modal.active {
                display: flex !important;
            }
            
            .modal-content {
                background-color: var(--bg-card);
                border-radius: var(--radius-md);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: var(--shadow-lg);
                animation: modal-appear 0.3s ease-out;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .modal-header h3 {
                color: var(--heading-color);
                font-weight: 500;
                margin: 0;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                color: var(--text-color);
                cursor: pointer;
                transition: var(--transition-normal);
            }
            
            .close-modal:hover {
                color: var(--error);
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 15px 20px;
                border-top: 1px solid var(--border-color);
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: var(--text-main);
                font-weight: 500;
            }
            
            .form-group input {
                width: 100%;
                padding: 10px 15px;
                border-radius: var(--radius-sm);
                border: 1px solid var(--border-color);
                background-color: var(--bg-secondary);
                color: var(--text-main);
                font-family: var(--font-main);
                transition: var(--transition-normal);
            }
            
            .form-group input:focus {
                outline: none;
                border-color: var(--accent);
                box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
            }
            
            @keyframes modal-appear {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        
        document.head.appendChild(style);
    };
    
    console.log("✅ Missing functions added successfully");
})();
