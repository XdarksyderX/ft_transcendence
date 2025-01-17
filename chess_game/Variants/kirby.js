//its a kind of absortion/cannibal chess but modify to muy own rules
//when a piece capture another -> it convert itself in the piece captured
//I'm not sure what I'm going to do with the king xdd

import * as pieces from "../Data/pieces.js";
//import { blackKnight, whiteKnight } from "../Data/pieces.js";
import { globalPiece } from "../Render/main.js"
import { globalPieceUpdate, callbackPiece } from "../Events/global.js";

function getPieceType(piece) {
  const pieceType = piece.piece_name.split('_')[1].toLowerCase();
  return pieceType;
}

function test(square, capturedPiece) {
  let piece = square.piece;

  if (capturedPiece && capturedPiece.piece_name.includes("KING")) 
    return;
  if (getPieceType(capturedPiece) == getPieceType(piece))
    return;

  console.log(capturedPiece, piece);
  console.log(globalPiece);

  if (capturedPiece.piece_name.includes("BLACK_KNIGHT")) {
    callbackPiece(pieces.whiteKnight, square.id);
  }
  else if (capturedPiece.piece_name.includes("WHITE_KNIGHT")) {
    callbackPiece(pieces.blackKnight, square.id);
  }
}

export { test }