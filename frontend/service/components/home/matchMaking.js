import { joinMatchmaking, leaveMatchmaking } from "../../app/chess.js";

export async function initMatchmaking() {
    if (await handleJoinMatchmaking()) {
        launchMatchmakingModal();
    }
}

async function handleJoinMatchmaking() {
    const response = await joinMatchmaking();
    if (response.status === "succes") {
        console.log("joining to matchmaking queue...");
        return true;
    } else {
        console.error("Error while joining matchmaking queue:", error);
        return false;
    }
}

async function handleLeaveMatchmaking() {
    const response = await leaveMatchmaking();
    if (response.status === "succes") {
        console.log("joining to matchmaking queue...");
        return true;
    } else {
        console.error("Error while leaving matchmaking queue:", error);
        return false;
    }
}


function launchMatchmakingModal() {
    const modalHTML = `
        <div class="modal fade" id="wait-match" tabindex="-1" aria-labelledby="waitGameLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title ctm-text-title" id="waitGameLabel">Matchmaking</h5>
                        <button id="close-matchmaking-modal"type="button" class="close-modal" aria-label="Close">x</button>
                    </div>
                    <div class="modal-body">
                    <div class="loading-bars d-flex justify-content-center align-items-center mb-2">
                        <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
                    </div>
                        <p id="waiting-text" class="text-center"> Waiting for a match</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement);

    const modal = new bootstrap.Modal(modalElement.querySelector('#wait-match'), {
        backdrop: 'static', // Evita cerrar la modal al hacer clic fuera
        keyboard: false     // Evita cerrar la modal con la tecla escape
    });
    modal.show();

    modalElement.querySelector('#wait-match').addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });

    const closeBtn = document.getElementById("close-matchmaking-modal");
    closeBtn.addEventListener('click', () => {
        if (handleLeaveMatchmaking()) {
            modal.hide();
        }
    })
}