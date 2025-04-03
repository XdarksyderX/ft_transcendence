import { updateNotificationIndicator, getElements, renderChat, renderRecentChats, 
markMessagesAsRead, currentChat, currentView, isExpanded, toggleChat, openChat, 
updateChatCache,
clearChatCache} from "./app.js";
import { getUsername } from "../../app/auth.js";
import { refreshAccessToken } from "../../app/auth.js";
import { GATEWAY_HOST } from "../../app/sendRequest.js";
import { consoleSuccess } from "../../app/render.js";
import { clearInvitationCache } from "./bubbles.js";

let chatSocket = null;
let attemptedReconnection = false;

export function initializeGlobalChatSocket() {
    if (chatSocket && chatSocket.readyState !== WebSocket.CLOSED) {
        console.log("[ChatSocket] Already connected or connecting...");
        return;
    }

    chatSocket = new WebSocket(`wss://${GATEWAY_HOST}/ws/chat/`);

    chatSocket.onopen = () => {
		consoleSuccess("[ChatSocket] Connection established succesfully");
        attemptedReconnection = false;
    };

    chatSocket.onmessage = async (event) => {
        await handleReceivedMessage(event);
    };

    chatSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    chatSocket.onclose = async (event) => {
		if (state.intentionalClose) {
			chatSocket = null;
			consoleSuccess("[ChatSocket] closed succesfully");
			clearChatCache();
			clearInvitationCache();
			return ;
		} 
        console.log("WebSocket cerrado, código:", event.code);
        if (!attemptedReconnection) {
            attemptedReconnection = true;
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                console.log("Token refreshed, retrying WebSocket connection...");
                setTimeout(initializeGlobalChatSocket, 1000);
                return;
            } else {
                console.warn("Failed to refresh token, staying disconnected");
            }
        }
        setTimeout(initializeGlobalChatSocket, 5090); 
    };
}

// Handle received WebSocket messages
async function handleReceivedMessage(event) {
	try {
		const data = JSON.parse(event.data);
		console.log("WS message received:", data);
		const currentUser = getUsername();
		const imSender = currentUser === data?.data?.sender;
		if (data.status === "success" && data.data && data.data.message) {
			if (imSender && !data.data.is_special) return;
			currentChat.messages.push({
				id: currentChat.messages.length + 1,
				message: data.data.message,
				sender: data.data.sender,
				receiver: currentUser,
				sent_at: data.data.sent_at,
				is_special: data.data.is_special,
				is_read: data.data.is_read
			});
			updateChatCache(currentChat.username, currentChat.messages);
			if (!imSender && data.data.is_special) {
				const elements = getElements();
				if (currentChat.username !== data.data.sender || currentView !== 'chat') {
					openChat(data.data.sender, elements);
				}
				if (!isExpanded) {
					toggleChat(elements);
				} 
			}

			// Update the view if the current view is the chat with the sender or the recent-chats tab
			if (currentView === 'chat' && currentChat.username === data.data.sender) {
				if (isExpanded) {
					markMessagesAsRead(currentChat.username);
				}
				(await renderChat(getElements()));
			} else if (currentView === 'recent-chats') {
				renderRecentChats(getElements());
			} if (!isExpanded) {
				updateNotificationIndicator(document.getElementById('notification-indicator'));
			}
		}
	} catch (e) {
		console.error("Error parsing WS message:", e);
	}
}

// Handle the submission of the chat form to send a message
export async function handleSentMessage(event, elements) {
	event.preventDefault();
	const messageText = elements.messageInput.value.trim();
	if (messageText && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
		const messageData = {
			message: messageText,
			sender: getUsername(),
			receiver: currentChat.username,
			sent_at: new Date().toISOString(),
			is_special: false,
			is_read: false
		};
		chatSocket.send(JSON.stringify(messageData));
		currentChat.messages.push({
			id: currentChat.messages.length + 1,
			...messageData
		});
		updateChatCache(currentChat.username, currentChat.messages);
		await renderChat(elements);
		elements.messageInput.value = '';
	}
}


export { chatSocket }
export const state = {
    intentionalClose: false
};