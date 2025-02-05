import { navigateTo } from '../../app/router.js';
import { loadChat, loadSidebar, throwAlert } from '../../app/render.js';
import { getUsername, refreshAccessToken, login } from '../../app/auth.js';

export async function initializeLoginEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value.trim() || 'Vicenta';
            const password = document.getElementById('password').value.trim() || 'Octubre10';
            const otpCode = document.getElementById('otp')?.value.trim() || null;
            await authenticateUser({ username, password, two_fa_code: otpCode });
        });
    }
    
    const cancelLogin = document.getElementById('cancel-login');
    if (cancelLogin) {
        cancelLogin.addEventListener('click', () => navigateTo('/'));
    }
}

async function authenticateUser(userCredentials) {
    try {
        const loginData = await login(userCredentials);

        if (loginData.status === "success") {
            console.log("Login successful:", loginData.access_token);
            navigateTo('/start-game');
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


// function updateNavbar(username) {
//     document.getElementById('navbar-content').innerHTML = `<div>Welcome ${username}</div>`;
// }

async function showOTPForm(userCredentials) {
    document.getElementById('app').innerHTML = `
        <div class="ctm-card">
            <h2 class="text-center ctm-text-title">Enter OTP</h2>
            <form id="otp-form">
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

    document.getElementById('otp-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        const otpCode = document.getElementById('otp').value.trim();
        if (!otpCode) {
            throwAlert('Please enter the OTP code.');
            return;
        }

        await authenticateUser({ ...userCredentials, two_fa_code: otpCode });
    });
}

async function handleServerError(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Server error! Status: ${response.status}`);
    }
    return response.json();
}

export { handleServerError };
