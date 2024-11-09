const user = 'erivero-';
const pass = 'patata';

// document.addEventListener('DOMContentLoaded', () => {
//     const loginForm = document.getElementById('submit');

//     loginForm.addEventListener('click', function(event) {
//         event.preventDefault(); // Prevent the form from submitting

//         const username = document.getElementById('username').value;
//         const password = document.getElementById('password').value;

//         if (username === '' || password === '') {
//             alert('Please fill in all fields');
//             return;
//         }
//         //ill eventually call login function here
//         //const userCredentials = { username, password };
//         if (username != user) {
//             const modal = new bootstrap.Modal(document.getElementById('user-modal'));
//             modal.show();
//             return;
//         }
//         if (username === user && password === pass) {
//             /* alert('Login successful!'); */
//             window.location.href = "home.html";
//         } else {
//             alert('Incorrect password');
//         }
//     });
// });

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

      const userCredentials = { username, password };
      login(userCredentials);
  });
});

function login(userCredentials) {
  console.log('Attempting to log in with credentials:', userCredentials);

  fetch('http://localhost:5000/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userCredentials),
  })
    .then(response => {
      console.log('Received response:', response);
      return response.json();
    })
    .then(data => {
      console.log('Received data:', data);
      if (data.jwt) {
        console.log('Login successful, received JWT:', data.jwt); 
        localStorage.setItem('authToken', data.jwt); // Store the JWT in localStorage
        window.location.href = '/home.html'; // Redirect the user to the protected page

      } else {
        console.log('Authentication error, no JWT received');
        alert('Authentication error');
      }
    })
    .catch(error => {
      console.error('Authentication error:', error);
    });
}