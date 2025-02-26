import { getNotifications, markNotification } from "../../app/notifications.js";

/* 
urlpatterns = [
    path('notifications/', PendingNotificationsView.as_view(), name='pending-notifications'),
    path('notifications/mark/', MarkNotification.as_view(), name='mark-notification')
]
websocket_urlpatterns = [
    path('ws/events/', NotificationConsumer.as_asgi())
]
*/

let notiSocket = null;

export function initializeNotificationEvents() {
    initializeNotificationsSocket();
    document.getElementById("notifications-toggle").addEventListener('click', renderNotifications);
}

function initializeNotificationsSocket() {
    if (notiSocket) {
        notiSocket.close(); // Cierra el socket antes de iniciar uno nuevo
    }

    notiSocket = new WebSocket(`ws://localhost:5054/ws/events/`);

    notiSocket.onopen = () => {
        console.log("Notifications WebSocket connected");
    };

    notiSocket.onmessage = (event) => {
        console.log(event);
        handleReceivedNotification(event);
    };

    notiSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    notiSocket.onclose = () => {
        console.log("WebSocket cerrado, intentando reconectar...");
        setTimeout(initializeNotificationsSocket, 5000); // Siempre reintenta conectar
    };
}

function handleReceivedNotification(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("Notification received: ", data);
        renderNotifications(); // Refresca la UI automáticamente
    } catch (error) {
        console.error("Error parsing WS message:", error);
    }
}

export async function renderNotifications() {
    console.log("renderNotifications function called");
    const notifications = await handleGetNotifications();
    const container = document.getElementById('notifications-container');
    const bell = document.getElementById('bell');

    console.log("Hello " + notifications);
    container.innerHTML = '';
    if (notifications.length === 0) {
        container.innerText = 'You don\'t have any notifications';
    } else {
        bell.style.color = 'var(--accent)';
    }

    notifications.forEach(notifi => {
        const content = JSON.parse(notifi.content);
        const card = document.createElement('li');
        card.className = "notification-card";
        card.innerText = content.event_type; // Muestra el mensaje correcto
        card.addEventListener('click', (event) => handleMarkNotification(event, notifi.id, card));
        container.appendChild(card);
    });
}

// Simulación de notificaciones para pruebas
async function hardGetNotifications() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, content: '{"event_type": "Friend request accepted!"}' },
                { id: 2, content: '{"event_type": "Tournament started!"}' },
                { id: 3, content: '{"event_type": "New match invitation!"}' }
            ]);
        }, 100);
    });
}

// Obtiene las notificaciones pendientes desde la API
async function handleGetNotifications() {
    try {
        const response = await getNotifications();
        console.log(response);
        if (response.status === 'success') {
            return response.notifications;
        }
    } catch (error) {
        console.error('Error fetching pending notifications:', error);
    }
    return []; // Si hay un error, devuelve un array vacío
}

// Marca una notificación como leída y la elimina del HTML
async function handleMarkNotification(event, notificationId, card) {
    event.preventDefault();
    try {
        const response = await markNotification(notificationId);
        if (response.status === 'success') {
            card.remove();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}
