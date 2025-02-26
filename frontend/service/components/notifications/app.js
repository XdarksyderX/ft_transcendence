
import { getNotifications, markNotification } from "../../app/notifications.js";
/* 
urlpatterns = [
	path('notifications/', PendingNotificationsView.as_view(), name='pending-notifications'),
	path('notifications/mark/', MarkNotification.as_view(), name='mark-notification')
]
	websocket_urlpatterns = [
    path('ws/events/', NotificationConsumer.as_asgi())
]
*/
let notiSocket = null;

export function initializeNotificationEvents() {
	initializeNotificationsSocket();
	document.getElementById("notifications-toggle").addEventListener('click', renderNotifications);	
}

function initializeNotificationsSocket() {
	if (notiSocket) {
		notiSocket.close();
	}
	notiSocket = new WebSocket(`ws://localhost:5054/ws/events/`);

	notiSocket.onopen = () => {
		console.log("Notifications WebSocket conected");
	};

	notiSocket.onmessage = (event) => {
		handleReceivedNotification(event);
	};

	notiSocket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	notiSocket.onclose = () => {
		console.log("WebSocket cerrado, intentando reconectar...");
		setTimeout(initializeNotificationsSocket, 5000); // Reintentar conexión tras 5 segundos
	};
}

function handleReceivedNotification(event) {
	try {
		const data = JSON.parse(event.data);
		console.log("Notification received: ", data);
		// here I'll filter each notification depending 
		//on the type and the url path, I'll refresh whatever I need
	}
	catch (error) {
		console.error("Error parsing WS message:", error);
	}
}

export async function renderNotifications() {
    console.log("renderNotifications function called");
    //const notifications = await hardGetNotifications();
    const notifications = await handleGetNotifications();
    const container = document.getElementById('notifications-container');
    const bell = document.getElementById('bell');

    console.log("Hello " + notifications)
    container.innerHTML = '';
    if(notifications.length === 0) {
        container.innerText = 'you dont have any notification';
    } else {
        bell.style.color = 'var(--accent)';
    }
    notifications.forEach(notifi => {
        const content = JSON.parse(notifi.content);
        const card = document.createElement('li');
        card.className = "notification-card";
        card.innerText = content.event_type; // Adjust this to display the desired message
        card.addEventListener('click', () => handleMarkNotification(event, notifi.id, card));
        container.appendChild(card);
    })
}

async function hardGetNotifications() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, message: 'Whoever accepted your friend request!' },
                { id: 2, message: 'Whatever tournament has just started!' },
                { id: 3, message: 'Whoever accepted your friend request!' }
            ]);
        }, 100);
    });
}

// gets the pending notifications from the API
async function handleGetNotifications() {
    try {
        const response = await getNotifications();
		console.log(response)
        if (response.status === 'success') {
            return (response.notifications);
        }
    } catch (error) {
        console.error('Error fetching pending notifications:', error);
    }
}

// marks as readen a notification to the API and erases the HTML element
async function handleMarkNotification(event, notificationId, card) {
	event.preventDefault();
    try {
        const response = await markNotification(notificationId);
        if (response.status === 'success') {
			card.remove();
        }
    } catch (error) {
        console.error('Error fetching pending notifications:', error);
    }
}







