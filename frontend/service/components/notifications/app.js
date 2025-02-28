import { getNotifications, markNotification } from "../../app/notifications.js";
import { initializeNotificationsSocket } from "./notificationsSocket.js";

export function initializeNotificationEvents() {
    initializeNotificationsSocket();
    document.getElementById("notifications-toggle").addEventListener('click', renderNotifications);
}

function getNotificationText(content) {
    const data = JSON.parse(content);
    const type = data.event_type;

    switch (type) {
        case 'request_sent':
            return 'You have a new friend request';
        case 'friend_added':
            return 'One of your friend requests has been approved, go check ;)';
        case 'tournament_started':
            return 'esto no existe todavía';
        default: // 'friend_removed' 'request_declined' 'request_cancelled'  'avatar_changed' shouldnt generate notification
            return null;
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