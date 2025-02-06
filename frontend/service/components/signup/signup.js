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
            //    throwAlert('Please fill in all fields');
                hardcodedSingup();
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

export function initializeVerifyEmailEvents() {
    document.getElementById('verify-btn').addEventListener('click', async () => {
        
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        try {
            const response = await verifyEmail(token);
            if (response.status === "success") {
                navigateTo('/login');
               // throwAlert("Email verification succesful");
               alert("ole c:");
                console.log("navigating?")
        } else {
            //throwAlert(response.message);
            throwAlert("todo mal, reina");
        }
    } catch (error) {
        throwAlert("An error occurred during the email verification");
    }});
}