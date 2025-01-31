let chessVariant = null;
import { throwAlert } from "../../app/render.js";
import { navigateTo } from "../../app/router.js";

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
                playRandom: document.getElementById('play-any-friend'),
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
/*                 duck: document.getElementById('duck-chess'),
                kirby: document.getElementById('kirby-chess'),
                bomb: document.getElementById('bomb-chess'), */
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

    let currentView = null;
    let selectedFriend = null;

    const friends = [
        { id: 1, name: 'Alice', status: 'online' },
        { id: 2, name: 'Bob', status: 'offline' },
        { id: 3, name: 'Charlie', status: 'online' },
        { id: 4, name: 'David', status: 'away' }
    ];

    function toggleView(from, to) {
        if (!to) { // if I go to inittial view
            elements.pong.playPong.style.display = 'block';
            elements.chess.playChess.style.display = 'block';
        } else {
            to.style.display = 'flex';
        }
        from.style.display = 'none';
        currentView = to;
      //  console.log("toggling from: ", currentView, "to: ", to);
    }

    // displays an overlay covering everything but the chat and the selected game card
    function showOverlay(reveal) {
        elements.overlay.lay.style.display = 'block';
        elements.overlay.chat.style.zIndex = '100';
        reveal.style.zIndex = '100';
    }
    // hides the overlay restoring the original z-index
    function hideOverlay() {
        const overlay = elements.overlay.lay;
        overlay.style.transition = 'opacity 0.3s ease-out';
        overlay.style.opacity = '0';
    
        overlay.addEventListener('transitionend', function handleTransitionEnd() {
            overlay.style.display = 'none';
            overlay.style.opacity = '';
            overlay.style.transition = '';
            overlay.removeEventListener('transitionend', handleTransitionEnd);
        });
    
        elements.overlay.chat.style.zIndex = 'auto';
        elements.pong.btn.style.zIndex = 'auto';
        elements.chess.btn.style.zIndex = 'auto';
        toggleView(currentView, null);
    }
    //clicking on the overlay will go back to chose game view
    overlay.addEventListener('click', hideOverlay);
    // goes from initial view to pong-options
    function togglePongOptions(event) { 
        event.stopPropagation();
        if (!currentView) {
            showOverlay(elements.pong.btn);
            toggleView(elements.pong.playPong, elements.pong.options);
        }
    }
    elements.pong.btn.addEventListener('click', togglePongOptions);
    // goes from pong-options to quick-play-options
    function showQuickPlayOptions() {
        toggleView(currentView, elements.pong.quickPlay.options);
    }
    elements.pong.quickPlay.btn.addEventListener('click', showQuickPlayOptions);
    // goes from quick-play-options to friend-list rendering it
    function playPongWithFriend() {
        toggleView(currentView, elements.pong.quickPlay.friendList);
        renderFriendList(elements.pong.quickPlay.friendsContainer);
    }
    elements.pong.quickPlay.playFriend.addEventListener('click', playPongWithFriend);

    function playPongWithRandom() {
        console.log("Play with any friend option selected");
        throwAlert("this eventually will take you to waiting room");
    }
    elements.pong.quickPlay.playRandom.addEventListener('click', playPongWithRandom);

    function playAgainstMachine() {
        console.log("Play against the machine option selected");
        throwAlert("this eventually will take you to pong directly");
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
            throwAlert('This friend is not available to play right now.');
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

    function launchWaitModal(game) {
        const modal = new bootstrap.Modal(elements.modal.waitGame);
        elements.modal.text.innerHTML = `Waiting for ${selectedFriend.name} to start a game of ${game}...`;
        modal.show();
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
        });
    }
    // toggles from init to chess options
    function toggleChessOptions(event) {
        event.stopPropagation();
        if (!currentView) {
            showOverlay(elements.chess.btn);
            toggleView(elements.chess.playChess, elements.chess.options);
        }
    }
    elements.chess.btn.addEventListener('click', toggleChessOptions);

    function chooseClasicChess() {
        chessVariant = 'classic';
        sessionStorage.setItem('chessVariant', chessVariant); //borrar -> solucion temporal para asegurar la persistencia de la variable hasta que tengamos backend
        toggleView(currentView, elements.chess.friendsOptions);
    }
    elements.chess.variants.classic.addEventListener('click', chooseClasicChess);

    function playChessWithFriend() {
    //    console.log("playchess tggles from: ", currentView);
        toggleView(currentView, elements.chess.friendList);
        renderFriendList(elements.chess.friendsContainer);
    }
    elements.chess.playFriend.addEventListener('click', playChessWithFriend);

    function playChessWithRandom() {
        throwAlert("this eventually will take you to waiting room");
        navigateTo("/chess");
    }
    elements.chess.playRandom.addEventListener("cick", playChessWithRandom);

    function showChessVariants() {
        toggleView(currentView, elements.chess.variants.container);
    
        // Initialize the tooltip
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    
    }
    
    elements.chess.variants.spicy.addEventListener('click', showChessVariants);
    
    function chooseChessVariant(event) {
        const variant = event.target.closest('[id$="-chess"]')
        if (variant) {
            chessVariant = variant.id.split('-')[0];
            console.log('selected variant: ', chessVariant);
            sessionStorage.setItem('chessVariant', chessVariant); //borrar -> solucion temporal para asegurar la persistencia de la variable hasta que tengamos backend
            toggleView(currentView, elements.chess.friendsOptions);
        }
    }
    elements.chess.variants.container.addEventListener('click', chooseChessVariant);

    elements.pong.quickPlay.startGameWithFriendButton.addEventListener('click', () => launchWaitModal('pong'));
    elements.chess.startGameWithFriendButton.addEventListener('click', () => launchWaitModal('chess'));
}