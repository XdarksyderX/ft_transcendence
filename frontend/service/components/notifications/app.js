import { getNotifications, markNotification, hasPendingNotification } from "../../app/notifications.js";
import { initializeNotificationsSocket } from "./socket.js";
import { getUsername } from "../../app/auth.js";

const bell = document.getElementById('bell');
export function initializeNotificationEvents() {
    initializeNotificationsSocket();
    document.getElementById("notifications-toggle").addEventListener('click', renderNotifications);
}

export async function renderNotifications() {
    const allNotifications = await handleGetNotifications();
    const notifications = filterNotifications(allNotifications);
    const container = document.getElementById('notifications-container');

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

export async function updateNotificationBell(on = null) {
    const loggedContent = document.getElementById('logged-content');
    if (loggedContent.classList.contains('hidden')) {
        return ;
    }
    if (!on) {
        const response = await hasPendingNotification();
        if (response.status === "success") {
            on = response.has_pending_notifications;
        }
    }
    const color = on ? 'var(--accent)' : 'var(--light)';
    bell.style.color = color;
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

function filterNotifications(all) {
    const username = getUsername();
    return all
        .filter(notifi => { // filters notifications you generated
            const { user } = JSON.parse(notifi.content);
            return user != username;
        })
        .map(notifi => { // creates a map with the display text of each one
            let displayText = getNotificationText(JSON.parse(notifi.content));
            return {
                ...notifi,
                displayText
            };
        }) // filters notifications without display text
        .filter(notifi => notifi.displayText !== null);
}

export function getNotificationText(notiContent) {
    const { event_type, user} = notiContent;

    switch (event_type) {
        case 'request_sent':
            return 'You have a new friend request';
        case 'friend_added':
            return `${user} has accepted your friend request c:`;
        case 'tournament_start':
            return 'A tournament you signed in is ready to start!';
        default: // 'friend_removed' 'request_declined' 'request_cancelled'  'avatar_changed' shouldnt generate notification
            return null;
    }
}

// API Request: Mark a notification as read
async function handleMarkNotification(event, notificationId, card) {
    event.preventDefault();
    event.stopPropagation();
    try {
        const response = await markNotification(notificationId);
        if (response.status === 'success') {
            card.remove();
            const container = document.getElementById('notifications-container');
            if (container.children.length === 0) {
                const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('notifications-toggle'));
                dropdown.hide();
            }
        }
    } catch (error) {
        console.error('[API] Error marking notification as read:', error);
    }
}