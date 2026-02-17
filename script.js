// Interactive Gradient Background
document.addEventListener('DOMContentLoaded', function() {
    const gradientBg = document.getElementById('gradientBg');
    const clickableArea = document.getElementById('clickableArea');
    
    // Smooth gradient movement on mouse move
    if (gradientBg) {
        let targetX = 50;
        let targetY = 50;
        let currentX = 50;
        let currentY = 50;
        
        document.addEventListener('mousemove', function(e) {
            // Convert mouse position to percentage
            targetX = (e.clientX / window.innerWidth) * 100;
            targetY = (e.clientY / window.innerHeight) * 100;
        });
        
        // Smooth animation loop
        function animateGradient() {
            // Lerp (linear interpolation) for smooth following
            currentX += (targetX - currentX) * 0.05;
            currentY += (targetY - currentY) * 0.05;
            
            // Update gradient position
            gradientBg.style.backgroundPosition = `${currentX}% ${currentY}%`;
            
            requestAnimationFrame(animateGradient);
        }
        
        animateGradient();
    }
    
    // Landing page click to navigate
    if (clickableArea) {
        clickableArea.addEventListener('click', function() {
            window.location.href = 'contact.html';
        });
    }
    
    // Add subtle entrance animation on page load
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Prevent form submission before Formspree ID is configured
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form');
    if (form && form.action.includes('YOUR_FORM_ID')) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Please configure your Formspree Form ID in contact.html first!\n\nSee the setup instructions in README.md');
        });
    }
});
