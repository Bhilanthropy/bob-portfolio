// Dashboard Logic
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userData = localStorage.getItem('user');
    
    if (!isLoggedIn || !userData) {
        // Redirect to home if not logged in
        window.location.href = 'index.html';
        return;
    }
    
    // Parse user data
    const user = JSON.parse(userData);
    
    // Display user information
    displayUserProfile(user);
    
    // Setup logout
    setupLogout();
});

function displayUserProfile(user) {
    // Display name and username
    const userName = document.getElementById('userName');
    const userUsername = document.getElementById('userUsername');
    const userAvatar = document.getElementById('userAvatar');
    const themesList = document.getElementById('themesList');
    
    if (userName) userName.textContent = user.name;
    if (userUsername) userUsername.textContent = `@${user.username}`;
    
    // Recreate avatar
    if (userAvatar && user.avatar) {
        const colors = user.avatar.colors;
        
        // Set CSS variables
        userAvatar.style.setProperty('--theme-color-1', colors[0] || '#ccc');
        userAvatar.style.setProperty('--theme-color-2', colors[1] || '#999');
        userAvatar.style.setProperty('--theme-color-3', colors[2] || '#666');
        
        // Generate same pattern
        generateAvatarPattern(userAvatar, colors, user.themes);
    }
    
    // Display themes
    if (themesList && user.themes) {
        const themeNames = {
            'basic-needs': 'Basic Needs & Poverty',
            'health': 'Health & Medicine',
            'education': 'Education & Knowledge',
            'environment': 'Environment & Climate',
            'animals': 'Animals',
            'children': 'Children & Youth',
            'human-rights': 'Human Rights & Social Justice',
            'community': 'Community & Social Services',
            'culture': 'Culture, Arts & Heritage',
            'technology': 'Technology & Future Causes',
            'freedom': 'Freedom of Speech'
        };
        
        user.themes.forEach(theme => {
            const badge = document.createElement('div');
            badge.className = 'theme-badge';
            badge.textContent = themeNames[theme] || theme;
            themesList.appendChild(badge);
        });
    }
}

function generateAvatarPattern(container, colors, themes) {
    const seed = themes.join('-');
    const hash = simpleHash(seed);
    
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '150');
    svg.setAttribute('height', '150');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    
    for (let i = 0; i < 5; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const size = 25 + ((hash + i * 17) % 50);
        const x = ((hash + i * 23) % 120) + 15;
        const y = ((hash + i * 31) % 120) + 15;
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

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear user data
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            
            // Redirect to home
            window.location.href = 'index.html';
        });
    }
}
