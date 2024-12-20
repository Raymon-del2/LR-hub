// Handle profile setup functionality
class ProfileSetup {
    static init() {
        this.setupFormHandlers();
        this.setupImageUpload();
    }

    static setupFormHandlers() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const formData = {
                    name: form.querySelector('#name').value,
                    bio: form.querySelector('#bio').value,
                    profilePicture: form.querySelector('#profilePreview').src,
                    interests: Array.from(form.querySelectorAll('input[name="interests"]:checked')).map(cb => cb.value)
                };

                // Update auth data with profile info
                Auth.updateProfile(formData);

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            });
        }
    }

    static setupImageUpload() {
        const fileInput = document.getElementById('profilePicture');
        const preview = document.getElementById('profilePreview');
        
        if (fileInput && preview) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
}

// Initialize profile setup
ProfileSetup.init();
