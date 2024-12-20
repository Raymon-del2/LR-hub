// Handle user authentication and persistent login
const AUTH_KEY = 'lr_hub_auth';
const REMEMBER_KEY = 'lr_hub_remember';

// Default avatar SVG
const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(`
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#E2E8F0"/>
    <circle cx="20" cy="15" r="7" fill="#94A3B8"/>
    <path d="M8 35.5C8 35.5 11 25 20 25C29 25 32 35.5 32 35.5" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
</svg>
`)}`;

class Auth {
    static init() {
        // Check authentication on every page
        this.checkAuthStatus();
        this.updateHeader();
        
        if (window.location.pathname.includes('auth.html')) {
            this.setupLoginForm();
        }
    }

    static updateHeader() {
        const auth = this.getAuthData();
        const headerProfile = document.querySelector('.header-profile');
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        
        if (auth) {
            // Update profile picture in header
            const headerProfilePic = headerProfile?.querySelector('.profile-pic');
            if (headerProfilePic) {
                headerProfilePic.src = auth.profilePicture || DEFAULT_AVATAR;
                headerProfilePic.alt = auth.name || 'Profile';
            }

            // Update profile picture and name in hamburger menu
            if (hamburgerMenu) {
                const menuProfilePic = hamburgerMenu.querySelector('.profile-info .profile-pic');
                const nameElement = hamburgerMenu.querySelector('.user-name');
                
                if (menuProfilePic) {
                    menuProfilePic.src = auth.profilePicture || DEFAULT_AVATAR;
                    menuProfilePic.alt = auth.name || 'Profile';
                }
                if (nameElement) {
                    nameElement.textContent = auth.name || 'Guest';
                }

                // Add "New Post" button for admin
                const menuList = hamburgerMenu.querySelector('ul');
                if (menuList && auth.email === 'Wambuiraymond03@gmail.com') {
                    // Check if New Post button already exists
                    const existingNewPost = menuList.querySelector('a[href="new-project.html"]');
                    if (!existingNewPost) {
                        const newPostItem = document.createElement('li');
                        newPostItem.innerHTML = '<a href="new-project.html"><i class="fas fa-plus"></i> New Post</a>';
                        menuList.insertBefore(newPostItem, menuList.firstChild);
                    }
                }
            }
        }
    }

    static checkAuthStatus() {
        const currentPath = window.location.pathname;
        const auth = this.getAuthData();
        
        // If not authenticated and trying to access protected pages
        if (!auth && !currentPath.includes('auth.html')) {
            window.location.href = 'auth.html';
            return;
        }

        // If authenticated but no profile, redirect to profile setup
        if (auth && !auth.hasProfile && !currentPath.includes('profile-setup.html')) {
            window.location.href = 'profile-setup.html';
            return;
        }

        // If authenticated with profile trying to access auth pages
        if (auth && auth.hasProfile && (currentPath.includes('auth.html') || currentPath.includes('profile-setup.html'))) {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    static getAuthData() {
        const auth = localStorage.getItem(AUTH_KEY);
        return auth ? JSON.parse(auth) : null;
    }

    static setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = form.querySelector('#email').value;
                const password = form.querySelector('#password').value;
                const remember = form.querySelector('#remember').checked;
                
                try {
                    // Send verification code
                    const sent = await EmailService.sendVerificationCode(email);
                    if (sent) {
                        // Show verification UI
                        this.showVerificationUI(email, remember, password);
                    } else {
                        this.showError('Failed to send verification code. Please try again.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    this.showError('An error occurred. Please try again.');
                }
            });
        }
    }

    static showVerificationUI(email, remember, password) {
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            const verificationHtml = `
                <div class="verification-container">
                    <h2>Enter Verification Code</h2>
                    <p>We've sent a code to ${email}</p>
                    <div class="code-inputs">
                        <input type="text" maxlength="1" class="code-input" pattern="[0-9]" inputmode="numeric">
                        <input type="text" maxlength="1" class="code-input" pattern="[0-9]" inputmode="numeric">
                        <input type="text" maxlength="1" class="code-input" pattern="[0-9]" inputmode="numeric">
                        <input type="text" maxlength="1" class="code-input" pattern="[0-9]" inputmode="numeric">
                        <input type="text" maxlength="1" class="code-input" pattern="[0-9]" inputmode="numeric">
                        <input type="text" maxlength="1" class="code-input" pattern="[0-9]" inputmode="numeric">
                    </div>
                    <button class="verify-btn">Done</button>
                </div>
            `;
            loginContainer.innerHTML = verificationHtml;

            // Setup code input behavior
            this.setupCodeInputs();

            // Setup verify button
            const verifyBtn = loginContainer.querySelector('.verify-btn');
            verifyBtn.addEventListener('click', () => this.verifyCode(email, remember));

            // Focus first input
            loginContainer.querySelector('.code-input').focus();
        }
    }

    static setupCodeInputs() {
        const inputs = document.querySelectorAll('.code-input');
        inputs.forEach((input, index) => {
            // Only allow numbers
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                
                if (e.target.value) {
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                }
            });

            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (!e.target.value && index > 0) {
                        inputs[index - 1].focus();
                        inputs[index - 1].value = '';
                    }
                }
            });

            // Handle paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                
                inputs.forEach((input, i) => {
                    if (pastedData[i]) {
                        input.value = pastedData[i];
                    }
                });

                if (pastedData.length === 6) {
                    inputs[5].focus();
                }
            });
        });
    }

    static verifyCode(email, remember) {
        const inputs = document.querySelectorAll('.code-input');
        const code = Array.from(inputs).map(input => input.value).join('');

        if (EmailService.verifyCode(email, code)) {
            // Create initial user object
            const user = {
                email: email,
                hasProfile: false,
                token: 'sample-token-' + Date.now()
            };

            // Store auth data
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            if (remember) {
                localStorage.setItem(REMEMBER_KEY, 'true');
            }

            // Redirect to profile setup
            window.location.href = 'profile-setup.html';
        } else {
            this.showError('Please input correct code');
            inputs.forEach(input => input.value = '');
            inputs[0].focus();
        }
    }

    static updateProfile(profileData) {
        const auth = this.getAuthData();
        if (auth) {
            const updatedAuth = {
                ...auth,
                ...profileData,
                hasProfile: true
            };
            localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAuth));
            this.updateHeader(); // Update header immediately after profile change
        }
    }

    static showError(message) {
        const container = document.querySelector('.verification-container') || document.querySelector('.login-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            
            // Remove any existing error message
            const existingError = container.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            container.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 3000);
        }
    }

    static logout() {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        window.location.href = 'auth.html';
    }
}

// Initialize authentication immediately
Auth.init();
