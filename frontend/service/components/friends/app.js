import { throwAlert, throwToast } from "../../app/render.js";
import { getAvatar, getFriendsList, removeFriend, blockUser } from "../../app/social.js";
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

/* export function refreshFriendsFriendlist(changedFriend, add) {
    const friendsContainer= document.getElementById('friends-container');
    const dataContainer = document.getElementById('friend-data');

    let refresh = false; // if there are changes on the selected friend ill need to refresh the data container too
    if (add === -1) { // if Im erasing a friend
        if (friendsContainer.children.length === 1) { // if Im losting my only friend (drama)
            refresh = true ; // i'll have to refresh
        } else { // else if I'm already showing the frieng to change data
            const selectedFriend = dataContainer.querySelector('#friend-name');
            const selectedFriendName = selectedFriend ? selectedFriend.innerText : null; // check if we had open their data
            refresh = selectedFriendName === changedFriend ? true : false; // and refresh it if needed
        }
    } else if (add === 1 && friendsContainer.children.length === 0) { // if Im adding my first friend
        refresh = true;
    }
    // there I could handle avatar cand status hanges but too much for now
    renderFriendList(friendsContainer, dataContainer, refresh);
} */
export function refreshFriendsFriendlist(changedFriend, add) {
    const friendsContainer= document.getElementById('friends-container');
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
    // there I could handle avatar cand status hanges but too much for now
    renderFriendList(friendsContainer, dataContainer, refresh);
}

async function renderFriendList(container, dataContainer, refreshData = true) {
    container.innerHTML = '';
    const friends = await handleGetFriendList();
    if (friends.length === 0) {
        container.innerHTML = `
        <div class="d-flex flex-column h-100">
            <div> You don't have any friends, yet ;) </div>
            <div class="mt-auto text-center">
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
        }
    }
}

async function createFriendBtn(friend, dataContainer) {
	const friendBtn = document.createElement('div');
	const avatar = await getAvatar(null, null, friend.avatar);

	friendBtn.className = 'friend-btn d-flex align-items-center';
	friendBtn.setAttribute('data-username', friend.username); //this probably will change when its connected w API
	//let color = friend.is_online ? 'var(--accent)' : '#808080'
	friendBtn.innerHTML = `
		<img src="${avatar}" alt="${friend.username}" class="friend-picture">
		<div class="friend-info">
			<p class="mt-2">${friend.username}</p>
			</div>
			`;
			// <span class="status-circle" style="background-color: ${color};"></span>
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

function renderFriendData(friend, avatar, dataContainer) {
	let color = friend.is_online ? 'var(--accent)' : '#808080'


	dataContainer.innerHTML = `
		<h2 id="friend-name" class="text-center ctm-text-title">${friend.username}</h2>
		<img src="${avatar}" alt="${friend.username}" class="friend-picture-expanded mb-3">
		<p>
		  <span class="friend-status" style="color: ${color};">status: ${friend.is_online ? 'online' : 'offline'}</span>
		  <span class="status-circle" style="background-color: ${color};"></span>
		</p>
		<p>friends since: 4/8/24</p>
		<p>
			<div class="btn ctm-btn-secondary "data-action="delete">delete</div>
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
	deleteBtn.addEventListener('click', () => handleRemoveFriend(friendName, deleteModalInstance));
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
    blockBtn.addEventListener('click', () => handleBlockFriend(friendName, blockModalInstance));
}

async function handleRemoveFriend(username, modal = null) {
    const response = await removeFriend(username);

    if (modal) {
        modal.hide();
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
        modal.hide();
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