import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';

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

/**
 * Verifica la sesión del usuario y lo redirige según corresponda.
 */
export async function isLoggedIn() {
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
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.clear();
    }
}

/**
 * Registra un nuevo usuario.
 */
export async function register(userCredentials) {
    return await sendRequest('POST', 'register/', userCredentials);
}

/**
 * Inicia sesión y almacena los datos del usuario en localStorage.
 */
export async function login(userCredentials) {
    const data = await sendRequest('POST', 'login/', userCredentials);
    
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
    const response = await fetch('http://localhost:5050/verify-token/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
}

/**
 * Refresca el `access_token` con el `refresh_token`.
 */
export async function refreshAccessToken() {
    const data = await sendRequest('POST', 'refresh/');

    if (data?.status === 'success' && data.access_token) {
        const decoded = jwtDecode(data.access_token);
        localStorage.setItem('username', decoded.username);
        localStorage.setItem('user_id', decoded.user_id);
        localStorage.setItem('two_fa_enabled', decoded.two_fa_enabled);
        return true;
    }
    return false;
}

/**
 * Activa o desactiva 2FA.
 */
export async function toggleTwoFA(enable, password, otpCode = null) {
    return await sendRequest('POST', `${enable ? 'activate-2fa' : 'deactivate-2fa'}/`, { password, two_fa_code: otpCode });
}

/**
 * Cambia el nombre de usuario.
 */
export async function changeUsername(newUsername, password) {
    return await sendRequest('POST', 'change-username/', { password, username: newUsername });
}

/**
 * Cambia la dirección de correo electrónico.
 */
export async function changeEmail(newEmail, password) {
    return await sendRequest('POST', 'change-email/', { password, email: newEmail });
}

/**
 * Cambia la contraseña del usuario.
 */
export async function changePassword(newPassword, oldPassword) {
    return await sendRequest('POST', 'change-password/', { new_password: newPassword, old_password: oldPassword });
}

/**
 * Solicita el reseteo de contraseña.
 */
export async function requestPasswordReset(email) {
    return await sendRequest('POST', 'reset-password-request/', { email });
}

/**
 * Resetea la contraseña con el token de recuperación.
 */
export async function resetPassword(token, newPassword) {
    return await sendRequest('POST', 'reset-password/', { token, new_password: newPassword });
}

/**
 * Verifica el correo electrónico con un token de verificación.
 */
export async function verifyEmail(token) {
    return await sendRequest('GET', `verify-email/?token=${token}`);
}

/**
 * Elimina la cuenta del usuario.
 */
export async function deleteAccount(password) {
    return await sendRequest('POST', 'delete-account/', { password });
}

/**
 * Enviar una solicitud `fetch` con `Content-Type: application/json`.
 * @param {string} method - Método HTTP (`GET`, `POST`, `PUT`, `DELETE`).
 * @param {string} endpoint - Endpoint de la API.
 * @param {Object} [body=null] - Datos opcionales a enviar en el body.
 */
async function sendRequest(method, endpoint, body = null) {
    try {
        const response = await fetch(`http://localhost:5050/${endpoint}`, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null
        });

        return await response.json();
    } catch (error) {
        console.error(`Error en ${method} ${endpoint}:`, error);
        return false;
    }
}
