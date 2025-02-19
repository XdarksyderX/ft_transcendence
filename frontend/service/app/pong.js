export async function getMatchHistory() {
    return await sendRequest('GET', 'match/history');
}

export async function getMatchDetail(matchId) {
    return await sendRequest('GET', `match/detail/${matchId}`);
}

export async function getPendingInvitationsOutgoing() {
    return await sendRequest('GET', 'invitation/outgoing/list/');
}

export async function getPendingInvitationsIncoming() {
    return await sendRequest('GET', 'invitation/incoming/list/');
}

export async function createPongMatchInvitation(friendName) {
    return await sendRequest('POST', 'invitation/create/', friendName);
}

export async function getInvitationDetail(token) {
    return await sendRequest('GET', `invitation/detail/${token}`);
}
// denys an invitation you've received
export async function denyInvitation(token) {
    return await sendRequest('POST', `invitation/deny/${token}`);
}
//cancels an invitation you've sent
export async function cancelInvitation(token) {
    return await sendRequest('POST', `invitation/cancel/${token}`);
}

export async function joinMatch(token) {
    return await sendRequest('POST', `match/join/${token}/`);
}

export async function getPendingMatches() {
    return await sendRequest('GET', 'match/pending/');
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