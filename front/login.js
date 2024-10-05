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
        if (username != user) {
            const modal = new bootstrap.Modal(document.getElementById('user-modal'));
            modal.show();
            return;
        }
        if (username === user && password === pass) {
            /* alert('Login successful!'); */
            window.location.href = "home_log.html";
        } else {
            alert('Incorrect password');
        }
    });
});