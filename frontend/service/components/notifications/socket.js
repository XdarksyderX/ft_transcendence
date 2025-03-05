import { getUsername } from "../../app/auth.js";
import { throwToast } from "../../app/render.js";
import { refreshFriendsFriendlist, refreshFriendData } from "../friends/app.js";
import { refreshTournamentFriendList } from "../tournament/new.js";
import { refreshChatFriendList, updateNotificationIndicator } from "../chat/app.js";
import { renderPendingFriendRequests, refreshIfDeclined } from "../friends/requests.js";
import { navigateTo } from "../../app/router.js";
import { getNotificationText, updateNotificationBell } from "./app.js";
import { handleAcceptedInvitation, handleDeclinedInvitation } from "../home/game-invitation.js";
import { handleCancelledInvitation } from "../chat/bubbles.js";
import { state } from "../chat/socket.js";

let notiSocket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // Máximo 30s de espera entre reconexiones

const notificationHandlers = {
    // Friends changes
    friend_added: (data) => handleFriendChanges('friend_added', data, 1),
    friend_removed: (data) => handleFriendChanges('friend_removed', data, -1),
    avatar_changed: (data) => handleFriendChanges('avatar_changed', data),
	friend_status_updated: (data) => handleFriendChanges('avatar_changed', data),
    deleted_account: (data) => handleFriendChanges('deleted_account', data, -1),

    // Friend requests
    request_sent: () => handleFriendRequestChanges('request_sent'),
    request_declined: (data) => handleFriendRequestChanges('request_declined', data),
    request_cancelled: () => handleFriendRequestChanges('request_cancelled'),

    // Pong Match Events
    match_invitation: () => console.log("[WebSocket] You have a match invitation"),
    tournament_invitation: () => console.log("[WebSocket] You have a tournament invitation"),
    tournament_start: () => console.log("[WebSocket] Tournament started"),
    tournament_end: () => console.log("[WebSocket] Tournament ended"),
    pong_match_accepted: () => handleAcceptedInvitation('pong'),
    pong_match_decline: () => handleDeclinedInvitation(),
    pong_match_cancelled: (data) => handleCancelledInvitation(data.invitation_token),
    chess_match_accepted: () => handleAcceptedInvitation('chess'),
    chess_match_decline: () => handleDeclinedInvitation(),
    chess_match_cancelled: (data) => handleCancelledInvitation(data.invitation_token),
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
        if (state.intentionalClose) return ;
        console.warn("[WebSocket] Disconnected, attempting to reconnect...");
        scheduleReconnect();
    };
}

function scheduleReconnect() {
    const delay = Math.min(1000 * (2 ** reconnectAttempts), MAX_RECONNECT_DELAY);
    console.log(`[NotiSocket] Reconnecting in ${delay / 1000} seconds...`);
    setTimeout(initializeNotificationsSocket, delay);
    reconnectAttempts++;
}

function startKeepAlive() {
    setInterval(() => {
        if (notiSocket.readyState === WebSocket.OPEN) {
            notiSocket.send(JSON.stringify({ event_type: "ping" }));
            console.log("[WebSocket] Sent keepalive ping");
        }
    }, 30000); // Every 30 seconds
}

function handleReceivedNotification(event) {
	console.log("[WebSocket] Notification received:", event.data);
    try {
        const data = JSON.parse(event.data);
		const type = data.event_type;
		if (data.user === getUsername() || type == 'ping') {
			return ;
		}
		const handler = notificationHandlers[type];
        if (handler) {
            console.log("handler :D");
            handler(data);
        } else {
            console.warn("[WebSocket] Unhandled notification type:", type);
        }
        const text = getNotificationText(data);
        if (text) {
            throwToast(text);
            updateNotificationBell("on");
        }

    } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
    }
}

function handleFriendChanges(type, data, add = 0) {
    const path = window.location.pathname;
    if (path === '/friends') {
        refreshFriendsFriendlist(data.user, add); // aquí debo mandar el username del amigo
		if (add === 0) {
			refreshFriendData(data.user);
		}
    }
    if (add) { // we dont see avatar or status on chat or tournament
        refreshChatFriendList(); // chat refreshes in all paths
        if (path === '/new-tournament') {
            refreshTournamentFriendList();
        }
	}
}

function handleFriendRequestChanges(type, data = null) {
//	request_sent, 	request_declined,     request_cancelled
	if (type === 'request_sent' || type === 'request_cancelled') {
		renderPendingFriendRequests();
	} else {
		refreshIfDeclined(data.user);
	}
}


export { notiSocket }