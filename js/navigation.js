// Navigation functionality
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('active');
}

function updateUserInfo() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (document.getElementById('menuProfileName')) {
        document.getElementById('menuProfileName').textContent = userProfile.name || 'Guest';
    }
    if (document.getElementById('userLocation')) {
        document.getElementById('userLocation').textContent = userProfile.country || 'Location not set';
    }
}

function checkAdminAccess() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const adminEmail = 'wambuiraymond03@gmail.com';
    const postProjectLink = document.getElementById('postProjectLink');
    if (postProjectLink) {
        postProjectLink.style.display = userProfile.email === adminEmail ? 'block' : 'none';
    }
}

function signOut() {
    localStorage.removeItem('userProfile');
    window.location.href = 'auth.html';
}

// Initialize navigation when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Update the active menu item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.style.backgroundColor = 'var(--bg-secondary)';
        }
    });

    updateUserInfo();
    checkAdminAccess();
});
