
import { navigateTo } from './router.js';
import { handleSearchUsers } from '../components/friends/requests.js';

export const ONLINE = true;
export const OFFLINE = false;

export async function setOnlineStatus(status) {
    return await sendRequest('POST', 'online-status', { is_online: status });
}

export async function getFriendsList() {
    return await sendRequest('GET', 'friends/list/');
}

export async function removeFriend(username) {
    return await sendRequest('POST', `friends/remove/${username}/`);
}

export async function getPendingReceivedRequests() {
    return await sendRequest('GET', 'requests/pending/received/');
}

export async function getPendingSentRequests() {
    return await sendRequest('GET', 'requests/pending/sent/');
}

export async function acceptFriendRequest(invitationId) {
    return await sendRequest('POST', `requests/accept/${invitationId}/`);
}

export async function declineFriendRequest(invitationId) {
    return await sendRequest('POST', `requests/decline/${invitationId}/`);
}

export async function sendFriendRequest(username) {
    return await sendRequest('POST', `requests/send/${username}/`);
}

export async function cancelFriendRequest(invitationId) {
    return await sendRequest('POST', `requests/cancel/${invitationId}/`);
}

export async function blockUser(username) {
    return await sendRequest('POST', `block/user/${username}/`);
}

export async function unblockUser(username) {
    return await sendRequest('POST', `block/unblock/${username}/`);
}

export async function isUserBlocked(username) {
    return await sendRequest('GET', `block/is-blocked/${username}/`);
}

export async function getBlockedList() {
    return await sendRequest('GET', 'block/list/');
}

export async function getProfile() {
    return await sendRequest('GET', 'profile/');
}

export async function searchUsers(username) {
    return await sendRequest('GET', `search/${username}/`);
}

export async function changeAvatar(formData) {
    return await sendRequest('POST', 'change-avatar', formData, true);
}

async function sendRequest(method, endpoint, body = null, isFormData = false) {
    console.log("endpoint: ", endpoint);
    try {
        if (body && !isFormData) console.log('Payload:', JSON.stringify(body));
        
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
        const response = await fetch(`http://localhost:5051/${endpoint}`, {
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

/**
 * Retrieves the avatar URL for a user. It will work with the username, the user object, or the path
 *
 * @param {string|null} username - The username of the user (optional).
 * @param {object|null} user - The user object containing user details (optional).
 * @param {string|null} path - The direct path to the avatar (optional).
 * @returns {Promise<string>} - The full URL to the user's avatar.
 * @throws {Error} - If neither username, user object, nor path is provided.
 * @throws {Error} - If the user is not found.
 * @throws {Error} - If the avatar path is invalid.
 */

export async function getAvatar(username = null, user = null, path = null) {
    if (!path) {
        if (!user) {
            if (!username) {
                throw new Error("Username, user object, or path must be provided");
            }
            console.log('username: ', username);
            // Perform an asynchronous search for the user.
            const search = await handleSearchUsers(username);
            if (search) {
                user = search.find(u => u.username === username);
                if (!user) {
                    throw new Error("User not found");
                }
            } else {
                throw new Error("Failed to search users");
            }
        }
        path = user.avatar;
    }

    if (!path.startsWith('/media/')) {
        throw new Error("Invalid avatar path");
    }

    return `http://localhost:5051${path}`;
}