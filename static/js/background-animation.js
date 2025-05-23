/**
 * Enhanced Background Animation for AI Features Page
 * Creates a dynamic, animated background with floating shapes, particles, and interactive elements
 */

// Initialize the background animation
function initBackgroundAnimation() {
    const canvas = document.getElementById('particles-bg');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full window size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Initialize canvas size
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Animation properties
    const particleCount = 100;
    const particles = [];
    const connectionDistance = 150;
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Colors based on theme
    const colors = {
        light: {
            primary: '#0073e6',
            secondary: '#00c6ff',
            accent: '#6366F1',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)'
        },
        dark: {
            primary: '#1a91ff',
            secondary: '#38d2ff',
            accent: '#818cf8',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)'
        }
    };
    
    // Use theme colors
    const theme = isDarkMode ? colors.dark : colors.light;
    
    // Update canvas background
    canvas.style.background = theme.background;
    
    // Mouse position for interaction
    let mouseX = null;
    let mouseY = null;
    
    // Track mouse movement
    window.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Floating shapes (decorative elements)
    const shapes = [];
    const shapeCount = 5;
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            
            // Use a gradient of colors between primary and secondary
            const colorRatio = Math.random();
            const primaryRgb = hexToRgb(theme.primary);
            const secondaryRgb = hexToRgb(theme.secondary);
            
            const r = parseInt(primaryRgb.r * (1 - colorRatio) + secondaryRgb.r * colorRatio);
            const g = parseInt(primaryRgb.g * (1 - colorRatio) + secondaryRgb.g * colorRatio);
            const b = parseInt(primaryRgb.b * (1 - colorRatio) + secondaryRgb.b * colorRatio);
            
            this.color = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.5 + 0.2})`;
        }
        
        update() {
            // Apply mouse attraction for interactivity
            if (mouseX && mouseY) {
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    const forceDirectionX = dx / dist;
                    const forceDirectionY = dy / dist;
                    const force = (120 - dist) / 120;
                    
                    this.vx += forceDirectionX * force * 0.02;
                    this.vy += forceDirectionY * force * 0.02;
                }
            }
            
            // Apply velocity
            this.x += this.vx;
            this.y += this.vy;
            
            // Add slight random movement
            this.vx += (Math.random() - 0.5) * 0.01;
            this.vy += (Math.random() - 0.5) * 0.01;
            
            // Apply friction to slow down
            this.vx *= 0.98;
            this.vy *= 0.98;
            
            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) {
                this.vx = -this.vx;
            }
            
            if (this.y < 0 || this.y > canvas.height) {
                this.vy = -this.vy;
            }
            
            // Make sure particles stay within bounds
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Shape class for floating design elements
    class Shape {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.size = Math.random() * 80 + 40;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.002;
            this.type = Math.floor(Math.random() * 3); // 0: square, 1: circle, 2: triangle
            
            // Opacity based on theme
            this.opacity = isDarkMode ? 
                Math.random() * 0.06 + 0.02 : 
                Math.random() * 0.08 + 0.02;
            
            // Choose color
            const colors = [theme.primary, theme.secondary, theme.accent];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        
        update() {
            // Move the shape
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            
            // Bounce off edges with padding
            const padding = this.size;
            
            if (this.x < -padding || this.x > canvas.width + padding) {
                this.vx = -this.vx;
            }
            
            if (this.y < -padding || this.y > canvas.height + padding) {
                this.vy = -this.vy;
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            
            switch(this.type) {
                case 0: // Square
                    ctx.fillStyle = this.color;
                    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                    break;
                case 1: // Circle
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    break;
                case 2: // Triangle
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size/2);
                    ctx.lineTo(this.size/2, this.size/2);
                    ctx.lineTo(-this.size/2, this.size/2);
                    ctx.closePath();
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    // Initialize particles
    function initParticles() {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // Initialize shapes
    function initShapes() {
        for (let i = 0; i < shapeCount; i++) {
            shapes.push(new Shape());
        }
    }
    
    // Draw connections between particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < connectionDistance) {
                    // Opacity based on distance
                    const opacity = 1 - (distance / connectionDistance);
                    const primaryRgb = hexToRgb(theme.primary);
                    
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${opacity * 0.15})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }
    
    // Draw subtle grid overlay for a professional look
    function drawGrid() {
        const gridSize = 30;
        
        ctx.strokeStyle = isDarkMode 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Animation loop
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid first (bottom layer)
        drawGrid();
        
        // Draw shapes (middle layer)
        for (let i = 0; i < shapes.length; i++) {
            shapes[i].update();
            shapes[i].draw();
        }
        
        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        
        // Draw connections between particles
        drawConnections();
        
        // Draw the particles on top of connections
        for (let i = 0; i < particles.length; i++) {
            particles[i].draw();
        }
        
        // Continue animation loop
        requestAnimationFrame(animate);
    }
    
    // Start animation
    initParticles();
    initShapes();
    animate();
}

// Check for dark mode changes and update background
document.addEventListener('themeChange', function(e) {
    // Reinitialize the background when theme changes
    const canvas = document.getElementById('particles-bg');
    if (canvas) {
        initBackgroundAnimation();
    }
});

// Allow global access
window.initBackgroundAnimation = initBackgroundAnimation;
