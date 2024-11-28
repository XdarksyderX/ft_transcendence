async function loadChat() {
    const chatContainer = document.getElementById('chat-inport');

    try {
        const response = await fetch('./chat.html');
        if (!response.ok) throw new Error('Error al cargar el chat');

        const chatHTML = await response.text();
        chatContainer.innerHTML = chatHTML;

        // Puedes inicializar scripts o eventos adicionales después de cargar el chat
        initializeChatEvents();
    } catch (error) {
        console.error('Error al cargar el chat:', error);
    }
}

/* function initializeChatEvents() {
    // Agrega eventos al chat dinámico, como clicks en botones, etc.
    const toggleIcon = document.getElementById('toggle-icon');
    const chatBody = document.getElementById('chat-body');

    if (toggleIcon && chatBody) {
        toggleIcon.addEventListener('click', () => {
            const isVisible = chatBody.style.display !== 'none';
            chatBody.style.display = isVisible ? 'none' : 'block';
            toggleIcon.classList.toggle('fa-chevron-down', !isVisible);
            toggleIcon.classList.toggle('fa-chevron-up', isVisible);
        });
    }
}
 */
// Llama a la función para cargar el chat cuando sea necesario
loadChat();
