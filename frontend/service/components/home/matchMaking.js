import { joinMatchmaking, leaveMatchmaking } from "../../app/chess.js";
import { navigateTo } from "../../app/router.js";
import { getUsername } from "../../app/auth.js";
import { hideModalGently } from "../../app/render.js";


export async function initMatchmaking(variants, ranked) {

  if (await handleJoinMatchmaking(variants, ranked)) {
    launchMatchmakingModal()
    localStorage.setItem("isOnQueue", "true")
  }
}

async function handleJoinMatchmaking(variants, ranked) {
  const response = await joinMatchmaking(variants, ranked)
  if (response.status === "success") {
    console.log("[CHESS] joining to matchmaking queue...")
    return true
  } else {
    console.error("Error while joining matchmaking queue:", response.message)
    return false
  }
}

export async function handleLeaveMatchmaking() {
  try {
    const response = await leaveMatchmaking()
    if (response.status === "success") {
      console.log("[CHESS] Successfully left matchmaking queue")
      localStorage.removeItem("isOnQueue")
      return true
    } else {
      // Check if the error is because we're not in the queue
      if (response.message && response.message.includes("not in any matchmaking queue")) {
        //console.log("Not in queue, cleaning up local state only")
        localStorage.removeItem("isOnQueue")
        return true
      } else {
        console.error("Error while leaving matchmaking queue:", response.message)
        return false
      }
    }
  } catch (error) {
    console.error("Exception while leaving matchmaking queue:", error)
    // Still clean up local state in case of errors
    localStorage.removeItem("isOnQueue")
    return false
  }
}

function launchMatchmakingModal() {

  const modalEl = document.getElementById('matchmaking-modal')
  const modal = new bootstrap.Modal(modalEl, {
    backdrop: "static",
    keyboard: false,
  })

  modal.show()

}

export function closeMatchmakingModal() {
  const modalElement = document.getElementById('matchmaking-modal');

  if (modalElement) {

      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
          hideModalGently(modalInstance);
      }

      const dismissBtn = document.getElementById('dismiss');
      if (dismissBtn) {
          dismissBtn.click();
      }
  }
}

export function handleJoinMatchmakingMatch(gameKey) {

  sessionStorage.setItem('inGame', '/chess');
  localStorage.removeItem("isOnQueue")
  setTimeout(() => {
    closeMatchmakingModal();
    navigateTo("/chess", gameKey)
  }, 2000)
}

// Clean up on page load
document.addEventListener("DOMContentLoaded", async () => {

  // If user was in queue, try to leave the queue
  if (localStorage.getItem("isOnQueue")) {
    try {
      await handleLeaveMatchmaking()
    } catch (error) {
      console.log("Error during cleanup, forcing local cleanup")
      localStorage.removeItem("isOnQueue")
    }
  }
})



