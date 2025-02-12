import { throwAlert } from "../../app/render.js";
import { searchUsers, getFriendsList } from "../../app/social.js";
import { initSearchFriendEvents } from "./requests.js";


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
        searchInput: document.querySelector('#search-form input'),
        searchList: document.getElementById('search-list'),
        searchListContainer: document.getElementById('search-list-container')
    
    });
}

/* * * * * * * * * * * * * * * FRIENDS * * * * * * * * * * * * * * */

export async function handleGetFriendList() {
	const response = await getFriendsList();
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
        friends.forEach(friend => {
            const friendBtn = createFriendBtn(friend, dataContainer);
            container.appendChild(friendBtn);
        });
    }
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
