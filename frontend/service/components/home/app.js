import { throwAlert } from "../../app/render.js";
import { navigateTo } from "../../app/router.js";
import { handleSendGameInvitation } from "./game-invitation.js";
import { handleGetFriendList } from "../friends/app.js";

let chessVariant = null;
let currentView = null;
let selectedFriend = null;

/* const friends = [
	{ id: 1, name: 'Alice', status: 'online' },
	{ id: 2, name: 'Bob', status: 'offline' },
	{ id: 3, name: 'Charlie', status: 'online' },
	{ id: 4, name: 'David', status: 'away' }
]; */

export function initializeHomeEvents() {
	const elements = getElements();
	currentView = null;
	initPongEvents(elements);
	initChessEvents(elements);
	initOverlayEvents(elements);
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
				friendsContainer: document.getElementById('friends-container'),
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
	elements.pong.quickPlay.playRandom.addEventListener('click', playPongWithRandom);
	elements.pong.quickPlay.playMachine.addEventListener('click', playAgainstMachine);
	elements.pong.tournament.btn.addEventListener('click', () => showTournamentOptions(elements));
	elements.pong.tournament.ongoing.addEventListener('click', () => navigateTo("/ongoing-tournaments"));
    elements.pong.tournament.new.addEventListener('click', () => navigateTo("/new-tournament"));

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
	renderFriendList(elements.pong.quickPlay.friendsContainer, elements);
}
//
function playPongWithRandom() {
	throwAlert("this eventually will take you to waiting room");
}

function playAgainstMachine() {
	console.log("Play against the machine option selected");
	navigateTo('/pong');
}
function showTournamentOptions(elements) {
	console.log("Tournament option selected");
	toggleView(currentView, elements.pong.tournament.options);
}


/* * * * * * * * * * * * * * * CHESS * * * * * * * * * * * * * * */
function initChessEvents(elements) {
	elements.chess.btn.addEventListener('click', () => toggleChessOptions(event, elements));
	elements.chess.variants.classic.addEventListener('click', () => chooseClasicChess(elements.chess.friendsOptions));
    elements.chess.variants.spicy.addEventListener('click', () => showChessVariants(elements.chess.variants.container));
	elements.chess.variants.container.addEventListener('click', () => chooseChessVariant(elements.chess.friendsOptions));
	elements.chess.playFriend.addEventListener('click', () => playChessWithFriend(elements));
	elements.chess.playRandom.addEventListener("click", playChessWithRandom);

	elements.chess.startGameWithFriendButton.addEventListener('click', () => {
		const gameData = {
			game: 'chess',
			friend: selectedFriend.username,
			variant: chessVariant
		}
		handleSendGameInvitation(gameData, elements.chess.startGameWithFriendButton)
	});

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
	sessionStorage.setItem('chessVariant', chessVariant); //borrar -> solucion temporal para asegurar la persistencia de la variable hasta que tengamos backend
	toggleView(currentView, toggleTo);
}
// displays the spicy chess variants
function showChessVariants(toggleTo) {
	toggleView(currentView, toggleTo);
	// Initialize the tooltips
	const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
	const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl);
	});
}
// select the chess variant clicked and goes to friend options
function chooseChessVariant(toggleTo) {
	const variant = event.target.closest('[id$="-chess"]')
	if (variant) {
		chessVariant = variant.id.split('-')[0];
		console.log('selected variant: ', chessVariant);
		sessionStorage.setItem('chessVariant', chessVariant); //borrar -> solucion temporal para asegurar la persistencia de la variable hasta que tengamos backend
		toggleView(currentView, toggleTo);
	}
}

function playChessWithFriend(elements) {
    //    console.log("playchess tggles from: ", currentView);
        toggleView(currentView, elements.chess.friendList);
        renderFriendList(elements.chess.friendsContainer, elements);
}

function playChessWithRandom() {
	throwAlert("this eventually will take you to waiting room");
	navigateTo("/chess");
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

        // Restaurar la vista original
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
	//console.log("toggle view togling from: ", from, "to: ", to);
}

/* * * * * * * * * * * * * * * FRIEND HANDLE * * * * * * * * * * * * * * */
async function renderFriendList(container, elements) {
	const friends = await handleGetFriendList();
	container.innerHTML = '';
	let startBtn;
	if (container === elements.pong.quickPlay.friendsContainer)
		startBtn = elements.pong.quickPlay.startGameWithFriendButton;
	else 
		startBtn = elements.chess.startGameWithFriendButton;
	//console.log("startBtn: ", startBtn);
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

function toggleFriendSelection(friend, btn) { // btn is for chess or for pong
	// if (!friend.is_online) { this will go back when status is propertly setted
	// 	throwAlert('This friend is not available to play right now.');
	// 	return;
	// }
	const newFriendBtn = currentView.querySelector(`.friend-btn[data-friend-username="${friend.username}"]`);
	if (selectedFriend === friend) {
		unselectFriend(true, btn);
	} else {
		unselectFriend(false, btn);
		selectedFriend = friend;
		newFriendBtn.classList.add('selected');
		console.log("adding selected class to: ", newFriendBtn);
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