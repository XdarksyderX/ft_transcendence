export async function getNotifications() {
	return await sendRequest('GET', 'notifications/');
}

export async function markNotification(notificationId) {
    return await sendRequest('POST', 'notifications/mark/', { notification_id: notificationId });
}

async function sendRequest(method, endpoint, body = null) {
    try {
        if (body) console.log('Payload:', JSON.stringify(body));
        
        const response = await fetch(`http://localhost:5054/${endpoint}`, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null
        });

        let responseData = null;

        // Manejar respuestas sin cuerpo (como 204 No Content)
        if (response.status !== 204) {
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.error('Error parsing response JSON:', parseError);
            }
        }

        if (!response.ok) {
            console.error('Request failed with status:', response.status);
            console.error('Error details:', responseData); // Imprime detalles del error si los hay.
            return { status: "error", message: responseData?.message || "Request failed" };
        }

        console.log('Response:', response.status, responseData);
        return responseData || { status: "success", message: "No content" };
    } catch (error) {
        console.error(`Error en ${method} ${endpoint}:`, error);
        return { status: "error", message: "An unexpected error occurred" };
    }
}


