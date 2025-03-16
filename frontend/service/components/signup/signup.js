import { navigateTo } from '../../app/router.js';
import { throwAlert } from '../../app/render.js';
import { register } from '../../app/auth.js';
import { verifyEmail } from '../../app/auth.js';

async function hardcodedSingup() {
    const hardCredentials = { username : "Vicenta" , email : "vicenta@invent.com", password: "12345678"}
    if (await register(hardCredentials))
        {
            throwAlert('Account created successfully. Verify your email to login!');
            navigateTo('/login');
        }
}

export function parseNewPasswords(password, confirmPassword) {

    if (!password || !confirmPassword) {
        throwAlert('Please, fill in all fields.');
        return false;
    }
    if (password !== confirmPassword) {
        throwAlert('Passwords do not match.');
        return false;
    }
    if (password.length < 8) {
        throwAlert('Passwords must have more than 8 characters');
        return false 
    }
    return true
}

export function parseEmail(email) {
    if (!email) {
        throwAlert("Please, fill in email field") 
    }
    if (!(email.includes('@') && email.includes('.'))) {
        throwAlert('Please, enter a valid email address.');
        return false 
    }
    return true
}

export function initializeSignupEvents() {
    const cancelSignup = document.getElementById('cancel-signup');
    const registerForm = document.getElementById('register');

    cancelSignup.addEventListener('click',() => navigateTo('/'));
    
    if (registerForm) {
        registerForm.addEventListener('click', async function(event) {
            event.preventDefault();
            const username = document.getElementById('new-username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!username || !email || !password || !confirmPassword) {
            //    throwAlert('Please fill in all fields');
                hardcodedSingup();
                return;
            }
            if (!parseNewPasswords(password, confirmPassword) || !parseEmail(email)) {
                return ;
            }
            const userCredentials = { username, email, password };
            try {

                const response = await register(userCredentials);
                if (response.status === "success") {
                    throwAlert('Account created successfully. Verify your email to login!');
                    navigateTo('/login');
                } else {
                    throwAlert(response.message);
                }
            } catch (error) {
                throwAlert("An error occurred during the sing up process");
            }
        });
    }
}

export function initializeVerifyEmailEvents() {
    const verifyBtn = document.getElementById('verify-btn');

    loadBotCanvas(verifyBtn);
    verifyBtn.addEventListener('click', async () => {
        
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        try {
            const response = await verifyEmail(token);
            if (response.status === "success") {
                navigateTo('/login');
                throwAlert("Email verification succesful");
        } else {
            //throwAlert(response.message);
            throwAlert("Error while email verification");
        }
    } catch (error) {
        throwAlert("An error occurred during the email verification");
    }});
}

function loadBotCanvas(verifyBtn) {
    const imgSrc = '../../resources/404/bot.png'; // Explicit image source

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create an Image object
    const img = new Image();
    img.src = imgSrc;

    // Get the CSS variable value
    const rootStyles = getComputedStyle(document.documentElement);
    const darkColor = rootStyles.getPropertyValue('--dark').trim();

    // Convert the CSS variable value to RGB
    const rgb = hexToRgb(darkColor);

    const processImage = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Set canvas dimensions to 20% of the original image size
        canvas.width = originalWidth * 0.2;
        canvas.height = originalHeight * 0.2;

        // Draw the image onto the canvas with scaling
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get the image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Manipulate the image data to change its color
        for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3];
            if (alpha > 0) {
                pixels[i] = rgb.r;     // Red
                pixels[i + 1] = rgb.g; // Green
                pixels[i + 2] = rgb.b; // Blue
            }
        }

        // Put the modified image data back onto the canvas
        ctx.putImageData(imageData, 0, 0);

        // Add the canvas to the verifyBtn container
        verifyBtn.appendChild(canvas);
    };

    if (img.complete) {
        processImage();
    } else {
        img.onload = processImage;
    }
}

function hexToRgb(hex) {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse the r, g, b values
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return { r, g, b };
}