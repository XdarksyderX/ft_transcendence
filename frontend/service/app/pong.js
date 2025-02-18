export async function getMatchHistory() {
    return await sendRequest('GET', 'match/history');
}

export async function getMatchDetail(matchId) {
    return await sendRequest('GET', `match/detail/${matchId}`);
}

export async function getPendingInvitations() {
    return await sendRequest('GET', 'invitations/');
}

export async function createPongMatchInvitation(friendName) {
    return await sendRequest('POST', 'invitations/create/', friendName);
}

export async function getInvitationDetail(invitationId) {
    return await sendRequest('GET', `invitations/${invitationId}/`);
}

export async function joinMatch(token) {
    return await sendRequest('POST', `join/${token}/`);
}

export async function getPendingMatches() {
    return await sendRequest('GET', 'pending/');
}

async function sendRequest(method, endpoint, body = null, isFormData = false) {
    console.log("endpoint: ", endpoint);
    try {
        if (body && !isFormData) console.log('Payload:', JSON.stringify(body));
        
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
        const response = await fetch(`http://localhost:5052/${endpoint}`, {
            method,
            credentials: 'include',
            headers,
            body: body ? (isFormData ? body : JSON.stringify(body)) : null
        });

        let responseData = null;

        if (response.status !== 204) {
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.error('Error parsing response JSON:', parseError);
            }
        }

        if (!response.ok) {
            console.error('Request failed with status:', response.status);
            console.error('Error details:', responseData);
            return { status: "error", message: responseData?.message || "Request failed" };
        }

        console.log('Response:', response.status, responseData);
        return responseData || { status: "success", message: "No content" };
    } catch (error) {
        console.error(`Error en ${method} ${endpoint}:`, error);
        return { status: "error", message: "An unexpected error occurred" };
    }
}