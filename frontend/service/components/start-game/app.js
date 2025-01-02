export function initializeStartGameEvents() {
    const elements = {
        pong: {
            btn: document.getElementById('pong-btn'),
            playPong: document.getElementById('play-pong'),
            options: document.getElementById('pong-options'),
            quickPlay: {
                btn: document.getElementById('quick-play'),
                options: document.getElementById('quick-play-options'),
                playFriend: document.getElementById('play-friend'),
                playAnyFriend: document.getElementById('play-any-friend'),
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
            playFriend: document.getElementById('chess-friend'),
            playAnyFriend: document.getElementById('chess-random'),
            friendList: document.getElementById('chess-friend-list'),
            friendsContainer: document.getElementById('chess-friends-container'),
            startGameWithFriendButton: document.getElementById('start-chess-with-friend'),
        },
        modal: {
            waitGame: document.getElementById('wait-game'),
            text: document.getElementById('modal-text'),
            progressBar: document.getElementById('progress-bar'),
            timer: document.getElementById('timer')
        }
    };

    let currentView = null;

    function toggleView(from, to) {
        if (!to) { // if im on inittial view
            elements.pong.playPong.style.display = 'block';
            elements.chess.playChess.style.display = 'block';
        } else {
            to.style.display = 'flex';
        }
        from.style.display = 'none';
        currentView = to;
        console.log("toggling from: ", currentView, "to: ", to);
    }

    let selectedFriend = null;
    let isModalShown = false;
    const friends = [
        { id: 1, name: 'Alice', status: 'online' },
        { id: 2, name: 'Bob', status: 'offline' },
        { id: 3, name: 'Charlie', status: 'online' },
        { id: 4, name: 'David', status: 'away' }
    ];

    function togglePongOptions(event) { 
        event.stopPropagation();
        //if (currentView !== elements.pong.quickPlay.friendList && currentView !== elements.pong.quickPlay.options) {
          if (!currentView) {
            toggleView(elements.pong.playPong, elements.pong.options);
        }
    }
    elements.pong.btn.addEventListener('click', togglePongOptions);

    function backToChooseGame(event) { 
        if (!isModalShown && currentView !== elements.pong.playPong && !elements.pong.btn.contains(event.target)) {
            toggleView(currentView, null);
        }
    }
    document.addEventListener('click', backToChooseGame);

    function showQuickPlayOptions() {
        toggleView(currentView, elements.pong.quickPlay.options);
    }
    elements.pong.quickPlay.btn.addEventListener('click', showQuickPlayOptions);

    function playPongWithFriend() {
        toggleView(currentView, elements.pong.quickPlay.friendList);
        renderFriendList(elements.pong.quickPlay.friendsContainer);
    }
    elements.pong.quickPlay.playFriend.addEventListener('click', playPongWithFriend);

    function playWithAnyFriend() {
        console.log("Play with any friend option selected");
        alert("this eventually will take you to waiting room");
    }
    elements.pong.quickPlay.playAnyFriend.addEventListener('click', playWithAnyFriend);

    function playAgainstMachine() {
        console.log("Play against the machine option selected");
        alert("this eventually will take you to pong directly");
    }
    elements.pong.quickPlay.playMachine.addEventListener('click', playAgainstMachine);

    function showTorunamentOptions() {
        console.log("Tournament option selected");
        toggleView(currentView, elements.pong.tournament.options);
    }
    elements.pong.tournament.btn.addEventListener('click', showTorunamentOptions);

    function renderFriendList(container) {
        container.innerHTML = '';
        let startBtn;
        if (container === elements.pong.quickPlay.friendsContainer)
            startBtn = elements.pong.quickPlay.startGameWithFriendButton;
        else 
            startBtn = elements.chess.startGameWithFriendButton;
        console.log("startBtn: ", startBtn);
        friends.forEach(friend => {
            const friendBtn = createFriendBtn(friend, startBtn);
            container.appendChild(friendBtn);
        });
    }

    function createFriendBtn(friend, startBtn) {
        const friendBtn = document.createElement('div');
        friendBtn.className = 'friend-btn';
        friendBtn.setAttribute('data-friend-id', friend.id);
        friendBtn.innerHTML = `<p class="mb-0">${friend.name}</p>`;
        let color = (friend.status === 'online') ? 'accent' : 'light';
        friendBtn.style.color = `var(--${color})`;
        friendBtn.style.border = `1px solid var(--${color})`;
        friendBtn.addEventListener('click', () => toggleFriendSelection(friend, startBtn));
        return (friendBtn);
    }

    function toggleFriendSelection(friend, btn) { // btn is for chess or for pong
        console.log('toggleFriendSelection called with btn:', btn); // Debugging line
        if (friend.status !== 'online') {
            alert('This friend is not available to play right now.');
            return;
        }
        const newFriendBtn = document.querySelector(`.friend-btn[data-friend-id="${friend.id}"]`);
        if (selectedFriend === friend) {
            unselectFriend(true, btn);
        } else {
            unselectFriend(false, btn);
            selectedFriend = friend;
            newFriendBtn.classList.add('selected');
            btn.disabled = false;
        }
    }

    function unselectFriend(all, btn) {
        if (selectedFriend) {
            const friendBtn = document.querySelector(`.friend-btn[data-friend-id="${selectedFriend.id}"]`);
            friendBtn.classList.remove('selected');            
            if (all) {
                selectedFriend = null;
                btn.disabled = true;
            }
        }    
    }

    function launchWaitModal() {
        const modal = new bootstrap.Modal(elements.modal.waitGame);
        elements.modal.text.innerHTML = `Waiting for ${selectedFriend.name} to accept the game...`;
        modal.show();
        isModalShown = true;
        handleProgressBar(modal);
    }
    
    function handleProgressBar(modal) {
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
            isModalShown = false;
        });
    }


    function toggleChessOptions(event) {
        event.stopPropagation();
        if (!currentView) {
            toggleView(elements.chess.playChess, elements.chess.options);
        }
    }
    elements.chess.btn.addEventListener('click', toggleChessOptions);

    function playChessWithFriend() {
        console.log("playchess tggles from: ", currentView);
        toggleView(currentView, elements.chess.friendList);
        renderFriendList(elements.chess.friendsContainer);
    }
    elements.chess.playFriend.addEventListener('click', playChessWithFriend);





    elements.pong.quickPlay.startGameWithFriendButton.addEventListener('click', launchWaitModal);
    //currentView = elements.pong.playPong;
}