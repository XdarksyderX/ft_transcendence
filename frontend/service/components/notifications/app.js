import { getNotifications, markNotification } from "../../app/notifications.js";
import { refreshAccessToken } from "../../app/auth.js";

let notiSocket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // Máximo 30s de espera entre reconexiones
let attemptedReconnection = false;  // Para evitar bucles infinitos de refresh

export function initializeNotificationEvents() {
    initializeNotificationsSocket();
    document.getElementById("notifications-toggle").addEventListener('click', renderNotifications);
}

function initializeNotificationsSocket() {
    if (notiSocket && notiSocket.readyState !== WebSocket.CLOSED) {
        console.log("[WebSocket] Already connected or connecting...");
        return;
    }

    notiSocket = new WebSocket(`ws://localhost:5054/ws/events/`);

    notiSocket.onopen = () => {
        console.log("[WebSocket] Notifications connected");
        reconnectAttempts = 0; // Reset reconnection attempts
        attemptedReconnection = false; // Reset after successful connection
        startKeepAlive();
    };

    notiSocket.onmessage = (event) => {
        handleReceivedNotification(event);
    };

    notiSocket.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
    };

    notiSocket.onclose = async (event) => {
        console.warn(`[WebSocket] Disconnected (code ${event.code}), attempting to reconnect...`);

        // Intentar refresh si es un cierre rápido (asumiendo que podría ser por auth)
        if (!attemptedReconnection) {
            attemptedReconnection = true;
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                console.log("[WebSocket] Token refreshed, retrying notifications WebSocket connection...");
                setTimeout(initializeNotificationsSocket, 1000);  // Reintenta tras 1 segundo si refresh tuvo éxito
                return;
            } else {
                console.warn("[WebSocket] Token refresh failed, continuing with regular reconnect strategy...");
            }
        }

        scheduleReconnect();
    };
}

function scheduleReconnect() {
    const delay = Math.min(1000 * (2 ** reconnectAttempts), MAX_RECONNECT_DELAY);
    console.log(`[WebSocket] Reconnecting in ${delay / 1000} seconds...`);
    setTimeout(initializeNotificationsSocket, delay);
    reconnectAttempts++;
}

function startKeepAlive() {
    setInterval(() => {
        if (notiSocket.readyState === WebSocket.OPEN) {
            notiSocket.send(JSON.stringify({ type: "ping" }));
            console.log("[WebSocket] Sent keepalive ping");
        }
    }, 30000);
}

function handleReceivedNotification(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("[WebSocket] Notification received:", data);
        renderNotifications();
    } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
    }
}

export async function renderNotifications() {
    console.log("[UI] Rendering notifications...");
    const notifications = await handleGetNotifications();
    const container = document.getElementById('notifications-container');
    const bell = document.getElementById('bell');

    container.innerHTML = '';
    if (notifications.length === 0) {
        container.innerText = "You don't have any notifications";
    } else {
        bell.style.color = 'var(--accent)';
    }

    notifications.forEach(notifi => {
        const content = JSON.parse(notifi.content);
        const card = document.createElement('li');
        card.className = "notification-card";
        card.innerText = content.event_type;
        card.addEventListener('click', (event) => handleMarkNotification(event, notifi.id, card));
        container.appendChild(card);
    });
}

async function handleGetNotifications() {
    try {
        const response = await getNotifications();
        if (response.status === 'success') {
            return response.notifications;
        }
    } catch (error) {
        console.error('[API] Error fetching notifications:', error);
    }
    return [];
}

async function handleMarkNotification(event, notificationId, card) {
    event.preventDefault();
    try {
        const response = await markNotification(notificationId);
        if (response.status === 'success') {
            card.remove();
        }
    } catch (error) {
        console.error('[API] Error marking notification as read:', error);
    }
}
