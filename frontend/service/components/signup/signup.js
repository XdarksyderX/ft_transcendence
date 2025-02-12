import { navigateTo } from '../../app/router.js';
import { throwAlert } from '../../app/render.js';
import { register } from '../../app/auth.js';
import { verifyEmail } from '../../app/auth.js';

async function hardcodedSingup() {
    const hardCredentials = { username : "Vicenta" , email : "vicenta@invent.com", password: "Octubre10"}
    if (await register(hardCredentials))
        {
            throwAlert('Account created successfully. Verify your email to login!');
            navigateTo('/login');
        }
}

export function parseNewPasswords(password, confirmPassword) {

    if (!password || !confirmPassword) {
        throwAlert('Please, fill in all fields.');
        return false;
    }
    if (password !== confirmPassword) {
        throwAlert('Passwords do not match.');
        return false;
    }
    if (password.length < 8) {
        throwAlert('Passwords must have more than 8 characters');
        return false 
    }
    return true
}

export function parseEmail(email) {
    if (!email) {
        throwAlert("Please, fill in email field") 
    }
    if (!(email.includes('@') && email.includes('.'))) {
        throwAlert('Please, enter a valid email address.');
        return false 
    }
    return true
}

export function initializeSignupEvents() {
    const cancelSignup = document.getElementById('cancel-signup');
    const registerForm = document.getElementById('register');

    cancelSignup.addEventListener('click',() => navigateTo('/'));
    
    if (registerForm) {
        registerForm.addEventListener('click', async function(event) {
            event.preventDefault();
            const username = document.getElementById('new-username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!username || !email || !password || !confirmPassword) {
            //    throwAlert('Please fill in all fields');
                hardcodedSingup();
                return;
            }
            if (!parseNewPasswords(password, confirmPassword) || !parseEmail(email)) {
                return ;
            }
            const userCredentials = { username, email, password };
            try {

                const response = await register(userCredentials);
                if (response.status === "success") {
                    throwAlert('Account created successfully. Verify your email to login!');
                    navigateTo('/login');
                } else {
                    throwAlert(response.message);
                }
            } catch (error) {
                throwAlert("An error occurred during the sing up process");
            }
        });
    }
}

export function initializeVerifyEmailEvents() {
    document.getElementById('verify-btn').addEventListener('click', async () => {
        
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        try {
            const response = await verifyEmail(token);
            if (response.status === "success") {
                navigateTo('/login');
                throwAlert("Email verification succesful");
        } else {
            //throwAlert(response.message);
            throwAlert("todo mal, reina");
        }
    } catch (error) {
        throwAlert("An error occurred during the email verification");
    }});
}