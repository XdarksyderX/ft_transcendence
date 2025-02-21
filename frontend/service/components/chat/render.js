import { getRecentChats, updateNotificationIndicator, currentChat } from "./app.js";
import { handleGetFriendList } from "../friends/app.js";
import { getUsername } from "../../app/auth.js";
// Render the friend list
let chats = {}

export async function renderFriendList(elements) {
    const friends = await handleGetFriendList();
    const newChatFriends = friends.filter(friend => !chats[friend.username]);

    elements.friendList.innerHTML = newChatFriends.map(friend => `
        <a href="#" class="list-group-item list-group-item-action friend-item" 
           data-friend-username="${friend.username}">
            <h6 class="mb-1">${friend.username}</h6>
        </a>
    `).join('');
}

// Render the recent chats list
export async function renderRecentChats(elements) {
	console.log("render recent chats function called");
	const recentChats = await getRecentChats();
	chats = { ... recentChats};

/* 	if (Object.keys(recentChats).length === 0) {
		showFriendList(elements, false);
		return;
	} */
	let html = '';
	for (const [username, chatData] of Object.entries(recentChats)) {
		console.log("ON renderRecentChats CHATDATA: ", chatData);
		const unreadClass = !chatData.is_read ? 'unread' : '';
		const formattedTime = formatTime(chatData.lastUpdated);
		const checkIcon = chatData.sender === 'out' ? (chatData.is_read ? '✔✔' : '✔') : '';
		html += `
			<a href="#" class="list-group-item list-group-item-action chat-item" 
				data-friend-username="${username}">
				<div class="d-flex w-100 justify-content-between">
					<h5 class="mb-1">${username}</h5>
					<small class="text-muted">${formattedTime}</small>
				</div>
				<div class="d-flex w-100 justify-content-between">
					<p class="mb-1 ${unreadClass}">${chatData.lastMessage}</p>
					<span class="check-icon">${checkIcon}</span>
				</div>
			</a>
		`;
	}
	elements.recentChatsList.innerHTML = html;
	await updateNotificationIndicator(elements.notificationIndicator, recentChats);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}



// Render the chat messages in the chat window
export function renderChat(elements) {
	if (currentChat) {
		elements.chatMessages.innerHTML = currentChat.messages.map(message => {
			console.log("ON RENDER CHAT: ", message);
			if (message.is_special) {
				return createQuickGameInvitation(message);
			} else {
				return createMessageBubble(message);
			}
		}).join('');
		elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
	}
}

function createMessageBubble(message) {
    const messageClass = message.sender === getUsername() ? 'out' : 'in';
    return `
        <div class="message ${messageClass}">
            ${message.message}
        </div>
    `;
}

function createQuickGameInvitation(message) {
	return `
	<div class="quick-game-invitation card border-0 overflow-hidden" style="max-width: 250px;">
		<div class="progress position-absolute w-100 h-100" style="z-index: 0;">
			<div class="progress-bar bg-primary" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
		</div>
		<div class="card-body position-relative p-3" style="z-index: 1;">
			<h6 class="card-title mb-2">Game Invitation</h6>
			<p class="card-text mb-2 small">${message.sender} invited you!</p>
			<div class="d-flex justify-content-between align-items-center">
				<button class="btn btn-sm ctm-btn flex-grow-1 me-1" onclick="acceptGameInvitation('${message.sender}')">
					Accept <span class="ms-1 badge bg-light text-dark">30s</span>
				</button>
				<button class="btn btn-sm btn-danger flex-grow-1 ms-1" onclick="declineGameInvitation('${message.sender}')">Decline</button>
			</div>
		</div>
	</div> `;
}

function createTournamentInvitation(friendName, tourName) {
	return `
	<div class="outer-card" style="max-width: 250px;">
		<div class="game-invitation card overflow-hidden">
			<div class="card-body position-relative p-3" style="z-index: 1;">
				<h6 class="mb-2 ctm-text-title">new tournament</h6>
				<p class="card-text mb-2 small ctm-text-light"><span id="inviter-name">${friendName}</span> invited you to the <span id="tournament-name"> ${tourName} </span>tournament!</p>
				<div class="d-flex justify-content-between align-items-center">
					<button id="accept-btn" class="btn btn-sm ctm-btn flex-grow-1 me-1">Accept</button>
					<button id="decline-btn" class="btn btn-sm ctm-btn-danger flex-grow-1 ms-1">Decline</button>
				</div>
			</div>
		</div>
	</div> `;
}

function createTournamentStartedNotification(tourName) {
	return `
	<div class="card-border" style="max-width: 250px;">
		<div class="game-invitation card overflow-hidden">
			<div class="card-body position-relative p-3" style="z-index: 1;">
			<h6 class="mb-2 ctm-text-title">tournament info</h6>
			<p class="card-text mb-2 small ctm-text-light">the <span id="tournament-name"> whatever the name </span>tournament has just started!</p>
			<div class="d-flex justify-content-between align-items-center">
				<button id="accept-btn" class="btn btn-sm ctm-btn flex-grow-1 me-1">got it!</button>
			</div>
			</div>
		</div>
	</div> `;
}




