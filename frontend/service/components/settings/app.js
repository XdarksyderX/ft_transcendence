import { throwAlert } from "../../app/render.js";
import { navigateTo } from "../../app/router.js";
import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';
import { getCookie } from '../../app/auth.js'

const apiUrl = 'http://localhost:5050'

function get2FAstatus() {
	const { two_fa_enabled } = jwtDecode(getCookie('authToken'));
	console.log("2fa is: ", two_fa_enabled);
	return (two_fa_enabled);
}

function handle2FAmodal(status) {
    const modalElement = document.getElementById('2fa-qr-modal');
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static', // Disables closing the modal by clicking outside of it
        keyboard: false     // Disables closing the modal with the escape key
    });
	console.log('status: ', status);
    if (!status) {
        throwAlert(`2FA is now disabled`);
    } else {
        modal.show();
    }

    // Disable the close buttons
    const closeButtons = modalElement.querySelectorAll('.close-qr-modal');
    closeButtons.forEach(button => {
        button.disabled = true;
    });

    setTimeout(() => {
        closeButtons.forEach(button => {
            button.disabled = false;
        });
    }, 5000); // 5 seconds
}
function toggle2FA(event) {

	const status = document.getElementById('2fa-status');
    
	let isChecked;
	if (event) {
		isChecked = event.target.checked;
		set2FAstatus(isChecked);
	} else {
		isChecked = get2FAstatus();
		if (isChecked) {
			document.getElementById('2fa-toggle').checked = true;
		}
	}
	status.innerText = (isChecked ? 'Disable 2FA' : 'Enable 2FA');
}
//checks the actual status of 2FA and adds an event listener to the switch
function init2FAEvents() {
	toggle2FA();
	document.getElementById("2fa-toggle").addEventListener('change', toggle2FA);
}

async function set2FAstatus(status) {
    try {
        const response = await fetch(apiUrl + '/activate-2f', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getCookie('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enable: status })
        });
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        const data = JSON.parse(responseText);
        if (response.ok) {
			handle2FAmodal(status);
        } else {
            console.error('Failed to update 2FA status:', data.message);
            throwAlert('Failed to update 2FA status.');
        }
    } catch (error) {
        console.error('Error setting 2FA status:', error);
        throwAlert('Failed to update 2FA status.');
    }
}

/* async function changePassword(currentPw, newPw) {
    try {
        const response = await fetch(apiUrl + '/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getCookie('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ current_password: currentPw, new_password: newPw })
        });

        const contentType = response.headers.get('Content-Type');
        const responseText = await response.text();
        console.log("on changePassword(), response: ", responseText);

        let data;
        if (contentType && contentType.includes('application/json')) {
            data = JSON.parse(responseText);
        } else {
            console.error('Response is not JSON:', responseText);
            throwAlert('Failed to change password.');
            return;
        }

        if (response.ok) {
            throwAlert('Password changed successfully');
        } else {
            console.error('Failed to change password:', data.message);
            throwAlert('Failed to change password.');
        }
    } catch (error) {
        console.error('Failed to change password:', error.message);
        throwAlert('Failed to change password.');
    }
}
 */
function parsePasswords(currentPw, newPw, confirmPw) {
	if (currentPw === '' || newPw === '' || confirmPw === '') {
		throwAlert('Please fill in all fields');
	} else if (currentPw.length < 8) {
		throwAlert('Incorrect password');
	} else if (newPw !== confirmPw) {
		throwAlert('Passwords do not match');
	} else if (currentPw === newPw) {
		throwAlert('New password must be different to the current one, you need a bit more of imagination, pls');
	} else if (newPw.length < 8) {
		throwAlert('Passwords must have at least 8 characters');
	} else {
		return (true);
	}
	return (false);
}

function changePassword() {
	throwAlert('perdón no doy abasto esto todavía no está hecho');
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
        
        const newPassword = parsePasswords(currentPw, newPw, confirmPw);
        if (newPassword) {
            changePassword(currentPw, newPw);
        }
    });
}

export function initializeSettingsEvents() {
	init2FAEvents();
	document.getElementById('edit-profile-pencil').addEventListener('click', () => {
		navigateTo("/profile"); //eventually ill trigger the edit mode but not today
	} )
	initChangePasswordEvents();
}