import { updateNotificationIndicator, getElements, renderChat, renderRecentChats, 
markMessagesAsRead, currentChat, currentView, isExpanded, toggleChat, openChat } from "./app.js";
import { getUsername } from "../../app/auth.js";
import { refreshAccessToken } from "../../app/auth.js";
import { GATEWAY_HOST } from "../../app/sendRequest.js";

let chatSocket = null;
let attemptedReconnection = false;

export function initializeGlobalChatSocket() {
    if (chatSocket && chatSocket.readyState !== WebSocket.CLOSED) {
        console.log("[ChatSocket] Already connected or connecting...");
        return;
    }

    chatSocket = new WebSocket(`wss://${GATEWAY_HOST}/ws/chat/`);

    chatSocket.onopen = () => {
        console.log("Chat WebSocket connected");
        attemptedReconnection = false;
    };

    chatSocket.onmessage = async (event) => {
		console.log("[CHAT SOCKET]: ", event.data)
        await handleReceivedMessage(event);
    };

    chatSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    chatSocket.onclose = async (event) => {
		if (state.intentionalClose) {
			chatSocket = null;
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
		//console.log("WS message received:", data);
		const currentUser = getUsername();
		const imSender = getUsername() === data?.data?.sender;
		if (data.status === "success" && data.data && data.data.message) {
			if (imSender && !data.data.is_special) return;
			if (!imSender && data.data.is_special) {
				const elements = getElements();
				if (!isExpanded) {
					toggleChat(elements);
				} if (currentChat.username !== data.data.sender) {
					openChat(data.data.sender, elements);
				}
			}
			// Update currentChat if the message is for the currently open chat
			//if (currentChat.username === data.data.sender && currentView === 'chat') {
				currentChat.messages.push({
					id: currentChat.messages.length + 1,
					message: data.data.message,
					sender: data.data.sender,
					receiver: currentUser,
					sent_at: data.data.sent_at,
					is_special: data.data.is_special,
					is_read: data.data.is_read
				});

				//console.log("current chat on received: ", currentChat);
		   // }
			// Update the view if the current view is the chat with the sender or the recent-chats tab
			if (currentView === 'chat' && currentChat.username === data.data.sender) { /* && currentChat.username === data.data.sender */
				if (isExpanded) {
					markMessagesAsRead(currentChat.username);
				}
				(await renderChat(getElements()));
			} else if (currentView === 'recent-chats') {
				renderRecentChats(getElements());
			} if (!isExpanded) {
				updateNotificationIndicator(document.getElementById('notification-indicator'));
			}
		} else {
			console.error("WS error:", data.message);
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
		await renderChat(elements);
		elements.messageInput.value = '';
	}
}

export { chatSocket }
export const state = {
    intentionalClose: false
};