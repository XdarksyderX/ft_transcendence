(function verifyAndRedirect() {
    const accessToken = localStorage.getItem('authToken');
    if (!accessToken) {
        redirectToLogin();
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
    if (currentPath.endsWith('/login.html') || currentPath.endsWith('/register.html') || currentPath.endsWith('/index.html')) {
        return;
    }
    window.location.href = '/login.html';
}
// aparentemente window.location.href volvería a cargar la página y dejaría de ser SPA
// por lo que se debería usar history.pushState() para cambiar la URL sin recargar la página
// pendiente arreglar 
function redirectToHome() {
    const currentPath = window.location.pathname;
    if (currentPath !== '/home.html') {
        window.location.href = '/home.html';
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
        window.location.href = '/login.html';
    })
    .catch(error => {
        console.error('An error occurred during logout:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/login.html'; 
    });
}


function verifyAccessToken(accessToken) {
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

function refreshAccessToken() {
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

function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('/login.html') || currentPath.endsWith('/register.html')
        || currentPath.endsWith('/index.html')) {
        return;
    }
    window.location.href = '/login.html';
}

function handleServerError(response) {
    if (response.status >= 500 && response.status < 600) {
        throw new Error(`Server error! status: ${response.status}`);
    }
    return response.json();
}
