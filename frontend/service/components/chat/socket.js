import { updateNotificationIndicator, getElements, renderChat, renderRecentChats, 
markMessagesAsRead, currentChat, currentView, isExpanded } from "./app.js";
import { getUsername } from "../../app/auth.js";
import { refreshAccessToken } from "../../app/auth.js";

let chatSocket = null;
let attemptedReconnection = false;

export function initializeGlobalChatSocket() {
    if (chatSocket) {
        chatSocket.close();
    }

    chatSocket = new WebSocket(`ws://localhost:5051/ws/chat/`);

    chatSocket.onopen = () => {
        console.log("Chat WebSocket connected");
        attemptedReconnection = false;
    };

    chatSocket.onmessage = (event) => {
        handleReceivedMessage(event);
    };

    chatSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    chatSocket.onclose = async (event) => {
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
        setTimeout(initializeGlobalChatSocket, 5000); 
    };
}

// Handle received WebSocket messages
function handleReceivedMessage(event) {
	try {
		const data = JSON.parse(event.data);
		console.log("WS message received:", data);
		const currentUser = getUsername();
		if (data.status === "success" && data.data && data.data.message) {
			if (data.data.sender === currentUser) return;

			// Check if the message is a game invitation
			//if (data.data.type === 'game-invitation') {
			if (data.data.is_special) { // if the message is a game invitation
				// Untoggle the chat window
				const elements = getElements();
				if (!isExpanded) {
					toggleChat(elements);
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

				console.log("current chat on received: ", currentChat);
		   // }
			// Update the view if the current view is the chat with the sender or the recent-chats tab
			if (currentView === 'chat' && currentChat.username === data.data.sender) { /* && currentChat.username === data.data.sender */
				markMessagesAsRead(currentChat.username);
				renderChat(getElements());
			} else if (currentView === 'recent-chats') {
				renderRecentChats(getElements());
			} else if (!isExpanded) {
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
export function handleSentMessage(event, elements) {
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
		renderChat(elements);
		elements.messageInput.value = '';
	}
}
