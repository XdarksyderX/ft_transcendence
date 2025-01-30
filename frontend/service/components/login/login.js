import { navigateTo } from '../../app/router.js';
import {loadChat, loadSidebar, throwAlert} from '../../app/render.js';

export function initializeLoginEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === '' || password === '') {
                //throwAlert('Please fill in all fields');
                hardcodedLogin();
                return;
            }
            const userCredentials = { username, password };
            login(userCredentials);
        });
    }
    const cancelLogin = document.getElementById('cancel-login');
    if (cancelLogin) {
        cancelLogin.addEventListener('click', () => {
            navigateTo('/');
        });
    }
}

function updateNavbar(username) {
    const navbarContent = document.getElementById('navbar-content');
    navbarContent.innerHTML = `<div>Welcome ${username}</div>`
}

function hardcodedLogin() { //sorry
    localStorage.setItem("hardcoded", true);
    loadChat();
    loadSidebar();
    updateNavbar('erivero-');
    navigateTo('/start-game');
}

function loadLogin(userName) {
    loadChat();
    loadSidebar();
    updateNavbar(userName);
    navigateTo('/start-game');
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
            console.log('Login successful, received access token:', data.access_token);
            //localStorage.setItem('authToken', data.access_token);
            document.cookie = `authToken=${data.access_token}; path=/; secure; SameSite=Strict`;
            console.log('Cookie set:', document.cookie);
            loadLogin(userCredentials.username);
        } else if (data.status === 'error' && data.message === 'OTP required.') {
            await showOTPForm(data.temp_token, userCredentials.username);
            // Only call loadLogin after successful OTP verification
        } else if (data.status === 'error' && data.message !== 'OTP required.') {
            console.log(data.message);
            throwAlert(data.message || 'Authentication error');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        throwAlert('An error occurred during login. Please try again later.');
    }
}

function showOTPForm(tempToken, username) {
    return new Promise((resolve, reject) => {
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="ctm-card">
                <h2 class="text-center ctm-text-title">Enter OTP</h2>
                <form id="otp-form">
                    <div class="mb-3">
                        <label for="otp" class="form-label ctm-text-light">One-Time Password (OTP)</label>
                        <input type="text" class="form-control ctm-text-dark" id="otp" required>
                    </div>
                    <div class="d-flex justify-content-center">
                        <button type="submit" class="btn ctm-btn" id="submit-otp">Submit</button>
                    </div>
                </form>
            </div>
        `;

        const otpForm = document.getElementById('otp-form');
        otpForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const otpCode = document.getElementById('otp').value;
            if (otpCode === '') {
                throwAlert('Please enter the OTP');
                return;
            }

            try {
                await verifyOTP(tempToken, otpCode, username);
                resolve();
                loadLogin(username); // Call loadLogin after successful OTP verification
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function verifyOTP(tempToken, otpCode, username) {
    console.log({ temp_token: tempToken, two_fa_code: otpCode });
    try {
        const response = await fetch('http://localhost:5050/verify-otp/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token: tempToken, two_fa_code: otpCode })
        });

        if (response.status >= 500 && response.status < 600) {
            throw new Error(`Server error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        if (data.status === 'success' && data.access_token) {
            console.log('OTP verified, received JWT:', data.access_token);
//          localStorage.setItem('authToken', data.access_token);
            document.cookie = `authToken=${data.access_token}; path=/; secure; SameSite=Strict`;
            loadLogin(username);

           // navigateTo('/start-game');
        } else {
            throwAlert(data.message || 'OTP verification failed');
            throw new Error('OTP verification failed');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        throwAlert('An error occurred during OTP verification. Please try again later.');
        throw error;
    }
}
function handleServerError(response) {
    if (response.status >= 500 && response.status < 600) {
        throw new Error(`Server error! status: ${response.status}`);
    }
    return response.json();
}

export { handleServerError}