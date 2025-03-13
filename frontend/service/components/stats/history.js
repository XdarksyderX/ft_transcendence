import { getPongMatchHistory } from "../../app/pong.js";
//import { getChessMatchHistory } from "../../app/chess.js";

async function getChessMatchHistory() {
    return {
        "status": "success",
        "message": "Match history retrieved successfully",
        "matches": [
            {
                "id": 1,
                "player_white": {
                    "id": 1,
                    "username": "player1"
                },
                "player_black": {
                    "id": 2,
                    "username": "player2"
                },
                "status": "finished",
                "winner": "player1",
                "created_at": "2025-02-01T12:00:00Z",
                "updated_at": "2025-02-01T14:00:00Z",
                "moves": [
                    "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7"
                ]
            },
            {
                "id": 2,
                "player_white": {
                    "id": 3,
                    "username": "player3"
                },
                "player_black": {
                    "id": 1,
                    "username": "player1"
                },
                "status": "finished",
                "winner": "player3",
                "created_at": "2025-02-02T12:00:00Z",
                "updated_at": "2025-02-02T14:00:00Z",
                "moves": [
                    "d2d4", "d7d5", "c2c4", "e7e6", "g1f3", "g8f6", "c4d5", "e6d5", "b1c3", "f8b4"
                ]
            }
        ]
    };
}
//async function getPongMatchHistory() {
//    return {
//        "status": "success",
//        "message": "Match history retrieved successfully",
//        "matches": [
//            {
//                "id": 1,
//                "player1": {
//                    "id": 1,
//                    "username": "player1"
//                },
//                "player2": {
//                    "id": 2,
//                    "username": "player2"
//                },
//                "status": "finished",
//                "winner": "player1",
//                "created_at": "2025-02-01T12:00:00Z",
//                "updated_at": "2025-02-01T14:00:00Z",
//                "score": {
//                    "player1": 21,
//                    "player2": 15
//                }
//            },
//            {
//                "id": 2,
//                "player1": {
//                    "id": 3,
//                    "username": "player3"
//                },
//                "player2": {
//                    "id": 1,
//                    "username": "player1"
//                },
//                "status": "finished",
//                "winner": "player3",
//                "created_at": "2025-02-02T12:00:00Z",
//                "updated_at": "2025-02-02T14:00:00Z",
//                "score": {
//                    "player1": 21,
//                    "player2": 18
//                }
//            },
//            {
//                "id": 2,
//                "player1": {
//                    "id": 3,
//                    "username": "player3"
//                },
//                "player2": {
//                    "id": 1,
//                    "username": "player1"
//                },
//                "status": "finished",
//                "winner": "",
//                "created_at": "2025-02-02T12:00:00Z",
//                "updated_at": "2025-02-02T14:00:00Z",
//                "score": {
//                    "player1": 15,
//                    "player2": 15
//                }
//            }
//        ]
//    };
//}

export function renderMatchHistory() {
	renderPongMatchHistory();
	renderChessMatchHistory();
}


async function handleGetMatchHistory(game) {
    const response = game === 'pong' ? await getPongMatchHistory() : await getChessMatchHistory();
    console.log("match History: ", response);
    return response.matches;
}


async function renderPongMatchHistory() {
    const matches = await handleGetMatchHistory('pong');
    const container = document.getElementById('full-pong-history');
    matches.forEach(match => {
        const card = createPongMatchCard(match);
        container.appendChild(card);
    });
}

async function renderChessMatchHistory() {
    const matches = await handleGetMatchHistory('chess');
    const container = document.getElementById('full-chess-history');
    matches.forEach(match => {
        const card = createChessMatchCard(match);
        container.appendChild(card);
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function createPongMatchCard(match) {
  const isPlayer1Winner = match.winner === match.player1;
  const isPlayer2Winner = match.winner === match.player2;
  const date = formatDateTime(match.created_at);

  const card = document.createElement('div');
  card.innerHTML = `
    <div class="history-card overflow-hidden">
      <div class="card-body text-center position-relative" style="z-index: 1;">
        <small class="text-center mb-2 small ctm-text-light">${date}</small>
        <div class="row justify-content-center align-items-center">
          <div class="col-5 text-center">
            <p class="ctm-text-title score ${isPlayer1Winner ? 'winner' : ''}">${match.score_player1}</p>
            <div class="ctm-text-light">
              ${match.player1} ${isPlayer1Winner ? "👑" : ""}
            </div>
          </div>
          <div class="col-2">vs</div>
          <div class="col-5 text-center">
            <p class="ctm-text-title score">${match.score_player2}</p>
            <div class="ctm-text-light">
              ${match.player2} ${isPlayer2Winner ? "👑" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return card;
}


function createChessMatchCard(match) {
  const isWhiteWinner = match.winner === match.player_white.username;
  const isBlackWinner = match.winner === match.player_black.username;
  const date = formatDateTime(match.created_at);

  const card = document.createElement('div');
  card.innerHTML = `
    <div class="history-card overflow-hidden">
      <div class="card-body text-center position-relative" style="z-index: 1;">
        <small class="text-center mb-2 small ctm-text-light">${date}</small>
        <div class="row justify-content-center align-items-center">
          <div class="col-5 text-center">
            <p class="ctm-text-title score ${isWhiteWinner ? 'winner' : ''}">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path fill="var(--light)" d="
                  M256 40c-44.2 0-80 35.8-80 80 0 28.1 14.4 52.9 36.2 67.8-39 11.4-68.2 
                  47.7-68.2 90.2v8h224v-8c0-42.5-29.1-78.8-68.2-90.2 
                  21.8-14.9 36.2-39.7 36.2-67.8 0-44.2-35.8-80-80-80z
                  M128 320h256c49.8 21.9 84.8 71.4 84.8 128v24H43.2v-24
                  c0-56.6 35-106.1 84.8-128z
                "/>
              </svg>
            </p>
            <div class="ctm-text-light">
              ${match.player_white.username} ${isWhiteWinner ? "👑" : ""}
            </div>
          </div>
          <div class="col-2">vs</div>
          <div class="col-5 text-center">
            <p class="ctm-text-title score ${isBlackWinner ? 'winner' : ''}">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="background-color: var(--light);">
                <path fill="var(--dark)" d="
                  M256 40c-44.2 0-80 35.8-80 80 0 28.1 14.4 52.9 36.2 67.8-39 11.4-68.2 
                  47.7-68.2 90.2v8h224v-8c0-42.5-29.1-78.8-68.2-90.2 
                  21.8-14.9 36.2-39.7 36.2-67.8 0-44.2-35.8-80-80-80z
                  M128 320h256c49.8 21.9 84.8 71.4 84.8 128v24H43.2v-24
                  c0-56.6 35-106.1 84.8-128z
                "/>
              </svg>
            </p>
            <div class="ctm-text-light">
              ${match.player_black.username} ${isBlackWinner ? "👑" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return card;
}