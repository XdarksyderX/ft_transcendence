document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('submit');
  loginForm.addEventListener('click', function(event) {
      event.preventDefault();
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
  fetch('http://localhost:5000/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userCredentials)
  })
  .then(response => handleServerError(response))
  .then(data => {
      if (data.status === 'success' && data.access_token) {
          console.log('Login successful, received access token:', data.access_token);
          localStorage.setItem('authToken', data.access_token);
          window.location.href = '/home.html';
      } else if (data.status === 'error' && data.message === 'OTP required.') {
          showOTPForm(data.temp_token);
      } else {
          alert(data.message || 'Authentication error');
      }
  })
  .catch(error => {
      console.error('Authentication error:', error);
      alert('An error occurred during login. Please try again later.');
  });
}

function showOTPForm(tempToken) {
    const mainContainer = document.querySelector('main.container');
    mainContainer.innerHTML = `
        <div class="ctm-card">
            <div class="w-75">
                <h2 class="text-center ctm-text-title">Enter OTP</h2>
                <form id="otp-form">
                    <div class="mb-3">
                        <label for="otp" class="form-label ctm-text-light">One-Time Password (OTP)</label>
                        <input type="text" class="form-control ctm-text-dark" id="otp" required>
                    </div>
                    <div class="d-flex justify-content-center">
                        <button type="submit" class="btn ctm-btn" id="submit-otp">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const otpForm = document.getElementById('otp-form');
    otpForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const otpCode = document.getElementById('otp').value;
        if (otpCode === '') {
            alert('Please enter the OTP');
            return;
        }

        verifyOTP(tempToken, otpCode);
    });
}

function verifyOTP(tempToken, otpCode) {
    console.log({ temp_token: tempToken, two_fa_code: otpCode })
    fetch('http://localhost:5000/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, two_fa_code: otpCode })
    })
    .then(response => {
        if (response.status >= 500 && response.status < 600) {
            throw new Error(`Server error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        if (data.status === 'success' && data.access_token) {
            console.log('OTP verified, received JWT:', data.access_token);
            localStorage.setItem('authToken', data.access_token);
            window.location.href = '/home.html';
        } else {
            alert(data.message || 'OTP verification failed');
        }
    })
    .catch(error => {
        console.error('OTP verification error:', error);
        alert('An error occurred during OTP verification. Please try again later.');
    });
}