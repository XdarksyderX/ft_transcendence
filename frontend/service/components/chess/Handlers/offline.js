import { globalState, updateInTurn } from "../index.js";
 import { generateHordePosition } from "../Variants/horde.js";
import { generateChess960Position } from "../Variants/chess960.js";
import { initGameRender } from "../Render/main.js";
import { convertToPiecePositions } from "./online.js";
import { renderPlayers } from "../Render/main.js";
import { resetLoggerIndex } from "../Helper/logging.js";

const offlineInfo = {
	gameMode: null,
	inTurn: true // initGameRenders needs a boolean
}

function initOfflineChess() {

	console.log("initializing offline chess");
    const whoIsWho = {
        player1: 'white',
        player2: 'black'
    }
    if (sessionStorage.getItem('chessMoves')) {
        sessionStorage.removeItem('chessMoves')
    }
    resetLoggerIndex();
    offlineInfo.gameMode = 	sessionStorage.getItem('chessVariant');
    const piecePositions = convertToPiecePositions(getBoard());
    renderPlayers(whoIsWho);
    initGameRender(globalState, piecePositions, offlineInfo);
    updateInTurn('white'); // GlobalState needs inTurn to be a string

}

function getBoard() {
    const variant = offlineInfo.gameMode;
    console.log("variant: ", variant);
    switch (variant) {
        case 'horde':
            return getHordeBoard();
        case '960':
            return get960Board();
        default:
            return getClassicBoard();
    }
}

function getClassicBoard() {
    const board = {};
    const pieceSetup = {
        1: ["Rook", "Knight", "Bishop", "Queen", "King", "Bishop", "Knight", "Rook"],
        2: Array(8).fill("Pawn"),
        7: Array(8).fill("Pawn"),
        8: ["Rook", "Knight", "Bishop", "Queen", "King", "Bishop", "Knight", "Rook"]
    };

    const colors = {
        1: "white",
        2: "white",
        7: "black",
        8: "black"
    };

    for (let row = 1; row <= 8; row++) {
        for (let col = 0; col < 8; col++) {
            const position = String.fromCharCode(97 + col) + row; // 'a' + col + row
            if (pieceSetup[row]) {
                const type = pieceSetup[row][col];
                const color = colors[row];
                const piece_id = type === "Pawn" ? (col + 1).toString() : (col < 4 ? "1" : "2");
                board[position] = {
                    type,
                    color,
                    position,
                    piece_id: ["King", "Queen"].includes(type) ? "" : piece_id,
                    has_moved: false
                };
            } else {
                board[position] = null;
            }
        }
    }
    console.log("classic Board: ", board);
    return board;
}

function getHordeBoard() {
    const board = {};
    const pieceSetup = generateHordePosition(); // Generate the Horde Chess positions

    for (let row = 1; row <= 8; row++) {
        for (let col = 0; col < 8; col++) {
            const position = String.fromCharCode(97 + col) + row; // 'a' + col + row
            if (pieceSetup[position]) {
                const type = pieceSetup[position];
                const color = row <= 5 ? "white" : "black"; // Rows 1-4 are white, rows 7-8 are black
                const piece_id = type === "Pawn" ? (col + 1).toString() : (col < 4 ? "1" : "2");
                board[position] = {
                    type,
                    color,
                    position,
                    piece_id: ["King", "Queen"].includes(type) ? "" : piece_id,
                    has_moved: false
                };
            } else {
                board[position] = null; // Empty squares
            }
        }
    }
    console.log("hordeBoard: ", board)
    return board;
}

function get960Board() {
    const board = {};
    const pieceSetup = generateChess960Position(); // Generate the Chess960 back rank positions
    const colors = {
        1: "white",
        2: "white",
        7: "black",
        8: "black"
    };

    for (let row = 1; row <= 8; row++) {
        for (let col = 0; col < 8; col++) {
            const position = String.fromCharCode(97 + col) + row; // 'a' + col + row
            if (row === 1 || row === 8) {
                // Back rank pieces
                const type = pieceSetup[position];
                const color = row === 1 ? "white" : "black";
                const piece_id = (type === "King" || type === "Queen") ? "" : (col < 4 ? "1" : "2");
                board[position] = {
                    type,
                    color,
                    position,
                    piece_id,
                    has_moved: false
                };
            } else if (row === 2 || row === 7) {
                // Pawns
                const color = row === 2 ? "white" : "black";
                board[position] = {
                    type: "Pawn",
                    color,
                    position,
                    piece_id: (col + 1).toString(),
                    has_moved: false
                };
            } else {
                // Empty squares
                board[position] = null;
            }
        }
    }

    return board;
}

export { initOfflineChess, offlineInfo }