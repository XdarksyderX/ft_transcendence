import { getUsername } from '../../app/auth.js';
import { handleAcceptQuickGameInvitation, handleDeclineInvitation } from '../home/game-invitation.js';
import { formatTime, toggleChat, getElements } from './app.js';
import { getPongInvitationDetail, acceptTournamentInvitation, denyTournamentInvitation } from '../../app/pong.js';
import { getChessInvitationDetail } from '../../app/chess.js';
import { throwAlert } from '../../app/render.js';

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

	console.log("on create Special Bubble, message: ", message);

    let card;

	if (type === 'pong-match' || type === 'chess-match') {
		const game = type.split('-')[0];
		card = isSender ? createSentInvitation(game, message.receiver) : createQuickGameInvitation(game, message.sent_at, message.sender, messageContent.invitation_token);
	} else if (type === 'tournament') {
		card = isSender ? createSentInvitation('tournament', message.receiver) : createTournamentInvitationCard(message.sender, messageContent.tournament_token);
	}

    return card;
}

/* * * * * * * * * * * * * * * * * * *  QUICK GAME INVITATIONS  * * * * * * * * * * * * * * * * * * */
// a map to store the interval id with each invitation card token, so we can clear the interval whenever, wherever, we're meant to be together
const activeIntervals = new Map();

function createSentInvitation(game, friend) {
    const card = document.createElement('div');
	const title = game === 'tournament' ? `New ${game}!` : `${game} invitation!`;
    card.innerHTML = `
        <div class="card-border special-bubble ms-auto" style="max-width: 250px;">
            <div class="game-invitation card overflow-hidden">
                <div class="card-body position-relative p-2" style="z-index: 1;">
                    <h6 class="mb-2 ctm-text-title">${title}</h6>
                    <p class="card-text mb-2 small ctm-text-light">You sent a ${game} invitation to ${friend}</p>
                </div>
            </div>
        </div>`;
	return (card);
}

export function createQuickGameInvitation(game, sent_at, sender, token) {
	const card = document.createElement('div');
	const remainingTime = calculateTimeRemaining(sent_at); 
	card.innerHTML = `
		<div data-token=${token} class="quick-game-invitation special-bubble card border-0 overflow-hidden" style="max-width: 250px;">
			<div class="progress position-absolute w-100 h-100" style="z-index: 0;" data-progress>
				<div class="progress-bar" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
			</div>
			<div class="card-body position-relative p-3" style="z-index: 1;">
				<h6 class="card-title mb-2 ctm-text-title">${game} Invitation</h6>
				<p class="card-text mb-2 small ctm-text-light">${sender} invited you!</p>
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
	const progressBar = card.querySelector('[data-progress] .progress-bar');
	progressBar.width = '0%';
	startProgressBar(card, btns, {game: game, token: token, remainingTime: remainingTime});
	btns.accept.addEventListener('click', () => {
		if (handleAcceptQuickGameInvitation(game, token))
			toggleChat(getElements());
	});
	return card; // Return the card element
}

function calculateTimeRemaining(sentAt) {
	const sentAtTimestamp = new Date(sentAt).getTime();
	const expirationTimestamp = sentAtTimestamp + 30000;
	return Math.max(0, Math.floor((expirationTimestamp - Date.now()) / 1000));
}

async function checkInvitationValidity(game, token) {
	const response = game === 'pong' ? await getPongInvitationDetail(token) : await getChessInvitationDetail(token);
	if (response.status === 'success') {
		return (true);
	}
	return (false);
}

async function startProgressBar(card, btns, gameData) {
    const expirationTime = Date.now() + (gameData.remainingTime * 1000);
    const progressBar = card.querySelector('[data-progress] .progress-bar');
	const isInvitationValid = gameData.remainingTime > 0.2 && await checkInvitationValidity(gameData.game, gameData.token);
    if (!isInvitationValid) {
		cleanProgressBar(progressBar, btns, null);
		return;
	}

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

    activeIntervals.set(gameData.token, interval);

    btns.decline.addEventListener("click", () => {
        cleanProgressBar(progressBar, btns, interval);
        handleDeclineInvitation(gameData.game, gameData.token);
    });
}

function cleanProgressBar(progressBar, btns, interval) {
	if (interval) {
		clearInterval(interval);
	}
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

    const progressBar = card.querySelector('[data-progress] .progress-bar');

	const intervalId = activeIntervals.get(token);
	console.log(`Recuperando interval para ${token}:`, intervalId);
    
	if (intervalId) {
        cleanProgressBar(progressBar, btns, intervalId);
    }
}

/* * * * * * * * * * * * * * * * * * *  TOURNAMENT INVITATIONS  * * * * * * * * * * * * * * * * * * */


function createTournamentInvitationCard(friendName, token) {
	const tourName = "PUF"; // this will be a fetch to /detail
	const card = document.createElement('div');
	card.innerHTML = `
	<div data-token=${token} class="card-border special-bubble">
		<div class="game-invitation card overflow-hidden">
			<div class="card-body position-relative p-2" style="z-index: 1;">
				<h6 class="mb-2 ctm-text-title">New Tournament</h6>
				<p class="card-text mb-2 small ctm-text-light"><span class="ctm-text-accent">${friendName}</span> invited you to the <span class="ctm-text-accent"> ${tourName} </span>tournament!</p>
				<div class="d-flex justify-content-between align-items-center">
					<button data-action="accept"class="btn btn-sm ctm-btn flex-grow-1 me-1">Accept</button>
					<button data-action="decline" class="btn btn-sm ctm-btn-danger flex-grow-1 ms-1">Decline</button>
					<button data-info="accepted"class="btn btn-sm ctm-btn flex-grow-1 me-1" style="display: none;">Already accepted!</button>
					<button data-info="declined" class="btn btn-sm ctm-btn-danger flex-grow-1 ms-1" style="display: none;">Already declined</button>
				</div>
			</div>
		</div>
	</div> `;

	const btns = {
		accept: card.querySelector('[data-action="accept"]'),
		decline: card.querySelector('[data-action="decline"]'),
		accepted: card.querySelector('[data-info="accepted"]'),
		declined: card.querySelector('[data-info="declined"]')
	}
	btns.accept.addEventListener('click', () => handleAcceptTournamentInvitation(token, btns))
	btns.decline.addEventListener('click', () => handleDeclineTournamentInvitation(token, btns))
	return card;
}

function toggleBtns(btns, show, accepted) {
	Object.values(btns).forEach(btn => {
		btn.style.display = 'none';
	});
	show.style.display = 'block';
	if (accepted) {
		btns.accepted.addEventListener('mouseenter', () => {
			btns.accepted.innerText = 'cancel X';
		});
		btns.accepted.addEventListener('mouseleave', () => {
			btns.accepted.innerText = 'Already accepted!';
		});
		//btns.accepted.addEventListener('click', () handle cancel etc etc
	} else {
		btns.declined.disabled = true;
	}
}

async function handleAcceptTournamentInvitation(token, btns) {
	toggleBtns(btns, btns.accepted, true);
/*     const response = await acceptTournamentInvitation(token);
    if (response.status !== "success") {
        throwAlert(`Failed to accept tournament invitation: ${response.message}`);
    } else {
		toggleBtns(btns, btns.accepted, true);
    } */
}

async function handleDeclineTournamentInvitation(token, btns) {
	toggleBtns(btns, btns.declined, false);
/*     const response = await denyTournamentInvitation(token);
    if (response.status !== "success") {
        throwAlert(`Failed to decline tournament invitation: ${response.message}`);
    } else {
		toggleBtns(btns, btns.declined, false);
	} */
}


/* 
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