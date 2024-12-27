import { navigateTo } from '../../app/router.js';

(function verifyAndRedirect() {
 
    const accessToken = localStorage.getItem('authToken');
    if (!accessToken) {
        navigateTo('/'); 
        return;
    }

    verifyAccessToken(accessToken).then(isValid => {
        if (isValid) {
            redirectToHome(); // Redirige a home.html si el token es válido
        } else {
            refreshAccessToken().then(refreshed => {
                if (!refreshed) {
                    redirectToLogin();
                } else {
                    redirectToHome(); // Redirige a home.html si el token se refresca con éxito
                }
            });
        }
    });
})();

function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/register'
        || currentPath === '/') {
        return;
    }
    navigateTo('/login');
}


function redirectToHome() {
    const currentPath = window.location.pathname;
    if (currentPath !== '/home.html') {
        navigateTo('/home');
    }
}

function logout() {
    fetch('http://localhost:5000/logout/', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            console.error('Logout failed:', response.statusText);
            return;
        }
        return response.json();
    })
    .then(data => {
        console.log('Logout successful:', data.message);
        localStorage.removeItem('authToken');
        navigateTo('/');
    })
    .catch(error => {
        console.error('An error occurred during logout:', error);
        localStorage.removeItem('authToken');
        navigateTo('/'); 
    });
}


async function verifyAccessToken(accessToken) {
    return fetch('http://localhost:5000/verify-token/', {
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
    return fetch('http://localhost:5000/refresh/', {
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
            localStorage.setItem('authToken', data.access_token);
            return true;
        } else {
            throw new Error('Token refresh failed.');
        }
    })
    .catch(error => {
        console.error('Token refresh error:', error);
        localStorage.removeItem('authToken');
        return false;
    });
}


function handleServerError(response) {
    if (response.status >= 500 && response.status < 600) {
        throw new Error(`Server error! status: ${response.status}`);
    }
    return response.json();
}
