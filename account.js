// Account Creation and Theme Selection Logic
document.addEventListener('DOMContentLoaded', function() {
    const accountForm = document.getElementById('accountForm');
    const themeGrid = document.getElementById('themeGrid');
    const themeCount = document.getElementById('themeCount');
    const avatarPreview = document.getElementById('avatarPreview');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const welcomeModal = document.getElementById('welcomeModal');
    
    if (!accountForm) return; // Only run on account page
    
    // Check if already logged in - redirect to dashboard
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    let selectedThemes = [];
    const MAX_THEMES = 3;
    
    // Theme color palettes (random colors for each theme)
    const themeColors = {
        'basic-needs': ['#8B4513', '#CD853F', '#DEB887'],
        'health': ['#DC143C', '#FF6B6B', '#FFB6C1'],
        'education': ['#4169E1', '#6495ED', '#87CEEB'],
        'environment': ['#228B22', '#32CD32', '#90EE90'],
        'animals': ['#8B4789', '#9370DB', '#BA55D3'],
        'children': ['#FFD700', '#FFA500', '#FF8C00'],
        'human-rights': ['#000000', '#696969', '#A9A9A9'],
        'community': ['#FF69B4', '#FF1493', '#C71585'],
        'culture': ['#DAA520', '#B8860B', '#CD853F'],
        'technology': ['#00CED1', '#20B2AA', '#48D1CC'],
        'freedom': ['#FF4500', '#FF6347', '#FF7F50']
    };
    
    // Theme card click handler
    themeGrid.addEventListener('click', function(e) {
        const card = e.target.closest('.theme-card');
        if (!card) return;
        
        const theme = card.dataset.theme;
        const isSelected = card.classList.contains('selected');
        
        if (isSelected) {
            // Deselect theme
            card.classList.remove('selected');
            selectedThemes = selectedThemes.filter(t => t !== theme);
            enableAllCards();
        } else {
            // Select theme (if under limit)
            if (selectedThemes.length < MAX_THEMES) {
                card.classList.add('selected');
                selectedThemes.push(theme);
                
                // Disable other cards if max reached
                if (selectedThemes.length === MAX_THEMES) {
                    disableUnselectedCards();
                }
            }
        }
        
        updateThemeCount();
        updateProfilePreview();
        updateCreateButton();
    });
    
    function enableAllCards() {
        const cards = themeGrid.querySelectorAll('.theme-card');
        cards.forEach(card => {
            card.classList.remove('disabled');
        });
    }
    
    function disableUnselectedCards() {
        const cards = themeGrid.querySelectorAll('.theme-card');
        cards.forEach(card => {
            if (!card.classList.contains('selected')) {
                card.classList.add('disabled');
            }
        });
    }
    
    function updateThemeCount() {
        themeCount.textContent = selectedThemes.length;
    }
    
    function updateCreateButton() {
        // Enable button only if 3 themes selected
        if (selectedThemes.length === MAX_THEMES) {
            createAccountBtn.disabled = false;
        } else {
            createAccountBtn.disabled = true;
        }
    }
    
    function updateProfilePreview() {
        if (selectedThemes.length === 0) {
            avatarPreview.classList.remove('has-themes');
            avatarPreview.innerHTML = '';
            avatarPreview.style.removeProperty('--theme-color-1');
            avatarPreview.style.removeProperty('--theme-color-2');
            avatarPreview.style.removeProperty('--theme-color-3');
            return;
        }
        
        // Generate avatar based on selected themes
        const colors = selectedThemes.map(theme => {
            const palette = themeColors[theme];
            return palette[Math.floor(Math.random() * palette.length)];
        });
        
        // Set CSS variables for gradient
        avatarPreview.style.setProperty('--theme-color-1', colors[0] || '#ccc');
        avatarPreview.style.setProperty('--theme-color-2', colors[1] || '#999');
        avatarPreview.style.setProperty('--theme-color-3', colors[2] || '#666');
        
        avatarPreview.classList.add('has-themes');
        
        // Generate geometric pattern
        generateAvatarPattern(avatarPreview, colors, selectedThemes);
    }
    
    function generateAvatarPattern(container, colors, themes) {
        // Create unique pattern based on themes
        const seed = themes.join('-');
        const hash = simpleHash(seed);
        
        // Clear previous pattern
        container.innerHTML = '';
        
        // Create SVG pattern
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '120');
        svg.setAttribute('height', '120');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        
        // Add circles based on theme count and hash
        for (let i = 0; i < 5; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const size = 20 + ((hash + i * 17) % 40);
            const x = ((hash + i * 23) % 100) + 10;
            const y = ((hash + i * 31) % 100) + 10;
            const opacity = 0.3 + ((hash + i) % 40) / 100;
            
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', size);
            circle.setAttribute('fill', colors[i % colors.length]);
            circle.setAttribute('opacity', opacity);
            
            svg.appendChild(circle);
        }
        
        container.appendChild(svg);
    }
    
    // Simple hash function for pattern generation
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    // Form submission
    accountForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (selectedThemes.length !== MAX_THEMES) {
            alert('Please select exactly 3 themes');
            return;
        }
        
        // Collect form data
        const formData = {
            name: document.getElementById('name').value,
            username: document.getElementById('username').value,
            email: document.getElementById('email-account').value,
            password: document.getElementById('password').value, // In production, NEVER store plain passwords!
            themes: selectedThemes,
            avatar: {
                colors: selectedThemes.map(theme => {
                    const palette = themeColors[theme];
                    return palette[Math.floor(Math.random() * palette.length)];
                }),
                pattern: selectedThemes.join('-')
            },
            createdAt: new Date().toISOString()
        };
        
        // Store in localStorage (temporary solution)
        localStorage.setItem('user', JSON.stringify(formData));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Show welcome modal
        showWelcomeModal();
    });
    
    function showWelcomeModal() {
        if (!welcomeModal) return;
        
        welcomeModal.classList.add('active');
        
        // Auto-redirect after 10 seconds
        const autoRedirect = setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 10000);
        
        // Allow click to skip
        welcomeModal.addEventListener('click', function() {
            clearTimeout(autoRedirect);
            window.location.href = 'dashboard.html';
        }, { once: true });
    }
});
