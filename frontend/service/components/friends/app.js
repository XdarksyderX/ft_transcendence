export function initializeFriendsEvents() {
    const friends = [
        { id: 1, name: 'Alice', status: 'online', picture: '../../resources/avatar/avatar_1.png' },
        { id: 2, name: 'Bob', status: 'offline', picture: '../../resources/avatar/avatar_2.png' },
        { id: 3, name: 'Charlie', status: 'online', picture: '../../resources/avatar/avatar_3.png' },
        { id: 4, name: 'David', status: 'away', picture: '../../resources/avatar/avatar_1.png' }
    ];

    const elements = {
        friendsContainer: document.getElementById('friends-container'),
        searchContainer: document.getElementById('search-form-container'),
        searchBtn: document.getElementById('toggle-search'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.querySelector('#search-form input')
    };

    const statusColorMap = {
        online: 'var(--accent)',
        offline: '#808080',
        away: 'var(--lorange)'
    };

    function renderFriendList() {
        elements.friendsContainer.innerHTML = '';
        friends.forEach(friend => {
            const friendBtn = createFriendBtn(friend);
            elements.friendsContainer.appendChild(friendBtn);
        });
    }

    function createFriendBtn(friend) {
        const friendBtn = document.createElement('div');
        friendBtn.className = 'friend-btn d-flex';
        friendBtn.setAttribute('data-friend-id', friend.id); //this probably will change when its connected w API
        let color = statusColorMap[friend.status];
        friendBtn.innerHTML = `
            <img src="${friend.picture}" alt="${friend.name}" class="friend-picture">
            <div class="friend-info">
                <p class="mb-0">${friend.name}</p>
                <span class="status-circle" style="background-color: ${color};"></span>
                <span class="friend-status" style="color: ${color};">${friend.status}</span>
            </div>
        `;
        friendBtn.style.color = `var(--light)`;
        friendBtn.style.border = `1px solid var(--light)`;
        friendBtn.addEventListener('click', () => renderFriendData(friend, color));
        return friendBtn;
    }
    renderFriendList();


    function renderFriendData(friend, color) {
        const container = document.getElementById('friend-data');

        container.innerHTML = `
            <h2 id="friend-name" class="text-center ctm-text-title">${friend.name}</h2>
            <img src="${friend.picture}" alt="${friend.name}" class="friend-picture-expanded mb-3">
            <p>
              <span class="friend-status" style="color: ${color};">status: ${friend.status}</span>
              <span class="status-circle" style="background-color: ${color};"></span>
            </p>
            <p>friends since: 4/8/24</p>
            <p>
                <div class="btn ctm-btn">delete</div>
                <div class="btn ctm-btn-secondary">block</div>
            </p>
        `
    }

let inactivityTimeout;

function resetInactivityTimeout() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        toggleSearch(false);
    }, 30000);
}

function searchNewFriend(username) {
    elements.searchInput.value = '';
    console.log('Searching for:', username);
}

function toggleSearch(on) {
    if (on) {
        elements.searchContainer.classList.toggle('expanded');
        elements.searchBtn.innerHTML = '<i class="bi bi-search"></i>';
        elements.searchBtn.setAttribute('aria-label', 'Search friends');
        resetInactivityTimeout();
    }
    else {
        elements.searchContainer.classList.remove('expanded');
        elements.searchBtn.innerHTML = '<i class="bi bi-plus"></i>';
        elements.searchBtn.setAttribute('aria-label', 'Open friend request form');
        elements.searchInput.value = '';
    }
}

elements.searchBtn.addEventListener('click', function() {
    if (elements.searchContainer.classList.contains('expanded')) {
        searchNewFriend(elements.searchInput.value);
    } else {
        toggleSearch(true);
    }
});

elements.searchInput.addEventListener('input', resetInactivityTimeout);
elements.searchInput.addEventListener('focus', resetInactivityTimeout);
// elements.searchInput.addEventListener('blur', resetInactivityTimeout);

elements.searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    searchNewFriend(elements.searchInput.value);
});

}