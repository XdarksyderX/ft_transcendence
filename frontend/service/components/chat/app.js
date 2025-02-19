import { getMessages, markAsReadMessage } from '../../app/social.js';
import { getUsername } from '../../app/auth.js';
import { handleGetFriendList } from '../friends/app.js';
import { renderChat, renderRecentChats, renderFriendList } from './render.js';

let isExpanded = false;
let currentView = 'recent-chats';
let chatSocket = null;

let currentChat = {
    username: null,
    messages: []
};

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


// Open a chat with a specific friend
async function openChat(friendUsername, elements) {
    console.log("Opening chat with:", friendUsername);
    currentChat = { username: friendUsername, messages: [] };
    // if (chatSocket) {
    //     chatSocket.close();
    // }
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


// Handle received WebSocket messages
function handleReceivedMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("WS message received:", data);
        const currentUser = getUsername();
        if (data.status === "success" && data.data && data.data.message) {
            if (data.data.sender === currentUser) return;

            // Check if the message is a game invitation
            //if (data.data.type === 'game-invitation') {
            if (data.data.is_special) {
                // Untoggle the chat window
                const elements = getElements();
                if (!isExpanded) {
                    toggleChat(elements);
                    openChat(data.data.sender, getElements());
                }
            }
            // Update currentChat if the message is for the currently open chat
            //if (currentChat.username === data.data.sender && currentView === 'chat') {
                currentChat.messages.push({
                    id: currentChat.messages.length + 1,
                    message: data.data.message,
                    sender: data.data.sender,
                    receiver: currentUser,
                    sent_at: data.data.sent_at,
                    is_special: data.data.is_special,
                    is_read: data.data.is_read
                });
           // }

            // Update the view if the current view is the chat with the sender or the recent-chats tab
            if (currentView === 'chat' ) { /* && currentChat.username === data.data.sender */
                renderChat(getElements());
            } else if (currentView === 'recent-chats') {
                renderRecentChats(getElements());
            } else if (!isExpanded) {
                updateNotificationIndicator(document.getElementById('notification-indicator'));
            }
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

// // Send a game invitation to a friend
// export async function sendGameInvitation(friend, game) {
//     console.log("Sending game invitation to", friend, "for game", game);
//     try {
//         await initializeChatSocket(friend);
//         const messageData = {
//             type: 'game-invitation',
//             sender: getUsername(),
//             message: `${getUsername()} has invited you to play ${game}!`,
//             is_special: true,
//             sent_at: new Date().toISOString(),
//             is_read: false
//         };
//         console.log("Sending game invitation message:", messageData);
//         chatSocket.send(JSON.stringify(messageData));
//     } catch (error) {
//         console.error("Failed to send game invitation:", error);
//     }
// }

export {currentChat}