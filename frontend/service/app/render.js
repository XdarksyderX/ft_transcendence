import { initializeSidebarEvents } from "../components/sidebar/app.js";
import { initializeChatEvents } from "../components/chat/app.js";
import { initializeNeonChat } from "./neon.js";

async function loadChat() {
    const chatContainer = document.getElementById('chat-container');

    if (chatContainer.innerHTML != '') {
      console.log("chat already loaded");
      return ;
    }

    try {
        const response = await fetch('/components/chat/chat.html'); // Ensure the path is correct
        if (!response.ok) throw new Error('Error while loading chat');

        const chatHTML = await response.text();
        chatContainer.innerHTML = chatHTML;

        initializeChatEvents();
        initializeNeonChat();
        chatContainer.style.display = 'block';
    } catch (error) {
        console.error('Error while loading chat: ', error);
    }
}

async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebarToggle = document.getElementById('sidebar-toggle-container');

    if (sidebarContainer.innerHTML != '') {
      console.log("sidebar already loaded");
      return ;
    }

    try {
        const response = await fetch('./components/sidebar/sidebar.html'); // Ensure the path is correct
        if (!response.ok) throw new Error('Error while loading sidebar');

        const sidebarHTML = await response.text();
        sidebarContainer.innerHTML = sidebarHTML;

        initializeSidebarEvents();
        sidebarContainer.style.display = 'block';
        sidebarToggle.style.display = 'block';
    } catch (error) {
        console.error('Error while loading sidebar: ', error);
    }
}

function throwAlert(text) {
    // Eliminar cualquier modal previo
    const prevModal = document.getElementById('alert-modal');
    if (prevModal) {
        prevModal.remove();
    }

    // Crear el HTML del modal
    const alert = `
    <div class="modal fade" id="alert-modal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <svg xmlns="http://www.w3.org/2000/svg" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:" style="height: 20px">
                <path fill="var(--title)" d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            <h5 class="modal-title ctm-text-title">Alert</h5>
            <button type="button" class="close-modal" data-bs-dismiss="modal" aria-label="Close">x</button>
          </div>
          <div class="modal-body">
            ${text}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn ctm-btn" data-bs-dismiss="modal">okiDoki</button>
          </div>
        </div>
      </div>
    </div>
    `;

    // Insertar el modal en el cuerpo del documento
    document.body.insertAdjacentHTML("beforeend", alert);

    // Inicializar el modal y mostrarlo
    const modal = new bootstrap.Modal(document.getElementById('alert-modal'));
    modal.show();
}

export { loadChat, loadSidebar, throwAlert }