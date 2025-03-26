import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';
import { navigateTo } from './router.js';
import { throwToast } from './render.js';
import { sendRequestAuth } from './sendRequest.js';

import { chatSocket, state } from '../components/chat/socket.js';
import { notiSocket } from '../components/events/socket.js';

/**
 * Obtiene el username almacenado en localStorage.
 */
export function getUsername() {
    return localStorage.getItem('username');
}

/**
 * Obtiene el user_id almacenado en localStorage.
 */
export function getUserId() {
    return localStorage.getItem('user_id');
}

/**
 * Obtiene el estado de 2FA almacenado en localStorage.
 */
export function isTwoFAEnabled() {
    return localStorage.getItem('two_fa_enabled') === 'true';
}

export function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Verifica la sesión del usuario y lo redirige según corresponda.
 */
export async function isLoggedIn() {
    if (!getUsername()) {
            return false
    }
    if (!getUsername() && (path === '/' || path === '/login' || path === '/singup')) {
        console.log("nono, path: ", path);
        return false;
    }
    const isValid = await verifyAccessToken();
    return isValid ? true : await refreshAccessToken();
}

/**
 * Cierra sesión en el backend y borra los datos de localStorage.
 */
export async function logout() {
    try {
        await fetch('http://localhost:5050/logout/', {
            method: 'POST',
            credentials: 'include',
        });
        throwToast('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        state.intentionalClose = true;
        if (chatSocket) {
            chatSocket.close();
        } if (notiSocket) {
            console.log("closing notisocket...");
            notiSocket.close();
        }
        navigateTo('/');
        localStorage.clear();
    }
}

/**
 * Registra un nuevo usuario.
 */
export async function register(userCredentials) {
    return await sendRequestAuth('POST', 'register/', userCredentials);
}

/**
 * Inicia sesión y almacena los datos del usuario en localStorage.
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
 * Verifica si el `access_token` en las cookies es válido.
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
 * Refresca el `access_token` con el `refresh_token`.
 */
export async function refreshAccessToken() {
    const data = await sendRequestAuth('POST', 'refresh/');
    if (data?.status === 'success' && data.access_token) {
        console.log(data.access_token);
        const decoded = jwtDecode(data.access_token);
        localStorage.setItem('username', decoded.username);
        localStorage.setItem('user_id', decoded.user_id);
        localStorage.setItem('two_fa_enabled', decoded.two_fa_enabled);
        console.log("Access token refreshed");
        return true;
    }
    return false;
}

/**
 * Activa o desactiva 2FA.
 */
export async function toggleTwoFA(enable, password, otpCode = null) {
    return await sendRequestAuth('POST', `${enable ? 'activate-2fa' : 'deactivate-2fa'}/`, { password, two_fa_code: otpCode });
}

/**
 * Cambia el nombre de usuario.
 */
export async function changeUsername(newUsername, password) {
    return await sendRequestAuth('POST', 'change-username/', { password, new_username: newUsername });
}

/**
 * Cambia la dirección de correo electrónico.
 */
export async function changeEmail(newEmail, password) {
    return await sendRequestAuth('POST', 'change-email/', { password, new_email: newEmail });
}

/**
 * Cambia la contraseña del usuario.
 */
export async function changePassword(newPassword, oldPassword) {
    return await sendRequestAuth('POST', 'change-password/', { new_password: newPassword, password: oldPassword });
}

/**
 * Solicita el reseteo de contraseña.
 */
export async function requestPasswordReset(email) {
    return await sendRequestAuth('POST', 'reset-password-request/', { email });
}

/**
 * Resetea la contraseña con el token de recuperación.
 */
export async function resetPassword(token, newPassword) {
    return await sendRequestAuth('POST', 'reset-password/', { reset_token: token, new_password: newPassword });
}

/**
 * Verifica el correo electrónico con un token de verificación.
 */
export async function verifyEmail(token) {
    return await sendRequestAuth('GET', `verify-email/?token=${token}`);
}

/**
 * Elimina la cuenta del usuario.
 */
export async function deleteAccount(password) {
    return await sendRequestAuth('POST', 'delete-account/', { password });
}
