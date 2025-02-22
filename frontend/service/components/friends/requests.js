import { throwAlert, throwToast } from "../../app/render.js";
import { searchUsers, getAvatar,
sendFriendRequest, getPendingSentRequests, cancelFriendRequest,
getPendingReceivedRequests, acceptFriendRequest, declineFriendRequest,
    blockUser, isUserBlocked, unblockUser } from "../../app/social.js";
import { getUsername } from "../../app/auth.js";
import { initializeFriendsEvents } from "./app.js";

/* * * * * * * * * * * * * * * INITIALIZERS * * * * * * * * * * * * * * */

// initializes all search events
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
// renders all pending friend request once you open /friends
export async function renderPendingFriendRequests(container) {
    if (!container) {
        container = document.getElementById('requests-container');
    }
    const requests = await handleGetPendingReceivedRequests();
    if (!requests || requests.length === 0) {
        container.innerText = "You don't have any friend requests yet, but you can make your own!";
    } else {
        container.innerHTML = '';
        for (const request of requests) {
            const card = await createFriendRequestCard(request);
            container.appendChild(card);
        }
    }
}

/* * * * * * * * * * * * * * * RECEIVED REQUESTS  * * * * * * * * * * * * * * */

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

async function createFriendRequestCard( request ) {
//if request only have the username i'll have to get the photo
    const username = request.sender__username;
    const card = document.createElement('div');
    const invitationId = request.id;
    const avatar = await getAvatar(username);
    card.innerHTML = 
            `<div class="user-card d-flex flex-column flex-md-row justify-content-between align-items-center">
                <div class="d-flex align-items-center mb-2 mb-md-0">
                <img src="${avatar}" alt="${username}" class="friend-picture">
                <p class="mb-0 ms-2">${username}</p>
                </div>
                <div>
                <button class="btn ctm-btn" data-action="accept">
                    <i class="fas fa-check"></i> <span class="ctm-text">accept</span>
                </button>
                <button class="btn ctm-btn-secondary" data-action="decline">
                    <i class="fas fa-times"></i> <span class="ctm-text">decline</span>
                </button>
            </div>`;
    const acceptBtn = card.querySelector('[data-action="accept"]');
    const declineBtn = card.querySelector('[data-action="decline"]');
    acceptBtn.addEventListener('click', () => handleAcceptFiendRequest(invitationId, username));
    declineBtn.addEventListener('click', () => handleDeclineFiendRequest(invitationId));
    return (card);
}

async function handleAcceptFiendRequest(invitationId, username) {
    const response = await acceptFriendRequest(invitationId);
    if (response.status === "success") {
       throwToast(`${username} and you are now Friends!`);
       initializeFriendsEvents(false);

    } else {
        throwAlert(response.message);
    } 
}
async function handleDeclineFiendRequest(invitationId) {
    const response = await declineFriendRequest(invitationId);
    if (response.status === "success") {
        renderPendingFriendRequests(null);
        throwToast(`Friend request declined`);
    } else {
        throwAlert(response.message);
    } 
}


/* * * * * * * * * * * * * * * SEARCH AND SENT REQUESTS * * * * * * * * * * * * * * */


async function searchNewFriend(elements) {
    const username = elements.searchInput.value;
    if (!username) return;
    elements.searchInput.value = '';
    const users = await handleSearchUsers(username);
    const userStatusMap = await filterSearchList(users);
    renderSearchList(userStatusMap, elements);
}

export async function handleSearchUsers(username) {
    const response = await searchUsers(username);
    if (response.status === "success") {
        if (response.users.length === 0) {
            return (null);
        } else {
            return (response.users);
        }
    } else {
        throwAlert(response.message);
        return (null);
    }
}
// filters your already friends and yourself from the search results
async function filterSearchList(users) {
    if (!users) {
        return new Map();
    }
    const friendsNames = getFriendsFromDOM();
    const ownUsername = getUsername();
    const filteredUsers = users.filter(user => !friendsNames.includes(user.username) && user.username !== ownUsername);
    return await getUserStatusMap(filteredUsers);
}
// gets Friendlist from dom just for not duplicate API's work
function getFriendsFromDOM() {
    const friendElements = document.querySelectorAll('.friend-btn .friend-info p');
    const usernames = [];
    friendElements.forEach(friendElement => {
        usernames.push(friendElement.textContent);
    });
    return usernames;
}
// converts the search results in a map with blocked/pendant status info
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
// displays the search results
async function renderSearchList(users, elements) {
    elements.searchList.innerHTML = '';
    elements.searchListContainer.classList.add('show');
    console.log("on renderSearchList", users);
    if (users.size === 0) {
        elements.searchList.appendChild(await createAddFriendCard(null)); // Use await here
    } else {
        for (const [key, value] of users) {
            const status = value.isBlocked ? 'blocked' : value.isPending ? 'pendant' : 'default';
            const addFriendCard = await createAddFriendCard(value.user, status, value.invitationId); // Use await here
            elements.searchList.appendChild(addFriendCard);
        }
    }
}

async function createAddFriendCard(user, status, invitationId) {
    const card = document.createElement('div');
    card.className = 'user-card d-flex flex-column flex-md-row justify-content-between align-items-center';

    if (!user) {
        createEmptyUserCard(card);
    } else {
        const btns = createCardBtns(card, user, invitationId);
        const avatar = await getAvatar(null, user);
        console.log('avatar: ', avatar);
        card.setAttribute('data-user-id', user.user_id);
        card.innerHTML = `
        <div class="d-flex align-items-center mb-2 mb-md-0">
            <img src="${avatar}" alt="${user.username}" class="friend-picture">
            <p class="mb-0 ms-2">${user.username}</p>
        </div>
        `;
        card.appendChild(btns);
        toggleBtns(card, status);
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

    const unblockBtn = document.createElement('button');
    unblockBtn.className = 'btn ctm-btn-danger';
    unblockBtn.setAttribute('data-action', 'unblock');
    unblockBtn.innerHTML = '<i class="fas fa-ban mt-1 me-2"></i> <span class="ctm-text"> Unblock </span>';
    unblockBtn.addEventListener('click', () => handleUnblockUser(user.username, card));
    const pendantBtn = document.createElement('button');
    pendantBtn.className = 'btn ctm-btn pendant-btn';
    pendantBtn.setAttribute('data-action', 'pendant');
    pendantBtn.innerHTML = '<i class="fas fa-ban mt-1 me-2"></i> <span class="ctm-text"> pendant </span>';
    pendantBtn.addEventListener('click', () => handleCancelFriendRequest(card, invitationId));
    pendantBtn.dataset.invitationId = invitationId;
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
    btnsContainer.appendChild(unblockBtn);
    btnsContainer.appendChild(pendantBtn);

    return btnsContainer;
}

function toggleBtns(card, status, invitationId = null) {
    const addBtn = card.querySelector('[data-action="add"]');
    const blockBtn = card.querySelector('[data-action="block"]');
    const unblockBtn = card.querySelector('[data-action="unblock"]');
    const pendantBtn = card.querySelector('[data-action="pendant"]');
    if (status === 'blocked') {
        addBtn.style.display = 'none';
        blockBtn.style.display = 'none';
        unblockBtn.style.display = 'flex';
        pendantBtn.style.display = 'none';
        card.classList.add('blocked');
    } else if (status === 'pendant') {
        addBtn.style.display = 'none';
        blockBtn.style.display = 'none';
        unblockBtn.style.display = 'none';
        pendantBtn.style.display = 'flex';
        if (invitationId) {
            pendantBtn.addEventListener('click', ()=>handleCancelFriendRequest(card, invitationId))
        }
    } else {
        addBtn.style.display = 'flex';
        blockBtn.style.display = 'flex';
        unblockBtn.style.display = 'none';
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
//    console.log('handleSendFriendRequest response:', response);
    if (response.status === "success") {
        toggleBtns(card, 'pendant', response.invitation_id);
        //throwAlert(`Friend request sent to ${username}`);
        throwToast(`Friend request sent to ${username}`);
        
    } else {
        throwAlert(response.message);
    }
}

async function handleUnblockUser(username, card) {
	const response = await unblockUser(username);
	if (response.status === "success") {
        toggleBtns(card, 'default');
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

let inactivityTimeout;

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
