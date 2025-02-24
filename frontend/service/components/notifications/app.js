
import { getNotifications, markNotification } from "../../app/notifications.js";
/* 
urlpatterns = [
	path('notifications/', PendingNotificationsView.as_view(), name='pending-notifications'),
	path('notifications/mark/', MarkNotification.as_view(), name='mark-notification')
]
*/

async function handleGetNotifications() {
    try {
        const response = await getNotifications();
        if (response.status === 'success') {
            console.log(response);
        }
    } catch (error) {
        console.error('Error fetching pending notifications:', error);
    }
}

const cards = document.querySelectorAll('.notification-card');
cards.forEach(card => {
	card.addEventListener('click', (event) => {
		event.stopPropagation(); // Prevent the dropdown from closing
		card.remove();
	});
});

/* async function getNotifications() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, message: 'Whoever accepted your friend request!' },
                { id: 2, message: 'Whatever tournament has just started!' },
                { id: 3, message: 'Whoever accepted your friend request!' }
            ]);
        }, 1000);
    });
} */

export async function renderNotifications() {
	getNotifications();
	/* const notifications = await getNotifications();
	const container = document.getElementById('notifications-container');
	const bell = document.getElementById('bell');

	if(notifications.lenght === 0) {
		container.innerText = 'you dont have any notification';
	} else {
		bell.style.color = 'var(--accent)';
	}
	notifications.forEach(notifi => {
		const card = document.createElement('li');
		card.className = "notification-card";
		card.innerText = notifi.message;
		card.addEventListener('click', (event) => {
			event.stopPropagation(); // Prevent the dropdown from closing
			card.remove();
		});
		container.appendChild(card);
	}) */
}