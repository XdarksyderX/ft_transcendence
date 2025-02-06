import { throwAlert } from "../../app/render.js";
import { resetPassword } from "../../app/auth.js";

export function initializeResetPasswordEvents() {
	const resetForm = document.getElementById('reset-pw-form');

	resetForm.addEventListener('submit', handlePasswordReset);
}

async function handlePasswordReset(event) {
    event.preventDefault();
    const password = document.getElementById('new-password').value;
    if (password !== document.getElementById('confirm-new-password').value)
        return throwAlert("Passwords do not match");

    const urlParams = new URLSearchParams(window.location.search);
    console.log("URL: ", window.location.href); // Log the full URL
    const token = urlParams.get('token');
    console.log("Token: ", token); // Log the token

    try {
        const response = await resetPassword(token, password);
        if (response.status === "success") {
            throwAlert("Password changed successfully");
        } else {
            throwAlert(response.message);
        }
    } catch (error) {
        throwAlert("An error occurred during the password reset");
    }
}