import { navigateTo } from '../../app/router.js';
import { /* loadChat, loadSidebar,  */hideModalGently, throwAlert } from '../../app/render.js';
import { getUsername, refreshAccessToken, login, resetPassword } from '../../app/auth.js';
import { requestPasswordReset } from '../../app/auth.js';
import { parseEmail, parseUsername } from '../signup/signup.js';

export async function initializeLoginEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim() || '12345678';
            const otpCode = document.getElementById('otp')?.value.trim() || null;
            await authenticateUser({ username, password, two_fa_code: otpCode });
        });
    }
    
    const cancelLogin = document.getElementById('cancel-login');
    if (cancelLogin) {
        cancelLogin.addEventListener('click', () => navigateTo('/'));
    }
    initRequestResetPasswordEvents();
    init42cosa();
    initOTPform();
}

function init42cosa() { // socorro esto es súper provisional
    document.getElementById('login42-button').addEventListener('click', () => {
        window.location.href = 'http://localhost:5050/oauth/42/';
    });
}

async function authenticateUser(userCredentials) {
    try {
        if (!parseUsername) {
            return;
        }
        const loginData = await login(userCredentials);

        if (loginData.status === "success") {
            console.log("Login successful:", loginData.access_token);
            navigateTo('/home');
        } 
        else if (loginData.status === "otp_required") {
            showOTPForm(userCredentials);
        } 
        else {
            throwAlert(loginData.message);
        }
    } catch (error) {
        console.error("Authentication error:", error);
        throwAlert("An error occurred during login. Please try again later.");
    }
}

async function showOTPForm(userCredentials) {
    const otpModal = new bootstrap.Modal(document.getElementById('otp-modal'));
    otpModal.show();

    // Handle OTP form submission
    const otpForm = document.getElementById('otp-form');
    otpForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const otpInputs = document.querySelectorAll('.otp-input');
        let otpCode = '';
        otpInputs.forEach(input => {
            otpCode += input.value;
        });

        if (!otpCode) {
            throwAlert('Please enter the OTP code.');
            return;
        } else {
            await authenticateUser({ ...userCredentials, two_fa_code: otpCode });
        }

        // Hide the OTP modal
        hideModalGently(otpModal);
    });
}

export function initOTPform() {
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
}

async function handleServerError(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Server error! Status: ${response.status}`);
    }
    return response.json();
}

function toggleLoginReset(event) {

    const loginCard = document.getElementById('login-card');
    const resetCard = document.getElementById('reset-password-card');

    loginCard.style.display = loginCard.style.display === 'none' ? 'block' : 'none';
    resetCard.style.display = loginCard.style.display === 'block' ? 'none' : 'block';
}

function initRequestResetPasswordEvents() {
    const forgotPw = document.getElementById('forgot-pw');
    const cancelReset = document.getElementById('cancel-reset-pw-request');
    const resetPwForm = document.getElementById('request-reset-pw-form');
    forgotPw.addEventListener('click', toggleLoginReset);
    cancelReset.addEventListener('click', toggleLoginReset);
    resetPwForm.addEventListener('submit', handlePasswordResetRequest);
}

async function handlePasswordResetRequest(event) {
    event.preventDefault();
    const email = document.getElementById('reset-pw-email').value;
    if (!parseEmail(email)) {
        return 
    }
    try {
        const response = await requestPasswordReset(email);
        if (response.status === "success") {
            throwAlert("Please, check your email");
        } else {
            throwAlert(response.message);
        }
    } catch (error) {
        throwAlert("An error ocurred during the reset password request");
    }
}

export { handleServerError };
 