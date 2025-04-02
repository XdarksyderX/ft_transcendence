import { joinMatchmaking, leaveMatchmaking } from "../../app/chess.js";
import { navigateTo } from "../../app/router.js";
import { getUsername } from "../../app/auth.js";
import { hideModalGently } from "../../app/render.js";


export async function initMatchmaking(variants, ranked) {

  // document.getElementById('matchmaking-modal').addEventListener('shown.bs.modal', () => {
  //   setTimeout(() => {
  //       const buttonInsideModal = document.querySelector('#matchmaking-modal button');
  //       if (buttonInsideModal) {
  //           buttonInsideModal.focus();
  //           console.log('Foco forzado dentro del modal:', document.activeElement);
  //       }
  //   }, 100);
  // });

  if (await handleJoinMatchmaking(variants, ranked)) {
    launchMatchmakingModal()
    localStorage.setItem("isOnQueue", "true")
  }
}

async function handleJoinMatchmaking(variants, ranked) {
  const response = await joinMatchmaking(variants, ranked)
  if (response.status === "success") {
    console.log("joining to matchmaking queue...")
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
      console.log("Successfully left matchmaking queue")
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
  // Clean up any existing modals first
  // cleanupExistingModals()

  // const modalId = `matchmaking-modal-${username}`

  // const modalHTML = `
  //       <div class="modal fade" id="matchmaking-modal" data-username="${username}" tabindex="-1" aria-labelledby="waitGameLabel" aria-hidden="true">
  //           <div class="modal-dialog">
  //               <div class="modal-content">
  //                   <div class="modal-header">
  //                       <h5 class="modal-title ctm-text-title" id="waitGameLabel">Matchmaking</h5>
  //                       <button id="close-matchmaking-modal" type="button" class="close-modal" aria-label="Close">x</button>
  //                   </div>
  //                   <div class="modal-body">
  //                       <div class="loading-bars d-flex justify-content-center align-items-center mb-2">
  //                           <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
  //                       </div>
  //                       <p id="waiting-text" class="text-center"> Waiting for a match</p>
  //                   </div>
  //               </div>
  //           </div>
  //       </div>
  //   `

  // const modalElement = document.createElement("div")
  // modalElement.innerHTML = modalHTML
  // document.body.appendChild(modalElement)

  const modalEl = document.getElementById('matchmaking-modal')
  const modal = new bootstrap.Modal(modalEl, {
    backdrop: "static",
    keyboard: false,
  })

  modal.show()

  // // Store modal instance in a data attribute for easy access later
  // modal.modalInstance = matchmakingModal
}

export function closeMatchmakingModal() {
  const modalElement = document.getElementById('matchmaking-modal');

  if (modalElement) {

      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
          console.log('calling hide()');
          hideModalGently(modalInstance);
      }

      const dismissBtn = document.getElementById('dismiss');
      if (dismissBtn) {
          dismissBtn.click();
      }
  }
}




export function handleJoinMatchmakingMatch(gameKey) {

  localStorage.removeItem("isOnQueue")

  setTimeout(() => {
    closeMatchmakingModal();
    navigateTo("/chess", gameKey)
  }, 2000)
}

// Clean up on page load
document.addEventListener("DOMContentLoaded", async () => {
  //console.log("DOM content loaded - checking queue status")

  // Clean up any existing modals
  // cleanupExistingModals()

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

// // Add an unload listener to clean up when navigating away
// window.addEventListener("beforeunload", () => {
//   cleanupExistingModals()
// })

