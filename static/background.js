// Background Animation Script
document.addEventListener('DOMContentLoaded', function() {
    // Create background container
    const backgroundContainer = document.createElement('div');
    backgroundContainer.className = 'animated-background';
    document.body.prepend(backgroundContainer);

    // Create floating shapes
    for (let i = 0; i < 3; i++) {
        const shape = document.createElement('div');
        shape.className = `bg-shape shape-${i+1}`;
        backgroundContainer.appendChild(shape);
    }

    // Add grid overlay
    const gridOverlay = document.createElement('div');
    gridOverlay.className = 'grid-overlay';
    document.body.prepend(gridOverlay);

    // Add necessary styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .animated-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, 
                ${document.body.classList.contains('dark-mode') ? '#121212' : '#f8f9fa'} 0%, 
                ${document.body.classList.contains('dark-mode') ? '#1e2838' : '#e9f0f6'} 100%);
            background-size: 400% 400%;
            animation: gradient-shift 15s ease infinite;
            z-index: -10;
        }
        
        @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .bg-shape {
            position: absolute;
            border-radius: 50%;
            opacity: 0.05;
            filter: blur(40px);
        }
        
        .shape-1 {
            width: 400px;
            height: 400px;
            top: -100px;
            right: -100px;
            background: linear-gradient(45deg, #e6f4ff 0%, #0073e6 100%);
            animation: float 20s ease-in-out infinite;
        }
        
        .shape-2 {
            width: 300px;
            height: 300px;
            bottom: -50px;
            left: -50px;
            background: linear-gradient(45deg, #e6f4ff 0%, #fbbc05 100%);
            animation: float 15s ease-in-out infinite reverse;
        }
        
        .shape-3 {
            width: 200px;
            height: 200px;
            top: 40%;
            left: 25%;
            background: linear-gradient(45deg, #fbbc05 0%, #0073e6 100%);
            animation: float 18s ease-in-out infinite 2s;
        }
        
        @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            33% { transform: translate(30px, -50px) rotate(5deg) scale(1.05); }
            66% { transform: translate(-20px, 40px) rotate(-3deg) scale(0.95); }
            100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        
        .grid-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
            background-size: 40px 40px;
            z-index: -5;
            pointer-events: none;
        }
        
        body.dark-mode .grid-overlay {
            background-image: 
                linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
        }
    `;
    document.head.appendChild(styleSheet);

    // Update background with theme changes
    const themeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                const isDarkMode = document.body.classList.contains('dark-mode');
                document.querySelector('.animated-background').style.background = 
                    `linear-gradient(135deg, 
                    ${isDarkMode ? '#121212' : '#f8f9fa'} 0%, 
                    ${isDarkMode ? '#1e2838' : '#e9f0f6'} 100%)`;
            }
        });
    });
    
    themeObserver.observe(document.body, { attributes: true });
});
