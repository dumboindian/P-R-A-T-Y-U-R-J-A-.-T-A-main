document.addEventListener('DOMContentLoaded', () => {
    console.log('register.js loaded successfully');

    if (typeof firebase === 'undefined') {
        console.error('Firebase not defined in register.js');
        const messageDiv = document.getElementById('signup-message');
        if (messageDiv) {
            messageDiv.innerHTML = '<p class="error">Firebase SDK not loaded. Check internet or script tags.</p>';
            messageDiv.style.display = 'block';
        }
        return;
    }

    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const registerBtn = document.getElementById('signup-btn');
    const messageDiv = document.getElementById('signup-message');

    if (!emailInput || !passwordInput || !confirmPasswordInput || !registerBtn || !messageDiv) {
        console.error('One or more DOM elements not found:', {
            emailInput, passwordInput, confirmPasswordInput, registerBtn, messageDiv
        });
        if (messageDiv) {
            messageDiv.innerHTML = '<p class="error">Page elements missing. Refresh or check HTML.</p>';
            messageDiv.style.display = 'block';
        }
        return;
    }

    registerBtn.addEventListener('click', () => {
        console.log('Register button clicked');
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        console.log('Input values:', { email, password, confirmPassword });

        if (!email || !password || !confirmPassword) {
            messageDiv.innerHTML = '<p class="error">Please fill in all fields.</p>';
            messageDiv.style.display = 'block';
            console.log('Validation failed: Empty fields');
            return;
        }

        if (password.length < 6) {
            messageDiv.innerHTML = '<p class="error">Password must be at least 6 characters.</p>';
            messageDiv.style.display = 'block';
            console.log('Validation failed: Password too short');
            return;
        }

        if (password !== confirmPassword) {
            messageDiv.innerHTML = '<p class="error">Passwords do not match.</p>';
            messageDiv.style.display = 'block';
            console.log('Validation failed: Passwords mismatch');
            return;
        }

        messageDiv.style.display = 'none';
        registerBtn.disabled = true;
        console.log('Starting registration for:', email);

        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User registered successfully:', userCredential.user.uid);
                console.log('User email:', userCredential.user.email);
                return userCredential.user.sendEmailVerification();
            })
            .then(() => {
                console.log('Verification email sent');
                messageDiv.innerHTML = '<p>Verification email sent! Please check your inbox and verify your email.</p>';
                messageDiv.style.display = 'block';
                setTimeout(() => {
                    console.log('Redirecting to verify-email.html');
                    window.location.href = '/verify-email.html';
                }, 2000);
            })
            .catch((error) => {
                console.error('Registration or email verification error:', error);
                messageDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
                messageDiv.style.display = 'block';
                registerBtn.disabled = false;
            })
            .finally(() => {
                registerBtn.disabled = false;
                console.log('Registration process completed');
            });
    });
});