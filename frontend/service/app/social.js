import { handleSearchUsers } from '../components/friends/requests.js';
import { sendRequestSocial } from './sendRequest.js';

export async function getFriendsList() {
    return await sendRequestSocial('GET', 'friends/list/');
}

export async function removeFriend(username) {
    return await sendRequestSocial('POST', `friends/remove/${username}/`);
}

export async function getPendingReceivedRequests() {
    return await sendRequestSocial('GET', 'requests/pending/received/');
}

export async function getPendingSentRequests() {
    return await sendRequestSocial('GET', 'requests/pending/sent/');
}

export async function acceptFriendRequest(invitationId) {
    return await sendRequestSocial('POST', `requests/accept/${invitationId}/`);
}

export async function declineFriendRequest(invitationId) {
    return await sendRequestSocial('POST', `requests/decline/${invitationId}/`);
}

export async function sendFriendRequest(username) {
    return await sendRequestSocial('POST', `requests/send/${username}/`);
}

export async function cancelFriendRequest(invitationId) {
    return await sendRequestSocial('POST', `requests/cancel/${invitationId}/`);
}

export async function blockUser(username) {
    return await sendRequestSocial('POST', `block/user/${username}/`);
}

export async function unblockUser(username) {
    return await sendRequestSocial('POST', `block/unblock/${username}/`);
}

export async function isUserBlocked(username) {
    return await sendRequestSocial('GET', `block/is-blocked/${username}/`);
}

export async function getBlockedList() {
    return await sendRequestSocial('GET', 'block/list/');
}

export async function getProfile() {
    return await sendRequestSocial('GET', 'profile/');
}

export async function searchUsers(username) {
    return await sendRequestSocial('GET', `search/${username}/`);
}


// ==================== Chat Endpoints ====================
// returns the last message of each open conversation
export async function getRecentChats() {
    return await sendRequestSocial('GET', `recent-chats/`);
}
// returns all messages of one chat
export async function getMessages(user_id) {
    return await sendRequestSocial('GET', `messages/${user_id}/`);
}
// mask one message as read
export async function markAsReadMessage(user_id) {
    return await sendRequestSocial('POST', `messages/read/${user_id}/`);
}
// returns a bool to indicate if you have or not unread messages
export async function hasUnreadMessages() {
    return await sendRequestSocial('GET', `unread-messages/`);
}

// ==================== Avatar Endpoints ====================

export async function changeAvatar(formData) {
    return await sendRequestSocial('POST', 'change-avatar', formData, true);
}

/**
 * Retrieves the avatar URL for a user. It will work with the username, the user object, or the path.
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
   // console.log(`http://localhost:5051${path}`)
    return `http://localhost:5051${path}`;
}
