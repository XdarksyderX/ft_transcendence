import { navigateTo } from '../../app/router.js';
import { throwAlert } from '../../app/render.js';
import { isTwoFAEnabled, toggleTwoFA } from '../../app/auth.js';

function get2FAstatus() {
	const twoFAEnabled = isTwoFAEnabled();
	console.log("2FA is: ", twoFAEnabled);
	return twoFAEnabled;
}

function handle2FAmodal(status) {
    const modalElement = document.getElementById('2fa-qr-modal');
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });

	console.log('Status:', status);
    if (!status) {
        throwAlert(`2FA is now disabled`);
    } else {
        modal.show();
    }

    const closeButtons = modalElement.querySelectorAll('.close-qr-modal');
    closeButtons.forEach(button => button.disabled = true);

    setTimeout(() => {
        closeButtons.forEach(button => button.disabled = false);
    }, 5000);
}

async function toggle2FA(event) {
	const statusElement = document.getElementById('2fa-status');

	let isChecked;
	if (event) {
		isChecked = event.target.checked;
		await set2FAstatus(isChecked);
	} else {
		isChecked = get2FAstatus();
		if (isChecked) {
			document.getElementById('2fa-toggle').checked = true;
		}
	}

	statusElement.innerText = isChecked ? 'Disable 2FA' : 'Enable 2FA';
}

function init2FAEvents() {
	toggle2FA();
	document.getElementById("2fa-toggle").addEventListener('change', toggle2FA);
}

async function set2FAstatus(status) {
    try {
        const response = await toggleTwoFA(status);

        if (response) {
            handle2FAmodal(status);
        } else {
            throwAlert('Failed to update 2FA status.');
        }
    } catch (error) {
        console.error('Error setting 2FA status:', error);
        throwAlert('Failed to update 2FA status.');
    }
}

function parsePasswords(currentPw, newPw, confirmPw) {
	if (!currentPw || !newPw || !confirmPw) {
		throwAlert('Please fill in all fields');
	} else if (currentPw.length < 8) {
		throwAlert('Incorrect password');
	} else if (newPw !== confirmPw) {
		throwAlert('Passwords do not match');
	} else if (currentPw === newPw) {
		throwAlert('New password must be different from the current one.');
	} else if (newPw.length < 8) {
		throwAlert('Passwords must have at least 8 characters');
	} else {
		return true;
	}
	return false;
}

function changePassword() {
	throwAlert('This feature is not implemented yet.');
}

function initChangePasswordEvents() {
    const passwordForm = document.getElementById('change-password-form');
    passwordForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const currentPw = document.getElementById('current-password').value;
        const newPw = document.getElementById('new-password').value;
        const confirmPw = document.getElementById('confirm-new-password').value;
        
        console.log('Current Password:', currentPw);
        console.log('New Password:', newPw);
        console.log('Confirm Password:', confirmPw);
        
        if (parsePasswords(currentPw, newPw, confirmPw)) {
            changePassword(currentPw, newPw);
        }
    });
}

export function initializeSettingsEvents() {
	init2FAEvents();
	document.getElementById('edit-profile-pencil').addEventListener('click', () => {
		navigateTo("/profile");
	});
	initChangePasswordEvents();
}
