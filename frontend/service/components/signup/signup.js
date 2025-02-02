import { navigateTo } from '../../app/router.js';
import { throwAlert } from '../../app/render.js';
import { register } from '../../app/auth.js';

export function initializeSignupEvents() {
    const cancelSignup = document.getElementById('cancel-signup');
    const registerForm = document.getElementById('register');

    //if (cancelSignup) {
    //    cancelSignup.addEventListener('click', () => {
    //        navigateTo('/');
    //    });
    //}
    
    if (registerForm) {
        registerForm.addEventListener('click', async function(event) {
            event.preventDefault();
            const username = document.getElementById('new-username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!username || !email || !password || !confirmPassword) {
                throwAlert('Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                throwAlert('Passwords do not match');
                return;
            }

            const userCredentials = { username, email, password };
            if (await register(userCredentials))
            {
                throwAlert('Account created successfully. Verify your email to login!');
                navigateTo('/login');
            }
        });
    }
}
