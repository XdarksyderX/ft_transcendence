import { sendRequestPong } from './sendRequest.js';

export async function getPongMatchHistory() {
    return await sendRequestPong('GET', 'match/history');
}

export async function getPongMatchDetail(matchId) {
    return await sendRequestPong('GET', `match/detail/${matchId}`);
}

export async function getPendingPongInvitationsOutgoing() {
    return await sendRequestPong('GET', 'invitation/outgoing/list/');
}

export async function getPendingPongInvitationsIncoming() {
    return await sendRequestPong('GET', 'invitation/incoming/list/');
}

export async function createPongMatchInvitation(friendName) {
    return await sendRequestPong('POST', 'invitation/create/', { receiver: friendName });
}

export async function getPongInvitationDetail(token) {
    return await sendRequestPong('GET', `invitation/detail/${token}`);
}
export async function denyPongInvitation(token) {
    return await sendRequestPong('POST', `invitation/deny/${token}`);
}

export async function cancelPongInvitation(token) {
    return await sendRequestPong('POST', `invitation/cancel/${token}`);
}

export async function acceptPongInvitation(token) {
    return await sendRequestPong('GET', `match/join/${token}/`);
}

export async function getPongPendingMatches() {
    return await sendRequestPong('GET', 'match/pending/');
}

export async function getTournaments() {
    return await sendRequestPong('GET', 'tournaments/');
}

export async function editTournament(tournamentId, data) {
    return await sendRequestPong('POST', `tournaments/${tournamentId}/edit/`, data);
}

export async function startTournament(tournamentId) {
    return await sendRequestPong('POST', `tournaments/${tournamentId}/start/`);
}

export async function getTournamentGames(tournamentId) {
    return await sendRequestPong('GET', `tournaments/${tournamentId}/games/`);
}
