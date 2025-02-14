import { throwAlert } from "../../app/render.js";
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

async function renderFriendList(container, dataContainer) {
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
        dataContainer.innerHTML = `
        <img src="../../resources/rain.gif" class="img-fluid rounded mx-auto d-block" >
        `;
    } else {
        dataContainer.innerHTML = `
        <div id="friend-data" class="h-100 flex-column ctm-text-light text-center">
                click on a friend to see their data!
        </div>
        `;
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
	friendBtn.setAttribute('data-friend-id', friend.id); //this probably will change when its connected w API
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
        throwAlert(`You and ${username} are not friends anymore`);
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
        throwAlert(`You and ${username} are not friends anymore >:(`);
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