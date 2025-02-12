import { throwAlert } from "../../app/render.js";
import { searchUsers, getFriendsList, blockUser } from "../../app/social.js";
import { getUsername } from "../../app/auth.js";


let inactivityTimeout;

export function initSearchFriendEvents(elements) {

	elements.searchBtn.addEventListener('click', function() {
		if (elements.searchContainer.classList.contains('expanded')) {
			searchNewFriend(elements);
		} else {
			toggleSearch(true, elements);
		}
	});	
	elements.searchInput.addEventListener('input', () => resetInactivityTimeout(elements));
	elements.searchInput.addEventListener('focus', () => resetInactivityTimeout(elements));
	elements.searchForm.addEventListener('submit', function(e) {
		e.preventDefault();
		searchNewFriend(elements);
	});
}
function toggleSearch(on, elements) {
    if (on) {
        elements.searchContainer.classList.toggle('expanded');
        elements.searchBtn.innerHTML = '<i class="bi bi-search"></i>';
        elements.searchBtn.setAttribute('aria-label', 'Search friends');
        resetInactivityTimeout(elements);
    }
    else {
        elements.searchContainer.classList.remove('expanded');
        elements.searchBtn.innerHTML = '<i class="bi bi-plus"></i>';
        elements.searchBtn.setAttribute('aria-label', 'Open friend request form');
        elements.searchInput.value = '';
    }
}

function resetInactivityTimeout(elements) {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        toggleSearch(false, elements);
    }, 30000);
}


async function searchNewFriend(elements) {
	const username = elements.searchInput.value;
    if (!username) return ;
    elements.searchInput.value = '';
    console.log('Searching for:', username);
	const users = await handleSearchUsers(username);
    const filteredUsers = filterSearchList(users);
    renderSearchList(filteredUsers, elements);
}

async function handleSearchUsers(username) {
    const response = await searchUsers(username);
    if (response.status === "success") {
        if (response.users.length === 0) {
            return (null);
        } else {
            console.log(response.data);
            return (response.users);
        }
    } else {
        throwAlert(response.message);
        return (null);
    }
}
//just for not duplicate API's work
function getFriendsFromDOM() {
    const friendElements = document.querySelectorAll('.friend-btn .friend-info p');
    const usernames = [];
    friendElements.forEach(friendElement => {
        usernames.push(friendElement.textContent);
    });
    return usernames;
}

function filterSearchList(users) {
    if (!users) {
        return (null);
    }
    const friendsNames = getFriendsFromDOM();
    const ownUsername = getUsername();
    const filteredUsers = users.filter(user => !friendsNames.includes(user.username) && user.username !== ownUsername);
    return filteredUsers;
}

function renderSearchList(users, elements) {
// Eventualmente tendré que manejar que el usuario no sea yo, ni ya mi amigo
elements.searchList.innerHTML = '';
elements.searchListContainer.classList.add('show');
    if (!users || users.length === 0) {
        elements.searchList.appendChild(createAddFriendCard(null));
    } else {
        users.forEach(user => {
            const addFriendCard = createAddFriendCard(user);
            elements.searchList.appendChild(addFriendCard);
        })
    }
}

function createAddFriendCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card d-flex flex-column flex-md-row justify-content-between align-items-center';
    if (!user) {
        card.innerHTML = `
        <div class="d-flex align-items-center p-2 mb-md-0">
            No matches found :c
        </div>`;
        console.log('card created');
        return card;
    }
    card.setAttribute('data-user-id', user.user_id);
    card.innerHTML = `
    <div class="d-flex align-items-center mb-2 mb-md-0">
        <img src="${user.avatar}" alt="${user.username}" class="friend-picture">
        <p class="mb-0 ms-2">${user.username}</p>
    </div>
    <div>
        <button class="btn ctm-btn-secondary">
            <i class="fas fa-plus"> add </i>
        </button>
        <button class="btn ctm-btn-danger">
            <i class="fas fa-ban"> block </i>
        </button>
    </div>
    `;
    //card.querySelector('.fa-plus').addEventListener
    card.querySelector('.fa-ban').addEventListener('click', () => handleBlockUser(user.username, card));
    return card;
}

async function handleBlockUser(username, card) {
    const response = await blockUser(username);
    if (response.status === "success") {
       // throwAlert('ole ole ole los caracole');
        card.classList.add('blocked');
    } else {
        throwAlert(response.message);
    } 
}

