import { sendRequestPong } from './sendRequest.js';

export async function getMatchHistory() {
    return await sendRequestPong('GET', 'match/history');
}

export async function getMatchDetail(matchId) {
    return await sendRequestPong('GET', `match/detail/${matchId}`);
}

export async function getPendingInvitationsOutgoing() {
    return await sendRequestPong('GET', 'invitation/outgoing/list/');
}

export async function getPendingInvitationsIncoming() {
    return await sendRequestPong('GET', 'invitation/incoming/list/');
}

export async function createPongMatchInvitation(friendName) {
    return await sendRequestPong('POST', 'invitation/create/', { receiver: friendName });
}

export async function getInvitationDetail(token) {
    return await sendRequestPong('GET', `invitation/detail/${token}`);
}

export async function denyInvitation(token) {
    return await sendRequestPong('POST', `invitation/deny/${token}`);
}

export async function cancelInvitation(token) {
    return await sendRequestPong('POST', `invitation/cancel/${token}`);
}

export async function acceptInvitation(token) {
    return await sendRequestPong('GET', `match/join/${token}/`);
}

export async function getPendingMatches() {
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
