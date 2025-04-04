import { throwAlert, initTooltips } from "../../app/render.js";
import { navigateTo } from "../../app/router.js";
import { handleSendGameInvitation } from "./game-invitation.js";
import { handleGetFriendList } from "../friends/app.js";
import { initMatchmaking, closeMatchmakingModal, handleLeaveMatchmaking } from "./matchMaking.js";

let chessVariant = null;
let currentView = null;
let selectedFriend = null;


export function initializeHomeEvents() {
	const elements = getElements();
	currentView = null;
	selectedFriend = null;
	initPongEvents(elements);
	initChessEvents(elements);
	initOverlayEvents(elements);
	setSwitches();
}

function getElements() {
	return {
		pong: {
			btn: document.getElementById('pong-btn'),
			playPong: document.getElementById('play-pong'),
			options: document.getElementById('pong-options'),
			quickPlay: {
				btn: document.getElementById('quick-play'),
				options: document.getElementById('quick-play-options'),
				playFriend: document.getElementById('play-friend'),
				playRandom: document.getElementById('pong-random'),
				playMachine: document.getElementById('play-machine'),
				friendList: document.getElementById('friend-list'),
				friendsContainer: document.getElementById('pong-friends-container'),
				startGameWithFriendButton: document.getElementById('start-game-with-friend'),
			},
			tournament: {
				btn: document.getElementById('tournament'),
				options: document.getElementById('tournament-options'),
				ongoing: document.getElementById('ongoing-tournaments'),
				new: document.getElementById('new-tournament'),
			}
		},
		chess: {
			btn: document.getElementById('chess-btn'),
			playChess: document.getElementById('play-chess'),
			options: document.getElementById('chess-options'),
			variants: {
				classic: document.getElementById('classic-chess'),
				spicy: document.getElementById('spicy-chess'),
				container: document.getElementById('chess-variants'),
			},
			friendsOptions: document.getElementById('chess-friend-options'),
			playFriend: document.getElementById('chess-friend'),
			playRandom: document.getElementById('chess-random'),
			matchmakingOptions: document.getElementById('matchmaking-options'),
			playLocal: document.getElementById('chess-local'),

			friendList: document.getElementById('chess-friend-list'),
			friendsContainer: document.getElementById('chess-friends-container'),
			startGameWithFriendButton: document.getElementById('start-chess-with-friend'),
		},
		modal: {
			waitGame: document.getElementById('wait-game'),
			text: document.getElementById('modal-text'),
			progressBar: document.getElementById('progress-bar'),
			timer: document.getElementById('timer')
		},
		overlay: {
			lay: document.getElementById('overlay'),
			chat: document.getElementById('chat-container'),
		}
	};
}

/* * * * * * * * * * * * * * * PONG * * * * * * * * * * * * * * */
function initPongEvents(elements) {
	elements.pong.btn.addEventListener('click', () => togglePongOptions(event, elements));
	elements.pong.quickPlay.btn.addEventListener('click', () => showQuickPlayOptions(elements));
	elements.pong.quickPlay.playFriend.addEventListener('click', () => playPongWithFriend(elements));
	elements.pong.quickPlay.playMachine.addEventListener('click', playAgainstMachine);
	elements.pong.tournament.btn.addEventListener('click', () => showTournamentOptions(elements));
	elements.pong.tournament.ongoing.addEventListener('click', () => navigateTo("/started-tournaments"));
    elements.pong.tournament.new.addEventListener('click', () => navigateTo("/unstarted-tournaments"));

    elements.pong.quickPlay.startGameWithFriendButton.addEventListener('click', () => {
		const gameData = {
			game: 'pong',
			friend: selectedFriend.username,
		}
		handleSendGameInvitation(gameData, elements.pong.quickPlay.startGameWithFriendButton)
	});
}
// goes from initial view to pong-options
function togglePongOptions(event, elements) { 
event.stopPropagation();
if (!currentView) {
	showOverlay(elements.pong.btn);
	toggleView(elements.pong.playPong, elements.pong.options);
	}
}
// goes from pong-options to quick-play-options
function showQuickPlayOptions(elements) {
	toggleView(currentView, elements.pong.quickPlay.options);
}
// goes from quick-play-options to friend-list rendering it
function playPongWithFriend(elements) {
	toggleView(currentView, elements.pong.quickPlay.friendList);
	renderFriendList(elements.pong.quickPlay.friendsContainer);
}

function playAgainstMachine() {
	//console.log("Play against the machine option selected");
	navigateTo('/pong');
}
function showTournamentOptions(elements) {
	//console.log("Tournament option selected");
	toggleView(currentView, elements.pong.tournament.options);
}


/* * * * * * * * * * * * * * * CHESS * * * * * * * * * * * * * * */
function initChessEvents(elements) {
	elements.chess.btn.addEventListener('click', () => toggleChessOptions(event, elements));
	elements.chess.variants.classic.addEventListener('click', () => chooseClasicChess(elements.chess.friendsOptions));
    elements.chess.variants.spicy.addEventListener('click', () => showChessVariants(elements.chess.variants.container));
	elements.chess.variants.container.addEventListener('click', () => chooseChessVariant(elements.chess.friendsOptions));
	elements.chess.playFriend.addEventListener('click', () => playChessWithFriend(elements));
	elements.chess.playRandom.addEventListener("click", () => playChessWithRandom(elements));
	elements.chess.playLocal.addEventListener("click", () => navigateTo('/chess'));
	
	elements.chess.startGameWithFriendButton.addEventListener('click', () => {
		const gameData = {
			game: 'chess',
			friend: selectedFriend.username,
			variant: chessVariant
		}
		handleSendGameInvitation(gameData, elements.chess.startGameWithFriendButton)
	});

	initMatchmakingBtns();

}
// toggles from init to chess options
function toggleChessOptions(event, elements) {
	event.stopPropagation();
	if (!currentView) {
		showOverlay(elements.chess.btn);
		toggleView(elements.chess.playChess, elements.chess.options);
	}
}
// selects classic chess variant and goes to friend options
function chooseClasicChess(toggleTo) {
	chessVariant = 'classic';
	sessionStorage.setItem('chessVariant', 'classic');
	toggleView(currentView, toggleTo);
}
// displays the spicy chess variants
function showChessVariants(toggleTo) {
	toggleView(currentView, toggleTo);
	// Initialize the tooltips
	initTooltips();
}

// select the chess variant clicked and goes to friend options
function chooseChessVariant(toggleTo) {
	const variant = event.target.closest('[id$="-chess"]')
	if (variant) {
		chessVariant = variant.id.split('-')[0];
		//console.log('selected variant: ', chessVariant);
		sessionStorage.setItem('chessVariant', chessVariant);
		toggleView(currentView, toggleTo);
	}
}

function playChessWithFriend(elements) {
        toggleView(currentView, elements.chess.friendList);
        renderFriendList(elements.chess.friendsContainer);
}

function playChessWithRandom(elements) {
	toggleView(currentView, elements.chess.matchmakingOptions);
	const switches = document.querySelectorAll("#matchmaking-options .switch-btn");
	if (!switches[0].classList.contains('active') && !switches[1].classList.contains('active')) {
		switches[0].click();
	}
}

function initMatchmakingBtns() {
	const switches = setSwitches();
	const variantBtns = setVariantBtns();
	const startBtn = document.getElementById('start-queue');
	startBtn.addEventListener('click', () => clickStartQueueBtn(switches, variantBtns));
	document.getElementById("close-matchmaking-modal").addEventListener("click", async () => {
		if (await handleLeaveMatchmaking()) {
		  closeMatchmakingModal()
		}
	  })
}

function setVariantBtns() {
    const btns = document.querySelectorAll('.variant-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
        });
    });
	return btns;
}

function setSwitches() {
    const switches = document.querySelectorAll("#matchmaking-options .switch-btn");
    const variantsToggle = document.getElementById('variants-toggle');

    switches.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            switches.forEach((btn) => btn.classList.remove("active"));
            btn.classList.add("active");
            // Show or hide variants based on the selected switch button
            if (btn.getAttribute('data-ranked') === 'false') {
				toggleVariants(variantsToggle, true);
            } else {
				toggleVariants(variantsToggle, false);
            }
        });
    });
	return switches;
}

function clickStartQueueBtn(switches, variants) {
    const ranked = switches[1].classList.contains('active');
    const selectedVariants = [];
	if (!ranked) {
		variants.forEach(variant => {
			if (variant.classList.contains('selected')) {
				selectedVariants.push(variant.getAttribute('data-variant'));
			}
		});
	}
    //console.log('Selected Variants:', selectedVariants, 'Ranked: ', ranked);
	if (!ranked && selectedVariants.length === 0) {
		return throwAlert('Please, choose at least one chess variant');
	}
	initMatchmaking(selectedVariants, ranked);
}

function toggleVariants(container, show) {
	const disclaimer = document.getElementById('ranked-variants');
    if (show) {
        container.classList.add('show');
		disclaimer.classList.remove('show');
        const selected = document.querySelector(`[data-variant="${chessVariant}"]`);
        if (selected) {
            selected.classList.add('selected');
        }
    } else {
        container.classList.remove('show');
        disclaimer.classList.add('show');
    }
}

/* * * * * * * * * * * * * * * UTILS * * * * * * * * * * * * * * */


// displays an overlay covering everything but the chat and the selected game card
function showOverlay(reveal) {
    const overlay = document.getElementById('overlay');

    overlay.style.pointerEvents = 'none';  // Blocks click during transition
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 0.3s ease-in';

    reveal.style.zIndex = '100';

    setTimeout(() => {
        overlay.style.pointerEvents = ''; // Reactivate clicks
    }, 300);
}


function hideOverlay(elements) {
    const overlay = document.getElementById('overlay');

    overlay.style.pointerEvents = 'none'; // Blocks click during transition
    overlay.style.transition = 'opacity 0.3s ease-out';
    overlay.style.opacity = '0';

    overlay.addEventListener('transitionend', function handleTransitionEnd() {
        overlay.style.display = 'none';
        overlay.style.opacity = '';
        overlay.style.transition = '';
        overlay.style.pointerEvents = ''; // Reactivate clicks
        overlay.removeEventListener('transitionend', handleTransitionEnd);

        // Reestore original view
        elements.overlay.chat.style.zIndex = 'auto';
        elements.pong.btn.style.zIndex = 'auto';
        elements.chess.btn.style.zIndex = 'auto';
		const btn = currentView.querySelector("#start-game-with-friend");
		if (btn) { // if the start btn is present, we must clean the selected friend
			unselectFriend(true, btn);
		}
		toggleView(currentView, null, elements);
    });
}
    
function initOverlayEvents(elements) {
	elements.overlay.lay.addEventListener('click', ()=> hideOverlay(elements));
}
// toggles from "from" to "to" :D
function toggleView(from, to, elements) {
	if (!to) { // if I go to inittial view
		elements.pong.playPong.style.display = 'block';
		elements.chess.playChess.style.display = 'block';
	} else {
		to.style.display = 'flex';
	}
    if (from) {
        from.style.display = 'none';
    }
	currentView = to;
}

/* * * * * * * * * * * * * * * FRIEND HANDLE * * * * * * * * * * * * * * */
async function renderFriendList(container) {
	const friends = await handleGetFriendList();
	container.innerHTML = '';
	let startBtn = currentView.querySelector(`[data-action=start-game]`);

	friends.forEach(friend => {
		const friendBtn = createFriendBtn(friend, startBtn);
		container.appendChild(friendBtn);
	});
}

function createFriendBtn(friend, startBtn) {
	const friendBtn = document.createElement('div');
	friendBtn.className = 'friend-btn';
	friendBtn.setAttribute('data-friend-username', friend.username);
	friendBtn.innerHTML = `<p class="mb-0">${friend.username}</p>`;
	let color = friend.is_online ? 'accent' : 'light';
	friendBtn.style.color = `var(--${color})`;
	friendBtn.style.border = `1px solid var(--${color})`;
	friendBtn.addEventListener('click', () => toggleFriendSelection(friend, startBtn));
	return (friendBtn);
}

export function refreshFriendStatusOnHome() {

	if (!currentView) return ;
	const container = currentView.querySelector('#pong-friends-container') || currentView.querySelector('#chess-friends-container');
	if (container) {
		renderFriendList(container);
	}
}

function toggleFriendSelection(friend, btn) { // btn is for chess or for pong
	if (!friend.is_online) {// this will go back when status is propertly setted
		throwAlert('This friend is not available to play right now.');
		return;
	}
	const newFriendBtn = currentView.querySelector(`.friend-btn[data-friend-username="${friend.username}"]`);
	if (selectedFriend === friend) {
		unselectFriend(true, btn);
	} else {
		unselectFriend(false, btn);
		selectedFriend = friend;
		newFriendBtn.classList.add('selected');
		//console.log("adding selected class to: ", newFriendBtn);
		btn.disabled = false;
	}
}

function unselectFriend(all, btn) {
	if (selectedFriend) {
		const friendBtn = currentView.querySelector(`.friend-btn[data-friend-username="${selectedFriend.username}"]`);
		friendBtn.classList.remove('selected');            
		if (all) {
			selectedFriend = null;
			btn.disabled = true;
		}
	}    
}

export { chessVariant }