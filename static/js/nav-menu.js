document.addEventListener('DOMContentLoaded', function() {
    // Set active class based on current URL
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath === linkPath) {
            link.classList.add('active');
        }
        
        // Add subtle animation on hover
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add scroll effect to navigation
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('.main-nav');
        if (window.scrollY > 50) {
            nav.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
            nav.style.padding = '10px 0';
        } else {
            nav.style.backgroundColor = 'rgba(50, 50, 50, 0.85)';
            nav.style.padding = '15px 0';
        }
    });
});
