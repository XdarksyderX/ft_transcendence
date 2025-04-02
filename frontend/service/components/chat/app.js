import { getMessages, markAsReadMessage, getRecentChats, hasUnreadMessages, getUserData, getAvatar } from '../../app/social.js';
import { getUsername } from '../../app/auth.js';
import { handleGetFriendList } from '../friends/app.js';
import { initializeGlobalChatSocket, handleSentMessage } from './socket.js';
import { createMessageBubble, createSpecialBubble, escapeHTML } from './bubbles.js';
import { throwAlert } from '../../app/render.js';

let isExpanded = false;
let currentView;

const chatCache = {}

let chats = {}
let currentChat = {
    username: null,
    messages: []
};

const renderedMessages = new Set();

// Initialize chat events by getting elements, binding event listeners, and showing recent chats
export async function initializeChatEvents() {
	currentView = 'recent-chats';
	const elements = getElements();
	initializeGlobalChatSocket();
	bindEventListeners(elements);
	await updateNotificationIndicator(elements.notificationIndicator);
}

// Get DOM elements related to the chat functionality
export function getElements() {
    return {
        chatContainer: document.getElementById('chat-container'),
        chatHeader: document.getElementById('chat-header'),
        chatBody: document.getElementById('chat-body'),
        recentChatsTab: document.getElementById('recent-chats'),
        newChatTab: document.getElementById('new-chat'),
        backToRecents: document.getElementById('back-to-recents'),
        startNewChat: document.getElementById('start-a-new-chat'),
        chatTab: document.getElementById('chat-window'),
		profileTab: document.getElementById('chat-profile'),
        newChatBtn: document.getElementById('new-chat-btn'),
        toggleIcon: document.getElementById('toggle-icon'),
        friendList: document.getElementById('friends-list'),
        recentChatsList: document.getElementById('recent-chats-list'),
        chatMessages: document.getElementById('chat-messages'),
        chatForm: document.getElementById('chat-form'),
        messageInput: document.getElementById('message-input'),
        currentChatName: document.getElementById('current-chat-name'),
        notificationIndicator: document.getElementById('notification-indicator')
    };
}

// Bind event listeners to the chat elements
function bindEventListeners(elements) {
    elements.chatHeader.addEventListener('click', () => toggleChat(elements));
    elements.newChatBtn.addEventListener('click', () => showFriendList(elements));
    elements.friendList.addEventListener('click', (event) => handleFriendListClick(event, elements));
    elements.chatForm.addEventListener('submit', async (event) => await handleSentMessage(event, elements));
    elements.recentChatsList.addEventListener('click', (event) => handleRecentChatsClick(event, elements));
    document.querySelectorAll('.back-to-recents').forEach(button => {
        button.addEventListener('click', () => showRecentChats(elements));
    });
	// Attach the scroll event listener
	elements.chatMessages.addEventListener('scroll', (event) => handleScroll(event, elements));	
}

// Toggle the chat window between expanded and collapsed states
export async function toggleChat(elements) {
	isExpanded = !isExpanded;
	elements.chatBody.style.display = isExpanded ? 'block' : 'none';
	elements.toggleIcon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
	if (isExpanded && currentView === 'recent-chats') {
		await showRecentChats(elements);
	} else if (currentView === 'chat') {
		await markMessagesAsRead(currentChat.username);
	} 
	await updateNotificationIndicator(elements.notificationIndicator);
}

export async function updateNotificationIndicator(indicator) {
	//console.log("Updating notification indicator...");  
	let indicatiorDisplay;
	if (isExpanded) {
		indicatiorDisplay = 'none';
	} else {
		const response = await hasUnreadMessages();
		if (response.status === 'success') {
			const hasUnreadMessages = response.has_unread_messages;
			indicatiorDisplay = hasUnreadMessages ? 'block' : 'none';
		} else {
			throwAlert('Error while fetching unread messages status');
		}
	}
	indicator.style.display = indicatiorDisplay;
}

/* * * * * * * * * * * * * * * * * *  RECENT CHATS TAB  * * * * * * * * * * * * * * * * * */

// Show the recent chats tab
async function showRecentChats(elements) {
	currentView = 'recent-chats';
	elements.newChatTab.style.display = 'none';
	elements.chatTab.style.display = 'none';
	elements.recentChatsTab.style.display = 'flex';
	await renderRecentChats(elements);
}

// Renders the recent chats list
export async function renderRecentChats(elements) {
	//console.log("render recent chats function called");
	const recentChats = await handleGetRecentChats();
	chats = { ... recentChats};

/* 	if (Object.keys(recentChats).length === 0) {
		showFriendList(elements, false);
		return;
	} */
	let html = '';
	for (const [username, chatData] of Object.entries(recentChats)) {
		const unreadClass = (!chatData.is_read && chatData.sender === 'in') ? 'unread' : '';
		const formattedTime = formatTime(chatData.lastUpdated);
		const checkIcon = chatData.sender === 'out' ? (chatData.is_read ? '✔✔' : '✔') : '';
		const message = parseLastMessage(chatData);
		html += `
			<div class="list-group-item list-group-item-action chat-item" 
				data-friend-username="${username}">
				<div class="d-flex w-100 justify-content-between">
					<h5 class="mb-1">${username}</h5>
					<small class="text-muted">${formattedTime}</small>
				</div>
				<div class="d-flex w-100 justify-content-between">
					<p class="mb-1 ${unreadClass}">${message}</p>
					<span class="check-icon">${checkIcon}</span>
				</div>
			</div>
		`;
	}
	elements.recentChatsList.innerHTML = html;
	//await updateNotificationIndicator(elements.notificationIndicator);
}

function parseLastMessage(data) {
    if (data.is_special) {
        return '[Game notification]';
    } else {
        const cleanMsg = escapeHTML(data.lastMessage);
        if (cleanMsg.length > 19) {
            return cleanMsg.substring(0, 16) + ' ...';
        }
        return cleanMsg;
    }
}

export function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Get the recent chats by fetching from the recent-chats endpoint
async function handleGetRecentChats() {

	const response = await getRecentChats();
	if (response.status === 'success') {
		return response.recent_chats;
	} else {
		return null;
	}
}

// Handle clicks on the recent chats list to open a chat
function handleRecentChatsClick(event, elements) {
    event.preventDefault();
    const chatItem = event.target.closest('.chat-item');
    if (chatItem) {
        const friendUsername = chatItem.getAttribute('data-friend-username');
        openChat(friendUsername, elements);
    }
}

/* * * * * * * * * * * * * * * * * * *  NEW CHAT TAB  * * * * * * * * * * * * * * * * * * */
// Show the friend list tab
async function showFriendList(elements, hasChats = true) {
	currentView = 'friend-list';
	elements.recentChatsTab.style.display = 'none';
	elements.newChatTab.style.display = 'flex';
	if (!hasChats) {
		elements.startNewChat.style.display = 'block';
		elements.backToRecents.style.display = 'none';
	} else {
		elements.startNewChat.style.display = 'none';
		elements.backToRecents.style.display = 'block';
	}
	await renderFriendList(elements);
}

export function refreshChatFriendList() {
	if (isExpanded && currentView === 'friend-list') {
		renderFriendList();
	}
}

// Render the friend list
export async function renderFriendList(elements = null) {
	const friendList = elements ? elements.friendList : document.getElementById('friends-list');
	const friends = await handleGetFriendList();
	const newChatFriends = friends.filter(friend => !chats[friend.username]);

	friendList.innerHTML = newChatFriends.map(friend => `
		<div  class="list-group-item list-group-item-action friend-item" 
		   data-friend-username="${friend.username}">
			<h6 class="mb-1">${friend.username}</h6>
		</div>
	`).join('');
}

// Handle clicks on the friend list to start a new chat
function handleFriendListClick(event, elements) {
    event.preventDefault();
    const friendLink = event.target.closest('.friend-item');
    if (friendLink) {
        const friendUsername = friendLink.getAttribute('data-friend-username');
        openChat(friendUsername, elements, true);
    }
}

/* * * * * * * * * * * * * * * * * * * *  CHATS TAB  * * * * * * * * * * * * * * * * * * * */

export async function openChat(friendUsername, elements, newChat = false) {
    currentChat = { username: friendUsername, messages: [] };
    renderedMessages.clear();
	elements.chatMessages.innerHTML = '';

    if (chatCache[friendUsername]) {
        // Use cached messages
		console.log("showing messagges on cache: ", chatCache[friendUsername]);
		currentChat.messages = [...chatCache[friendUsername]];
        //renderChat(elements);
    } else {
        // Fetch messages from the server
        await fetchChatMessages(friendUsername);
		updateChatCache(friendUsername, currentChat.messages);
    }

    showChatWindow(elements, friendUsername);
    renderChat(elements);
}

// Fetch chat messages for a specific friend
async function fetchChatMessages(friendUsername) {
    try {
        const messagesResponse = await getMessages(friendUsername);

        if (messagesResponse.status === "success" && messagesResponse.messages) {
            const fetchedMessages = messagesResponse.messages.map((msg, index) => ({
                id: index + 1,
                message: msg.content,
                sender: msg.sender,
                receiver: msg.receiver,
                sent_at: msg.sent_at,
                is_special: msg.is_special,
                is_read: msg.is_read
            }));

            // Filter out messages that are already in `currentChat.messages`
            const existingMessageIds = new Set(currentChat.messages.map((msg) => msg.id));
            const newMessages = fetchedMessages.filter((msg) => !existingMessageIds.has(msg.id));

            // Prepend new messages to the beginning of `currentChat.messages`
            currentChat.messages = [...newMessages, ...currentChat.messages];

            // Update the cache with the latest messages
            //updateChatCache(friendUsername, currentChat.messages);
        }
    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}
// Mark messages as read for a specific friend
export async function markMessagesAsRead(friendUsername) { 
    try {
		console.log("marking as read");
        const markResponse = await markAsReadMessage(friendUsername);
        if (markResponse.status !== "success") {
            console.error("Error marking messages as read:", markResponse.message);
        }
    } catch (error) {
        console.error("Error marking messages as read:", error);
    }
}

// Display the chat window for a specific friend
function showChatWindow(elements, friendUsername) {
    currentView = 'chat';
    elements.recentChatsTab.style.display = 'none';
    elements.newChatTab.style.display = 'none';
    elements.chatTab.style.display = 'flex';
	const nameBtn = document.getElementById('current-chat-name');
	const newNameBtn = elements.currentChatName.cloneNode();
	nameBtn.parentNode.replaceChild(newNameBtn, nameBtn);
	newNameBtn.addEventListener('click', () => showProfileOnChat(elements, friendUsername));
    newNameBtn.textContent = friendUsername;
}

const generateMessageId = (message) => `${message.sender}-${message.sent_at}`;

export async function renderChat(elements, scroll = true) {
    if (currentChat) {
        let messageElements = [];

        for (const message of currentChat.messages) {
            const messageId = generateMessageId(message);
            if (!renderedMessages.has(messageId)) {
                let messageElement = message.is_special 
                    ? await createSpecialBubble(message) 
                    : createMessageBubble(message);

                if (messageElement instanceof Node) {
                    messageElements.push({ element: messageElement, timestamp: new Date(message.sent_at).getTime() });
                    renderedMessages.add(messageId);
                }
            }
        }

        // Sort messages by timestamp before appending
        messageElements.sort((a, b) => a.timestamp - b.timestamp)
            .forEach(({ element }) => elements.chatMessages.appendChild(element));
		if (scroll) {
			elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
		}
    }
}

async function showProfileOnChat(elements, username) {

	const container = document.getElementById('profile-data-container');

	currentView = 'profile';
	elements.chatTab.style.display = 'none';
	elements.profileTab.style.display = 'block';
	const backBtn = document.getElementById('back-to-chat');
	const newBackBtn = backBtn.cloneNode(true);
	backBtn.parentNode.replaceChild(newBackBtn, backBtn);
	newBackBtn.addEventListener('click', () => {
		container.innerHTML = ``;
		openChat(username, elements);
	});
	await fillProfileData(username, container);
}

async function fillProfileData(username, container) {
    const user = await getUserData(username);
    const avatar = await getAvatar(null, null, user.avatar);
    let color = user.status === "online" ? 'var(--accent)' : '#808080';
    // const aliasDiv = user.alias ? `<p>Alias: ${user.alias}</p>` : ''

    if (!user) return;

    container.innerHTML = `
        <h5 id="friend-name" class="ctm-text-title my-3">${user.username}</h5>
        <img src="${avatar}" alt="${user.username}" class="mb-3 friend-picture-expanded">
        <div class="footer mt-auto mb-5 text-center">
            <p>
				<div> status:
                <span class="friend-status" style="color: ${color};"> ${user.status || 'unknown'}</span>
                <span class="status-circle" style="background-color: ${color};"></span>
				</div>
            </p>
            <p>Alias: ${user.alias || user.username}</p>
        </div>
    
    `;
}

/* * * * * * * * * * * * * * * * * * * *  PRE-FETCH AND CACHE HANDLING  * * * * * * * * * * * * * * * * * * * */


async function handleScroll(event, elements) {
    if (event.target.scrollTop === 0) { // User scrolled to the top
		if (chatCache[currentChat.username]?.hasFetchedAllMessages) {
            console.log(`No more messages to fetch for ${currentChat.username}`);
            return;
        } else {
			await fetchChatMessages(currentChat.username);
			chatCache[currentChat.username].hasFetchedAllMessages = true;
			if (currentChat.messages.length > 8) {
				//currentChat.messages = [...olderMessages, ...currentChat.messages];
				//updateChatCache(currentChat.username, currentChat.messages);
				renderChat(elements, false);
			}
		}
    }
}



export function updateChatCache(username, messages) {
	console.log("updating chat cache")
	chatCache[username] = messages.slice(-8);
}
  

export {currentChat, currentView, isExpanded, chatCache}