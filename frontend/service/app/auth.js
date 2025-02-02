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
 * Retorna `true` si el usuario sigue autenticado, `false` si no.
 */
export async function isLoggedIn() {
    const isValid = await verifyAccessToken();
    if (isValid) {
        return true;
    } else {
        return await refreshAccessToken();
    }
}

/**
 * Cierra sesión en el backend y redirige al usuario a la página de login.
 */
export async function logout() {
    try {
        const response = await fetch('http://localhost:5050/logout/', {
            method: 'POST',
            credentials: 'include'
        });
        await response.json();
        localStorage.clear();
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.clear();
    }
}

/**
 * Registra un nuevo usuario en la API.
 */
export async function register(userCredentials) {
    try {
        const response = await fetch('http://localhost:5050/register/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userCredentials)
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}


/**
 * Inicia sesión en la API y almacena los datos del usuario en localStorage.
 */
export async function login(userCredentials) {
    try {
        const response = await fetch('http://localhost:5050/login/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userCredentials)
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            const decoded = jwtDecode(data.access_token);
            localStorage.setItem('username', decoded.username);
            localStorage.setItem('user_id', decoded.user_id);
            localStorage.setItem('two_fa_enabled', decoded.two_fa_enabled);
            return { status: "success", access_token: data.access_token };
        } 
        
        if (data.message === "OTP required.") {
            return { status: "otp_required", message: data.message };
        }

        return { status: "error", message: data.message || "Authentication failed." };
        
    } catch (error) {
        console.error("Login error:", error);
        return { status: "error", message: "An error occurred during login. Please try again later." };
    }
}


/**
 * Verifica si el `access_token` en las cookies es válido.
 */
async function verifyAccessToken() {
    try {
        const response = await fetch('http://localhost:5050/verify-token/', {
            method: 'POST',
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Refresca el `access_token` utilizando el `refresh_token` en cookies.
 */
export async function refreshAccessToken() {
    try {
        const response = await fetch('http://localhost:5050/refresh/', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        if (data.status === 'success' && data.access_token) {
            const decoded = jwtDecode(data.access_token);
            localStorage.setItem('username', decoded.username);
            localStorage.setItem('user_id', decoded.user_id);
            localStorage.setItem('two_fa_enabled', decoded.two_fa_enabled);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Activa o desactiva la autenticación en dos pasos (2FA).
 */
export async function toggleTwoFA(enable, password, otpCode = null) {

    try {
        const response = await fetch(`http://localhost:5050/${enable ? 'activate-2fa' : 'deactivate-2fa'}/`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ password, two_fa_code: otpCode }),
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Cambia el nombre de usuario.
 */
export async function changeUsername(newUsername, password) {
    try {
        const response = await fetch('http://localhost:5050/change-username/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, username: newUsername })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Cambia la dirección de correo electrónico.
 */
export async function changeEmail(newEmail) {
    try {
        const response = await fetch('http://localhost:5050/change-email/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Cambia la contraseña del usuario.
 */
export async function changeEmail(newPassword, oldPassword) {
    try {
        const response = await fetch('http://localhost:5050/change-password/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_password: newPassword, old_password: oldPassword })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Envía una solicitud para resetear la contraseña.
 */
export async function requestPasswordReset(email) {
    try {
        const response = await fetch('http://localhost:5050/reset-password-request/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Resetea la contraseña con el token de recuperación.
 */
export async function resetPassword(token, newPassword) {
    try {
        const response = await fetch('http://localhost:5050/reset-password/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Verifica el correo electrónico con un token de verificación.
 */
export async function verifyEmail(token) {
    try {
        const response = await fetch(`http://localhost:5050/verify-email/?token=${token}`, {
            method: 'GET',
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}