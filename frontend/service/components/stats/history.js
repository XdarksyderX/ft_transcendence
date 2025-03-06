//import { getPongMatchHistory } from "../../app/pong.js";
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
async function getPongMatchHistory() {
    return {
        "status": "success",
        "message": "Match history retrieved successfully",
        "matches": [
            {
                "id": 1,
                "player1": {
                    "id": 1,
                    "username": "player1"
                },
                "player2": {
                    "id": 2,
                    "username": "player2"
                },
                "status": "finished",
                "winner": "player1",
                "created_at": "2025-02-01T12:00:00Z",
                "updated_at": "2025-02-01T14:00:00Z",
                "score": {
                    "player1": 21,
                    "player2": 15
                }
            },
            {
                "id": 2,
                "player1": {
                    "id": 3,
                    "username": "player3"
                },
                "player2": {
                    "id": 1,
                    "username": "player1"
                },
                "status": "finished",
                "winner": "player3",
                "created_at": "2025-02-02T12:00:00Z",
                "updated_at": "2025-02-02T14:00:00Z",
                "score": {
                    "player1": 21,
                    "player2": 18
                }
            }
        ]
    };
}

async function handleGetMatchHistory(game) {
    const response = game === 'pong' ? await getPongMatchHistory() : await getChessMatchHistory();
    console.log("match History: ", response);
}

export function renderMatchHistory() {
	handleGetMatchHistory('pong');
}

