export function initializeStartGameEvents() {
    const elements = {
        pongBtn: document.getElementById('pong-btn'),
        playPong: document.getElementById('play-pong'),
        pongOptions: document.getElementById('pong-options'),
        playFriend: document.getElementById('play-friend'),
        friendList: document.getElementById('friend-list'),
        friendsContainer: document.getElementById('friends-container'),
        startGameWithFriendButton: document.getElementById('start-game-with-friend'),
        waitGameModal: document.getElementById('wait-game'),
        modalText: document.getElementById('modal-text'),
        progressBar: document.getElementById('progress-bar'),
        timer: document.getElementById('timer')
    };
    let selectedFriend = null;
    let isModalShown = false;
    // Provisionally hardcoded friends list
    const friends = [
        { id: 1, name: 'Alice', status: 'online' },
        { id: 2, name: 'Bob', status: 'offline' },
        { id: 3, name: 'Charlie', status: 'online' },
        { id: 4, name: 'David', status: 'away' }
    ];

    // toggle between play-pong and play options when you click on the card
    function togglePongOptions(event) { 
        event.stopPropagation();
        if (elements.friendList.style.display === 'none') {
            elements.playPong.style.display = elements.playPong.style.display === 'none' ? 'block' : 'none';
            elements.pongOptions.style.display = elements.pongOptions.style.display === 'none' ? 'flex' : 'none';
        }
    }
    elements.pongBtn.addEventListener('click', togglePongOptions);

    // go back to choose game mode when you click outside the card
    function backToChooseGame(event) { 
        if (!isModalShown && elements.playPong.style.display !== 'block' && !elements.pongBtn.contains(event.target)) {
            elements.playPong.style.display = 'block';
            elements.pongOptions.style.display = 'none';
            elements.friendList.style.display = 'none';
            unselectFriend(true);
        }
    }
    document.addEventListener('click', backToChooseGame);

    // show the play with a friend option
    function playWithFriend() {
        elements.playPong.style.display = 'none';
        elements.pongOptions.style.display = 'none';
        elements.friendList.style.display = 'flex';
        renderFriendList();
    }
    elements.playFriend.addEventListener('click', playWithFriend);

    //create a btn for each friend and append it to the container
    function renderFriendList() {
        elements.friendsContainer.innerHTML = '';
        friends.forEach(friend => {
            const friendBtn = createFriendBtn(friend);
            elements.friendsContainer.appendChild(friendBtn);
        });
    }

    //create a friendBtn, changing its color depending on the friend's status
    function createFriendBtn(friend) {
        const friendBtn = document.createElement('div');
        friendBtn.className = 'friend-btn';
        friendBtn.setAttribute('data-friend-id', friend.id); //this probably will change when its connected w API
        friendBtn.innerHTML = `<p class="mb-0">${friend.name}</p>`;
        let color = (friend.status === 'online') ? 'accent' : 'light';
        friendBtn.style.color = `var(--${color})`;
        friendBtn.style.border = `1px solid var(--${color})`;
        friendBtn.addEventListener('click', () => toggleFriendSelection(friend));
        return (friendBtn);
    }

    // toggle between selected or unselected on each friend card
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
            elements.startGameWithFriendButton.disabled = false;
        }
    }

    // unselect the already selected friend and disables the startGameWithFriendButton if its required
    function unselectFriend(all) {
        if (selectedFriend) {
            const friendBtn = document.querySelector(`.friend-btn[data-friend-id="${selectedFriend.id}"]`);
            friendBtn.classList.remove('selected');            
            if (all) {
                selectedFriend = null;
                elements.startGameWithFriendButton.disabled = true;
            }
        }    
    }

    // launch the modal while waiting a friend to accept the game invitation
    function launchWaitModal() { //this will be eventually called in a bigger "inviteFriend() function i guess"
        const modal = new bootstrap.Modal(elements.waitGameModal);
        elements.modalText.innerHTML = `Waiting for ${selectedFriend.name} to accept the game...`;
        modal.show();
        isModalShown = true;
        handleProgressBar(modal);
    }
    
    // handle progress bar functionality
    function handleProgressBar(modal) {
        let progress = 100;
        const interval = setInterval(() => {
            let time = Math.floor(progress / 100 * 30);
            progress -= 1;
            elements.progressBar.style.width = `${progress}%`;
            elements.progressBar.setAttribute('aria-valuenow', progress); // defines the current value of the progressBar so is accesible, for example for screen readers
            elements.timer.textContent = `${time}`;
            if (progress <= 0) {
                clearInterval(interval);
                modal.hide();
            }
            if (progress < 50) {
                elements.timer.style.color = `var(--light)`;
            } else {
                elements.timer.style.color = `var(--dark)`;
            }
        }, 300);
        // reset the bar when the modal is closed 
        elements.waitGameModal.addEventListener('hidden.bs.modal', () => {
            clearInterval(interval);
            elements.progressBar.style.width = '100%';
            elements.progressBar.setAttribute('aria-valuenow', 100);
            elements.timer.textContent = '30s';
            elements.timer.style.color = 'var(--dark);'
            isModalShown = false;
        });
    }

    elements.startGameWithFriendButton.addEventListener('click', launchWaitModal);
}