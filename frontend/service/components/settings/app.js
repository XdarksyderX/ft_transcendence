
import { isTwoFAEnabled, toggleTwoFA, changeUsername, changeEmail, changePassword, deleteAccount, refreshAccessToken, getUsername,  } from '../../app/auth.js';
import { throwAlert } from '../../app/render.js';
import { parseNewPasswords } from '../signup/signup.js';
import { parseEmail } from '../signup/signup.js';
import { handle2FAmodal } from './QRhandler.js';
import { logout } from '../../app/auth.js';


function getEmail() {
	//just for testing
	return ('vicenta@invent.com')
}

export function initializeSettingsEvents() {
	const currentData = getCurrentData();
	const changedData = { ...currentData}; // this makes a copy of
	// security settings events
	init2FAEvents(currentData, changedData);
	initChangePasswordEvent();
	//account settings events
	initUsernameChangeEvents(currentData, changedData);
	initEmailChangeEvents(currentData, changedData);
	initDeleteAccountEvents();
	//save settings
	initSaveChangesEvents(currentData, changedData);
}

						/********* 2FA change **********/
/* toggles the switch if needed at loading /settings and adds the event listener to the 2FA switch btn */
function init2FAEvents(currentData, changedData) {
    toggle2FASwitch(null, currentData, changedData);
    document.getElementById("2fa-toggle").addEventListener("change", (event) => toggle2FASwitch(event, currentData, changedData));
}
/* toggles the switch on and off updating the changes */
function toggle2FASwitch(event, currentData, changedData) {
	const statusElement = document.getElementById("2fa-status");
	const currentStatus = currentData.enable2FA;
	const isChecked = event ? event.target.checked : currentStatus;

	document.getElementById("2fa-toggle").checked = isChecked;
	statusElement.innerText = isChecked ? "Disable 2FA" : "Enable 2FA"
	changedData.enable2FA = isChecked;
	toggleChanges(currentData, changedData);
}
/* handles the 2FA change with backend */
 async function handle2FAChange(enable, password) {
	const data = await toggleTwoFA(enable, password)
	if (data) {
	  throwAlert(`2FA ${enable ? "activated" : "deactivated"} successfully`)
	  handle2FAmodal(enable, data.secret);
	  toggle2FASwitch()
	} else {
	  throwAlert("Failed to update 2FA")
	}
}

					/******* password change *******/
/* initializes the events on the change password form */
function initChangePasswordEvent() {
	const changePasswordForm = document.getElementById("change-password-form");
	changePasswordForm.addEventListener("submit", handlePasswordChange);
}
/* parses the passwords and handles the password change with the backend */
async function handlePasswordChange(event) {
	event.preventDefault();
	const currentPassword = document.getElementById("current-password").value
	const newPassword = document.getElementById("new-password").value
	const confirmPassword = document.getElementById("confirm-new-password").value
	
	if (!currentPassword || !newPassword || !confirmPassword) {
		throwAlert("Please fill in all fields.")
		return
	}
	if (currentPassword === newPassword) {
		return throwAlert("New password must be different")
	}
	if (!parseNewPasswords(newPassword, confirmPassword)) {
		return
	}

	const response = await changePassword(newPassword, currentPassword);
	let message;
	if (response.status === "success") {
		message = "Password changed succesfully";
	} else {
		message = response.message || "Failed to change password.";
	}
	throwAlert(message);
}

					/******* username change *******/
/* listents the submit event on the new username form, storing the changes if they exist */
function initUsernameChangeEvents(currentData, changedData) {
	const usernameForm = document.getElementById("new-username-form");
	const usernameInput = document.getElementById("new-username");

	usernameForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const newUsername = usernameInput.value;
		if (!newUsername || newUsername === getUsername()) {
			changedData.username = currentData.username;
			throwAlert(!newUsername ? "Please, fill in username field" : "New username must be different");
		} else {
			usernameInput.classList.add('selected');
			changedData.username = newUsername;
		}
		toggleChanges(currentData, changedData);
	});
	usernameInput.addEventListener("focus", () => {
		usernameInput.classList.remove('selected');
	});
}
/* handles username changes with backend */
async function handleUsernameChange(newUsername, password) {

	const response = await changeUsername(newUsername, password);
	let message;
	if (response.status === "success") {
		message = "Username changed successfully";
	} else {
		message = response.message || "Failed to change username.";
	}
	throwAlert(message);
}


					/******** email change *********/
/* listents the submit event on the new email form, storing the changes if they exist */
function initEmailChangeEvents(currentData, changedData) {
	const emailForm = document.getElementById("new-email-form");
    const emailInput = document.getElementById("new-email");

	emailForm.addEventListener("submit", (event) => {
	  event.preventDefault();
	  const newEmail = emailInput.value;

	  if (parseEmail(newEmail)) {
		emailInput.classList.add('selected');
		changedData.email = newEmail;
	  } else {
		changedData.email = currentData.email;
	  }
	  toggleChanges(currentData, changedData);
	});

	emailInput.addEventListener("focus", () => {
	  emailInput.classList.remove('selected');
	});
}
/* handles email changes with backend */
async function handleEmailChange(newEmail, password) {

    const response = await changeEmail(newEmail, password);
	let message;

	if (response.status === "success") {
		message = "Email changed succesfully";
	} else {
		message = response.message || "Failed to change email.";
	}
	throwAlert(message);
}

					/****** delete account *********/
/* inits the event on confirm-delete-account btn */
function initDeleteAccountEvents() {
    const deleteForm = document.getElementById('delete-account-form');
    deleteForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const password = document.getElementById("delete-password").value;
        if (!password) {
            throwAlert("Password is required.");
            return;
        }
        const deleteProfileModal = new bootstrap.Modal(document.getElementById('delete-profile-modal'));
        deleteProfileModal.show();

        const confirmDeleteBtn = document.getElementById("confirm-delete-account");
        confirmDeleteBtn.addEventListener("click", async () => {
            await handleDeleteAccount(password);
            deleteProfileModal.hide(); // Hide the modal after account deletion
        });
    });
}
/* handles account delete with back */
async function handleDeleteAccount(password) {

    const response = await deleteAccount(password);
	let message;

    if (response.status === "success") {
      message = "Account deleted successfully";
    } else {
      message = response.message || "Failed to delete account.";
    }
	throwAlert(message);
	logout();
}
					/************ save changes utils ************/
/* gets the user data before any changes made */
function getCurrentData() {
	return {
		enable2FA: isTwoFAEnabled(),
		username: getUsername(),
		email: getEmail()
	};
}

/* search for any changes made so enable the save changes btn */
function toggleChanges(currentData, changedData) {
    const saveChangesBtn = document.getElementById("save-changes-btn");
    let changesDetected = false;

    for (const key in currentData) {
        if (currentData[key] !== changedData[key]) {
            changesDetected = true;
            break;
        }
    }
    saveChangesBtn.disabled = !changesDetected;
}

function initSaveChangesEvents(currentData, changedData) {
	const saveBtn = document.getElementById("confirm-save-changes");
	saveBtn.addEventListener("click", async () => {
		const password = document.getElementById("confirm-changes-password").value;
		if (!password) {
			throwAlert("Password required");
			return;
		}
		await handleSaveChanges(password, currentData, changedData);

		// Hide the modal after saving changes
		const modalElement = document.getElementById('save-changes-modal');
		const modal = bootstrap.Modal.getInstance(modalElement);
		if (modal) {
			modal.hide();
		}
	});
}

  async function handleSaveChanges(password, currentData, changedData) {
	let changesMade = false;

	if (currentData.enable2FA !== changedData.enable2FA) {
	  console.log('changes.enable2FA: ', changedData.enable2FA);
		await handle2FAChange(changedData.enable2FA, password);
		changesMade = true;
	}
	if (currentData.username !== changedData.username) {
		await handleUsernameChange(changedData.username, password);
		changesMade = true;
	}
	if (currentData.email !== changedData.email) {
		await handleEmailChange(changedData.email, password);
		changesMade = true;
	}
	if (changesMade) {
		refreshAccessToken();
	}
}	

					/****** blocked users **********/
