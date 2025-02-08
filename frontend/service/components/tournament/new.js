import { throwAlert } from "../../app/render.js";

let requiredParticipants = 0;

export function initializeNewTournament() {

  const elements = getElements();
  setSwitches(elements);
  
  renderFriendList(elements);
  initStartNewTournament(elements);
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

function renderFriendList(elements) {
  const friends = getFriends();

  friends.forEach((friend) => {
    const friendBtn = document.createElement("div")
    friendBtn.className = "friend-btn"
    friendBtn.setAttribute("data-friend-id", friend.id)
    friendBtn.innerHTML = `<p class="mb-0">${friend.name}</p>`
    elements.friendsContainer.appendChild(friendBtn)
    friendBtn.addEventListener("click", () => toggleFriendSelection(friend, friendBtn, elements))
  })
}




function getFriends() {
  return [
    { id: 1, name: "Concha", status: "online" },
    { id: 2, name: "Marisa", status: "offline" },
    { id: 3, name: "Valentín", status: "online" },
    { id: 4, name: "Belén", status: "online" },
    { id: 5, name: "Emilio", status: "online" },
    { id: 5, name: "Juan", status: "online" },
  ]
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