import { navigateTo } from '../../app/router.js';
import { loadChat, loadSidebar, throwAlert } from '../../app/render.js';
import { getUsername, refreshAccessToken } from '../../app/auth.js';

export function initializeLoginEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value || 'eli';
            const password = document.getElementById('password').value || 'Octubre10';
            const otpCode = document.getElementById('otp')?.value || null;
            await login({ username, password, two_fa_code: otpCode });
        });
    }
    
    const cancelLogin = document.getElementById('cancel-login');
    if (cancelLogin) {
        cancelLogin.addEventListener('click', () => navigateTo('/'));
    }
}

async function login(userCredentials) {
    try {
        const response = await fetch('http://localhost:5050/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userCredentials)
        });
        
        const data = await handleServerError(response);

        if (data.status === 'success' && data.access_token) {
            console.log('Login successful:', data.access_token);
            await refreshAccessToken();
            loadLogin();
        } else if (data.status === 'error' && data.message === 'OTP required.') {
            showOTPForm(userCredentials.username);
        } else {
            throwAlert(data.message || 'Authentication error');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        throwAlert('An error occurred during login. Please try again later.');
    }
}

export function loadLogin(move = true) {
    loadChat();
    loadSidebar();
    updateNavbar(getUsername());
    if (move) navigateTo('/start-game');
}

function updateNavbar(username) {
    document.getElementById('navbar-content').innerHTML = `<div>Welcome ${username}</div>`;
}

function showOTPForm(username) {
    document.getElementById('app').innerHTML = `
        <div class="ctm-card">
            <h2 class="text-center ctm-text-title">Enter OTP</h2>
            <form id="login-form">
                <div class="mb-3">
                    <label for="otp" class="form-label ctm-text-light">One-Time Password (OTP)</label>
                    <input type="text" class="form-control ctm-text-dark" id="otp" required>
                </div>
                <div class="d-flex justify-content-center">
                    <button type="submit" class="btn ctm-btn">Submit</button>
                </div>
            </form>
        </div>
    `;
    initializeLoginEvents();
}

async function handleServerError(response) {
    if (response.status >= 500) {
        throw new Error(`Server error! Status: ${response.status}`);
    }
    return response.json();
}

export { handleServerError };
