import { searchUsers } from "../../app/social.js";
import { throwAlert } from "../../app/render.js";

const friends = [
	{ id: 1, name: 'Alice', status: 'online', picture: '../../resources/avatar/avatar_1.png' },
	{ id: 2, name: 'Bob', status: 'offline', picture: '../../resources/avatar/avatar_2.png' },
	{ id: 3, name: 'Charlie', status: 'online', picture: '../../resources/avatar/avatar_3.png' },
	{ id: 4, name: 'David', status: 'away', picture: '../../resources/avatar/avatar_1.png' }
];


export function initializeFriendsEvents() {
	const elements = getElements();
	renderFriendList(elements.friendsContainer, elements.dataContainer);
	initSearchFriendEvents(elements);
}

function getElements() {
	return ({
        friendsContainer: document.getElementById('friends-container'),
		dataContainer : document.getElementById('friend-data'),
        searchContainer: document.getElementById('search-form-container'),
        searchBtn: document.getElementById('toggle-search'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.querySelector('#search-form input')
    });
}

/* * * * * * * * * * * * * * * FRIENDS * * * * * * * * * * * * * * */

function renderFriendList(container, dataContainer) {
	container.innerHTML = '';
	friends.forEach(friend => {
		const friendBtn = createFriendBtn(friend, dataContainer);
		container.appendChild(friendBtn);
	});
}

function createFriendBtn(friend, dataContainer) {
	const friendBtn = document.createElement('div');
	friendBtn.className = 'friend-btn d-flex';
	friendBtn.setAttribute('data-friend-id', friend.id); //this probably will change when its connected w API
	let color = friend.status === 'online' ? 'var(--accent)' : '#808080'
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
	friendBtn.addEventListener('click', () => renderFriendData(friend, color, dataContainer));
	return friendBtn;
}

function renderFriendData(friend, color, dataContainer) {
	dataContainer.innerHTML = `
		<h2 id="friend-name" class="text-center ctm-text-title">${friend.name}</h2>
		<img src="${friend.picture}" alt="${friend.name}" class="friend-picture-expanded mb-3">
		<p>
		  <span class="friend-status" style="color: ${color};">status: ${friend.status}</span>
		  <span class="status-circle" style="background-color: ${color};"></span>
		</p>
		<p>friends since: 4/8/24</p>
		<p>
			<div class="btn ctm-btn-secondary" data-bs-toggle="modal" data-bs-target="#delete-modal">delete</div>
			<div class="btn ctm-btn-danger" data-bs-toggle="modal" data-bs-target="#block-modal">block</div>
		</p>
	`;
}

/* * * * * * * * * * * * * FRIEND REQUEST * * * * * * * * * * * * */

let inactivityTimeout;

function initSearchFriendEvents(elements) {

	elements.searchBtn.addEventListener('click', function() {
		if (elements.searchContainer.classList.contains('expanded')) {
			searchNewFriend(elements.searchInput);
		} else {
			toggleSearch(true, elements);
		}
	});	
	elements.searchInput.addEventListener('input', resetInactivityTimeout);
	elements.searchInput.addEventListener('focus', resetInactivityTimeout);
	elements.searchForm.addEventListener('submit', function(e) {
		e.preventDefault();
		searchNewFriend(elements.searchInput);
	});
}

function searchNewFriend(input) {
	const username = input.value;
    input.value = '';
    console.log('Searching for:', username);
	handleSearchUsers(username);

}

async function handleSearchUsers(username) {
	const response = await searchUsers(username);
	if (response.status === "success") {
		throwAlert('ole ole ole los caracole');
		console.log(response.data);
	} else {
		throwAlert(response.message);
	}
}

function toggleSearch(on, elements) {
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

function resetInactivityTimeout() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        toggleSearch(false);
    }, 30000);
}

