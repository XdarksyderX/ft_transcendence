import { getNotifications, markNotification } from "../../app/notifications.js";
import { getUserId } from "../../app/auth.js";
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
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // Máximo 30s de espera entre reconexiones

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
        startKeepAlive(); // Inicia el keepalive pings
    };

    notiSocket.onmessage = (event) => {
        handleReceivedNotification(event);
    };

    notiSocket.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
    };

    notiSocket.onclose = () => {
        console.warn("[WebSocket] Disconnected, attempting to reconnect...");
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
    }, 30000); // Every 30 seconds
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
function getNotificationText(content) {
    const data = JSON.parse(content);
    const type = data.event_type;

    switch (type) {
        case 'request_sent':
            return 'You have a new friend request'
        case 'friend_added':
            return 'One of your friend request has been approved, go check ;)'
        case 'friend_removed':
            return (null);
        default:
            return type;
    }
}

function filterNotifications(all) {
    const userId = getUserId();
    console.log("USER ID: ", userId);
    return all
        .filter(notifi => {
            const { user_id } = JSON.parse(notifi.content);
            return user_id != userId;
        })
        .map(notifi => {
            let displayText = getNotificationText(notifi.content);
            return {
                ...notifi,
                displayText
            };
        })
        .filter(notifi => notifi.displayText !== null);
}

export async function renderNotifications() {
    const allNotifications = await handleGetNotifications();
    const notifications = filterNotifications(allNotifications);
    const container = document.getElementById('notifications-container');
    const bell = document.getElementById('bell');
    container.innerHTML = '';
    if (notifications.length === 0) {
        container.innerText = "You don't have any notifications";
    } else {
        bell.style.color = 'var(--accent)';
    }
    notifications.forEach(notifi => {
        const card = document.createElement('li');
        card.className = "notification-card";
        card.innerText = notifi.displayText;
        card.addEventListener('click', (event) => handleMarkNotification(event, notifi.id, card));
        container.appendChild(card);
    });
}

// API Request: Get pending notifications
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

// API Request: Mark a notification as read
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
