async function loadChat() {
    const chatContainer = document.getElementById('chat-container');

    try {
        const response = await fetch('./components/chat/chat.html');
        if (!response.ok) throw new Error('Error while loading chat');

        const chatHTML = await response.text();
        chatContainer.innerHTML = chatHTML;

        initializeChatEvents();
        initializeNeonChat();
    } catch (error) {
        console.error('Error while loading chat: ', error);
    }
}

loadChat();

async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');

    try {
        const response = await fetch('./components/sidebar/sidebar.html');
        if (!response.ok) throw new Error('Error while loading sidebar');

        const sidebarHTML = await response.text();
        sidebarContainer.innerHTML = sidebarHTML;

        initializeSidebarEvents();
    }
    catch (error) {
        console.error('Error while loading sidebar: ', error);
    }
}

loadSidebar();