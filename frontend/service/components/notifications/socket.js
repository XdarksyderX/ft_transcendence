import { getUsername } from "../../app/auth.js";
import { refreshFriendsFriendlist, refreshFriendData } from "../friends/app.js";

let notiSocket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // Máximo 30s de espera entre reconexiones

const notificationHandlers = {
    // Friends changes
    friend_added: (data) => handleFriendChanges('friend_added',),
    friend_removed: (data) => handleFriendChanges('friend_removed', data),
    avatar_changed: (data) => handleFriendChanges('avatar_changed', data),
	status_changed: (data) => handleFriendChanges('avatar_changed', data),
    deleted_account: (data) => handleFriendChanges('deleted_account', data),

    // Friend requests
    request_sent: () => console.log("[WebSocket] Friend request sent"), // handleFriendRequestChanges(),
    request_declined: () => console.log("[WebSocket] Friend request declined"),
    request_cancelled: () => console.log("[WebSocket] Friend request cancelled"),

    // Pong Match Events
    match_invitation: () => console.log("[WebSocket] You have a match invitation"),
    tournament_invitation: () => console.log("[WebSocket] You have a tournament invitation"),
    tournament_start: () => console.log("[WebSocket] Tournament started"),
    tournament_end: () => console.log("[WebSocket] Tournament ended"),
    pong_match_accepted: () => window.location.href = "/pong",
    chess_match_accepted: () => window.location.href = "/chess"
};


export function initializeNotificationsSocket() {
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

function handleFriendChanges(type, data) {
    const path = window.location.pathname;
    if (path === '/friends') {
    	const erase = type === 'friend_removed' || type === 'deleted_account';
        refreshFriendsFriendlist(data.other, erase); // aquí debo mandar el username del amigo
		if (!erase) {
			refreshFriendData(data.other);
		}
    }
    else if (type !== 'avatar_changed') { // we only see avatars on /friends
        refreshChatFriendlist(data.other); // chat refreshes in all paths
        if (path === '/new-tournament') {
            //refreshTournamentFriendList();
        }
    } else {
		//refreshFriendsDataAvatar();
	}
}

function handleReceivedNotification(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("[WebSocket] Notification received:", data);
        
        const type = data.content.event_type;
        const handler = notificationHandlers[type];

        if (handler) {
            handler(data.content);
        } else {
            console.warn("[WebSocket] Unhandled notification type:", type);
        }
    } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
    }
}