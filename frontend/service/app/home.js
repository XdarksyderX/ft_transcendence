document.addEventListener('DOMContentLoaded', () => {

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
        if (friendList.style.display === 'none') {
            playPong.style.display = playPong.style.display === 'none' ? 'block' : 'none';
            pongOptions.style.display = pongOptions.style.display === 'none' ? 'flex' : 'none';
        }
    }
    pongBtn.addEventListener('click', togglePongOptions);

    // go back to choose game mode when you click outside the card
    function backToChooseGame(event) { 
        if (!isModalShown && playPong.style.display !== 'block' && !pongBtn.contains(event.target)) {
            playPong.style.display = 'block';
            pongOptions.style.display = 'none';
            friendList.style.display = 'none';
            unselectFriend(true);
        }
    }
    document.addEventListener('click', backToChooseGame);

    // show the play with a friend option
    function playWithFriend() {
        playPong.style.display = 'none';
        pongOptions.style.display = 'none';
        friendList.style.display = 'flex';
        renderFriendList();
    }
    playFriend.addEventListener('click', playWithFriend);

    //create a btn for each friend and append it to the container
    function renderFriendList() {
        friendsContainer.innerHTML = '';
        friends.forEach(friend => {
            const friendBtn = createFriendBtn(friend);
            friendsContainer.appendChild(friendBtn);
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
            startGameWithFriendButton.disabled = false;
        }
    }

    // unselect the already selected friend and disables the startGameWithFriendButton if its required
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

    // launch the modal while waiting a friend to accept the game invitation
    function launchWaitModal() { //this will be eventually called in a bigger "inviteFriend() function i guess"
        const modal = new bootstrap.Modal(waitGameModal);
        const modalText = document.getElementById('modal-text');
        modalText.innerHTML = `Waiting for ${selectedFriend.name} to accept the game...`;
        modal.show();
        isModalShown = true;
        handleProgressBar(modal);
    }
    
    // handle progress bar functionality
    function handleProgressBar(modal) {
        const progressBar = document.getElementById('progress-bar');
        let progress = 100;
        const timer = document.getElementById('timer');
        const interval = setInterval(() => {
            let time = Math.floor(progress / 100 * 30);
            progress -= 1;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress); // defines the current value of the progressBar so is accesible, for example for screen readers
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
        // reset the bar when the modal is closed 
        waitGameModal.addEventListener('hidden.bs.modal', () => {
            clearInterval(interval);
            progressBar.style.width = '100%';
            progressBar.setAttribute('aria-valuenow', 100);
            timer.textContent = '30s';
            timer.style.color = 'var(--dark);'
            isModalShown = false;
        });
    }

    startGameWithFriendButton.addEventListener('click', launchWaitModal);
 
});