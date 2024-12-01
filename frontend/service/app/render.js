async function loadChat() {
    const chatContainer = document.getElementById('chat-container');

    try {
        const response = await fetch('./chat.html');
        if (!response.ok) throw new Error('Error al cargar el chat');

        const chatHTML = await response.text();
        chatContainer.innerHTML = chatHTML;

        // Puedes inicializar scripts o eventos adicionales después de cargar el chat
        initializeChatEvents();
        initializeNeonChat();
    } catch (error) {
        console.error('Error al cargar el chat:', error);
    }
}

loadChat();
