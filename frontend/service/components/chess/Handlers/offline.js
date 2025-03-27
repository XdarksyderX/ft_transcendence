import * as piece from "../Data/pieces.js";
import { globalState, highlightColor, updateInTurn } from "../index.js";
import { getChess960Piece } from "../Variants/chess960.js";
import { renderHordePieces } from "../Variants/horde.js";
import { initGameRender } from "../Render/main.js";
import { convertToPiecePositions } from "./online.js";



// export function initOfflineChess() {
//     let whoIsWho = {};
//     whoIsWho['player1'] = "white";
//     whoIsWho['player2'] = "black";
//     const piecePositions = {
//         "a8": piece.blackRook,
//         "h8": piece.blackRook,
//         "b8": piece.blackKnight,
//         "g8": piece.blackKnight,
//         "c8": piece.blackBishop,
//         "f8": piece.blackBishop,
//         "d8": piece.blackQueen,
//         "e8": piece.blackKing,
//         "a1": piece.whiteRook,
//         "h1": piece.whiteRook,
//         "b1": piece.whiteKnight,
//         "g1": piece.whiteKnight,
//         "c1": piece.whiteBishop,
//         "f1": piece.whiteBishop,
//         "d1": piece.whiteQueen,
//         "e1": piece.whiteKing
//       };
//     renderPlayers(whoIsWho);

//     initGameRender(globalState, piecePositions);

// }


// function initGameRender(data, piecePositions)
// {
//     const chessVariantTmp = 'classic';
//     globalPiece.black_pawns = [];
//      globalPiece.white_pawns = [];

//   if (chessVariantTmp === "960")
//     getChess960Piece();

//   data.forEach(element => {
//     const rowEl = document.createElement("div");
//     element.forEach((square) => {
//       const squareDiv = document.createElement("div");
//       squareDiv.id = square.id;
//       squareDiv.classList.add(square.color, "square");

//       if (chessVariantTmp === "horde") {
//         renderHordePieces(square, globalPiece, assignSpecificPiece);
//       } else {
//         if (square.id[1] == 7) {
//           square.piece = piece.blackPawn(square.id);
//           globalPiece.black_pawns.push(square.piece);
//         } else if (square.id[1] == 2) {
//           square.piece = piece.whitePawn(square.id);
//           globalPiece.white_pawns.push(square.piece);
//         } else if (piecePositions[square.id]) {
//           square.piece = piecePositions[square.id](square.id);
//           assignSpecificPiece(square, piecePositions);
//         }
//       }
//       rowEl.appendChild(squareDiv);
//     });
//     rowEl.classList.add("squareRow");
//     document.getElementById('root').appendChild(rowEl);
//   });
//   pieceRender(data);
// }

// function assignSpecificPiece(square) {
//     const color = square.id[1] == 8 || square.id[1] == 7 ? "black" : "white";
//     const fullName = piecePositions[square.id].name;
//     const pieceType = fullName.replace(color, '').toLowerCase();
    
//     if (pieceType === 'rook' || pieceType === 'knight' || pieceType === 'bishop')
//     assignRepeatedPiece(square, color, pieceType);
//     else
//     globalPiece[`${color}_${pieceType}`] = square.piece;
// }

// function assignRepeatedPiece(square, color, pieceType) {
//     if (globalPiece[`${color}_${pieceType}_1`])
//     globalPiece[`${color}_${pieceType}_2`] = square.piece;
//     else
//     globalPiece[`${color}_${pieceType}_1`] = square.piece;
// }
  

/// versión 2 porque va igual de mal pero es más pro :c


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
    updateInTurn('white');

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