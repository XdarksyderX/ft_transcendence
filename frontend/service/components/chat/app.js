import { handleGetFriendList } from "../friends/app.js";
import { getAllChats, getChatHistory, createMessage } from "../../app/social.js";

/* state variables */
let isExpanded = false;
let currentChat = null;
let currentView = 'recent-chats';

let chatSocket = null;

/**
 * Initializes chat events, sets up the single WebSocket,
 * and binds all UI event listeners.
 */
export function initializeChatEvents() {
    const elements = getElements();
    initWebSocket();
    updateNotificationIndicator(elements.status.notificationIndicator);
    initBtnEvents(elements);
    loadInitialChats(elements);
}

/**
 * Creates a single WebSocket connection for all chats.
 * Receives messages with chatId + message, then calls handleChatMessage.
 */
function initWebSocket() {
    if (!chatSocket) {
        const url = 'ws://' + window.location.host + '/ws/chat/';
        chatSocket = new WebSocket(url);

        chatSocket.onopen = () => console.log('WebSocket open');
        chatSocket.onclose = () => console.log('WebSocket closed');
        chatSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleChatMessage(data);
        };
    }
}

/**
 * Processes incoming messages, associating them with the correct chat by chatId.
 */
function handleChatMessage(data) {
    const { chatId, message } = data;
    // Find existing chat
    let chat = chats.find(c => c.id === chatId);

    // If chat doesn't exist, optionally create it, or skip
    if (!chat) {
        chat = { id: chatId, name: `Friend${chatId}`, messages: [] };
        chats.push(chat);
    }

    chat.messages.push({
        id: Date.now(),
        text: message,
        sender: 'in',
        read: false,
    });

    if (currentChat && currentChat.id === chatId) {
        const chatMessages = document.getElementById('chat-messages');
        renderChat(chatMessages);
        const indicator = document.getElementById('notification-indicator');
        updateNotificationIndicator(indicator);
    }
}

/**
 * Sends a message through the open WebSocket, including its chatId.
 */
function sendChatMessage(chatId, message) {
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        const payload = { chatId, message };
        chatSocket.send(JSON.stringify(payload));
    }
}

/* provisional data */
let chats = [];

/**
 * Retrieves all necessary DOM elements for chat functionality.
 */
function getElements() {
  return {
    container: {
      chatContainer: document.getElementById('chat-container'),
      chatHeader: document.getElementById('chat-header'),
      chatBody: document.getElementById('chat-body'),
    },
    tabs: {
      recentChats: document.getElementById('recent-chats'),
      newChat: document.getElementById('new-chat'),
      chatWindow: document.getElementById('chat-window'),
    },
    buttons: {
      newChatBtn: document.getElementById('new-chat-btn'),
      toggleIcon: document.getElementById('toggle-icon'),
    },
    lists: {
      friendList: document.getElementById('friends-list'),
      recentChats: document.getElementById('recent-chats-list'),
    },
    chat: {
      chatMessages: document.getElementById('chat-messages'),
      chatForm: document.getElementById('chat-form'),
      messageInput: document.getElementById('message-input'),
    },
    status: {
      currentChatName: document.getElementById('current-chat-name'),
      notificationIndicator: document.getElementById('notification-indicator'),
    },
  };
}

/**
 * Binds UI listeners (buttons, lists, etc.) for overall chat navigation and actions.
 */
function initBtnEvents(elements) {
    elements.container.chatHeader.addEventListener('click', () => toggleChat(elements));
    elements.buttons.newChatBtn.addEventListener('click', () => showFriendList(elements));
    
    elements.lists.friendList.addEventListener('click', event => {
        event.preventDefault();
        const friendLink = event.target.closest('.list-group-item');
        if (friendLink) {
            const friendName = friendLink.querySelector('h6').textContent;
            startNewChat(friendName, elements);
        }
    });

    elements.chat.chatForm.addEventListener('submit', event => {
        event.preventDefault();
        const messageText = elements.chat.messageInput.value.trim();
        if (messageText) {
            addMessage(messageText, 'out', elements);
            elements.chat.messageInput.value = '';
        }
    });

    elements.tabs.recentChats.addEventListener('click', event => {
        event.preventDefault();
        const chatItem = event.target.closest('.chat-item');
        if (chatItem) {
            openChat(parseInt(chatItem.dataset.chatId), elements);
        }
    });

    document.querySelectorAll('.back-to-recents').forEach(button => {
        button.addEventListener('click', () => showRecentChats(elements));
    });
}

/**
 * Expands or collapses the entire chat panel, updating the icon accordingly.
 */
function toggleChat(elements) {
    isExpanded = !isExpanded;
    elements.container.chatBody.style.display = isExpanded ? 'block' : 'none';
    elements.buttons.toggleIcon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    if (isExpanded && !currentChat) {
        showRecentChats(elements);
    }
    updateNotificationIndicator(elements.status.notificationIndicator);
}

/**
 * Shows the recent-chats tab and hides other sections.
 */
function showRecentChats(elements) {
    currentView = 'recent-chats';
    elements.tabs.newChat.style.display = 'none';
    elements.tabs.chatWindow.style.display = 'none';
    elements.tabs.recentChats.style.display = 'flex';
    renderRecentChats(elements);
}

/**
 * Renders the list of recent chats, including unread message indicators.
 */
function renderRecentChats(elements) {
    elements.lists.recentChats.innerHTML = chats.map(chat => {
        const lastMessage = chat.messages[chat.messages.length - 1];
        const unreadClass = (!lastMessage.read && lastMessage.sender === 'in') ? 'unread' : '';
        return `
            <a href="#" class="list-group-item list-group-item-action chat-item" data-chat-id="${chat.id}">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${chat.name}</h5>
                    <small class="text-muted">3 days ago</small>
                </div>
                <p class="mb-1 ${unreadClass}">${lastMessage ? lastMessage.text : 'No messages yet'}</p>
            </a>
        `;
    }).join('');
    updateNotificationIndicator(elements.status.notificationIndicator);
}

/**
 * Displays the friend list for creating new chats.
 */
async function showFriendList(elements) {
    currentView = 'friend-list';
    elements.tabs.recentChats.style.display = 'none';
    elements.tabs.newChat.style.display = 'flex';
    const friends = await handleGetFriendList();
    renderFriendList(elements.lists.friendList, friends);
}

/**
 * Renders the fetched friend list into the UI.
 */
function renderFriendList(listElement, friends) {
    listElement.innerHTML = friends.map(friend => `
        <a href="#" class="list-group-item list-group-item-action">
            <h6 class="mb-1">${friend.username}</h6>
        </a>
    `).join('');
}

/**
 * Toggles the notification indicator if there are unread messages
 * and the chat is currently collapsed.
 */
function updateNotificationIndicator(indicator) {
    const hasUnreadMessages = chats.some(chat => 
        chat.messages.some(message => !message.read && message.sender === 'in')
    );
    indicator.style.display = (hasUnreadMessages && !isExpanded) ? 'block' : 'none';
}

/**
 * Creates a new chat object (if needed) and opens it in the UI.
 */
function startNewChat(friendName, elements) {
    let chat = chats.find(chat => chat.name === friendName);
    if (!chat) {
        chat = { id: chats.length + 1, name: friendName, messages: [] };
        chats.push(chat);
    }
    currentChat = chat;
    openChat(chat.id, elements);
}

/**
 * Opens an existing chat by ID, marking all its messages as read.
 */
async function openChat(chatId, elements) {
    currentChat = chats.find(chat => chat.id === chatId);
    if (!currentChat) {
        currentChat = await getChatHistory(chatId);
        chats.push(currentChat);
    }
    if (currentChat) {
        currentView = 'chat';
        elements.tabs.recentChats.style.display = 'none';
        elements.tabs.newChat.style.display = 'none';
        elements.tabs.chatWindow.style.display = 'flex';
        elements.status.currentChatName.textContent = currentChat.name;
        renderChat(elements.chat.chatMessages);
        currentChat.messages.forEach(message => (message.read = true));
        updateNotificationIndicator(elements.status.notificationIndicator);
    }
}

/**
 * Renders the messages of the currently open chat into the chat window.
 */
function renderChat(chatMessages) {
    if (currentChat) {
        chatMessages.innerHTML = currentChat.messages
            .map(message => `<div class="message ${message.sender}">${message.text}</div>`)
            .join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Sends a new outgoing message for the currentChat, both locally and via WebSocket.
 */
async function addMessage(text, sender, elements) {
    if (currentChat) {
        const message = {
            id: currentChat.messages.length + 1,
            text,
            sender,
            read: true,
        };
        // Add locally
        currentChat.messages.push(message);
        // Send via WebSocket
        sendChatMessage(currentChat.id, text);
        // Send to server
        await createMessage(currentChat.id, text);

        renderChat(elements.chat.chatMessages);
    }
}

/**
 * Loads initial chats from the server.
 */
async function loadInitialChats(elements) {
    chats = await getAllChats();
    renderRecentChats(elements);
}