export function initializeStartGameEvents() {
    const elements = {
        pongBtn: document.getElementById('pong-btn'),
        playPong: document.getElementById('play-pong'),
        pongOptions: document.getElementById('pong-options'),
        quickPlay: document.getElementById('quick-play'),
        tournament: document.getElementById('tournament'),
        quickPlayOptions: document.getElementById('quick-play-options'),
        playFriend: document.getElementById('play-friend'),
        playAnyFriend: document.getElementById('play-any-friend'),
        playMachine: document.getElementById('play-machine'),
        friendList: document.getElementById('friend-list'),
        friendsContainer: document.getElementById('friends-container'),
        startGameWithFriendButton: document.getElementById('start-game-with-friend'),
        waitGameModal: document.getElementById('wait-game'),
        modalText: document.getElementById('modal-text'),
        progressBar: document.getElementById('progress-bar'),
        timer: document.getElementById('timer')
    };
    let currentView = null;

    function toggleView(to) {
        if (currentView) currentView.style.display = 'none';
        if (to === elements.playPong) {
            to.style.display = 'block';
        } else {
            to.style.display = 'flex';
        }
        currentView = to;
    }

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
        if (currentView !== elements.friendList && currentView !== elements.quickPlayOptions) {
            toggleView(elements.pongOptions);
        }
    }
    elements.pongBtn.addEventListener('click', togglePongOptions);

    // go back to choose game mode when you click outside the card
    function backToChooseGame(event) { 
        if (!isModalShown && currentView !== elements.playPong && !elements.pongBtn.contains(event.target)) {
            toggleView(elements.playPong);
        }
    }
    document.addEventListener('click', backToChooseGame);

    // show quick play options
    function showQuickPlayOptions() {
        toggleView(elements.quickPlayOptions);
    }
    elements.quickPlay.addEventListener('click', showQuickPlayOptions);

    // show the play with a friend option
    function playWithFriend() {
        toggleView(elements.friendList);
        renderFriendList();
    }
    elements.playFriend.addEventListener('click', playWithFriend);

    // placeholder functions for new options
    function playWithAnyFriend() {
        console.log("Play with any friend option selected");
        // Implement the logic for playing with any friend here
    }
    elements.playAnyFriend.addEventListener('click', playWithAnyFriend);

    function playAgainstMachine() {
        console.log("Play against the machine option selected");
        // Implement the logic for playing against the machine here
    }
    elements.playMachine.addEventListener('click', playAgainstMachine);

    function startTournament() {
        console.log("Tournament option selected");
        // Implement the logic for starting a tournament here
    }
    elements.tournament.addEventListener('click', startTournament);

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
            elements.progressBar.setAttribute('aria-valuenow', progress);
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
    currentView = elements.playPong;
}


