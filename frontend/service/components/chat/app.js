import { getMessages, markAsReadMessage } from '../../app/social.js';
import { getUsername } from '../../app/auth.js';
import { handleGetFriendList } from '../friends/app.js';

let isExpanded = false;
let currentView = 'recent-chats';
let chatSocket = null;

let currentChat = {
    username: null,
    messages: []
};

// A variable to store the last message of each chat to avoid unnecessary API calls
// Structure: { username: { lastMessage: "Hola", lastUpdated: timestamp, read: true/false } }
let chats = {};

// Initialize chat events by getting elements, binding event listeners, and showing recent chats
export async function initializeChatEvents() {
    const elements = getElements();
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
    }
    updateNotificationIndicator(elements.notificationIndicator);
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
async function getRecentChats() {
    if (!chats) chats = {}; // Ensure chats is defined

    const friends = await handleGetFriendList();

    for (let friend of friends) {
        if (!chats[friend.username]) { // Only fetch if not already in chats
            const lastMessage = await fetchLastMessageForUser(friend.username);
            if (lastMessage) {
                chats[friend.username] = {
                    lastMessage: lastMessage.content,
                    // lastUpdated: new Date(lastMessage.timestamp).getTime(),
                    read: lastMessage.is_read
                };
            }
        }
    }
}

// Render the recent chats list
async function renderRecentChats(elements) {
    console.log("render recent chats function called");
    if (!chats || Object.keys(chats).length === 0) {
        await getRecentChats(); // Fill chats if empty
    }
    if (Object.keys(chats).length === 0) {
        showFriendList(elements, false);
        return;
    }
    let html = '';
    for (const [username, chatData] of Object.entries(chats)) {
        const unreadClass = !chatData.read ? 'unread' : '';
        html += `
            <a href="#" class="list-group-item list-group-item-action chat-item" 
                data-friend-username="${username}">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${username}</h5>
                    <small class="text-muted">${'nope'}</small>
                </div>
                <p class="mb-1 ${unreadClass}">${chatData.lastMessage}</p>
            </a>
        `;
        // <small class="text-muted">${new Date(chatData.lastUpdated).toLocaleTimeString()}</small>
    }
    elements.recentChatsList.innerHTML = html;
    updateNotificationIndicator(elements.notificationIndicator);
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
async function renderFriendList(elements) {
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
    if (chatSocket) {
        chatSocket.close();
    }
    await fetchChatMessages(friendUsername);
    await markMessagesAsRead(friendUsername);
    initializeChatSocket(friendUsername);
    displayChatWindow(elements, friendUsername);
    renderChat(elements);
}

// Fetch chat messages for a specific friend
async function fetchChatMessages(friendUsername) {
    try {
        const messagesResponse = await getMessages(friendUsername);
        if (messagesResponse.status === "success" && messagesResponse.messages) {
            const currentUser = getUsername();
            currentChat.messages = messagesResponse.messages.map((msg, index) => ({
                id: index + 1,
                text: msg.content,
                sender: msg.sender === currentUser ? "out" : "in",
                read: msg.is_read
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
        } else {
            if (chats[friendUsername]) { // Update the read status in the chats object
                chats[friendUsername].read = true;
                console.log(`Marked messages as read for ${friendUsername}`);
                console.log("Updated chats object after marking messages as read:", chats);
            }
        }
    } catch (error) {
        console.error("Error marking messages as read:", error);
    }
}

// Initialize the WebSocket connection for a specific friend
function initializeChatSocket(friendUsername) {
    chatSocket = new WebSocket(`ws://localhost:5051/ws/chat/${friendUsername}/`);
    chatSocket.onopen = () => console.log("WebSocket connected for", friendUsername);
    chatSocket.onmessage = (event) => handleReceivedMessage(event);
    chatSocket.onerror = (error) => console.error("WebSocket error:", error);
    chatSocket.onclose = () => console.log("WebSocket closed");
}

// Handle received WebSocket messages
function handleReceivedMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("WS message received:", data);
        const currentUser = getUsername();
        if (data.status === "success" && data.data && data.data.message) {
            if (data.data.sender === currentUser) return;

            // Update currentChat if the message is for the currently open chat
            if (currentChat.username === data.data.sender && currentView === 'chat') {
                currentChat.messages.push({
                    id: currentChat.messages.length + 1,
                    text: data.data.message,
                    sender: "in",
                    read: true
                });
            }
            // Update chats object
            chats[data.data.sender] = {
                lastMessage: data.data.message,
                //lastUpdated: Date.now(),
                read: false
            };

            // Update the view if the current view is the chat with the sender or the recent-chats tab
            if (currentView === 'chat' && currentChat.username === data.data.sender) {
                renderChat(getElements());
            } else if (currentView === 'recent-chats') {
                renderRecentChats(getElements());
            }

            // Update notification indicator
            updateNotificationIndicator(document.getElementById('notification-indicator'));
        } else {
            console.error("WS error:", data.message);
        }
    } catch (e) {
        console.error("Error parsing WS message:", e);
    }
}

// Display the chat window for a specific friend
function displayChatWindow(elements, friendUsername) {
    currentView = 'chat';
    elements.recentChatsTab.style.display = 'none';
    elements.newChatTab.style.display = 'none';
    elements.chatTab.style.display = 'flex';
    elements.currentChatName.textContent = friendUsername;
}

// Render the chat messages in the chat window
function renderChat(elements) {
    if (currentChat) {
        elements.chatMessages.innerHTML = currentChat.messages.map(message => `
            <div class="message ${message.sender}">
                ${message.text}
            </div>
        `).join('');
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
}

// Start a new chat with a specific friend
async function startNewChat(friendUsername, elements) {
    await openChat(friendUsername, elements);
}

// Update the notification indicator based on unread messages
function updateNotificationIndicator(indicator) {
    console.log("Updating notification indicator...");
    console.log("Chats object:", chats);
    const hasUnreadMessages = Object.values(chats).some(chat => !chat.read);
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
        chatSocket.send(JSON.stringify({ message: messageText }));
        currentChat.messages.push({
            id: currentChat.messages.length + 1,
            text: messageText,
            sender: "out",
            read: true
        });
        chats[currentChat.username] = {
            lastMessage: messageText,
            //lastUpdated: Date.now(),
            read: true
        };
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