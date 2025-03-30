import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';


let isRefreshingToken = false;

const GATEWAY_PORT = 5090

function getGatewayHost() {
    return window.location.hostname + `:${GATEWAY_PORT}`;
}

export const GATEWAY_URL = 'https://' + getGatewayHost();
export const GATEWAY_HOST = getGatewayHost();

async function refreshAccessToken() {
    if (isRefreshingToken) {
        console.warn("Token refresh already in progress, skipping...");
        return false;
    }

    isRefreshingToken = true;

    try {
        const response = await fetch(`${GATEWAY_URL}/api/auth/refresh/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.error('Failed to refresh token');
            return false;
        }

        const data = await response.json();
        if (data?.status === 'success' && data.access_token) {
            const decoded = jwtDecode(data.access_token);
            localStorage.setItem('username', decoded.username);
            localStorage.setItem('user_id', decoded.user_id);
            localStorage.setItem('two_fa_enabled', decoded.two_fa_enabled);
            console.log("Access token refreshed");
            return true;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
    } finally {
        isRefreshingToken = false;
    }
    return false;
}

async function sendRequest(service, method, endpoint, body = null, isFormData = false, retried = false) {
    try {
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
        const requestPayload = {
            method,
            credentials: 'include',
            headers,
            body: body ? (isFormData ? body : JSON.stringify(body)) : null
        };

        console.log(`Sending request to ${GATEWAY_URL}/api/${service}/${endpoint}`, requestPayload);

        const response = await fetch(`${GATEWAY_URL}/api/${service}/${endpoint}`, requestPayload);

        let responseData = null;

        if (response.status !== 204) {
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.error('Error parsing response JSON:', parseError);
            }
        }

        if (response.status === 401 && !retried && service === 'auth') {
            console.warn(`[${service.toUpperCase()}] Unauthorized, attempting token refresh...`);
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                // Reintenta la petición original solo una vez.
                return sendRequest(service, method, endpoint, body, isFormData, true);
            }
        }

        if (!response.ok) {
            console.error(`[${service.toUpperCase()}] Request failed with status:`, response.status);
            console.error(`[${service.toUpperCase()}] Error details:`, responseData);
            return { status: "error", message: responseData?.message || "Request failed" };
        }

        return responseData || { status: "success", message: "No content" };
    } catch (error) {
        console.error(`Error in ${method} ${endpoint} [${service.toUpperCase()}]:`, error);
        return { status: "error", message: "An unexpected error occurred" };
    }
}

export async function sendRequestAuth(method, endpoint, body = null, isFormData = false) {
    return sendRequest('auth', method, endpoint, body, isFormData);
}

export async function sendRequestSocial(method, endpoint, body = null, isFormData = false) {
    return sendRequest('social', method, endpoint, body, isFormData);
}

export async function sendRequestPong(method, endpoint, body = null, isFormData = false) {
    return sendRequest('pong', method, endpoint, body, isFormData);
}

export async function sendRequestChess(method, endpoint, body = null, isFormData = false) {
    return sendRequest('chess', method, endpoint, body, isFormData);
}

export async function sendRequestNotifications(method, endpoint, body = null, isFormData = false) {
    return sendRequest('notifications', method, endpoint, body, isFormData);
}
