function initializeChatEvents() {
    /* each big container */
    const chatContainer = document.getElementById('chat-container');
    const chatHeader = document.getElementById('chat-header');
    const chatBody = document.getElementById('chat-body');

    /* the three available tabs on our chat */
    const recentChatsTab = document.getElementById('recent-chats');
    const newChatTab = document.getElementById('new-chat');
    const chatTab = document.getElementById('chat-window');

    /* buttons and icons */
    const newChatBtn = document.getElementById('new-chat-btn');
    const toggleIcon = document.getElementById('toggle-icon');

    /* lists and chat elements */
    const friendList = document.getElementById('friends-list');
    const recentChatsList = document.getElementById('recent-chats-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const currentChatName = document.getElementById('current-chat-name');
    const notificationIndicator = document.getElementById('notification-indicator');

    /* state variables */
    let isExpanded = false;
    let currentChat = null;
    let currentView = 'recent-chats';

    /* provisional data */
    const friends = [
        { id: 6, name: "albagar4" },
        { id: 7, name: "jariza-o" },
        { id: 8, name: "marirodr" },
        { id: 9, name: "erivero-" },
    ];

    let chats = [
        { id: 1, name: "Alice", messages: [
            { id: 1, text: "Hey there!", sender: "in", read: true },
            { id: 2, text: "Hi Alice! How are you?", sender: "out", read: true },
            { id: 3, text: "I'm good, thanks!", sender: "in", read: false },
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

    /* function to toggle chat visibility so it is collapsible */
    chatHeader.addEventListener('click', toggleChat);
    function toggleChat() {
        isExpanded = !isExpanded; // inverts the current state
        chatBody.style.display = isExpanded ? 'block' : 'none';
        toggleIcon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        if (isExpanded && !currentChat) {
            showRecentChats();
        }
        updateNotificationIndicator();
    }

    function showRecentChats() {
        currentView = 'recent-chats';
        newChatTab.style.display = 'none';
        chatTab.style.display = 'none';
        recentChatsTab.style.display = 'flex';
        renderRecentChats();
    }

    function renderRecentChats() {
        // sets the innerHTML of the recentChatsList to the chats array
        recentChatsList.innerHTML = chats.map(chat => { // with API, it will be a fetch I guess
            const lastMessage = chat.messages[chat.messages.length - 1]; // gets the last message
            const unreadClass = !lastMessage.read && lastMessage.sender === 'in' ? 'unread' : ''; //sets the unread status 
            // returns the chat item with the name, last message and unread status on html format
            return ` 
                <a href="#" class="list-group-item list-group-item-action chat-item" data-chat-id="${chat.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${chat.name}</h5>
                        <small class="text-muted">3 days ago</small>
                    </div>
                    <p class="mb-1 ${unreadClass}">${lastMessage ? lastMessage.text : 'No messages yet'}</p>
                </a>
            `;
        }).join(''); // joins the array of HTML strings into a single string
        updateNotificationIndicator();
    }

    newChatBtn.addEventListener('click', showFriendList);

    function showFriendList() {
        currentView = 'friend-list';
        recentChatsTab.style.display = 'none';
        newChatTab.style.display = 'flex';
        renderFriendList();
    }

    function renderFriendList() {
        friendList.innerHTML = friends.map(friend => `
            <a href="#" class="list-group-item list-group-item-action" data-friend-id="${friend.id}">
                <h6 class="mb-1">${friend.name}</h6>
            </a>
        `).join('');
    }

    function openChat(chatId) {
        currentChat = chats.find(chat => chat.id === chatId);
        if (currentChat) {
            currentView = 'chat';
            recentChatsTab.style.display = 'none';
            newChatTab.style.display = 'none';
            chatTab.style.display = 'flex';
            currentChatName.textContent = currentChat.name;
            renderChat();
            currentChat.messages.forEach(message => message.read = true);
            updateNotificationIndicator();
        } 
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

    function startNewChat(friendName) {
        let chat = chats.find(chat => chat.name === friendName);
        if (!chat) {
            chat = { id: chats.length + 1, name: friendName, messages: [] };
            chats.push(chat);
        }
        currentChat = chat;
        openChat(chat.id);
    }

    function updateNotificationIndicator() {
        const hasUnreadMessages = chats.some(chat => 
            chat.messages.some(message => !message.read && message.sender === 'in')
        );
        notificationIndicator.style.display = hasUnreadMessages && !isExpanded ? 'block' : 'none';
    }

    function addMessage(text, sender) {
        if (currentChat) {
            const message = { id: currentChat.messages.length + 1, text, sender, read: true };
            currentChat.messages.push(message);
            renderChat();
        }
    }

    document.querySelectorAll('.back-to-recents').forEach(button => {
        button.addEventListener('click', showRecentChats);
    });

    friendList.addEventListener('click', event => {
        event.preventDefault();
        const friendLink = event.target.closest('.list-group-item');
        if (friendLink) {
            const friendName = friendLink.querySelector('h6').textContent;
            startNewChat(friendName);
        }
    });

    recentChatsTab.addEventListener('click', event => {
        event.preventDefault();
        const chatItem = event.target.closest('.chat-item');
        if (chatItem) {
            openChat(parseInt(chatItem.dataset.chatId));
        }
    });

    chatForm.addEventListener('submit', event => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText) {
            addMessage(messageText, 'out');
            messageInput.value = '';
        }
    });

    updateNotificationIndicator();
}

