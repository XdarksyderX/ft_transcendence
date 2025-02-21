import { createPongMatchInvitation, acceptInvitation } from "../../app/pong.js";
import { throwAlert } from "../../app/render.js";
import { navigateTo } from "../../app/router.js";

function launchWaitModal(friendName, game, elements) {
	const modal = new bootstrap.Modal(elements.modal.waitGame);
	elements.modal.text.innerHTML = `Waiting for ${friendName} to start a game of ${game}...`;
	modal.show();
	handleProgressBar(modal, elements);
}

function handleProgressBar(modal, elements) {
	let progress = 100;
	const interval = setInterval(() => {
		let time = Math.floor(progress / 100 * 30);
		progress -= 1;
		elements.modal.progressBar.style.width = `${progress}%`;
		elements.modal.progressBar.setAttribute('aria-valuenow', progress);
		elements.modal.timer.textContent = `${time}`;
		if (progress <= 0) {
			clearInterval(interval);
			modal.hide();
		}
		if (progress < 50) {
			elements.modal.timer.style.color = `var(--light)`;
		} else {
			elements.modal.timer.style.color = `var(--dark)`;
		}
	}, 300);
	elements.modal.waitGame.addEventListener('hidden.bs.modal', () => {
		clearInterval(interval);
		elements.modal.progressBar.style.width = '100%';
		elements.modal.progressBar.setAttribute('aria-valuenow', 100);
		elements.modal.timer.textContent = '30s';
		elements.modal.timer.style.color = 'var(--dark);'
	});
}

export function handleSendGameInvitation(game, elements, friend) {
	launchWaitModal(friend.username, game, elements);
	if (game === 'pong') {
		sendPongInvitation(friend.username);
	}
}

async function sendPongInvitation(friendName) {
    try {
        const response = await createPongMatchInvitation(friendName);
        if (response.status === "success") {
            console.log('Invitation sent successfully:', response);
        } else {
            console.error('Failed to send invitation:', response.message);
        }
    } catch (error) {
        console.error('Error sending invitation:', error);
    }
}

export async function handleAcceptInvitation(token) {
	const response = await acceptInvitation(token);
	if (response.status === "success") {
		navigateTo("/pong");
	} else {
		console.error('Failed to accept invitation:', response.message);
	}
}