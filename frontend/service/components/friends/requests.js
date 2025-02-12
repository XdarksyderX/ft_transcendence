import { throwAlert } from "../../app/render.js";
import { searchUsers, sendFriendRequest, 
    getPendingSentRequests, getPendingReceivedRequests, cancelFriendRequest,

    blockUser, isUserBlocked } from "../../app/social.js";
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

export async function renderPendingFriendRequests(container) {
    const requests = await handleGetPendingReceivedRequests();
    if (!requests ||requests.length === 0) {
        container.innerText = "You don't have any friend requests yet, but you can add one!";
    } else {
        requests.forEach(request => {
            const card = createFriendRequestCard(request);
            container.appendChild(card);
        })
    }

}

function createFriendRequestCard( request ) {
//if request only have the username i'll have to get the photo
    const username = request.sender__username;
    const card = document.createElement('li');
    card.innerHTML = 
        `<div class="user-card d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div class="d-flex align-items-center mb-2 mb-md-0">
            <img src="${'avatar'}" alt="${username}" class="friend-picture">
            <p class="mb-0 ms-2">${username}</p>
            </div>
            <div>
            <button class="btn ctm-btn">
                <i class="fas fa-check"> accept </i>
            </button>
            <button class="btn ctm-btn-secondary">
                <i class="fas fa-cancel"> decline </i>
            </button>
        </div>`
    return (card);
}

async function handleGetPendingReceivedRequests() {
    const response = await getPendingReceivedRequests();
    if (response.status === "success") {
        console.log("getPendingReceivedRequests says: ", response);
        return (response.incoming);
    } else {
        throwAlert(response.message);
        return (null);
    } 
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
    if (!username) return;
    elements.searchInput.value = '';
//    console.log('Searching for:', username);
    const users = await handleSearchUsers(username);
    const userStatusMap = await filterSearchList(users);
    renderSearchList(userStatusMap, elements);
}

async function handleSearchUsers(username) {
    const response = await searchUsers(username);
    if (response.status === "success") {
        if (response.users.length === 0) {
            return (null);
        } else {
       //     console.log(response.data);
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

async function filterSearchList(users) {
    if (!users) {
        return new Map();
    }
    const friendsNames = getFriendsFromDOM();
    const ownUsername = getUsername();
    const filteredUsers = users.filter(user => !friendsNames.includes(user.username) && user.username !== ownUsername);
    return await getUserStatusMap(filteredUsers);
}

async function getUserStatusMap(users) {
    const userStatusMap = new Map();
    const pendingRequests = await getPendingSentRequests();
    console.log('pengüins: ', pendingRequests);

    // Log the structure of pendingRequests
    console.log('pendingRequests structure: ', JSON.stringify(pendingRequests, null, 2));

    const pendingUsernames = (pendingRequests.status === "success" && Array.isArray(pendingRequests.outgoing)) ? pendingRequests.outgoing.map(request => ({
        username: request.receiver__username,
        invitationId: request.id
    })) : [];

    // Log the pendingUsernames array
    console.log('pendingUsernames: ', pendingUsernames);

    for (const user of users) {
        const response = await isUserBlocked(user.username);
        const isBlocked = response.status === "success" && response.is_blocked;
        const pendingRequest = pendingUsernames.find(pending => pending.username === user.username);
        const isPending = !!pendingRequest;
        const invitationId = pendingRequest ? pendingRequest.invitationId : null;
        console.log(`User: ${user.username}, isBlocked: ${isBlocked}, isPending: ${isPending}, invitationId: ${invitationId}`);
        userStatusMap.set(user.username, { user, isBlocked, isPending, invitationId });
    }
    return userStatusMap;
}



function renderSearchList(users, elements) {
    elements.searchList.innerHTML = '';
    elements.searchListContainer.classList.add('show');
    console.log("on renderSearchList", users);
    if (users.size === 0) {
        elements.searchList.appendChild(createAddFriendCard(null));
    } else {
        users.forEach((value, key) => {
            const status = value.isBlocked ? 'blocked' : value.isPending ? 'pendant' : 'default'
            const addFriendCard = createAddFriendCard(value.user, status, value.invitationId);
            elements.searchList.appendChild(addFriendCard);
        });
    }
}

function createAddFriendCard(user, status, invitationId) {
    const card = document.createElement('div');
    card.className = 'user-card d-flex flex-column flex-md-row justify-content-between align-items-center';
    if (!user) {
        createEmptyUserCard(card);
    } else {
        const btns = createCardBtns(card, user, invitationId);
        card.setAttribute('data-user-id', user.user_id);
        card.innerHTML = `
        <div class="d-flex align-items-center mb-2 mb-md-0">
            <img src="${user.avatar}" alt="${user.username}" class="friend-picture">
            <p class="mb-0 ms-2">${user.username}</p>
        </div>
        `;
        card.appendChild(btns);
        toggleBtns(card, status)
    }
    return card;
}

function createEmptyUserCard(card) {
    card.innerHTML = `
    <div class="d-flex align-items-center p-2 mb-md-0">
        No matches found :c
    </div>`;
}
function createCardBtns(card, user, invitationId = null) {
    const btnsContainer = document.createElement('div');
    btnsContainer.className = 'card-btns d-flex aling-items-center';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn ctm-btn-secondary me-2';
    addBtn.setAttribute('data-action', 'add');
    addBtn.innerHTML = '<i class="fas fa-plus mt-1 me-2"></i> <span class="ctm-text"> add </span>';
    addBtn.addEventListener('click', () => handleSendFriendRequest(user.username, card));

    const blockBtn = document.createElement('button');
    blockBtn.className = 'btn ctm-btn-danger';
    blockBtn.setAttribute('data-action', 'block');
    blockBtn.innerHTML = '<i class="fas fa-ban mt-1 me-2"></i> <span class="ctm-text"> block </span>';
    blockBtn.addEventListener('click', () => handleBlockUser(user.username, card));

    const blockedBtn = document.createElement('button');
    blockedBtn.className = 'btn ctm-btn-danger';
    blockedBtn.setAttribute('data-action', 'blocked');
    blockedBtn.innerHTML = '<i class="fas fa-ban mt-1 me-2"></i> <span class="ctm-text"> this user is blocked </span>';
    blockedBtn.disabled = true;

    const pendantBtn = document.createElement('button');
    pendantBtn.className = 'btn ctm-btn pendant-btn';
    pendantBtn.setAttribute('data-action', 'pendant');
    pendantBtn.innerHTML = '<i class="fas fa-ban mt-1 me-2"></i> <span class="ctm-text"> pendant </span>';
    pendantBtn.addEventListener('click', () => handleCancelFriendRequest(card, invitationId));
    pendantBtn.dataset.invitationId = invitationId;
    console.log('on create card ID: ', invitationId);
    // Add event listeners for hover effect
    pendantBtn.addEventListener('mouseenter', () => {
        pendantBtn.dataset.originalHtml = pendantBtn.innerHTML;
        pendantBtn.innerText = 'cancel X';
    });

    pendantBtn.addEventListener('mouseleave', () => {
        pendantBtn.innerHTML = 'pendant';
    });

    btnsContainer.appendChild(addBtn);
    btnsContainer.appendChild(blockBtn);
    btnsContainer.appendChild(blockedBtn);
    btnsContainer.appendChild(pendantBtn);

    return btnsContainer;
}

function toggleBtns(card, status, invitationId = null) {
    const addBtn = card.querySelector('[data-action="add"]');
    const blockBtn = card.querySelector('[data-action="block"]');
    const blockedBtn = card.querySelector('[data-action="blocked"]');
    const pendantBtn = card.querySelector('[data-action="pendant"]');
//    console.log('togglebtns status: ', status)
    if (status === 'blocked') {
        addBtn.style.display = 'none';
        blockBtn.style.display = 'none';
        blockedBtn.style.display = 'flex';
        pendantBtn.style.display = 'none';
        card.classList.add('blocked');
    } else if (status === 'pendant') {
        addBtn.style.display = 'none';
        blockBtn.style.display = 'none';
        blockedBtn.style.display = 'none';
        pendantBtn.style.display = 'flex';
        if (invitationId) {
            pendantBtn.addEventListener('click', ()=>handleCancelFriendRequest(card, invitationId))
        }
    } else {
        addBtn.style.display = 'flex';
        blockBtn.style.display = 'flex';
        blockedBtn.style.display = 'none';
        pendantBtn.style.display = 'none';
        card.classList.remove('blocked');
        pendantBtn.dataset.invitationId = ''; 
    }
}

async function handleBlockUser(username, card) {
    const response = await blockUser(username);
    if (response.status === "success") {
        toggleBtns(card, 'blocked');
    } else {
        throwAlert(response.message);
    } 
}

async function handleSendFriendRequest(username, card) {
    const response = await sendFriendRequest(username);
    console.log('handleSendFriendRequest response:', response);
    if (response.status === "success") {
        console.log("RESPONSE", response);

        toggleBtns(card, 'pendant', response.invitation_id);
        throwAlert(`Friend request sent to ${username}`);
    } else {
        throwAlert(response.message);
    }
}
async function handleCancelFriendRequest(card, invitationId) {
    const response = await cancelFriendRequest(invitationId);
    if (response.status === "success") {
        toggleBtns(card, 'default');
    } else {
        throwAlert(response.message);
    } 
}



