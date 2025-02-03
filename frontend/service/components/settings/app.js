import { navigateTo } from "../../app/router.js";
// import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';
//import { getCookie } from '../../app/auth.js'
import { toggleEditMode } from "../profile/app.js";
import { isTwoFAEnabled, toggleTwoFA, changeUsername, changeEmail, changePassword, deleteAccount, refreshAccessToken,  } from '../../app/auth.js';
import { throwAlert } from '../../app/render.js';
import { loadLogin } from '../login/login.js';

export function initializeSettingsEvents() {
    setup2FA();
    document.getElementById("change-username-btn").addEventListener("click", handleChangeUsername);
    document.getElementById("change-email-btn").addEventListener("click", handleChangeEmail);
    document.getElementById("change-password-btn").addEventListener("click", handleChangePassword);
    document.getElementById("delete-account-btn").addEventListener("click", handleDeleteAccount);
}

/** 2FA Setup */
function setup2FA() {
    const twoFAToggle = document.getElementById("2fa-toggle");
    const otpSection = document.getElementById("otp-section");
    const otpSubmit = document.getElementById("2fa-submit");

    twoFAToggle.checked = isTwoFAEnabled();
    twoFAToggle.addEventListener("change", () => {
        otpSection.style.display = "block";
    });

    otpSubmit.addEventListener("click", async () => {
        const password = document.getElementById("2fa-password").value;
        const enable = twoFAToggle.checked;
        const success = await toggleTwoFA(enable, password);

        if (success) {
            throwAlert(`2FA ${enable ? "activated" : "deactivated"} successfully`);
            otpSection.style.display = "none";
        } else {
            throwAlert("Failed to update 2FA");
            twoFAToggle.checked = !enable;
        }
        refreshAccessToken();
        setup2FA();
    });
}

/** Change Username */
async function handleChangeUsername() {
    const newUsername = document.getElementById("new-username").value;
    const password = document.getElementById("username-password").value;

    if (!newUsername || !password) return throwAlert("Please fill in all fields.");

    const success = await changeUsername(newUsername, password);
    await refreshAccessToken();
    loadLogin();
    success ? throwAlert("Username changed successfully") : throwAlert("Failed to change username.");
}

/** Change Email */
async function handleChangeEmail() {
    const newEmail = document.getElementById("new-email").value;
    const password = document.getElementById("email-password").value;

    if (!newEmail || !password) return throwAlert("Please fill in all fields.");

    const success = await changeEmail(newEmail, password);
    await refreshAccessToken();
    success ? throwAlert("Email changed successfully") : throwAlert("Failed to change email.");
}

/** Change Password */
async function handleChangePassword() {
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!currentPassword || !newPassword || !confirmPassword) return throwAlert("Please fill in all fields.");
    if (newPassword !== confirmPassword) return throwAlert("Passwords do not match.");

    const success = await changePassword(newPassword, currentPassword);
    await refreshAccessToken();
    success ? throwAlert("Password changed successfully") : throwAlert("Failed to change password.");
}

export function initializeSettingsEvents() {
	init2FAEvents();
	document.getElementById('edit-profile-pencil').addEventListener('click', () => {
		navigateTo("/profile");
        //we create a temporal flag to toggle the edit mode directly
        sessionStorage.setItem("editMode", "true");
    } )
	initChangePasswordEvents();
}
/** Delete Account (only requires password) */
async function handleDeleteAccount() {
    const password = document.getElementById("delete-password").value;

    if (!password) return throwAlert("Password is required.");
    
    const success = await deleteAccount(password);
    refreshAccessToken();
    success ? throwAlert("Account deleted successfully") : throwAlert("Failed to delete account.");
}
