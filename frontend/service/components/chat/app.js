import { getMessages, markAsReadMessage } from '../../app/social.js';
import { getUsername } from '../../app/auth.js';
import { handleGetFriendList } from '../friends/app.js';
import { handleAcceptInvitation, handleDeclineInvitation } from '../home/game-invitation.js';

let isExpanded = false;
let currentView = 'recent-chats';
let chatSocket = null;
let chats = {}
let currentChat = {
    username: null,
    messages: []
};

// Initialize chat events by getting elements, binding event listeners, and showing recent chats
export async function initializeChatEvents() {
    const elements = getElements();
    initializeGlobalChatSocket();
    bindEventListeners(elements);
    await showRecentChats(elements);
}

// Get DOM elements related to the chat functionality
function getElements() {
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
    elements.chatForm.addEventListener('submit', (event) => handleSentMessage(event, elements));
    elements.recentChatsList.addEventListener('click', (event) => handleRecentChatsClick(event, elements));
    document.querySelectorAll('.back-to-recents').forEach(button => {
        button.addEventListener('click', () => showRecentChats(elements));
    });
}

// Toggle the chat window between expanded and collapsed states
async function toggleChat(elements) {
    isExpanded = !isExpanded;
    elements.chatBody.style.display = isExpanded ? 'block' : 'none';
    elements.toggleIcon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    if (isExpanded && currentView === 'recent-chats') {
        await showRecentChats(elements);
    } else {
        await updateNotificationIndicator(elements.notificationIndicator);
    }
}

// Show the recent chats tab
async function showRecentChats(elements) {
    currentView = 'recent-chats';
    elements.newChatTab.style.display = 'none';
    elements.chatTab.style.display = 'none';
    elements.recentChatsTab.style.display = 'flex';
    await renderRecentChats(elements);
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

// Get the recent chats by fetching the last message for each friend
export async function getRecentChats() {
    const friends = await handleGetFriendList();
    const recentChats = {};

    for (let friend of friends) {
        const lastMessage = await fetchLastMessageForUser(friend.username);
        if (lastMessage) {
            recentChats[friend.username] = {
                lastMessage: lastMessage.content,
                lastUpdated: lastMessage.sent_at,
                is_read: lastMessage.is_read,
                sender: lastMessage.sender === friend.username ? 'in' : 'out'
            };
        }
    }
    return recentChats;
}

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

// Render the friend list
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

// Open a chat with a specific friend
async function openChat(friendUsername, elements) {
    console.log("Opening chat with:", friendUsername);
    currentChat = { username: friendUsername, messages: [] };
    // if (chatSocket) {
    //     chatSocket.close();
    // }
    await fetchChatMessages(friendUsername);
    await markMessagesAsRead(friendUsername);
    //initializeChatSocket(friendUsername);
    displayChatWindow(elements, friendUsername);
    renderChat(elements);
}

// Fetch chat messages for a specific friend
async function fetchChatMessages(friendUsername) {
    try {
        const messagesResponse = await getMessages(friendUsername);
        if (messagesResponse.status === "success" && messagesResponse.messages) {
            currentChat.messages = messagesResponse.messages.map((msg, index) => ({
                id: index + 1,
                message: msg.content,
                sender: msg.sender,
                receiver: friendUsername,
                sent_at: msg.timestamp,
                is_special: msg.is_special,
                is_read: msg.is_read
            }));
            console.log("Messages history:", currentChat.messages);
        }
    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}

// Mark messages as read for a specific friend
async function markMessagesAsRead(friendUsername) {
    try {
        const markResponse = await markAsReadMessage(friendUsername);
        if (markResponse.status !== "success") {
            console.error("Error marking messages as read:", markResponse.message);
        }
    } catch (error) {
        console.error("Error marking messages as read:", error);
    }
}

// Initialize the WebSocket connection for a specific friend
function initializeChatSocket(friendUsername) {
    return new Promise((resolve, reject) => {
        if (chatSocket) {
            chatSocket.close();
        }
        chatSocket = new WebSocket(`ws://localhost:5051/ws/chat/${friendUsername}/`);
        chatSocket.onopen = () => {
            console.log("WebSocket connected for", friendUsername);
            resolve();
        };
        chatSocket.onmessage = (event) => handleReceivedMessage(event);
        chatSocket.onerror = (error) => {
            console.error("WebSocket error:", error);
            reject(error);
        };
        chatSocket.onclose = () => console.log("WebSocket closed");
    });
}
//initializes a global socket for all the chat
function initializeGlobalChatSocket() {
    if (chatSocket) {
        chatSocket.close();
    }
    chatSocket = new WebSocket(`ws://localhost:5051/ws/chat/`);

    chatSocket.onopen = () => {
        console.log("WebSocket global conectado");
    };

    chatSocket.onmessage = (event) => {
        handleReceivedMessage(event);
    };

    chatSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    chatSocket.onclose = () => {
        console.log("WebSocket cerrado, intentando reconectar...");
        setTimeout(initializeGlobalChatSocket, 5000); // Reintentar conexión tras 5 segundos
    };
}



// Handle received WebSocket messages
function handleReceivedMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("Mensaje recibido:", data);
        const currentUser = getUsername();

        if (data.status === "success" && data.data && data.data.message) {
            const sender = data.data.sender;
            const message = {
                id: Date.now(),
                message: data.data.message,
                sender: sender,
                receiver: currentUser,
                sent_at: data.data.sent_at,
                is_special: data.data.is_special,
                is_read: false
            };

            // Si el chat con ese usuario está abierto, actualizamos la vista
            if (currentChat.username === sender && currentView === 'chat') {
                currentChat.messages.push(message);
                renderChat(getElements());
            } else {
                // Agregar el mensaje al historial de chats
                if (!chats[sender]) {
                    chats[sender] = { messages: [] };
                }
                chats[sender].messages.push(message);

                // Actualizar la lista de chats recientes y notificaciones
                renderRecentChats(getElements());
                updateNotificationIndicator(document.getElementById('notification-indicator'));
            }
        } else {
            console.error("Error en WebSocket:", data.message);
        }
    } catch (e) {
        console.error("Error parseando el mensaje WebSocket:", e);
    }
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

// Display the chat window for a specific friend
function displayChatWindow(elements, friendUsername) {
    currentView = 'chat';
    elements.recentChatsTab.style.display = 'none';
    elements.newChatTab.style.display = 'none';
    elements.chatTab.style.display = 'flex';
    elements.currentChatName.textContent = friendUsername;
}

function renderChat(elements) {
    if (currentChat) {
        console.log("current CHAT: ", currentChat);
        elements.chatMessages.innerHTML = ''; // Clear previous messages
        currentChat.messages.forEach(message => {
            console.log("ON RENDER CHAT: ", message);
            let messageElement;
            if (message.is_special) {
                messageElement = createQuickGameInvitation(message);
            } else {
                messageElement = createMessageBubble(message);
            }
            elements.chatMessages.appendChild(messageElement);
        });
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
}



function createMessageBubble(message) {
    const card = document.createElement('div');
    const messageClass = message.sender === getUsername() ? 'out' : 'in';
    card.classList = `message ${messageClass}`;
    card.innerText = `${message.message}`;
    return card;
}

function createQuickGameInvitation(message) {
    const card = document.createElement('div');
    card.innerHTML = `
        <div class="quick-game-invitation card border-0 overflow-hidden" style="max-width: 250px;">
            <div class="progress position-absolute w-100 h-100" style="z-index: 0;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="card-body position-relative p-3" style="z-index: 1;">
                <h6 class="card-title mb-2">Game Invitation</h6>
                <p class="card-text mb-2 small">${message.sender} invited you!</p>
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn btn-sm ctm-btn flex-grow-1 me-1" data-action="accept">
                        Accept <span class="ms-1 badge bg-light text-dark">30s</span>
                    </button>
                    <button class="btn btn-sm ctm-btn-danger flex-grow-1 ms-1" data-action="decline">Decline</button>
                </div>
            </div>
        </div>
    `;
    const acceptBtn = card.querySelector('[data-action="accept"]');
    const declineBtn = card.querySelector('[data-action="decline"]');
    const messageContent = JSON.parse(message.message);
    const token = messageContent.invitation_token;
    acceptBtn.addEventListener('click', () => handleAcceptInvitation(token));
    declineBtn.addEventListener('click', () => handleDeclineInvitation(token));
    return card; // Return the card element
}
// Start a new chat with a specific friend
async function startNewChat(friendUsername, elements) {
    await openChat(friendUsername, elements);
}

// Update the notification indicator based on unread messages
export async function updateNotificationIndicator(indicator, recentChats = null) {
    console.log("Updating notification indicator...");  

    if (!recentChats) {
        recentChats = await getRecentChats();
    }
    let hasUnreadMessages = false;

    for (let [username, chatData] of Object.entries(recentChats)) {
        if (!chatData.is_read && chatData.sender !== getUsername()) {
            hasUnreadMessages = true;
            break;
        }
    }

    console.log("Has unread messages:", hasUnreadMessages);
    console.log("Is chat expanded:", isExpanded);
    indicator.style.display = hasUnreadMessages && !isExpanded ? 'block' : 'none';
}


// Handle clicks on the friend list to start a new chat
function handleFriendListClick(event, elements) {
    event.preventDefault();
    const friendLink = event.target.closest('.friend-item');
    if (friendLink) {
        const friendUsername = friendLink.getAttribute('data-friend-username');
        startNewChat(friendUsername, elements);
    }
}

// Handle the submission of the chat form to send a message
function handleSentMessage(event, elements) {
    event.preventDefault();
    const messageText = elements.messageInput.value.trim();
    if (messageText && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        const messageData = {
            message: messageText,
            sender: getUsername(),
            receiver: currentChat.username,
            sent_at: new Date().toISOString(),
            is_special: false,
            is_read: false
        };
        chatSocket.send(JSON.stringify(messageData));
        currentChat.messages.push({
            id: currentChat.messages.length + 1,
            ...messageData
        });
        renderChat(elements);
        elements.messageInput.value = '';
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


export {currentChat}