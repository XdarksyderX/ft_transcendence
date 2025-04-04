import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';
import { navigateTo } from './router.js';
import { throwToast } from './render.js';
import { sendRequestAuth } from './sendRequest.js';

import { chatSocket, state } from '../components/chat/socket.js';
import { notiSocket } from '../components/events/socket.js';

/**
 * Retrieves the username stored in localStorage.
 */
export function getUsername() {
    return localStorage.getItem('username');
}

/**
 * Retrieves the user_id stored in localStorage.
 */
export function getUserId() {
    return localStorage.getItem('user_id');
}

/**
 * Retrieves the 2FA status stored in localStorage.
 */
export function isTwoFAEnabled() {
    return localStorage.getItem('two_fa_enabled') === 'true';
}

export function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Verifies the user's session and redirects them accordingly.
 */
export async function isLoggedIn() {
    if (!getUsername()) {
            return false
    }
    if (!getUsername() && (path === '/' || path === '/login' || path === '/singup')) {
        return false;
    }
    const isValid = await verifyAccessToken();
    return isValid ? true : await refreshAccessToken();
}

/**
 * Logs out from the backend and clears localStorage data.
 */
export async function logout() {
    try {
        sendRequestAuth('POST', 'logout/');
        throwToast('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        state.intentionalClose = true;
        if (chatSocket) {
            chatSocket.close();
        } if (notiSocket) {
            notiSocket.close();
        }
        localStorage.clear();
        navigateTo('/');
    }
}

/**
 * Registers a new user.
 */
export async function register(userCredentials) {
    return await sendRequestAuth('POST', 'register/', userCredentials);
}

/**
 * Logs in and stores user data in localStorage.
 */
export async function login(userCredentials) {
    const data = await sendRequestAuth('POST', 'login/', userCredentials);
    
    if (data?.status === "success" && data.access_token) {
        const decoded = jwtDecode(data.access_token);
        localStorage.setItem('username', decoded.username);
        localStorage.setItem('user_id', decoded.user_id);
        localStorage.setItem('two_fa_enabled', decoded.two_fa_enabled);
        return { status: "success", access_token: data.access_token };
    }

    if (data?.message === "OTP required.") {
        return { status: "otp_required", message: data.message };
    }

    return { status: "error", message: data?.message || "Authentication failed." };
}

/**
 * Verifies if the `access_token` in the cookies is valid.
 */
async function verifyAccessToken() {
    try {
        const response = await sendRequestAuth('POST', 'verify-token/');

        if (response.status !== "success") {
            console.error('Token verification failed:', response.status);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

/**
 * Refreshes the `access_token` using the `refresh_token`.
 */
export async function refreshAccessToken() {
    const data = await sendRequestAuth('POST', 'refresh/');
    if (data?.status === 'success' && data.access_token) {
        //console.log(data.access_token);
        const decoded = jwtDecode(data.access_token);
        localStorage.setItem('username', decoded.username);
        localStorage.setItem('user_id', decoded.user_id);
        localStorage.setItem('two_fa_enabled', decoded.two_fa_enabled);
        console.log("[AUTH] Access token refreshed");
        return true;
    }
    return false;
}

/**
 * Enables or disables 2FA.
 */
export async function toggleTwoFA(enable, password, otpCode = null) {
    return await sendRequestAuth('POST', `${enable ? 'activate-2fa' : 'deactivate-2fa'}/`, { password, two_fa_code: otpCode });
}

/**
 * Changes the username.
 */
export async function changeUsername(newUsername, password) {
    return await sendRequestAuth('POST', 'change-username/', { password, new_username: newUsername });
}

/**
 * Changes the email address.
 */
export async function changeEmail(newEmail, password) {
    return await sendRequestAuth('POST', 'change-email/', { password, new_email: newEmail });
}

/**
 * Changes the user's password.
 */
export async function changePassword(newPassword, oldPassword) {
    return await sendRequestAuth('POST', 'change-password/', { new_password: newPassword, password: oldPassword });
}

/**
 * Requests a password reset.
 */
export async function requestPasswordReset(email) {
    return await sendRequestAuth('POST', 'reset-password-request/', { email });
}

/**
 * Resets the password using the recovery token.
 */
export async function resetPassword(token, newPassword) {
    return await sendRequestAuth('POST', 'reset-password/', { reset_token: token, new_password: newPassword });
}

/**
 * Verifies the email address using a verification token.
 */
export async function verifyEmail(token) {
    return await sendRequestAuth('GET', `verify-email/?token=${token}`);
}

/**
 * Deletes the user's account.
 */
export async function deleteAccount(password) {
    return await sendRequestAuth('POST', 'delete-account/', { password });
}