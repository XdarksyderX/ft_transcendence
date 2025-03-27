import * as piece from "../Data/pieces.js";
import { globalState, highlightColor, updateInTurn } from "../index.js";
import { getChess960Piece } from "../Variants/chess960.js";
import { renderHordePieces } from "../Variants/horde.js";
import { initGameRender } from "../Render/main.js";
import { convertToPiecePositions } from "./online.js";

const matchDetail = {
	gameMode: 'classic', // migración
	inTurn: true // initGameRenders needs a boolean
}

function initOfflineChess() {

	console.log("initializing offline chess");
    const whoIsWho = {
        player1: 'white',
        player2: 'black'
    }
    const piecePositions = convertToPiecePositions(getBoard());
//    renderPlayers(whoIsWho); migración
    initGameRender(globalState, piecePositions, matchDetail);
    updateInTurn('white'); // GlobalState needs inTurn to be a string

}


function getBoard() {
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

    return board;
}

export { initOfflineChess }