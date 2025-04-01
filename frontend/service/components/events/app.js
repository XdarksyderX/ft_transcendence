import { getNotifications, markNotification } from "../../app/notifications.js";
import { initializeNotificationsSocket } from "./socket.js";
import { getUsername } from "../../app/auth.js";

import { notiSocket } from "./socket.js";

const bell = document.getElementById('bell');

export function initializeNotificationEvents() {
    if (notiSocket && notiSocket.readyState === WebSocket.OPEN) return ;
    initializeNotificationsSocket();
    updateNotificationBell();
    document.getElementById("notifications-toggle").addEventListener('click', renderNotifications);
}

export async function renderNotifications() {
    const allNotifications = await handleGetNotifications();
    const notifications = filterNotifications(allNotifications).reverse();
    const container = document.getElementById('notifications-container');
    console.log(allNotifications);
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

async function hasPendingNotifications() {
    const all = await handleGetNotifications();
    const notifications = filterNotifications(all);
    notifications.reverse();
    if (notifications.length === 0) {
        return ("off");
    }
    return ("on");
}

export async function updateNotificationBell(turn = null) {
    const loggedContent = document.getElementById('logged-content');
    if (loggedContent.classList.contains('hidden')) {
        return ;
    }
    if (!turn) {
        turn = await hasPendingNotifications();
    }
    const color = turn === "on" ? 'var(--accent)' : 'var(--light)';
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
        case 'pong_tournament_closed':
            return `The ${notiContent.tournament} tournament is ready to start!`;
        case 'pong_tournament_match_waiting':
            const opponent = notiContent.opponent.alias || notiContent.opponent.username;
            // return `Your tournament oponent, ${notiContent.opponent} is waiting for you`
            return `Your opponent ${opponent}, is waiting for you on ${notiContent.tournament} tournament`
        case 'pong_tournament_round_finished':
            return `You have a new round available on ${notiContent.tournament} tournament`
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
                updateNotificationBell("off");
                dropdown.hide();
            }
        }
    } catch (error) {
        console.error('[API] Error marking notification as read:', error);
    }
}