import { sendRequestChess } from './sendRequest.js';

export async function getChessMatchHistory() {
	return await sendRequestChess('GET', 'match/history');
}

export async function getChessMatchDetail(game_key) {
	return await sendRequestChess('GET', `match/detail/${game_key}`);
}

export async function getRankedChessStats() {
    return await sendRequestChess('GET', `stats/ranked/`);
}

export async function getCasualChessStats() {
    return await sendRequestChess('GET', `stats/casual/`);
}
// ==================== Tournament Invitation Endpoints ====================

export async function getPendingChessInvitationsOutgoing() {
	return await sendRequestChess('GET', 'invitation/outgoing/list/');
}

export async function getPendingChessInvitationsIncoming() {
	return await sendRequestChess('GET', 'invitation/incoming/list/');
}

export async function createChessMatchInvitation(friendName, gameMode = 'classic') {
    return await sendRequestChess('POST', 'invitation/create/', { receiver: friendName, game_mode: gameMode });
}

export async function getChessInvitationDetail(token) {
	return await sendRequestChess('GET', `invitation/detail/${token}`);
}
export async function denyChessInvitation(token) {
	return await sendRequestChess('POST', `invitation/deny/${token}/`);
}

export async function cancelChessInvitation(token) {
	return await sendRequestChess('POST', `invitation/cancel/${token}/`);
}

export async function acceptChessInvitation(token) {
	return await sendRequestChess('GET', `match/join/${token}/`);
}

export async function getChessPendingMatches() {
	return await sendRequestChess('GET', 'match/in-progress/');
}


// ==================== Matchmaking Endpoints ====================

export async function joinMatchmaking(gameModes, isRanked) {
    return await sendRequestChess('POST', 'matchmaking/join/', {
        game_modes: gameModes,
        is_ranked: isRanked
    });
}

export async function leaveMatchmaking() {
    return await sendRequestChess('POST', 'matchmaking/leave/');
}

export async function checkMatchmakingStatus() {
    return await sendRequestChess('GET', 'matchmaking/status/');
}
