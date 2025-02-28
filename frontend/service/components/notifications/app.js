import { getNotifications, markNotification } from "../../app/notifications.js";
import { initializeNotificationsSocket } from "./socket.js";
import { getUsername } from "../../app/auth.js";

export function initializeNotificationEvents() {
    initializeNotificationsSocket();
    document.getElementById("notifications-toggle").addEventListener('click', renderNotifications);
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

function filterNotifications(all) {
    const username = getUsername();
    return all
        .filter(notifi => { // filters notifications you generated
            const { user } = JSON.parse(notifi.content);
            return user != username;
        })
        .map(notifi => { // creates a map with the display text of each one
            let displayText = getNotificationText(notifi.content);
            return {
                ...notifi,
                displayText
            };
        }) // filters notifications without display text
        .filter(notifi => notifi.displayText !== null);
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