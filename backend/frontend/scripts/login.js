document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginEmailInput = loginForm.querySelector('input[type="text"]');
    const loginPasswordInput = loginForm.querySelector('input[type="password"]');
    const loginButton = loginForm.querySelector('button[type="submit"]');

    const signupNameInput = signupForm.querySelector('input[type="text"]');
    const signupEmailInput = signupForm.querySelector('input[type="email"]');
    const signupPasswordInput = signupForm.querySelector('input[type="password"]');
    const signupButton = signupForm.querySelector('button[type="submit"]');

    function showFeedback(element, message, isError = true) {
        let feedbackDiv = element.nextElementSibling;
        if (!feedbackDiv || !feedbackDiv.classList.contains('feedback')) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.classList.add('feedback');
            element.parentNode.insertBefore(feedbackDiv, element.nextSibling);
        }
        feedbackDiv.textContent = message;
        feedbackDiv.style.color = isError ? 'red' : 'green';
        feedbackDiv.style.fontSize = '0.85em';
        feedbackDiv.style.marginTop = '-10px';
        feedbackDiv.style.marginBottom = '10px';
    }

    function clearFeedback(element) {
        const feedbackDiv = element.nextElementSibling;
        if (feedbackDiv && feedbackDiv.classList.contains('feedback')) {
            feedbackDiv.remove();
        }
    }

    function validateEmail(email) {
        const re = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
        return re.test(String(email).toLowerCase());
    }

    function validatePassword(password) {
        return password.length >= 6; // Minimum 6 characters for password
    }

    // Login Form Validation and Submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearFeedback(loginEmailInput);
        clearFeedback(loginPasswordInput);

        let isValid = true;

        if (loginEmailInput.value.trim() === '') {
            showFeedback(loginEmailInput, 'Email is required.');
            isValid = false;
        } else if (!validateEmail(loginEmailInput.value.trim())) {
            showFeedback(loginEmailInput, 'Invalid email format.');
            isValid = false;
        }

        if (loginPasswordInput.value.trim() === '') {
            showFeedback(loginPasswordInput, 'Password is required.');
            isValid = false;
        } else if (!validatePassword(loginPasswordInput.value.trim())) {
            showFeedback(loginPasswordInput, 'Password must be at least 6 characters.');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';

        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();
        
        try {
            const response = await fetch('/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user: { email: email, pass: password } })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Invalid email or password. Please try again.');
            }

            // Additional validation to ensure we have valid user data
            if (!data.user || !data.user.id) {
                throw new Error('Invalid user data received. Please try again.');
            }

            console.log('Login Successful:', data);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            showFeedback(loginButton, 'Login successful!', false);
            
            // Only redirect if we have valid user data
            if (data.user && data.user.id) {
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                throw new Error('Invalid user session. Please try again.');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showFeedback(loginButton, error.message || 'Login failed. Please check your credentials.', true);
            // Clear password field on failed login
            loginPasswordInput.value = '';
            loginPasswordInput.focus();
            // Clear any existing session data
            sessionStorage.removeItem('user');
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    });

    // Signup Form Validation and Submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearFeedback(signupNameInput);
        clearFeedback(signupEmailInput);
        clearFeedback(signupPasswordInput);

        let isValid = true;

        if (signupNameInput.value.trim() === '') {
            showFeedback(signupNameInput, 'Name is required.');
            isValid = false;
        }

        if (signupEmailInput.value.trim() === '') {
            showFeedback(signupEmailInput, 'Email is required.');
            isValid = false;
        } else if (!validateEmail(signupEmailInput.value.trim())) {
            showFeedback(signupEmailInput, 'Invalid email format.');
            isValid = false;
        }

        if (signupPasswordInput.value.trim() === '') {
            showFeedback(signupPasswordInput, 'Password is required.');
            isValid = false;
        } else if (!validatePassword(signupPasswordInput.value.trim())) {
            showFeedback(signupPasswordInput, 'Password must be at least 6 characters.');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        signupButton.disabled = true;
        signupButton.textContent = 'Signing Up...';

        const name = signupNameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value.trim();

        try {
            const response = await fetch('/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user: { name: name, email: email, pass: password } })
            });

            if (response.status === 409) {
                showFeedback(signupButton, 'User already exists! Please choose a different email.', true);
                throw new Error('User already exists');
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Registration failed. Please try again.');
            }

            const data = await response.json();
            console.log('Signup Successful:', data);
            showFeedback(signupButton, 'Registration successful! You can login now.', false);
            // Optionally clear the signup form and switch to login form
            signupNameInput.value = '';
            signupEmailInput.value = '';
            signupPasswordInput.value = '';
            // Assuming toggleForm is available globally or accessible
            if (typeof toggleForm === 'function') {
                setTimeout(() => toggleForm(), 1000); // Switch to login after a delay
            }

        } catch (error) {
            console.error('Signup error:', error);
            if (!error.message.includes('User already exists')) { // Avoid double message for 409
                 showFeedback(signupButton, error.message, true);
            }
        } finally {
            signupButton.disabled = false;
            signupButton.textContent = 'Sign Up';
        }
    });

    // Add general input event listeners to clear feedback on input
    const allInputs = document.querySelectorAll('#login-form input, #signup-form input');
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            clearFeedback(input);
            clearFeedback(input.parentNode.querySelector('button[type="submit"]')); // Clear button feedback
        });
    });
});
