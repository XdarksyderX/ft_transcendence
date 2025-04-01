import { isTwoFAEnabled, toggleTwoFA, changeUsername, changeEmail, changePassword, deleteAccount, refreshAccessToken, getUsername,  } from '../../app/auth.js';
import { hideModalGently, throwAlert, throwToast } from '../../app/render.js';
import { parseNewPasswords } from '../signup/signup.js';
import { parseEmail } from '../signup/signup.js';
import { handle2FAmodal } from './QRhandler.js';
import { logout } from '../../app/auth.js';
import { getBlockedList, unblockUser, getAvatar } from '../../app/social.js'
import { initOTPform } from '../login/login.js';
import { resizeSidebarUsername } from '../sidebar/app.js';


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
	initOTPform();
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
        return true;
    } else {
        throwAlert(`Failed to ${enable ? "enable" : "disable"} 2FA`);
        toggle2FASwitch(null, changedData);
        return false;
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
	if (response.status === "success") {
		throwToast("Password changed succesfully");
	} else {
		throwAlert(response.message || "Failed to change password.");
	}
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
export async function handleUsernameChange(newUsername, password) {
    const response = await changeUsername(newUsername, password);
    if (response.status === "success") {
        return true;
    } else {
        throwAlert(response.message || "Failed to change username.");
        return false;
    }
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
    if (response.status === "success") {
        return true;
    } else {
        throwAlert(response.message || "Failed to change email.");
        return false;
    }
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
			hideModalGently(deleteProfileModal);
        });
    });
}
/* handles account delete with back */
async function handleDeleteAccount(password) {

    const response = await deleteAccount(password);
	let message;

    if (response.status === "success") {
		throwToast("Account deleted successfully");
		logout();
    } else {
	  throwAlert(response.message || "Failed to delete account.");
    }
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
		        const otpInputs = document.querySelectorAll('.otp-input');
        let otpCode = '';
        otpInputs.forEach(input => {
            otpCode += input.value;
        });
		if (otpRequired && !otpCode) {
			throwAlert("OTP required");
			return;
		} 
		const modal = bootstrap.Modal.getInstance(document.getElementById('save-changes-modal'));
		if (modal) { //Hide the modal after saving changes
			modal.hide();
		}
		await handleSaveChanges(password, changedData, otpCode);
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
	resizeSidebarUsername();
}

async function handleSaveChanges(password, changedData, otp) {
    let changesMade = false;
    const currentData = getCurrentData();

    if (currentData.enable2FA !== changedData.enable2FA) {
        console.log('changes.enable2FA: ', changedData.enable2FA);
        const success = await handle2FAChange(changedData, password, otp);
        changesMade = changesMade || success;
    }
    if (currentData.username !== changedData.username) {
        const success = await handleUsernameChange(changedData.username, password);
        changesMade = changesMade || success;
    }
    if (currentData.email !== changedData.email) {
        const success = await handleEmailChange(changedData.email, password);
        changesMade = changesMade || success;
    }
    if (changesMade) {
		throwToast("Changes applyied succesfully");
        await refreshAccessToken();
        cleanAfterChanges(changedData);
    }
}

					/******** blocked users* *******/


async function handleGetBlockedUsers() {
	const response = await getBlockedList();
	if (response.status === "success") {
		return (response.blocked);
	} else {
		throwAlert(response.message || "An error ocurred while getting blocked users data");
		return (null);
	}
}

async function renderBlockedUsers() {
    const list = document.getElementById('blocked-users-list');

    try {
        const blockedUsers = await handleGetBlockedUsers();
        if (!blockedUsers) {
            return;
        }
        for (const user of blockedUsers) {
            const card = await createBlockedUserCard(user);
            list.appendChild(card);
        }
    } catch (error) {
        console.error("Error al mostrar usuarios bloqueados:", error);
    }
}

async function createBlockedUserCard(username) {
    const card = document.createElement('div');
	const avatar = await getAvatar(username);
    card.className = "user-card d-flex flex-column flex-md-row justify-content-between align-items-center";
  //  card.setAttribute('data-blocked-user-id', user.id); //i dont have any id
    card.innerHTML = `
    <div class="d-flex align-items-center mb-2 mb-md-0">
        <img src="${avatar}" alt="${username}" class="friend-picture">
            <p class="mb-0 ms-2">${username}</p>
    </div>
        <button class="btn ctm-btn-danger">
            <i class="fas fa-user-minus"></i> Unblock
        </button>
    `;

    const unblockBtn = card.querySelector('button');
    unblockBtn.addEventListener('click', () => handleUnblockUser(username));

    return card;
}

export async function handleUnblockUser(username) {
	const response = await unblockUser(username);
	if (response.status === "success") {
		throwToast(`${username} is now unblocked`);
		document.getElementById('blocked-users-list').innerHTML = '';
		renderBlockedUsers();
	} else {
		throwAlert(response.message);
	} 
}
