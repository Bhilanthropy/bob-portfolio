// Interactive Gradient Background
document.addEventListener('DOMContentLoaded', function() {
    const gradientBg = document.getElementById('gradientBg');
    const clickableArea = document.getElementById('clickableArea');
    
    // Smooth gradient movement on mouse move (desktop only)
    if (gradientBg && window.innerWidth > 768) {
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
            window.location.href = 'account.html';
        });
    }
    
    // Add subtle entrance animation on page load
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Dot Animation System (only on landing page)
    const dotsContainer = document.getElementById('dotsContainer');
    if (dotsContainer) {
        const DOT_SPACING = 30; // Vertical spacing between dots
        const COLUMN_SPACING = 30; // Horizontal spacing between columns
        const ANIMATION_DURATION = 3000; // 3 seconds per journey
        
        let currentColumn = 0;
        let currentRow = 0;
        let maxRows = 0;
        let maxColumns = 0;
        let animationTimeout;
        
        function calculateMaxDots() {
            maxRows = Math.floor(window.innerHeight / DOT_SPACING);
            maxColumns = Math.floor(window.innerWidth / COLUMN_SPACING);
        }
        
        function createDot(column, row) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            
            // Position dot at the start (left edge)
            const yPosition = window.innerHeight - (row * DOT_SPACING) - 50; // Start from bottom
            dot.style.top = `${yPosition}px`;
            dot.style.left = '0px';
            
            // Animate the dot
            dot.style.animation = `dotMove ${ANIMATION_DURATION}ms linear forwards`;
            
            dotsContainer.appendChild(dot);
            
            // Remove dot after animation completes
            setTimeout(() => {
                dot.remove();
            }, ANIMATION_DURATION);
        }
        
        function animateDots() {
            // Create all dots in the current column
            for (let row = 0; row <= currentRow; row++) {
                createDot(currentColumn, row);
            }
            
            // Move to next iteration
            currentRow++;
            
            // Check if column is complete
            if (currentRow > maxRows) {
                currentRow = 0;
                currentColumn++;
                
                // Check if all columns are complete
                if (currentColumn > maxColumns) {
                    // Reset everything and pause before restarting
                    currentColumn = 0;
                    currentRow = 0;
                    dotsContainer.innerHTML = ''; // Clear all dots
                    
                    // Wait 2 seconds before restarting
                    animationTimeout = setTimeout(() => {
                        animateDots();
                    }, 2000);
                    return;
                }
            }
            
            // Continue animation
            animationTimeout = setTimeout(() => {
                animateDots();
            }, ANIMATION_DURATION);
        }
        
        // Initialize and start animation
        calculateMaxDots();
        animateDots();
        
        // Recalculate on window resize
        window.addEventListener('resize', () => {
            calculateMaxDots();
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (animationTimeout) {
                clearTimeout(animationTimeout);
            }
        });
    }
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
