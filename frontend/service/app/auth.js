import { navigateTo } from '../../app/router.js';


export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
// Example usage:
export async function verifyAndRedirect() {
    const accessToken = getCookie('authToken');
    // console.log('they see me verifying');

    if (localStorage.getItem('hardcoded')) {
        return true;
    }
    if (!accessToken) {
        return false;
    }

    const isValid = await verifyAccessToken(accessToken);
    if (isValid) {
        return true;
    } else {
        const refreshed = await refreshAccessToken();
        return refreshed;
    }
}


export function logout() {

    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; SameSite=Strict';

    if (localStorage.getItem('hardcoded')) {
        navigateTo("/");
        localStorage.removeItem('hardcoded');
        return ;
    }

    fetch('http://localhost:5050/logout/', {
        method: 'POST',
        /* credentials: 'include', */
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            'access_token': getCookie('authToken')
        }
    })
/*     fetch('http://localhost:5050/logout/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: "paco"
        }) */
    .then(response => {
        if (!response.ok) {
            console.error('Logout failed:', response);
            document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly; SameSite=Strict';
            return;
        }
        return response.json();
    })
    .then(data => {
        console.log('Logout successful:', data);
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly; SameSite=Strict';
        navigateTo('/');
    })
    .catch(error => {
        console.error('An error occurred during logout:', error);
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly; SameSite=Strict';
        navigateTo('/'); 
    });
}

async function verifyAccessToken(accessToken) {
    // console.log("verifying: ", accessToken);
    return fetch('http://localhost:5050/verify-token/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: accessToken })
    })
    .then(response => {
        if (response.ok) {
            console.log('Access token is valid.');
            return true;
        } else {
            throw new Error('Invalid or expired access token');
        }
    })
    .catch(error => {
        console.error('Token verification error:', error);
        return false;
    });
}

async function refreshAccessToken() {
    console.log('Attempting to refresh token...');
    return fetch('http://localhost:5050/refresh/', {
        method: 'POST',
        credentials: 'include', // Include cookies for HTTP-only refresh tokens
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success' && data.access_token) {
            console.log('Token refreshed successfully.');
            document.cookie = `authToken=${data.access_token}; path=/; secure; HttpOnly; SameSite=Strict`;
            return true;
        } else {
            throw new Error('Token refresh failed.');
        }
    })
    .catch(error => {
        console.error('Token refresh error:', error);
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly; SameSite=Strict';
        return false;
    });
}

function handleServerError(response) {
    if (response.status >= 500 && response.status < 600) {
        throw new Error(`Server error! status: ${response.status}`);
    }
    return response.json();
}
