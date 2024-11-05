const user = 'erivero-';
const pass = 'patata';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('submit');

    loginForm.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the form from submitting

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === '' || password === '') {
            alert('Please fill in all fields');
            return;
        }
        //ill eventually call login function here
        //const userCredentials = { username, password };
        if (username != user) {
            const modal = new bootstrap.Modal(document.getElementById('user-modal'));
            modal.show();
            return;
        }
        if (username === user && password === pass) {
            /* alert('Login successful!'); */
            window.location.href = "home.html";
        } else {
            alert('Incorrect password');
        }
    });
});

function login(userCredentials) {
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userCredentials),
    })
      .then(response => response.json())
      .then(data => {
        if (data.jwt) {
          // Guardar el JWT en el localStorage
          localStorage.setItem('authToken', data.jwt);
          // Redirigir al usuario a la página protegida
          window.location.href = '/home.html';
        } else {
          alert('Error de autenticación');
        }
      })
      .catch(error => console.error('Error en la autenticación:', error));
  }
  