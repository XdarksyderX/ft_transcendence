import { throwAlert } from "../../app/render.js";
import { navigateTo } from "../../app/router.js";

let hardcodedStatus = false;

function get2FAstatus() { //this will evenctually be a fetch
	return (hardcodedStatus);
}

function set2FAstatus(status) {
	hardcodedStatus = status;
    throwAlert(`2FA is now ${status ? 'enabled' : 'disabled'}`);
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