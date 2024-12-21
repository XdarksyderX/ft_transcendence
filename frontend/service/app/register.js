document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register');
    registerForm.addEventListener('click', function(event) {
        event.preventDefault();
        const username = document.getElementById('new-username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (username === '' || email === '' || password === '' || confirmPassword === '') {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const userCredentials = { username, email, password };
        register(userCredentials);
    });
});

function register(userCredentials) {
    fetch('http://localhost:5000/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userCredentials)
    })
    .then(response => handleServerError(response))
    .then(data => {
        if (data.status === 'success') {
            alert('Registration successful! Please check your email for verification.');
            window.location.href = '/login.html'; // Redirect to the login page
        } else {
            alert(data.message || 'Registration error. Please try again.');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        alert('An error occurred during registration. Please try again later.');
    });
}
