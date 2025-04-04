import { updateNotificationIndicator, getElements, renderChat, renderRecentChats, 
markMessagesAsRead, currentView, isExpanded, toggleChat, openChat, activeChat,
updateChatCache, clearChatCache} from "./app.js";
import { getUsername } from "../../app/auth.js";
import { refreshAccessToken } from "../../app/auth.js";
import { GATEWAY_HOST } from "../../app/sendRequest.js";
import { consoleSuccess } from "../../app/render.js";
import { clearInvitationCache } from "./bubbles.js";

let chatSocket = null;
let attemptedReconnection = false;

export function initializeGlobalChatSocket() {
    if (chatSocket && chatSocket.readyState !== WebSocket.CLOSED) {
        console.log("[CHATSOCKET] Already connected or connecting...");
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
        console.log("[CHATSOCKET] WebSocket closed, code:", event.code);
        if (!attemptedReconnection) {
            attemptedReconnection = true;
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                console.log("[AUTH] Token refreshed, retrying WebSocket connection...");
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
		const currentUser = getUsername();
		const msg = data?.data;
		const imSender = currentUser === msg?.sender;

		if (data.status === "success" && msg?.message) {
			if (imSender && !msg.is_special) return;

			const chatUsername = imSender ? msg.receiver : msg.sender;

			updateChatCache(chatUsername, {
				id: Date.now(), // o algún id único si tienes
				message: msg.message,
				sender: msg.sender,
				receiver: msg.receiver,
				sent_at: msg.sent_at,
				is_special: msg.is_special,
				is_read: msg.is_read
			});

			const elements = getElements();

			// Open the chat if its a special message
			if (!imSender && msg.is_special) {
				if (activeChat !== msg.sender || currentView !== 'chat') {
					openChat(msg.sender, elements);
				}
				if (!isExpanded) {
					toggleChat(elements);
				}
			}

			// Render the message if the chat is open
			if (currentView === 'chat' && activeChat === msg.sender) {
				if (isExpanded) {
					markMessagesAsRead(msg.sender);
				}
				await renderChat(elements);
			} else if (currentView === 'recent-chats') {
				renderRecentChats(elements);
			}

			if (!isExpanded) {
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
			receiver: activeChat,
			sent_at: new Date().toISOString(),
			is_special: false,
			is_read: false
		};
		chatSocket.send(JSON.stringify(messageData));
		updateChatCache(activeChat, messageData);
		await renderChat(elements);
		elements.messageInput.value = '';
	}
}


export { chatSocket }
export const state = {
    intentionalClose: false
};