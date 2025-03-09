// In your JS file (e.g., pongEndpoints.js)
import { sendRequestPong } from './sendRequest.js';

// ==================== Pong Match Endpoints ====================

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

// ==================== Tournament Endpoints ====================

export async function listTournaments() {
    return await sendRequestPong('GET', 'tournaments/list/');
}

export async function createTournament(name, max_players) {
  return await sendRequestPong('POST', 'tournaments/', { name, max_players });
}

export async function getTournamentDetail(token) {
  return await sendRequestPong('GET', `tournaments/${token}/`);
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

// ==================== Tournament Invitation Endpoints ====================

export async function createTournamentInvitation(tournamentToken, receiverUsername) {
  return await sendRequestPong(
    'POST',
    `tournaments/${tournamentToken}/invite/${receiverUsername}/`
  );
}

export async function acceptTournamentInvitation(invitationToken) {
  return await sendRequestPong(
    'POST',
    `tournaments/invitations/${invitationToken}/accept/`
  );
}

export async function denyTournamentInvitation(invitationToken) {
  return await sendRequestPong(
    'POST',
    `tournaments/invitations/${invitationToken}/deny/`
  );
}

export async function cancelTournamentInvitation(invitationToken) {
  return await sendRequestPong(
    'POST',
    `tournaments/invitations/${invitationToken}/cancel/`
  );
}

export async function deleteTournamentPlayer(tournamentToken, username) {
  return await sendRequestPong(
    'POST',
    `tournaments/${tournamentToken}/players/${username}/delete/`
  );
}

export async function deleteTournament(token) {
  return await sendRequestPong('POST', `tournaments/${token}/delete/`);
}
// ==================== Stats Endpoints ====================

export async function getQuickMatchStats() {
  return await sendRequestPong('GET', 'stats/quick-match');
}

export async function getTournamentStats() {
  return await sendRequestPong('GET', 'stats/tournaments');
}