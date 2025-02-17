import { getFriendsList, getMessages, markAsReadMessage } from '../../app/social.js';
import { getUsername } from '../../app/auth.js';

export async function initializeChatEvents() {
    const chatContainer = document.getElementById('chat-container');
    const chatHeader = document.getElementById('chat-header');
    const chatBody = document.getElementById('chat-body');
    const recentChatsTab = document.getElementById('recent-chats');
    const newChatTab = document.getElementById('new-chat');
    const chatTab = document.getElementById('chat-window');
    const newChatBtn = document.getElementById('new-chat-btn');
    const toggleIcon = document.getElementById('toggle-icon');
    const friendList = document.getElementById('friends-list');
    const recentChatsList = document.getElementById('recent-chats-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const currentChatName = document.getElementById('current-chat-name');
    const notificationIndicator = document.getElementById('notification-indicator');

    let isExpanded = false;
    let currentView = 'recent-chats';

    let chatSocket = null;
    let currentChat = {
        username: null,
        name: "",
        messages: []
    };

    const response = await getFriendsList();
    const friends = response["friends"] || [];
    console.log("Friends list:", friends);

    chatHeader.addEventListener('click', async () => {
        await toggleChat();
    });
    async function toggleChat() {
        isExpanded = !isExpanded;
        chatBody.style.display = isExpanded ? 'block' : 'none';
        toggleIcon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        if (isExpanded && currentView === 'recent-chats') {
            await showRecentChats();
        }
        await updateNotificationIndicator();
    }
    async function showRecentChats() {
        currentView = 'recent-chats';
        newChatTab.style.display = 'none';
        chatTab.style.display = 'none';
        recentChatsTab.style.display = 'flex';
        await renderRecentChats();
    }
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
    async function renderRecentChats() {
        let html = '';
        for (let friend of friends) {
            const lastMessage = await fetchLastMessageForUser(friend.username);
            const messageText = lastMessage ? lastMessage.content : "No messages yet";
            html += `
                <a href="#" class="list-group-item list-group-item-action chat-item" 
                   data-friend-username="${friend.username}" data-friend-name="${friend.username}">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${friend.username}</h5>
                        <small class="text-muted">Last message time</small>
                    </div>
                    <p class="mb-1">${messageText}</p>
                </a>
            `;
        }
        recentChatsList.innerHTML = html;
        await updateNotificationIndicator();
    }
    newChatBtn.addEventListener('click', async () => {
        await showFriendList();
    });
    async function showFriendList() {
        currentView = 'friend-list';
        recentChatsTab.style.display = 'none';
        newChatTab.style.display = 'flex';
        await renderFriendList();
    }
    async function renderFriendList() {
        friendList.innerHTML = friends.map(friend => `
            <a href="#" class="list-group-item list-group-item-action friend-item" 
               data-friend-username="${friend.username}" data-friend-name="${friend.username}">
                <h6 class="mb-1">${friend.username}</h6>
            </a>
        `).join('');
    }
    async function openChat(friendUsername, friendName) {
        console.log("Opening chat with:", friendUsername, friendName);
        currentChat = { username: friendUsername, name: friendName, messages: [] };
        if (chatSocket) {
            chatSocket.close();
        }
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
        try {
            const markResponse = await markAsReadMessage(friendUsername);
            if (markResponse.status !== "success") {
                console.error("Error marking messages as read:", markResponse.message);
            }
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
        chatSocket = new WebSocket(`ws://localhost:5051/ws/chat/${friendUsername}/`);
        chatSocket.onopen = () => {
            console.log("WebSocket connected for", friendUsername);
        };
        chatSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WS message received:", data);
                const currentUser = getUsername();
                if (data.status === "success" && data.data && data.data.message) {
                    if (data.data.sender === currentUser) return;
                    currentChat.messages.push({
                        id: currentChat.messages.length + 1,
                        text: data.data.message,
                        sender: "in",
                        read: true
                    });
                    renderChat();
                } else {
                    console.error("WS error:", data.message);
                }
            } catch (e) {
                console.error("Error parsing WS message:", e);
            }
        };
        chatSocket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
        chatSocket.onclose = () => {
            console.log("WebSocket closed");
        };
        currentView = 'chat';
        recentChatsTab.style.display = 'none';
        newChatTab.style.display = 'none';
        chatTab.style.display = 'flex';
        currentChatName.textContent = friendName;
        renderChat();
    }
    function renderChat() {
        if (currentChat) {
            chatMessages.innerHTML = currentChat.messages.map(message => `
                <div class="message ${message.sender}">
                    ${message.text}
                </div>
            `).join('');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    async function startNewChat(friendUsername, friendName) {
        await openChat(friendUsername, friendName);
    }
    async function updateNotificationIndicator() {
        notificationIndicator.style.display = 'none';
    }
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({ message: messageText }));
            currentChat.messages.push({
                id: currentChat.messages.length + 1,
                text: messageText,
                sender: "out",
                read: true
            });
            renderChat();
            messageInput.value = '';
        }
    });
    friendList.addEventListener('click', async (event) => {
        event.preventDefault();
        const friendLink = event.target.closest('.friend-item');
        if (friendLink) {
            const friendUsername = friendLink.getAttribute('data-friend-username');
            const friendName = friendLink.getAttribute('data-friend-name');
            await startNewChat(friendUsername, friendName);
        }
    });
    recentChatsList.addEventListener('click', async (event) => {
        event.preventDefault();
        const chatItem = event.target.closest('.chat-item');
        if (chatItem) {
            const friendUsername = chatItem.getAttribute('data-friend-username');
            const friendName = chatItem.getAttribute('data-friend-name');
            await openChat(friendUsername, friendName);
        }
    });
    document.querySelectorAll('.back-to-recents').forEach(button => {
        button.addEventListener('click', async () => {
            if (chatSocket) {
                chatSocket.close();
                chatSocket = null;
            }
            await showRecentChats();
        });
    });
    await showRecentChats();
}
