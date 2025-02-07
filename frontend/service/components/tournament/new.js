import { throwAlert } from "../../app/render.js";

let requiredParticipants = 0;


export function initializeNewTournament() {
	const switchButtons = document.querySelectorAll('.switch-btn');
//	const friendList = document.getElementById('friends-list');
	switchButtons.forEach((button) => {
		button.addEventListener("click", (event) => {
		  event.preventDefault();
		  switchButtons.forEach((btn) => btn.classList.remove("active"));
		  button.classList.add("active");
		  updateRequiredParticipants(button.getAttribute("data-participants"));
		  document.getElementById('friends-list').classList.add('show');
		  renderFriendList();
		});
	  });
}

function updateRequiredParticipants(total) {
    requiredParticipants = Number.parseInt(total, 10)
    const startBtn = document.getElementById("start-tournament-btn")
    if (selectedFriends.length === requiredParticipants) {
      startBtn.disabled = false
    } else {
      startBtn.disabled = true
    }
  }

  function getFriends() {
    return [
      { id: 1, name: "Concha", status: "online" },
      { id: 2, name: "Marisa", status: "offline" },
      { id: 3, name: "Valentín", status: "online" },
      { id: 4, name: "Belén", status: "online" },
      { id: 5, name: "Emilio", status: "online" },
    ]
  }

  let selectedFriends = []
  function toggleFriendSelection(friend, btn) {
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

    const startBtn = document.getElementById("start-tournament-btn")
    startBtn.disabled = selectedFriends.length !== requiredParticipants
  }

  function renderFriendList() {
    const container = document.getElementById("friends-container")
    const friends = getFriends()

    friends.forEach((friend) => {
      const friendBtn = document.createElement("div")
      friendBtn.className = "friend-btn"
      friendBtn.setAttribute("data-friend-id", friend.id)
      friendBtn.innerHTML = `<p class="mb-0">${friend.name}</p>`
      container.appendChild(friendBtn)
      friendBtn.addEventListener("click", () => toggleFriendSelection(friend, friendBtn))
    })
  }

