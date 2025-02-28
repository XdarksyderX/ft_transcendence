import { sendRequestNotifications } from './sendRequest.js';

export async function getNotifications() {
    return await sendRequestNotifications('GET', 'notifications/');
}

export async function markNotification(notificationId) {
    return await sendRequestNotifications('POST', 'notifications/mark/', { notification_id: notificationId });
}
