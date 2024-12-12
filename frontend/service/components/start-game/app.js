// Utility functions
function togglePongOptions(event) { 
	event.stopPropagation();
	if (friendList.style.display === 'none') {
		playPong.style.display = playPong.style.display === 'none' ? 'block' : 'none';
		pongOptions.style.display = pongOptions.style.display === 'none' ? 'flex' : 'none';
	}
}

function backToChooseGame(event) { 
	if (!isModalShown && playPong.style.display !== 'block' && !pongBtn.contains(event.target)) {
		playPong.style.display = 'block';
		pongOptions.style.display = 'none';
		friendList.style.display = 'none';
		unselectFriend(true);
	}
}

function playWithFriend() {
	playPong.style.display = 'none';
	pongOptions.style.display = 'none';
	friendList.style.display = 'flex';
	renderFriendList();
}

function renderFriendList() {
	friendsContainer.innerHTML = '';
	friends.forEach(friend => {
		const friendBtn = createFriendBtn(friend);
		friendsContainer.appendChild(friendBtn);
	});
}

function createFriendBtn(friend) {
	const friendBtn = document.createElement('div');
	friendBtn.className = 'friend-btn';
	friendBtn.setAttribute('data-friend-id', friend.id);
	friendBtn.innerHTML = `<p class="mb-0">${friend.name}</p>`;
	let color = (friend.status === 'online') ? 'accent' : 'light';
	friendBtn.style.color = `var(--${color})`;
	friendBtn.style.border = `1px solid var(--${color})`;
	friendBtn.addEventListener('click', () => toggleFriendSelection(friend));
	return friendBtn;
}

function toggleFriendSelection(friend) {
	if (friend.status !== 'online') {
		alert('This friend is not available to play right now.');
		return;
	}
	const newFriendBtn = document.querySelector(`.friend-btn[data-friend-id="${friend.id}"]`);
	if (selectedFriend === friend) {
		unselectFriend(true);
	} else {
		unselectFriend(false);
		selectedFriend = friend;
		newFriendBtn.classList.add('selected');
		startGameWithFriendButton.disabled = false;
	}
}

function unselectFriend(all) {
	if (selectedFriend) {
		const friendBtn = document.querySelector(`.friend-btn[data-friend-id="${selectedFriend.id}"]`);
		friendBtn.classList.remove('selected');            
		if (all) {
			selectedFriend = null;
			startGameWithFriendButton.disabled = true;
		}
	}    
}

function launchWaitModal() {
	const modal = new bootstrap.Modal(waitGameModal);
	const modalText = document.getElementById('modal-text');
	modalText.innerHTML = `Waiting for ${selectedFriend.name} to accept the game...`;
	modal.show();
	isModalShown = true;
	handleProgressBar(modal);
}

function handleProgressBar(modal) {
	const progressBar = document.getElementById('progress-bar');
	let progress = 100;
	const timer = document.getElementById('timer');
	const interval = setInterval(() => {
		let time = Math.floor(progress / 100 * 30);
		progress -= 1;
		progressBar.style.width = `${progress}%`;
		progressBar.setAttribute('aria-valuenow', progress);
		timer.textContent = `${time}`;
		if (progress <= 0) {
			clearInterval(interval);
			modal.hide();
		}
		if (progress < 50) {
			timer.style.color = `var(--light)`;
		} else {
			timer.style.color = `var(--dark)`;
		}
	}, 300);
	waitGameModal.addEventListener('hidden.bs.modal', () => {
		clearInterval(interval);
		progressBar.style.width = '100%';
		progressBar.setAttribute('aria-valuenow', 100);
		timer.textContent = '30s';
		timer.style.color = 'var(--dark);'
		isModalShown = false;
	});
}

// Initializer function
export function initializeStartGameEvents() {
	const pongBtn = document.getElementById('pong-btn');
	const playPong = document.getElementById('play-pong');
	const pongOptions = document.getElementById('pong-options');
	const playFriend = document.getElementById('play-friend');
	const friendList = document.getElementById('friend-list');
	const friendsContainer = document.getElementById('friends-container');
	const startGameWithFriendButton = document.getElementById('start-game-with-friend');
	const waitGameModal = document.getElementById('wait-game');
	let selectedFriend = null;
	let isModalShown = false;

	pongBtn.addEventListener('click', togglePongOptions);
	document.addEventListener('click', backToChooseGame);
	playFriend.addEventListener('click', playWithFriend);
	startGameWithFriendButton.addEventListener('click', launchWaitModal);
}
