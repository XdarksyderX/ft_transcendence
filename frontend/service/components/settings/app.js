import { throwAlert } from "../../app/render.js";
import { navigateTo } from "../../app/router.js";
import jwtDecode from 'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js';
import { getCookie } from '../../app/auth.js'

let hardcodedStatus = false;
const url2FA = 'http://localhost:5050/activate-2fa'

function get2FAstatus() {
	const { is_2fa_enabled } = jwtDecode(getCookie('authToken'));
	return (is_2fa_enabled);
}

async function set2FAstatus(status) {
    try {
        const response = await fetch(url2FA, {
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
            throwAlert(`2FA is now ${status ? 'enabled' : 'disabled'}`);
        } else {
            console.error('Failed to update 2FA status:', data.message);
            throwAlert('Failed to update 2FA status.');
        }
    } catch (error) {
        console.error('Error setting 2FA status:', error);
        throwAlert('Failed to update 2FA status.');
    }
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

export function initializeSettingsEvents() {
	init2FAEvents();
	document.getElementById('edit-profile-pencil').addEventListener('click', () => {
		navigateTo("/profile");
	
	} )
}