import { hideModalGently, throwAlert, throwToast } from "../../app/render.js";
import { getAvatar, getFriendsList, removeFriend, blockUser } from "../../app/social.js";
import { handleGetResumeStats } from "../stats/app.js";
import { initSearchFriendEvents, renderPendingFriendRequests } from "./requests.js";


export function initializeFriendsEvents(init = true) {
	const elements = getElements();
	clearContainers(elements);
	renderFriendList(elements.friendsContainer, elements.dataContainer);
	renderPendingFriendRequests(elements.requestsContainer);
	if (init) {
		initSearchFriendEvents(elements);
	}
}

function getElements() {
	return ({
        friendsContainer: document.getElementById('friends-container'),
		dataContainer : document.getElementById('friend-data'),
        searchContainer: document.getElementById('search-form-container'),
        searchBtn: document.getElementById('toggle-search'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.querySelector('#search-form input'),
        searchList: document.getElementById('search-list'),
        searchListContainer: document.getElementById('search-list-container'),
		requestsContainer: document.getElementById('requests-container')
    });
}
function clearContainers(elements) {
    elements.friendsContainer.innerHTML = '';
    elements.dataContainer.innerHTML = '';
    elements.requestsContainer.innerHTML = '';
}
/* * * * * * * * * * * * * * * FRIENDS * * * * * * * * * * * * * * */

export async function handleGetFriendList() {
	const response = await getFriendsList();
	console.log("handleGetFriendList, response: ", response);
    if (response.status === "success") {
		return (response.friends);
    } else {
        throwAlert(response.message);
    }
}

export function refreshFriendsFriendlist(changedFriend, add) {
    console.log("refresh function called");
    console.log("friend: ", changedFriend, "add: ", add);
    const friendsContainer = document.getElementById('friends-container');
    const dataContainer = document.getElementById('friend-data');
    let refresh = false;

    if (add === 0) { // if my number of friends is not changing
        const selectedFriend = dataContainer.querySelector('#friend-name');
        const selectedFriendName = selectedFriend ? selectedFriend.innerText : null; // check if we had open their data
        refresh = selectedFriendName === changedFriend ? true : false;
    } else {
        const actualFriends = friendsContainer.children.length - 1 + add;
        if (actualFriends === -1 || actualFriends === 1) { // if its my first friend or Im losting my only friend (drama)
            refresh = true;
        } else if (add === -1) { // if I have more friends but I had selected the one I lost
            const selectedFriend = dataContainer.querySelector('#friend-name');
            const selectedFriendName = selectedFriend ? selectedFriend.innerText : null; // check if we had open their data
            console.log("selected friend: ", selectedFriendName, "changed friend: ", changedFriend);
            refresh = selectedFriendName === changedFriend ? true : false;
        }

    }
    if (add === 1) {
        cleanSearchList(changedFriend);
    }
    // there I could handle avatar cand status hanges but too much for now
    const selectedFriend = dataContainer.querySelector('#friend-name');
    const selectedFriendName = selectedFriend ? selectedFriend.innerText : null;
    renderFriendList(friendsContainer, dataContainer, refresh, selectedFriendName);
}

// if the user is still present on search list when accepts the friend request,
// erases the element from the DOM 
function cleanSearchList(username) {
    console.log("CleanSearch function called");
    console.log("username: ", username);
    const searchList = document.getElementById('search-list');
    const userCard = searchList.querySelector(`[data-username="${username}"]`);
    if (userCard) {
        console.log("no amiga no");
        searchList.removeChild(userCard);
    }
}

async function renderFriendList(container, dataContainer, refreshData = true, selectedFriendName = null) {
    container.innerHTML = '';
    const friends = await handleGetFriendList();
    if (friends.length === 0) {
        container.innerHTML = `
        <div class="d-flex flex-column h-100 bg-primary">
            <div class="flex-grow-1"> You don't have any friends, yet ;) </div>
            <div class="flex-grow-1 mt-auto text-center">
                <div> You'll can add some down there </div>
                <i class="fas fa-chevron-down"></i>
            </div>
        </div>
        `;
        if (refreshData) {
            dataContainer.innerHTML = `
            <img src="../../resources/rain.gif" class="img-fluid rounded mx-auto d-block" >
            `;
        }
    } else {
        if (refreshData) {
            dataContainer.innerHTML = `
            <div id="friend-data" class="h-100 flex-column ctm-text-light text-center">
                    click on a friend to see their data!
            </div>
            `;
        }
        for (const friend of friends) {
            const friendBtn = await createFriendBtn(friend, dataContainer);
            container.appendChild(friendBtn);
            if (selectedFriendName && friend.username === selectedFriendName) {
                friendBtn.click();
            }
        }
    }
}

async function createFriendBtn(friend, dataContainer) {
	const friendBtn = document.createElement('div');
	const avatar = await getAvatar(null, null, friend.avatar);
 //   console.log("avatar on creating friend btn: ", avatar);

	friendBtn.className = 'friend-btn d-flex align-items-center';
	friendBtn.setAttribute('data-username', friend.username); //this probably will change when its connected w API
	let color = friend.is_online ? 'var(--accent)' : '#808080'
	friendBtn.innerHTML = `
		<img src="${avatar}" alt="${friend.username}" class="friend-picture">
		<div class="friend-info flex-grow-1">
			<p class="text-start mt-2">${friend.username}</p>
			</div>
            <span class="status-circle text-end" style="background-color: ${color};"></span>
			`;
            // <span class="friend-status" style="color: ${color};">${friend.is_online ? 'online' : 'offline'}</span>
	friendBtn.style.color = `var(--light)`;
	friendBtn.style.border = `1px solid var(--light)`;
	friendBtn.addEventListener('click', () => renderFriendData(friend, avatar, dataContainer));
	return friendBtn;
}

export function refreshFriendData(friendName) {
    const selectedFriend = document.querySelector('#friend-name');
    const selectedFriendName = selectedFriend ? selectedFriend.innerText : null; // check if we had open their data
    if (friendName === selectedFriendName) {
        const friendBtn = document.querySelector(`.friend-btn[data-friend-username="${friendName}"]`);
        if (friendBtn) {
            friendBtn.click();
        }
    }
}

async function renderFriendData(friend, avatar, dataContainer) {
	let color = friend.is_online ? 'var(--accent)' : '#808080'
    const stats = await handleGetResumeStats(friend.username);
    console.log("stats: ", stats)
    const aliasDiv = friend.alias ? `<p>Alias: ${friend.alias}</p>` : ''

    dataContainer.innerHTML = `
        <h2 id="friend-name" class="text-center ctm-text-title">${friend.username}</h2>
        <img src="${avatar}" alt="${friend.username}" class="friend-picture-expanded mb-3">
        <p>
          <div class="friend-status">status: <span style="color: ${color};">${friend.is_online ? 'online' : 'offline'}</span>
          <span class="status-circle" style="background-color: ${color};"></span></div>
        </p>
        ${aliasDiv}
        <div class="d-flex flex-column align-items-start w-100">
            <div class="d-flex justify-content-between w-100">
                <span>Pong wins:</span>
                <span>${stats.pongWins} / ${stats.totalPong}</span>
            </div>
            <div class="d-flex justify-content-between w-100">
                <span>Chess wins:</span>
                <span>${stats.chessWins} / ${stats.totalChess}</span>
            </div>
            <div class="d-flex justify-content-between w-100">
                <span>Tournament wins:</span>
                <span>${stats.firstPlace}</span>
            </div>
            <div class="d-flex justify-content-between w-100">
                <span>Chess ELO:</span>
                <span>${stats.chessElo}</span>
            </div>
        </div>
        <p>
            <div class="btn ctm-btn-secondary" data-action="delete">delete</div>
            <div class="btn ctm-btn-danger" data-action="block">block</div>
        </p>
    `;
	dataContainer.querySelector('[data-action="delete"]').addEventListener('click', () => showDeleteModal(friend.username));
    dataContainer.querySelector('[data-action="block"]').addEventListener('click', () => showBlockModal(friend.username));
}

function showDeleteModal(friendName) {
    const deleteModal = document.getElementById('delete-modal');
    const deleteModalBody = deleteModal.querySelector('.modal-body');
    deleteModalBody.innerHTML = `
        <p>Are you sure you want to delete ${friendName} from your friends list?</p>
    `;
    const deleteModalInstance = new bootstrap.Modal(deleteModal);
    deleteModalInstance.show();

    const deleteBtn = document.getElementById('delete-friend-btn');
    // Remove any existing event listeners
    deleteBtn.replaceWith(deleteBtn.cloneNode(true));
    const newDeleteBtn = document.getElementById('delete-friend-btn');
    newDeleteBtn.addEventListener('click', () => handleRemoveFriend(friendName, deleteModalInstance));
}

function showBlockModal(friendName) {
    const blockModal = document.getElementById('block-modal');
    const blockModalBody = blockModal.querySelector('.modal-body');
    blockModalBody.innerHTML = `
        <p>Are you sure you want to block ${friendName}?</p>
    `;
    const blockModalInstance = new bootstrap.Modal(blockModal);
    blockModalInstance.show();

    const blockBtn = document.getElementById('block-friend-btn');
    // Remove any existing event listeners
    blockBtn.replaceWith(blockBtn.cloneNode(true));
    const newBlockBtn = document.getElementById('block-friend-btn');
    newBlockBtn.addEventListener('click', () => handleBlockFriend(friendName, blockModalInstance));
}

async function handleRemoveFriend(username, modal = null) {
    const response = await removeFriend(username);

    if (modal) {
        hideModalGently(modal);
    }
    if (response.status === 'success') {
        throwToast(`You and ${username} are not friends anymore`);
        initializeFriendsEvents(false);
    } else {
        throwAlert(response.message);
    }
}

async function handleBlockFriend(username, modal = null) {
    const response = await blockUser(username);

    if (modal) {
        hideModalGently(modal);
    }
    if (response.status === 'success') {
        throwToast(`You and ${username} are not friends anymore >:(`);
        const removeResponse = await removeFriend(username);
        if (removeResponse.status === 'success') {
            initializeFriendsEvents(false);
        } else {
            throwAlert(removeResponse.message);
        }
    } else {
        throwAlert(response.message);
    }
}
