import { getUsername } from '../../app/auth.js';
import { handleAcceptInvitation, handleDeclineInvitation } from '../home/game-invitation.js';
import { formatTime, toggleChat, getElements } from './app.js';

/* * * * * * * * * * * * * * * * * * *  NORMAL MESSAGE BUBBLE  * * * * * * * * * * * * * * * * * * */

export function createMessageBubble(message) {
	const card = document.createElement('div');
	const messageClass = message.sender === getUsername() ? 'out' : 'in';
	card.classList = `message ${messageClass}`;
	card.innerHTML = `
		<div class="d-flex">
			<div class="me-2">${message.message}</div>
			<small class="ms-auto text-muted timestamp">${formatTime(message.sent_at)}</small>
		</div>
	`;
	return card;
}
/* * * * * * * * * * * * * * * * * * *  SPECIAL MESSAGE BUBBLES  * * * * * * * * * * * * * * * * * * */

export function createSpecialBubble(message) {
    const messageContent = JSON.parse(message.message);
    const { type } = messageContent;
    const isSender = message.sender === getUsername();

    let card;
    switch (type) {
        case 'pong-match':
            if (isSender) {
                card = createQuickGameSent('Pong', message.receiver);
            } else {
                card = createQuickGameInvitation(message.sent_at, message.sender, messageContent.invitation_token);
            }
            break;
        default:
            console.warn(`Unknown invitation type: ${type}`);
            card = document.createElement('div');
            card.innerHTML = `<p>Unknown invitation type: ${type}</p>`;
    }

    return card;
}

/* * * * * * * * * * * * * * * * * * *  QUICK GAME INVITATIONS  * * * * * * * * * * * * * * * * * * */
// a map to store the interval id with each invitation card token, so we can clear the interval whenever, wherever, we're meant to be together
const activeIntervals = new Map();

function createQuickGameSent(game, friend) {
    const card = document.createElement('div');
    card.innerHTML = `
        <div class="card-border special-bubble ms-auto" style="max-width: 250px;">
            <div class="game-invitation card overflow-hidden">
                <div class="card-body position-relative p-2" style="z-index: 1;">
                    <h6 class="mb-2 ctm-text-title">${game} invitation!</h6>
                    <p class="card-text mb-2 small ctm-text-light">You sent a ${game} invitation to ${friend}</p>
                </div>
            </div>
        </div>`;
	return (card);
}

export function createQuickGameInvitation(sent_at, sender, token) {
	const card = document.createElement('div');
	const remainingTime = calculateTimeRemaining(sent_at); 
	card.innerHTML = `
		<div data-token=${token} class="quick-game-invitation special-bubble card border-0 overflow-hidden" style="max-width: 250px;">
			<div class="progress position-absolute w-100 h-100" style="z-index: 0;" data-progress>
				<div class="progress-bar" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
			</div>
			<div class="card-body position-relative p-3" style="z-index: 1;">
				<h6 class="card-title mb-2">Game Invitation</h6>
				<p class="card-text mb-2 small">${sender} invited you!</p>
				<div class="d-flex justify-content-between align-items-center">
					<button class="btn btn-sm ctm-btn flex-grow-1 me-1" data-action="accept">
						Accept <span class="ms-1 badge bg-light text-dark" data-timer>${remainingTime}s</span>
					</button>
					<button class="btn btn-sm ctm-btn-danger flex-grow-1 ms-1" data-action="decline">Decline</button>
				</div>
			</div>
		</div>
	`;

	const btns = {
		accept: card.querySelector('[data-action="accept"]'),
		decline: card.querySelector('[data-action="decline"]'),
		timer: card.querySelector('[data-timer]')
	}
	startProgressBar(remainingTime, card, btns, token);
	btns.accept.addEventListener('click', () => {
		if (handleAcceptInvitation(token))
			toggleChat(getElements());
	});
	return card; // Return the card element
}

function calculateTimeRemaining(sentAt) {
	const sentAtTimestamp = new Date(sentAt).getTime();
	const expirationTimestamp = sentAtTimestamp + 30000;
	return Math.max(0, Math.floor((expirationTimestamp - Date.now()) / 1000));
}


function startProgressBar(remainingTime, card, btns, token) {
    const expirationTime = Date.now() + (remainingTime * 1000);
    const progressBar = card.querySelector('[data-progress] .progress-bar');

    const interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, (expirationTime - now) / 1000);
        const progress = (timeLeft / 30) * 100;

        progressBar.style.width = `${progress}%`;
        btns.timer.textContent = `${Math.ceil(timeLeft)}s`;

        if (timeLeft <= 0) {
            cleanProgressBar(progressBar, btns, interval);
        }
    }, 100);

    activeIntervals.set(token, interval);

    btns.decline.addEventListener("click", () => {
        cleanProgressBar(progressBar, btns, interval);
        handleDeclineInvitation(token);
    });
}

function cleanProgressBar(progressBar, btns, interval) {
	clearInterval(interval);
	progressBar.style.width = '0%'; // Set the progress bar width to 0%
	btns.accept.disabled = true; // Disable the accept button
	btns.decline.disabled = true; // Disable the decline button
	btns.timer.textContent = '0s';
}

export function handleCancelledInvitation(token) {
	const card = document.querySelector(`[data-token="${CSS.escape(token)}"]`);
	if (!card) {
		console.error(`Card with token ${token} not found`);
		return;
	}
	const btns = {
		accept: card.querySelector('[data-action="accept"]'),
		decline: card.querySelector('[data-action="decline"]'),
		timer: card.querySelector('[data-timer]')
	};

    const progressBar = card.querySelector('[data-progress] .progress-bar'); // Añadir esto

	const intervalId = activeIntervals.get(token);
	console.log(`Recuperando interval para ${token}:`, intervalId);
    
	if (intervalId) {
        cleanProgressBar(progressBar, btns, intervalId);
    }
}




/* * * * * * * * * * * * * * * * * * *  TOURNAMENT INVITATIONS  * * * * * * * * * * * * * * * * * * */


/* function createTournamentInvitation(friendName, tourName) {
	return `
	<div class="outer-card" style="max-width: 250px;">
		<div class="game-invitation card overflow-hidden">
			<div class="card-body position-relative p-2" style="z-index: 1;">
				<h6 class="mb-2 ctm-text-title">new tournament</h6>
				<p class="card-text mb-2 small ctm-text-light"><span id="inviter-name">${friendName}</span> invited you to the <span id="tournament-name"> ${tourName} </span>tournament!</p>
				<div class="d-flex justify-content-between align-items-center">
					<button id="accept-btn" class="btn btn-sm ctm-btn flex-grow-1 me-1">Accept</button>
					<button id="decline-btn" class="btn btn-sm ctm-btn-danger flex-grow-1 ms-1">Decline</button>
				</div>
			</div>
		</div>
	</div> `;
}

function createTournamentStartedNotification(tourName) {
	return `
	<div class="card-border" style="max-width: 250px;">
		<div class="game-invitation card overflow-hidden">
			<div class="card-body position-relative p-2" style="z-index: 1;">
			<h6 class="mb-2 ctm-text-title">tournament info</h6>
			<p class="card-text mb-2 small ctm-text-light">the <span id="tournament-name"> whatever the name </span>tournament has just started!</p>
			<div class="d-flex justify-content-between align-items-center">
				<button id="accept-btn" class="btn btn-sm ctm-btn flex-grow-1 me-1">got it!</button>
			</div>
			</div>
		</div>
	</div> `;
} */