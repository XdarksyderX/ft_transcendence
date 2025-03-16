import { getMessages, markAsReadMessage } from '../../app/social.js';
import { getUsername } from '../../app/auth.js';
import { handleGetFriendList } from '../friends/app.js';
import { initializeGlobalChatSocket, handleSentMessage } from './socket.js';
import { createMessageBubble, createSpecialBubble } from './bubbles.js';

let isExpanded = false;
let currentView = 'recent-chats';

let chats = {}
let currentChat = {
    username: null,
    messages: []
};

const renderedMessages = new Set();

// Initialize chat events by getting elements, binding event listeners, and showing recent chats
export async function initializeChatEvents() {
	const elements = getElements();
	initializeGlobalChatSocket();
	bindEventListeners(elements);
	//await showRecentChats(elements);
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
}

// Toggle the chat window between expanded and collapsed states
export async function toggleChat(elements) {
	isExpanded = !isExpanded;
	elements.chatBody.style.display = isExpanded ? 'block' : 'none';
	elements.toggleIcon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
	if (isExpanded && currentView === 'recent-chats') {
		console.log("CI");
		await showRecentChats(elements);
	} else if (currentView === 'chat') {
		await markMessagesAsRead(currentChat.username);
		await updateNotificationIndicator(elements.notificationIndicator);
	}
}

export async function updateNotificationIndicator(indicator, recentChats = null) {
    //console.log("Updating notification indicator...");  

    if (!recentChats) {
        recentChats = await getRecentChats();
    }
    let hasUnreadMessages = false;

    for (let [username, chatData] of Object.entries(recentChats)) {
        //console.log(`Checking chat with ${username}: is_read=${chatData.is_read}, sender=${chatData.sender}`);
        if (!chatData.is_read && chatData.sender === 'in') {
            hasUnreadMessages = true;
            break;
        }
    }

    //console.log("Has unread messages:", hasUnreadMessages);
    //console.log("Is chat expanded:", isExpanded);
    indicator.style.display = hasUnreadMessages && !isExpanded ? 'block' : 'none';
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
	const recentChats = await getRecentChats();
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
		html += `
			<div class="list-group-item list-group-item-action chat-item" 
				data-friend-username="${username}">
				<div class="d-flex w-100 justify-content-between">
					<h5 class="mb-1">${username}</h5>
					<small class="text-muted">${formattedTime}</small>
				</div>
				<div class="d-flex w-100 justify-content-between">
					<p class="mb-1 ${unreadClass}">${chatData.lastMessage}</p>
					<span class="check-icon">${checkIcon}</span>
				</div>
			</div>
		`;
	}
	elements.recentChatsList.innerHTML = html;
	await updateNotificationIndicator(elements.notificationIndicator, recentChats);
}

export function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Get the recent chats by fetching the last message for each friend
async function getRecentChats() {
	const friends = await handleGetFriendList();
	const recentChats = {};

	for (let friend of friends) {
		const lastMessage = await fetchLastMessageForUser(friend.username);
		if (lastMessage) {
			let invitation = null;
			if (lastMessage.is_special) {
				invitation = '[Game notification]'
			}
			recentChats[friend.username] = {
				lastMessage: invitation || lastMessage.content,
				lastUpdated: lastMessage.sent_at,
				is_read: lastMessage.is_read,
				sender: lastMessage.sender === friend.username ? 'in' : 'out'
			};
		}
	}
	return recentChats;
}

// Fetch the last message for a specific user
async function fetchLastMessageForUser(friendUsername) {
    try {
        const messagesResponse = await getMessages(friendUsername);
        if (messagesResponse.status === "success" && messagesResponse.messages && messagesResponse.messages.length > 0) {
            return messagesResponse.messages[messagesResponse.messages.length - 1];
        }
    } catch (error) {
        console.error("Error fetching messages for", friendUsername, error);
    }
    return null;
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

// Open a chat with a specific friend
export async function openChat(friendUsername, elements, newChat = false) {
	//console.log("Opening chat with:", friendUsername);
	currentChat = { username: friendUsername, messages: [] };
	renderedMessages.clear(); // Reinicia el set de mensajes renderizados
	if (!newChat) { // si no es un chat nuevo que acabo de crear
		elements.chatMessages.innerHTML = ''; // clears the dom before fetching messages
		await fetchChatMessages(friendUsername);
		await markMessagesAsRead(friendUsername);
	}
	showChatWindow(elements, friendUsername);
	renderChat(elements);
}

// Fetch chat messages for a specific friend
async function fetchChatMessages(friendUsername) {
	try {
		const messagesResponse = await getMessages(friendUsername);
		//console.log("on fetch chat messages: ", messagesResponse.messages)
		if (messagesResponse.status === "success" && messagesResponse.messages) {
			currentChat.messages = messagesResponse.messages.map((msg, index) => ({
				id: index + 1,
				message: msg.content,
				sender: msg.sender,
				receiver: msg.receiver,
				sent_at: msg.sent_at,
				is_special: msg.is_special,
				is_read: msg.is_read
			}));
			//console.log("Messages history:", currentChat.messages);
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
    elements.currentChatName.textContent = friendUsername;
}

const generateMessageId = (message) => `${message.sender}-${message.sent_at}`;

export async function renderChat(elements) {
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

        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
}

export {currentChat, currentView, isExpanded}