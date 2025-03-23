/*its a kind of absortion/cannibal chess but modify to muy own rules
when a piece capture another -> it convert itself in the piece captured
Because I'm not sure how it would affect to the endgame that this rule applies
to the king too, I'm gonna exclude him directly to avoid futher conflicts
if a pawn captures in its last row of th board, the promotion has priority*/

import * as pieces from "../Data/pieces.js";
import { callbackPiece } from "../Events/global.js";

const pieceMap = {
  "BLACK_PAWN": pieces.whitePawn,
  "WHITE_PAWN": pieces.blackPawn,
  "BLACK_BISHOP": pieces.whiteBishop,
  "WHITE_BISHOP": pieces.blackBishop,
  "BLACK_ROOK": pieces.whiteRook,
  "WHITE_ROOK": pieces.blackRook,
  "BLACK_KNIGHT": pieces.whiteKnight,
  "WHITE_KNIGHT": pieces.blackKnight,
  "BLACK_QUEEN": pieces.whiteQueen,
  "WHITE_QUEEN": pieces.blackQueen
};

function kirbyTransformation(square, capturedPiece) {
  let piece = square.piece;

  if (piece && piece.piece_name.includes("KING")) 
    return;
  if (getPieceType(capturedPiece) == getPieceType(piece))
    return;
  const newPiece = pieceMap[capturedPiece.piece_name];
  if (newPiece)
    callbackPiece(newPiece, square.id);
}

function getPieceType(piece) {
  const pieceType = piece.piece_name.split('_')[1].toLowerCase();
  return pieceType;
}

export { kirbyTransformation }