// Tournament status management
let invitedFriends = []
let tournamentStatusVisible = false

// Mock functions for demonstration purposes.  In a real application, these would be imported or defined elsewhere.
let selectedFriends = [] // Initialize selectedFriends
function handleGetFriendList() {
  return Promise.resolve([
    { id: 1, username: 'Alice', status: 'pending' },
    { id: 2, username: 'Bob', status: 'pending' },
    { id: 3, username: 'Charlie', status: 'pending' },
    { id: 4, username: 'David', status: 'pending' },
    { id: 5, username: 'Eve', status: 'pending' },
    { id: 6, username: 'Frank', status: 'pending' },
    { id: 7, username: 'Grace', status: 'pending' },
    { id: 8, username: 'Hank', status: 'pending' },
    { id: 9, username: 'Ivy', status: 'pending' },
    { id: 10, username: 'Jack', status: 'pending' }
  ])
}
function throwAlert(message) {
  alert(message) // Replace with actual alert/notification logic
}

function showTournamentStatus(tournamentName, selectedFriends) {
  // Hide the tournament form and show the status section
  document.getElementById("tournament-form").style.display = "none"

  // Create and insert the tournament status HTML if it doesn't exist
  if (!document.getElementById("tournament-status-container")) {
    const tournamentFormCard = document.querySelector(".blinking-neon-frame .card")
    tournamentFormCard.innerHTML += document.getElementById("tournament-status-template").innerHTML
  }

  // Show the tournament status container
  const statusContainer = document.getElementById("tournament-status-container")
  statusContainer.style.display = "block"

  // Set tournament name
  document.getElementById("tournament-name-display").textContent = tournamentName

  // Set total invites
  invitedFriends = [...selectedFriends]
  const totalInvites = document.getElementById("total-invites")
  totalInvites.textContent = invitedFriends.length

  // Render invitations
  renderInvitations()

  // Add event listeners
  document.getElementById("cancel-tournament-btn").addEventListener("click", cancelTournament)
  document.getElementById("start-with-accepted-btn").addEventListener("click", startWithAccepted)
  document.getElementById("send-replacement-btn")?.addEventListener("click", sendReplacementInvites)

  // Simulate random responses (for demo purposes)
  simulateResponses()

  tournamentStatusVisible = true
}

function renderInvitations() {
  const container = document.getElementById("invitations-container")
  container.innerHTML = ""

  invitedFriends.forEach((friend) => {
    const inviteElement = document.createElement("div")
    inviteElement.className = `friend-btn ${getStatusClass(friend.status)}`

    let statusIcon = ""
    if (friend.status === "accepted") {
      statusIcon = '<i class="fas fa-check-circle"></i>'
    } else if (friend.status === "declined") {
      statusIcon = '<i class="fas fa-times-circle"></i>'
    } else if (friend.status === "pending") {
      statusIcon = '<i class="fas fa-clock"></i>'
    }

    inviteElement.innerHTML = `
      <p class="mb-0">${friend.username} ${statusIcon}</p>
      <span class="small">${getStatusText(friend.status)}</span>
    `
    container.appendChild(inviteElement)
  })

  updateProgress()
  checkForDeclined()
}

function getStatusClass(status) {
  switch (status) {
    case "accepted":
      return "accepted"
    case "declined":
      return "declined"
    case "pending":
      return "pending"
    default:
      return ""
  }
}

function getStatusText(status) {
  switch (status) {
    case "accepted":
      return "Accepted"
    case "declined":
      return "Declined"
    case "pending":
      return "Waiting..."
    default:
      return ""
  }
}

function updateProgress() {
  const acceptedCount = invitedFriends.filter((f) => f.status === "accepted").length
  const totalCount = invitedFriends.length
  const progressPercent = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0

  document.getElementById("acceptance-progress").style.width = `${progressPercent}%`
  document.getElementById("acceptance-progress").setAttribute("aria-valuenow", progressPercent)
  document.getElementById("accepted-count").textContent = acceptedCount

  // Enable/disable start button based on acceptances
  const startButton = document.getElementById("start-with-accepted-btn")
  if (acceptedCount >= 4) {
    // Minimum players needed
    startButton.disabled = false
  } else {
    startButton.disabled = true
  }
}

function checkForDeclined() {
  const declinedCount = invitedFriends.filter((f) => f.status === "declined").length
  const replacementSection = document.getElementById("replacement-section")

  if (declinedCount > 0) {
    replacementSection.classList.remove("d-none")
    renderReplacementFriends()
  } else {
    replacementSection.classList.add("d-none")
  }
}

async function renderReplacementFriends() {
  const container = document.getElementById("replacement-friends-container")
  container.innerHTML = ""

  // Get all friends
  const allFriends = await handleGetFriendList()

  // Filter out already invited friends
  const invitedIds = invitedFriends.map((f) => f.id)
  const availableFriends = allFriends.filter((f) => !invitedIds.includes(f.id))

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

    friendBtn.addEventListener("click", () => {
      if (friendBtn.classList.contains("selected")) {
        friendBtn.classList.remove("selected")
        friend.selected = false
      } else {
        friendBtn.classList.add("selected")
        friend.selected = true
      }

      // Enable/disable send button based on selections
      const selectedCount = availableFriends.filter((f) => f.selected).length
      const declinedCount = invitedFriends.filter((f) => f.status === "declined").length
      document.getElementById("send-replacement-btn").disabled = selectedCount === 0 || selectedCount > declinedCount
    })
  })
}

function sendReplacementInvites() {
  // Get all friends
  handleGetFriendList().then((allFriends) => {
    // Filter selected replacement friends
    const replacements = allFriends.filter((f) => f.selected)

    if (replacements.length === 0) return

    // Remove declined friends and add replacements
    const declinedFriends = invitedFriends.filter((f) => f.status === "declined")

    // Remove declined friends (up to the number of replacements)
    for (let i = 0; i < Math.min(replacements.length, declinedFriends.length); i++) {
      const indexToRemove = invitedFriends.findIndex((f) => f.status === "declined")
      if (indexToRemove !== -1) {
        invitedFriends.splice(indexToRemove, 1)
      }
    }

    // Add replacements with pending status
    replacements.forEach((friend) => {
      invitedFriends.push({
        ...friend,
        status: "pending",
      })
    })

    // Update UI
    renderInvitations()
    document.getElementById("replacement-section").classList.add("d-none")

    // Simulate responses for new invites
    simulateResponsesForNewInvites(replacements)
  })
}

function cancelTournament() {
  if (confirm("Are you sure you want to cancel this tournament?")) {
    // Reset and show the tournament form again
    document.getElementById("tournament-form").style.display = "block"
    document.getElementById("tournament-status-container").style.display = "none"
    document.getElementById("tournament-name-input").value = ""

    // Reset selected friends
    selectedFriends = []
    invitedFriends = []

    // Reset switches
    document.querySelectorAll(".switch-btn").forEach((btn) => btn.classList.remove("active"))
    document.getElementById("tournament-friends-list").classList.remove("show")

    // Reset friend selection
    document.querySelectorAll(".friend-btn.selected").forEach((btn) => btn.classList.remove("selected"))

    // Disable start button
    document.getElementById("start-tournament-btn").disabled = true

    tournamentStatusVisible = false

    throwAlert("Tournament cancelled")
  }
}

function startWithAccepted() {
  const acceptedFriends = invitedFriends.filter((f) => f.status === "accepted")
  const acceptedNames = acceptedFriends.map((f) => f.username).join(", ")

  throwAlert(`Starting tournament with accepted players: ${acceptedNames}`)
  // Here you would navigate to the tournament page or start the tournament
}

// Simulate random responses (for demo purposes)
function simulateResponses() {
  invitedFriends.forEach((friend, index) => {
    // Set initial status to pending
    friend.status = "pending"

    // Simulate random response time (1-5 seconds)
    const responseTime = 1000 + Math.random() * 4000

    setTimeout(() => {
      // 70% chance to accept, 30% to decline
      friend.status = Math.random() < 0.7 ? "accepted" : "declined"
      renderInvitations()
    }, responseTime)
  })
}

function simulateResponsesForNewInvites(newFriends) {
  newFriends.forEach((friend) => {
    // Find the friend in invitedFriends
    const invitedFriend = invitedFriends.find((f) => f.id === friend.id)
    if (!invitedFriend) return

    // Simulate random response time (1-5 seconds)
    const responseTime = 1000 + Math.random() * 4000

    setTimeout(() => {
      // 70% chance to accept, 30% to decline
      invitedFriend.status = Math.random() < 0.7 ? "accepted" : "declined"
      renderInvitations()
    }, responseTime)
  })
}

// Add HTML template to the page
export function addTournamentStatusTemplate() {
  const template = document.createElement("template")
  template.id = "tournament-status-template"
  template.innerHTML = `
    <div id="tournament-status-container" style="display: none;">
      <div class="mb-3">
        <h4 id="tournament-name-display" class="ctm-text-title text-center"></h4>
        <div class="progress mb-2">
          <div id="acceptance-progress" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <p class="text-center mb-3">
          <span id="accepted-count">0</span>/<span id="total-invites">0</span> players accepted
        </p>
      </div>
      
      <div class="mb-4">
        <h5 class="ctm-text-title">Invitations</h5>
        <div id="invitations-container" class="friends-container w-100"></div>
      </div>
      
      <div id="replacement-section" class="mb-4 d-none">
        <h5 class="ctm-text-title">Invite Replacement</h5>
        <p class="small mb-2">Some players declined. Select new friends to invite:</p>
        <div id="replacement-friends-container" class="friends-container w-100 mb-3"></div>
        <button id="send-replacement-btn" class="btn ctm-btn w-100 mb-3">Send Invitations</button>
      </div>
      
      <div class="d-flex justify-content-between">
        <button id="cancel-tournament-btn" class="btn cancel-btn">Cancel Tournament</button>
        <button id="start-with-accepted-btn" class="btn ctm-btn" disabled>Start With Accepted</button>
      </div>
    </div>
  `
  document.body.appendChild(template);

  // Call showTournamentStatus with a sample tournament name and selected friends
  showTournamentStatus("Sample Tournament", [
    { id: 1, username: 'Alice', status: 'pending' },
    { id: 2, username: 'Bob', status: 'pending' },
    { id: 3, username: 'Charlie', status: 'pending' },
    { id: 4, username: 'David', status: 'pending' },
    { id: 5, username: 'Eve', status: 'pending' }
  ]);
}