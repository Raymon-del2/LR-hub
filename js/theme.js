// Theme management and persistence
const THEME_KEY = 'lr_hub_theme';
const COLOR_KEY = 'lr_hub_color';

class ThemeManager {
    static init() {
        // Apply theme immediately before page loads to prevent flash
        this.loadSavedTheme();
        
        // Setup listeners only if we're on the settings page
        if (window.location.pathname.includes('settings.html')) {
            this.setupThemeListeners();
        }
    }

    static loadSavedTheme() {
        // Load saved dark mode preference
        const isDarkMode = localStorage.getItem(THEME_KEY) === 'dark';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            const darkModeToggle = document.getElementById('darkMode');
            if (darkModeToggle) darkModeToggle.checked = true;
        }

        // Load saved color theme
        const savedColor = localStorage.getItem(COLOR_KEY);
        if (savedColor) {
            this.applyColorTheme(savedColor);
            const colorOptions = document.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                if (option.dataset.color === savedColor) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
    }

    static setupThemeListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkMode');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem(THEME_KEY, 'dark');
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem(THEME_KEY, 'light');
                }
            });
        }

        // Color theme options
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                this.applyColorTheme(color);
                localStorage.setItem(COLOR_KEY, color);
                
                // Update active state
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Add shatter animation
                this.triggerShatterAnimation();
            });
        });
    }

    static applyColorTheme(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        // Adjust hover state to be slightly darker
        const darkerColor = this.adjustBrightness(color, -20);
        document.documentElement.style.setProperty('--primary-hover', darkerColor);
    }

    static adjustBrightness(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    static triggerShatterAnimation() {
        const preview = document.querySelector('.theme-preview');
        if (preview) {
            preview.style.animation = 'none';
            setTimeout(() => {
                preview.style.animation = 'shatter 0.5s ease-out';
            }, 10);
        }
    }
}

// Initialize theme manager immediately
ThemeManager.init();
