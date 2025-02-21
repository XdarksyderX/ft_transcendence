import { getRecentChats, updateNotificationIndicator, currentChat } from "./app.js";
import { handleGetFriendList } from "../friends/app.js";
import { getUsername } from "../../app/auth.js";







function createTournamentInvitation(friendName, tourName) {
	return `
	<div class="outer-card" style="max-width: 250px;">
		<div class="game-invitation card overflow-hidden">
			<div class="card-body position-relative p-3" style="z-index: 1;">
				<h6 class="mb-2 ctm-text-title">new tournament</h6>
				<p class="card-text mb-2 small ctm-text-light"><span id="inviter-name">${friendName}</span> invited you to the <span id="tournament-name"> ${tourName} </span>tournament!</p>
				<div class="d-flex justify-content-between align-items-center">
					<button id="accept-btn" class="btn btn-sm ctm-btn flex-grow-1 me-1">Accept</button>
					<button id="decline-btn" class="btn btn-sm ctm-btn-danger flex-grow-1 ms-1">Decline</button>
				</div>
			</div>
		</div>
	</div> `;
}

function createTournamentStartedNotification(tourName) {
	return `
	<div class="card-border" style="max-width: 250px;">
		<div class="game-invitation card overflow-hidden">
			<div class="card-body position-relative p-3" style="z-index: 1;">
			<h6 class="mb-2 ctm-text-title">tournament info</h6>
			<p class="card-text mb-2 small ctm-text-light">the <span id="tournament-name"> whatever the name </span>tournament has just started!</p>
			<div class="d-flex justify-content-between align-items-center">
				<button id="accept-btn" class="btn btn-sm ctm-btn flex-grow-1 me-1">got it!</button>
			</div>
			</div>
		</div>
	</div> `;
}




