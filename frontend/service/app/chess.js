/* path('match/history/', MatchHistoryView.as_view(), name='match-history'),
path('match/detail/<int:match_id>/', MatchDetailView.as_view(), name='match-detail'),
path('match/join/<str:token>/', JoinMatchView.as_view(), name='join-match'),
path('match/in-progress/', InProgressMatchesView.as_view(), name='in-progress-matches'),

path('invitation/outgoing/list/', PendingInvitationOutgoingListView.as_view(), name='invitation-outgoing-list'),
path('invitation/incoming/list/', PendingInvitationIncomingListView.as_view(), name='invitation-incoming-list'),
path('invitation/create/', PendingInvitationCreateView.as_view(), name='invitation-create'),
path('invitation/detail/<str:token>/', PendingInvitationDetailView.as_view(), name='invitation-detail'),
path('invitation/deny/<str:token>/', PendingInvitationDenyView.as_view(), name='invitation-deny'),
path('invitation/cancel/<str:token>/', PendingInvitationCancelView.as_view(), name='invitation-cancel'), */

import { sendRequestChess } from './sendRequest.js';

export async function getChessMatchHistory() {
	return await sendRequestChess('GET', 'match/history');
}

export async function getChessMatchDetail(matchId) {
	return await sendRequestChess('GET', `match/detail/${matchId}`);
}

export async function getPendingChessInvitationsOutgoing() {
	return await sendRequestChess('GET', 'invitation/outgoing/list/');
}

export async function getPendingChessInvitationsIncoming() {
	return await sendRequestChess('GET', 'invitation/incoming/list/');
}

export async function createChessMatchInvitation(friendName) {
	return await sendRequestChess('POST', 'invitation/create/', { receiver: friendName });
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
	return await sendRequestChess('GET', 'match/pending/');
}
