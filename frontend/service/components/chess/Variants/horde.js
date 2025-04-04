// import * as piece from "../Data/pieces.js";
import { globalPiece } from "../Render/main.js";
import { checkEnPassant, checkSquareCaptureId, pawnCaptureOptions, checkOpponetPieceByElement } from "../Helper/commonHelper.js";
import { keySquareMapper } from "../index.js";

// const piecePositionsHorde = {
//   "a8": piece.blackRook,
//   "h8": piece.blackRook,
//   "b8": piece.blackKnight,
//   "g8": piece.blackKnight,
//   "c8": piece.blackBishop,
//   "f8": piece.blackBishop,
//   "d8": piece.blackQueen,
//   "e8": piece.blackKing,
// };

// function renderHordePieces(square, globalPiece, assignSpecificPiece) {
//   if (square.id[1] == 7) {
//     square.piece = piece.blackPawn(square.id);
//     globalPiece.black_pawns.push(square.piece);
//   } else if (square.id[1] == 1 || square.id[1] == 2 || square.id[1] == 3 || square.id[1] == 4
//     || square.id == "b5" || square.id == "c5" || square.id == "f2" || square.id == "g2") {
//     square.piece = piece.whitePawn(square.id);
//     globalPiece.white_pawns.push(square.piece);
//   } else if (piecePositionsHorde[square.id]) {
//     square.piece = piecePositionsHorde[square.id](square.id);
//     assignSpecificPiece(square);
//   }
// }

function generateHordePosition() {
    const positionMap = {};
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // Rows 1 to 4 are filled with white pawns
    for (let row = 1; row <= 4; row++) {
        files.forEach(file => {
            const position = `${file}${row}`;
            positionMap[position] = "Pawn";
        });
    }

    // Special white pawns at specific positions
    const specialWhitePawns = ["b5", "c5", "f5", "g5"];
    specialWhitePawns.forEach(position => {
        positionMap[position] = "Pawn";
    });

    // Row 7 is filled with black pawns
    for (let col = 0; col < 8; col++) {
        const position = `${files[col]}7`;
        positionMap[position] = "Pawn";
    }

    // Row 8 is filled with black back rank pieces
    const blackBackRank = ["Rook", "Knight", "Bishop", "Queen", "King", "Bishop", "Knight", "Rook"];
    blackBackRank.forEach((piece, col) => {
        const position = `${files[col]}8`;
        positionMap[position] = piece;
    });

    return positionMap;
}

function whitePawnHordeMoves(piece) {
  let highlightSquareIds = null;
  const curr_pos = piece.current_pos;
  const direction = 1;
  if (curr_pos[1] == 1 || curr_pos[1] == 2) {
      highlightSquareIds = [
          `${curr_pos[0]}${Number(curr_pos[1]) + direction}`,
          `${curr_pos[0]}${Number(curr_pos[1]) + (direction * 2)}`, ];
  }
  else {
      highlightSquareIds = [`${curr_pos[0]}${Number(curr_pos[1]) + direction}`,];
      let enPassant = "";
      if (enPassant = checkEnPassant(curr_pos, "white", direction)) {
          highlightSquareIds.push(enPassant);
      }
  }
  highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  return highlightSquareIds;
}

function checkWinForBlackHorde() {
  for (const key in globalPiece) {
    if (key.includes("white") && globalPiece[key] !== null) {
      if (Array.isArray(globalPiece[key])) {
        for (const piece of globalPiece[key]) {
          if (piece.current_pos !== null) {
            // debugger
            //console.log("on blackHordeCheck: ", piece.current_pos);
            return false;
          }
        }
      } else if (globalPiece[key].current_pos !== null) {
        return false;
      }
    }
  }
  return "Black";
}

function whitePawnHordeRenderMoves (piece, color, circleHighlightRenderFunc) {
  const movesIds = whitePawnHordeMoves(piece);
  circleHighlightRenderFunc(movesIds, keySquareMapper);
  const captureIds = pawnCaptureOptions(piece.current_pos, color);
  captureIds.forEach(element => checkOpponetPieceByElement(element, color));
}

export { checkWinForBlackHorde, whitePawnHordeRenderMoves, generateHordePosition }