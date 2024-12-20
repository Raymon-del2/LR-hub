// Email service for handling verification codes
class EmailService {
    static emailConfig = {
        serviceID: 'service_k626oxi',    // Your actual service ID
        templateID: 'template_vzp69ij',   // Your actual template ID
        userID: 'iWkFYANwjfeUlw37p'      // Your public key
    };

    static async sendVerificationCode(email) {
        try {
            console.log('Starting email verification process...');
            
            // Generate a random 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            console.log('Generated code:', code);
            
            // Store the code temporarily
            sessionStorage.setItem(`verification_${email}`, JSON.stringify({
                code,
                timestamp: Date.now(),
                attempts: 0
            }));

            // Send the email using Email.js with exact template parameters
            const templateParams = {
                to_name: email.split('@')[0],
                code: code,
                to_email: email,
                from_name: 'LR Hub'
            };

            console.log('Attempting to send email with params:', {
                serviceID: this.emailConfig.serviceID,
                templateID: this.emailConfig.templateID,
                templateParams: templateParams
            });

            const response = await emailjs.send(
                this.emailConfig.serviceID,
                this.emailConfig.templateID,
                templateParams
            );

            console.log('Email sent successfully:', response);
            return true;
        } catch (error) {
            console.error('Failed to send verification code. Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    static verifyCode(email, userCode) {
        try {
            console.log('Verifying code for email:', email);
            console.log('User entered code:', userCode);
            
            const storedData = sessionStorage.getItem(`verification_${email}`);
            if (!storedData) {
                console.log('No stored code found for email');
                return false;
            }

            const { code } = JSON.parse(storedData);
            console.log('Stored code:', code);
            
            const isValid = code === userCode;
            console.log('Code verification result:', isValid);
            
            return isValid;
        } catch (error) {
            console.error('Error during code verification:', error);
            return false;
        }
    }
}

// Export the service
window.EmailService = EmailService;
