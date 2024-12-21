// I'll have to adapt register.js to the new logic but not today :c
import { navigateTo } from '../../app/router.js';

export function initializeSignupEvents() {
	const cancelSignup = document.getElementById('cancel-signup');
	if (cancelSignup) {
		cancelSignup.addEventListener('click', () => {
			navigateTo('/');
		});
	}
	// el signup más hardcodeado de la historia síes
	document.getElementById('register').addEventListener('click', () => {
		navigateTo('home');
	})
}

