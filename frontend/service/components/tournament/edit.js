import { throwAlert } from "../../app/render.js";
import { getEditableTournaments,  getTournamentDetail, getTournamentInvitationDetail, startTournament, joinTournamentQueue, leaveTournamentQueue} from "../../app/pong.js";
import { handleGetFriendList } from "../friends/app.js";
import { handleSendTournamentInvitation, handleDeleteTournament } from "./new.js";
import { navigateTo, preventMultipleClicks } from "../../app/router.js";

let selectedFriends = [];
let maxPlayers = 0;
let alreadyAccepted = 1;
let alreadyDeclined = 0;
let pending = 0;

export async function handleGetEditableTournaments() {
  const response = await getEditableTournaments();
  if (response.status === "success" && response.tournaments.length > 0) {
    maxPlayers = response.tournaments[0].max_players;
    return response.tournaments[0];
  } else {
    return null;
  }
}

export async function showEditTournamentSection(token, addListener, requiredParticipants = 0) {

  document.getElementById('new-tournament-container').style.display = 'none';
  document.getElementById('pendant-tournament-container').style.display = 'block';
  await initEditTournamentSection(token, addListener, requiredParticipants);
}
// addListener is to avoid adding event listener while "refreshing" with events
// anyway, if the eventListener already existed cause we cancel and go back to create and then again to edit
// we need to remove the previous event listener, and set the new one with the new token
async function initEditTournamentSection(token, addListener, requiredParticipants) {
  const detail = await handleGetTournamentDetail(token);
  const invitations = await getAllInvitationsStatusMap(detail);
  renderTournamentName(detail.name);
  initVariables(requiredParticipants);
  renderInvitations(invitations);
  if (isReplacementNeeded()) {
    renderReplacementFriends(invitations);
  }
  if (addListener) {
    const sendBtn = document.getElementById("send-replacement-btn");
    const cancelBtn = document.getElementById("cancel-tournament-btn");

    // Replace the send button with a clone to remove all existing event listeners
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.addEventListener('click', () => sendReplacementInvitations(token));

    // Replace the cancel button with a clone to remove all existing event listeners
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => preventMultipleClicks(cancelBtn, () => handleDeleteTournament(token)));
    // Attach click event for the Start With Accepted button
    const startButton = document.getElementById("start-with-accepted-btn");
    if (startButton) {
      const newStartButton = startButton.cloneNode(true);
      startButton.parentNode.replaceChild(newStartButton, startButton);
      newStartButton.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          const response = await startTournament(token);
          if (response.status === "success") {
            navigateTo('/started-tournaments');
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          throwAlert(`Error starting tournament: ${error.message}`);
        }
      }, { once: true });
    }
  }
}

function initVariables(requiredParticipants) {
  selectedFriends = [];
  alreadyAccepted = 1;
  alreadyDeclined = 0;
  pending = 0;
  if (requiredParticipants) {
    maxPlayers = requiredParticipants;
  }
  document.getElementById("send-replacement-btn").disabled = 'true';
}

function renderTournamentName(name) {
  const nameElement = document.getElementById('edit-tournament-name');
  nameElement.innerText = `${name} `;
}

async function getAllInvitationsStatusMap(detail) {
  const invitationTokensMap = getAllInvitationTokens(detail);
  const statusMap = await getAllInvitationsStatus(invitationTokensMap);
  return statusMap;
}

export async function handleGetTournamentDetail(token) {
  const response = await getTournamentDetail(token);
  if (response.status === 'success') {
    //console.log("on handleGetTournamentDetail: ", response.tournament);
    return response.tournament;
  } else {
    throwAlert('Error while getting tournament detail');
  }
}

function getAllInvitationTokens(detail) {
  const invitationTokensMap = {};
  if (detail.invited_users) {
    for (const user of detail.invited_users) {
      invitationTokensMap[user.username] = user.token;
    }
  }
  return invitationTokensMap;
}

async function getAllInvitationsStatus(invitationTokensMap) {
  const statusMap = {};
  for (const [username, token] of Object.entries(invitationTokensMap)) {
    const response = await handleGetTournamentInvitationDetail(token);
    if (response.status === 'success') {
      statusMap[username] = response.invitation.status;
    } else {
      statusMap[username] = 'unknown';
    }
  }
  return statusMap;
}

export async function handleGetTournamentInvitationDetail(invitationToken) {
  const response = await getTournamentInvitationDetail(invitationToken);
  if (response.status === 'success') {
    return response;
  } else {
    throwAlert('Error while getting tournament invitation detail');
  }
}

function renderInvitations(invitationsMap) {
  const container = document.getElementById("invitations-container")
  container.innerHTML = ""

  Object.entries(invitationsMap).forEach(([username, status]) => {
    const inviteElement = document.createElement("div")
    inviteElement.className = `friend-btn ${status}`
    const textClass = getStatusClass(status);
    let statusIcon = ""
    if (status === "accepted") {
      statusIcon = `<i class="${textClass} fas fa-check-circle"></i>`
      alreadyAccepted++;
    } else if (status === "denied") {
      statusIcon = `<i class="${textClass} fas fa-times-circle"></i>`
      alreadyDeclined++;
    } else if (status === "pending") {
      statusIcon = `<i class="${textClass} fas  fa-clock"></i>`
      pending++;
    }

    inviteElement.innerHTML = `
      <p class="mb-0 ${textClass}">${username} ${statusIcon}</p>
      <span class="small ${textClass}">${getStatusText(status)}</span>
    `
    container.appendChild(inviteElement)
  })
  updateProgress();
}

function getStatusClass(status) {
  switch (status) {
    case "accepted":
      return "ctm-text-accent"
    case "denied":
      return "ctm-text-danger"
    case "pending":
      return "ctm-text-light"
    default:
      return ""
  }
}

function getStatusText(status) {
  switch (status) {
    case "accepted":
      return "Accepted"
    case "denied":
      return "Declined"
    case "pending":
      return "Waiting..."
    default:
      return ""
  }
}

function updateProgress() {
  const progressPercent = maxPlayers > 0 ? (alreadyAccepted / maxPlayers) * 100 : 0
  document.getElementById("acceptance-progress").style.width = `${progressPercent}%`
  document.getElementById("acceptance-progress").setAttribute("aria-valuenow", progressPercent)
  document.getElementById("accepted-count").textContent = `${alreadyAccepted} / ${maxPlayers} players accepted`;

  // Enable/disable start button based on acceptances
  const startButton = document.getElementById("start-with-accepted-btn")
  if (alreadyAccepted === maxPlayers) {
    startButton.disabled = false
  } else {
    startButton.disabled = true
  } 
}

function isReplacementNeeded() {
  const replacementSection = document.getElementById("replacement-section")
  // i'll have to check for cancels to when its implemented
  if (alreadyAccepted + pending < maxPlayers) {
    replacementSection.classList.remove("d-none");
    return (true);
  } else {
    replacementSection.classList.add("d-none");
    return (false);
  }
}

async function renderReplacementFriends(invitationsMap) {
  const container = document.getElementById("replacement-friends-container")
  container.innerHTML = ""

  // Get all friends
  const allFriends = await handleGetFriendList();
  // Extract usernames that are already invited
  const invitedUsernames = Object.keys(invitationsMap);
  // Filter out already invited friends
  const availableFriends = allFriends.filter((friend) => !invitedUsernames.includes(friend.username));

  if (availableFriends.length === 0) {
    container.innerHTML = '<p class="text-center">No more friends available to invite</p>'
    document.getElementById("send-replacement-btn").disabled = true
    return
  }
  availableFriends.forEach((friend) => {
    const friendBtn = document.createElement("div")
    friendBtn.className = "friend-btn"
    friendBtn.innerHTML = `<p class="mb-0">${friend.username}</p>`
    container.appendChild(friendBtn)

    friendBtn.addEventListener("click", () => toggleFriendSelection(friend.username, friendBtn));
  })
}


function toggleFriendSelection(friendName, friendBtn) {
  if (friendBtn.classList.contains("selected")) {
    friendBtn.classList.remove("selected");
    const index = selectedFriends.indexOf(friendName);
    if (index !== -1) {
      selectedFriends.splice(index, 1);
    }
  } else {
    const friendsLeft = maxPlayers - alreadyAccepted - pending;
    if (selectedFriends.length === friendsLeft) {
      if (friendsLeft === 0) {
        return throwAlert(`You can't invite anyone else in this moment`);
      }
      return throwAlert(`You only have ${friendsLeft} friend${friendsLeft === 1 ? '' : 's'} left to invite`)
    }
    friendBtn.classList.add("selected")
    selectedFriends.push(friendName);
  }
  //console.log("selectedFriends.length: ", selectedFriends.length)
  const sendBtn = document.getElementById("send-replacement-btn");
  sendBtn.disabled = (selectedFriends.length === 0);
} 

async function sendReplacementInvitations(tourToken) {
  const sendBtn = document.getElementById("send-replacement-btn");
  sendBtn.disabled = true; // Disable the button to prevent multiple clicks

  try {
      for (const friend of selectedFriends) {
          await handleSendTournamentInvitation(tourToken, friend);
      }
      initEditTournamentSection(tourToken, true);
  } catch (error) {
      throwAlert(`Failed to send invitation: ${error.message}`);
  } finally {
      sendBtn.disabled = false; // Re-enable the button after the invitations are sent
  }
}
