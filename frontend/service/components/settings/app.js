
import { isTwoFAEnabled, toggleTwoFA, changeUsername, changeEmail, changePassword, deleteAccount, refreshAccessToken, getUsername,  } from '../../app/auth.js';
import { throwAlert } from '../../app/render.js';
import { parseNewPasswords } from '../signup/signup.js';
import { parseEmail } from '../signup/signup.js';
import { handle2FAmodal } from './QRhandler.js';
import { logout } from '../../app/auth.js';
import {getBlockedUsers} from '../../app/social.js'


export function initializeSettingsEvents() {

	console.log("initialize function called");
	let currentData = getCurrentData();
	let changedData = getCurrentData(); // this makes a copy of
	// security settings events
	init2FAEvents(changedData);
	initChangePasswordEvent();
	//account settings events
	initUsernameChangeEvents(changedData);
	initEmailChangeEvents(changedData);
	initDeleteAccountEvents();
	//save settings
	initSaveChangesEvents(changedData);
	// render blocked users
	renderBlockedUsers();
}

						/********* 2FA change **********/
/* toggles the switch if needed at loading /settings and adds the event listener to the 2FA switch btn */
function init2FAEvents(changedData) {
    toggle2FASwitch(null, changedData);
    document.getElementById("2fa-toggle").addEventListener("change", (event) => toggle2FASwitch(event, changedData));
}
/* toggles the switch on and off updating the changes */
function toggle2FASwitch(event, changedData) {
	const statusElement = document.getElementById("2fa-status");
	const currentStatus = isTwoFAEnabled();
	const isChecked = event ? event.target.checked : currentStatus;
	document.getElementById("2fa-toggle").checked = isChecked;
	statusElement.innerText = isChecked ? "Disable 2FA" : "Enable 2FA"
	changedData.enable2FA = isChecked;
	toggleChanges(changedData);

}
/* handles the 2FA change with backend */
 async function handle2FAChange(changedData, password, otp) {
	const enable = changedData.enable2FA;
	const response = await toggleTwoFA(enable, password, otp);
	if (response.status === "success") {
		handle2FAmodal(enable, response.secret);
	} else {
		throwAlert(`Failed to ${enable ? "enable" : "disable"} 2FA`);
		toggle2FASwitch(null, changedData);
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
function initUsernameChangeEvents(changedData) {
	const usernameForm = document.getElementById("new-username-form");
	const usernameInput = document.getElementById("new-username");
	usernameForm.addEventListener("submit", (event) => {
		const currentUsername =  getUsername();
		event.preventDefault();
		const newUsername = usernameInput.value;
		if (!newUsername || newUsername === currentUsername) {
			changedData.username = currentUsername
			throwAlert(!newUsername ? "Please, fill in username field" : "New username must be different");
		} else {
			usernameInput.classList.add('selected');
			changedData.username = newUsername;
		}
		toggleChanges(changedData);
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
function initEmailChangeEvents(changedData) {
	const emailForm = document.getElementById("new-email-form");
    const emailInput = document.getElementById("new-email");

	emailForm.addEventListener("submit", (event) => {
	  event.preventDefault();
	  const newEmail = emailInput.value;

	  if (parseEmail(newEmail)) {
		emailInput.classList.add('selected');
		changedData.email = newEmail;
	  } else {
		changedData.email = null;
	  }
	  toggleChanges(changedData);
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
		email: null
	};
}

/* search for any changes made so enable the save changes btn */
function toggleChanges(changedData) {
    const saveChangesBtn = document.getElementById("save-changes-btn");
    let changesDetected = false;
	const currentData = getCurrentData();
	console.log("on toggle changes, changedData:", changedData);

    for (const key in currentData) {
        if (currentData[key] !== changedData[key]) {
            changesDetected = true;
            break;
        }
    }
    saveChangesBtn.disabled = !changesDetected;
}

function showSaveChangesModal(enabled, changedData) {
	const modalElement = document.getElementById('save-changes-modal');
	const modal = new bootstrap.Modal(modalElement);
	const otpForm = document.getElementById('otp-form');
	const otpRequired = enabled && !changedData.enable2FA;

	if (otpRequired) {
		otpForm.style.display = 'block';
	} else {
		otpForm.style.display = 'none';
	}
	modal.show();
}

function initSaveChangesEvents(changedData) {
	const saveBtn = document.getElementById("save-changes-btn");
	
	saveBtn.addEventListener("click", () => showSaveChangesModal(isTwoFAEnabled(), changedData));
	
	const confirmSaveBtn = document.getElementById('confirm-save-changes');
	confirmSaveBtn.addEventListener('click', async () => {
		
		const password = document.getElementById("confirm-changes-password").value;
		if (!password) {
			throwAlert("Password required");
			return;
		}
		const otpRequired = isTwoFAEnabled() && !changedData.enable2FA;
		const otp = document.getElementById('otp-input').value;
		if (otpRequired && !otp) {
			throwAlert("OTP required");
			return;
		}
		const modal = bootstrap.Modal.getInstance(document.getElementById('save-changes-modal'));
		if (modal) { //Hide the modal after saving changes
			modal.hide();
		}
		await handleSaveChanges(password, changedData, otp);
	})
	
}

function cleanAfterChanges(changedData) {
    changedData = getCurrentData();
    toggleChanges(changedData);
	const inputs = document.querySelectorAll('input');
	inputs.forEach(input => {
		input.value = '';
		input.classList.remove('selected');
	});
	document.getElementById('sidebar-username').innerText = changedData.username;
}

async function handleSaveChanges(password, changedData, otp) {
    let changesMade = false;
	const currentData = getCurrentData();

    if (currentData.enable2FA !== changedData.enable2FA) {
      console.log('changes.enable2FA: ', changedData.enable2FA);
        await handle2FAChange(changedData, password, otp);
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
        await refreshAccessToken();
		cleanAfterChanges(changedData);
    }
}	

					/******** blocked users* *******/


async function handleGetBlockedUsers() {
	const response = await getBlockedUsers();
	if (response.status === "success") {
		return (response.data);
	} else {
		throwAlert(response.message || "An error ocurred while getting blocked users data");
		return (null);
	}
}

async function renderBlockedUsers() {
	const list = document.getElementById('blocked-users-list');
	try {
		const blockedUsers = await handleGetBlockedUsers(); // Asegúrate de esperar la resolución
		if (!blockedUsers) {
			return;
		}
		blockedUsers.forEach(user => {
			const card = createBlockedUserCard(user); // Asume que esta función crea un elemento DOM para el usuario
			list.appendChild(card);
		});
	} catch (error) {
		console.error("Error al renderizar usuarios bloqueados:", error);
	}
}

function createBlockedUserCard(user) {
    const card = document.createElement('div');
    card.className = "friend-btn d-flex flex-column flex-md-row justify-content-between align-items-center";
    card.setAttribute('data-blocked-user-id', user.id);
    card.innerHTML = `
    <div class="d-flex align-items-center mb-2 mb-md-0">
        <img src="${user.avatar}" alt="${user.username}" class="friend-picture">
            <p class="mb-0 ms-2">${user.username}</p>
    </div>
        <button class="btn ctm-btn-danger">
            <i class="fas fa-user-minus"></i> Unblock
        </button>
    `;
    return card;
}