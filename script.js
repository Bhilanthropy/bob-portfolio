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
            // Check if user is already logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            
            if (isLoggedIn === 'true') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'account.html';
            }
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
        const COLUMN_SPACING = 40; // Horizontal spacing between columns
        const ANIMATION_DURATION = 2500; // 2.5 seconds per journey
        
        let columns = []; // Track each column's current height
        let maxRows = 0;
        let maxColumns = 0;
        let animationTimeout;
        let currentIteration = 0;
        
        function calculateMaxDots() {
            maxRows = Math.floor(window.innerHeight / DOT_SPACING);
            maxColumns = Math.floor(window.innerWidth / COLUMN_SPACING);
        }
        
        function createDot(column, row) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            
            // Position dot vertically (from bottom)
            const yPosition = window.innerHeight - (row * DOT_SPACING) - 50;
            dot.style.top = `${yPosition}px`;
            dot.style.left = '0px';
            
            // Delay based on column (creates staggered effect)
            const delay = column * 100; // 100ms delay per column
            dot.style.animationDelay = `${delay}ms`;
            dot.style.animation = `dotMove ${ANIMATION_DURATION}ms linear forwards`;
            
            dotsContainer.appendChild(dot);
            
            // Remove dot after animation completes
            setTimeout(() => {
                dot.remove();
            }, ANIMATION_DURATION + delay);
        }
        
        function animateDots() {
            // Create dots for all active columns
            for (let col = 0; col < columns.length; col++) {
                const height = columns[col];
                for (let row = 0; row < height; row++) {
                    createDot(col, row);
                }
            }
            
            currentIteration++;
            
            // Build up existing columns or add new column
            let allColumnsFull = true;
            for (let i = 0; i < columns.length; i++) {
                if (columns[i] < maxRows) {
                    columns[i]++;
                    allColumnsFull = false;
                    break; // Only grow one column at a time
                }
            }
            
            // If all columns are full but we haven't reached max columns, add new column
            if (allColumnsFull && columns.length < maxColumns) {
                columns.push(1); // Start new column with 1 dot
                allColumnsFull = false;
            }
            
            // If all columns are full and we've reached max columns, reset
            if (allColumnsFull && columns.length >= maxColumns) {
                currentIteration = 0;
                columns = [];
                dotsContainer.innerHTML = '';
                
                // Wait 2 seconds before restarting
                animationTimeout = setTimeout(() => {
                    columns = [1]; // Start with first column, 1 dot
                    animateDots();
                }, 2000);
                return;
            }
            
            // Continue animation
            animationTimeout = setTimeout(() => {
                animateDots();
            }, ANIMATION_DURATION);
        }
        
        // Initialize and start animation
        calculateMaxDots();
        columns = [1]; // Start with first column, 1 dot
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
