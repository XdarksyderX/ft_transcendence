import { handleGetFriendList } from "../friends/app.js";
/* state variables */
let isExpanded = false;
let currentChat = null;
let currentView = 'recent-chats';

export function initializeChatEvents() {
    const elements = getElements();
    updateNotificationIndicator(elements.status.notificationIndicator);
    initBtnEvents(elements);
}

/* provisional data */
let chats = [
    { id: 1, name: "Vicenta", messages: [
        { id: 1, text: "Policía?! Me llamo Vicenta, estoy muy nerviosa", sender: "in", read: true },
        { id: 2, text: "...", sender: "out", read: true },
        { id: 3, text: "Ya vienen para acá", sender: "in", read: false },
    ]},
    { id: 2, name: "Bob", messages: [
        { id: 1, text: "Did you see the game last night?", sender: "in", read: true },
        { id: 2, text: "Yeah, it was amazing!", sender: "out", read: true },
    ]},
    { id: 3, name: "Charlie", messages: [
        { id: 1, text: "Meeting at 3pm today", sender: "in", read: true },
        { id: 2, text: "I'll be there", sender: "out", read: true },
        { id: 3, text: "Great, see you then!", sender: "in", read: false },
    ]},
];

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

    // Use elements.chat.chatForm instead of chatForm
    elements.chat.chatForm.addEventListener('submit', event => {
        event.preventDefault();
        const messageText = elements.chat.messageInput.value.trim();
        if (messageText) {
            addMessage(messageText, 'out', elements);
            elements.chat.messageInput.value = '';
        }
    });

    // Change from recentChatsTab to elements.tabs.recentChats
    elements.tabs.recentChats.addEventListener('click', event => {
        event.preventDefault();
        const chatItem = event.target.closest('.chat-item');
        if (chatItem) {
            openChat(parseInt(chatItem.dataset.chatId), elements);
        }
    });

    // For back-to-recents buttons
    document.querySelectorAll('.back-to-recents').forEach(button => {
        button.addEventListener('click', () => showRecentChats(elements));
    });
}

// Toggle chat visibility
function toggleChat(elements) {
    isExpanded = !isExpanded;
    elements.container.chatBody.style.display = isExpanded ? 'block' : 'none';
    elements.buttons.toggleIcon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    if (isExpanded && !currentChat) {
        showRecentChats(elements);
    }
    updateNotificationIndicator(elements.status.notificationIndicator);
}

function showRecentChats(elements) {
    currentView = 'recent-chats';
    elements.tabs.newChat.style.display = 'none';
    elements.tabs.chatWindow.style.display = 'none';
    elements.tabs.recentChats.style.display = 'flex';
    renderRecentChats(elements);
}

function renderRecentChats(elements) {
    elements.lists.recentChats.innerHTML = chats.map(chat => {
        const lastMessage = chat.messages[chat.messages.length - 1];
        const unreadClass = !lastMessage.read && lastMessage.sender === 'in' ? 'unread' : '';
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

async function showFriendList(elements) {
    currentView = 'friend-list';
    elements.tabs.recentChats.style.display = 'none';
    elements.tabs.newChat.style.display = 'flex';
    const friends = await handleGetFriendList();
    renderFriendList(elements.lists.friendList, friends);
}

function renderFriendList(listElement, friends) {
    listElement.innerHTML = friends.map(friend => `
        <a href="#" class="list-group-item list-group-item-action">
            <h6 class="mb-1">${friend.username}</h6>
        </a>
    `).join('');
}

function updateNotificationIndicator(indicator) {
    const hasUnreadMessages = chats.some(chat => 
        chat.messages.some(message => !message.read && message.sender === 'in')
    );
    indicator.style.display = hasUnreadMessages && !isExpanded ? 'block' : 'none';
}

function startNewChat(friendName, elements) {
    let chat = chats.find(chat => chat.name === friendName);
    if (!chat) {
        chat = { id: chats.length + 1, name: friendName, messages: [] };
        chats.push(chat);
    }
    currentChat = chat;
    openChat(chat.id, elements);
}

function openChat(chatId, elements) {
    currentChat = chats.find(chat => chat.id === chatId);
    if (currentChat) {
        currentView = 'chat';
        elements.tabs.recentChats.style.display = 'none';
        elements.tabs.newChat.style.display = 'none';
        // Fix: use chatWindow instead of chat
        elements.tabs.chatWindow.style.display = 'flex';
        elements.status.currentChatName.textContent = currentChat.name;
        renderChat(elements.chat.chatMessages);
        currentChat.messages.forEach(message => (message.read = true));
        updateNotificationIndicator(elements.status.notificationIndicator);
    }
}

function renderChat(chatMessages) {
    if (currentChat) {
        chatMessages.innerHTML = currentChat.messages
            .map(message => `<div class="message ${message.sender}">${message.text}</div>`)
            .join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Add elements as a parameter so we can use renderChat properly
function addMessage(text, sender, elements) {
    if (currentChat) {
        const message = {
            id: currentChat.messages.length + 1,
            text,
            sender,
            read: true,
        };
        currentChat.messages.push(message);
        renderChat(elements.chat.chatMessages);
    }
}