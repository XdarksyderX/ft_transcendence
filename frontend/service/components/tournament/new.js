import { throwAlert } from "../../app/render.js";
import { handleGetFriendList } from "../friends/app.js";
import { addTournamentStatusTemplate } from "./pendant.js";

let requiredParticipants = 0;

export function initializeNewTournament() {

  const elements = getElements();
  setSwitches(elements);
  
  renderFriendList(elements);
  initStartNewTournament(elements);
 // addTournamentStatusTemplate();
}

function getElements() {
  return ({
        startBtn: document.getElementById('start-tournament-btn'),
        switchButtons: document.querySelectorAll('.switch-btn'),
        friendsContainer: document.getElementById("friends-container"),
        friendList: document.getElementById('tournament-friends-list')
    }
);
}

function setSwitches(elements) {
  elements.switchButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      elements.switchButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      updateRequiredParticipants(button.getAttribute("data-participants"), elements);
      elements.friendList.classList.add('show');
    });
  });
}

function updateRequiredParticipants(total, elements) {
  requiredParticipants = Number.parseInt(total, 10);
  if (selectedFriends.length === requiredParticipants) {
    elements.startBtn.disabled = false;
  } else {
    elements.startBtn.disabled = true;
    if (selectedFriends.length > requiredParticipants) {
      const excedent = selectedFriends.length - requiredParticipants;
      throwAlert(`You'll have to unselect ${excedent} friend${excedent === 1 ? '' : 's'}`);
    }
  }
}

export function refreshTournamentFriendList() {
  if (requiredParticipants) {
    const elements = getElements();
    renderFriendList(elements);
  }
}

async function renderFriendList(elements) {
  elements.friendsContainer.innerHTML = '';
  const friends = await handleGetFriendList(); 
  if (friends.length < 0) {
    elements.friendsContainer.innerText = `you dont have enough friends to start a tournament`
    //elements.friendsContainer.innerText = `you dont have enough friends to start a ${requiredParticipants} players tournament`
    return ;
  }
  friends.forEach((friend) => {
    const friendBtn = document.createElement("div")
    friendBtn.className = "friend-btn"
    friendBtn.innerHTML = `<p class="mb-0">${friend.username}</p>`
    elements.friendsContainer.appendChild(friendBtn)
    friendBtn.addEventListener("click", () => toggleFriendSelection(friend, friendBtn, elements))
  })
}

let selectedFriends = []
function toggleFriendSelection(friend, btn, elements) {
  if (btn.classList.contains("selected")) {
    btn.classList.remove("selected")
    selectedFriends = selectedFriends.filter((f) => f.id !== friend.id)
  } else {
    if (selectedFriends.length === requiredParticipants) {
      return alert(`You already have ${requiredParticipants} selected friends`)
    }
    btn.classList.add("selected")
    selectedFriends.push(friend)
  }

  elements.startBtn.disabled = selectedFriends.length !== requiredParticipants
}

function initStartNewTournament(elements) {
  elements.startBtn.addEventListener('click', () => {
      event.preventDefault();
      const tournamentName = document.getElementById('tournament-name-input').value;
      createNewTournament(tournamentName);
    })
}

function createNewTournament(tournamentName) {
  const friendNames = selectedFriends.map(friend => friend.name).join(', ');
  throwAlert(`Creating a tournament named: '${tournamentName}', with: ${friendNames}`);
}