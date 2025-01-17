import { navigateTo } from '../../app/router.js';
import { throwAlert } from '../../app/render.js';
import { handleServerError } from '../login/login.js'

export function initializeSignupEvents() {
	const cancelSignup = document.getElementById('cancel-signup');
	const registerForm = document.getElementById('register');

	if (cancelSignup) {
		cancelSignup.addEventListener('click', () => {
			navigateTo('/');
		});
	}
	registerForm.addEventListener('click', function(event) {
		event.preventDefault();
		const username = document.getElementById('new-username').value;
		const email = document.getElementById('email').value;
		const password = document.getElementById('new-password').value;
		const confirmPassword = document.getElementById('confirm-password').value;

		if (username === '' || email === '' || password === '' || confirmPassword === '') {
			throwAlert('Please fill in all fields');
			return;
		}

		if (password !== confirmPassword) {
			throwAlert('Passwords do not match');
			return;
		}

		const userCredentials = { username, email, password };
		register(userCredentials);
	});
	//this to hardcode:
	// document.getElementById('register').addEventListener('click', () => {
	// 	navigateTo('/start-game');
	// })
}

function register(userCredentials) {
	console.log(JSON.stringify(userCredentials));

    fetch('http://localhost:5050/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userCredentials)
    })
    .then(response => handleServerError(response))
    .then(data => {
        if (data.status === 'success') {
            throwAlert('Registration successful! Please check your email for verification.');
            navigateTo('/login');
        } else {
            throwAlert(data.message || 'Registration error. Please try again.');
        }
    })
    .catch(error => {
        console.error('Registration error:', error.message); // Imprime solo el mensaje de error
        throwAlert('An error occurred during registration. Please try again later.');
    });
}

