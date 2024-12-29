import { imgStyle } from "../index.js";
//black pieces
function blackPawn(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/black/pawn.png`, piece_name: "BLACK_PAWN", move: false};
}

function blackRook(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/black/rook.png`, piece_name: "BLACK_ROOK", };
}

function blackKnight(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/black/knight.png`, piece_name: "BLACK_KNIGHT", move: false };
}

function blackBishop(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/black/bishop.png`, piece_name: "BLACK_BISHOP", };
}

function blackKing(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/black/king.png`, piece_name: "BLACK_KING", move: false };
}

function blackQueen(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/black/queen.png`, piece_name: "BLACK_QUEEN", };
}

//white pieces
function whitePawn(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/white/pawn.png`, piece_name: "WHITE_PAWN", };
}

function whiteRook(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/white/rook.png`, piece_name: "WHITE_ROOK", move: false };
}

function whiteKnight(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/white/knight.png`, piece_name: "WHITE_KNIGHT", };
}

function whiteBishop(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/white/bishop.png`, piece_name: "WHITE_BISHOP", };
}

function whiteKing(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/white/king.png`, piece_name: "WHITE_KING", move: false };
}

function whiteQueen(current_pos) {
  return { current_pos, img: `Assets/pieces/${imgStyle}/white/queen.png`, piece_name: "WHITE_QUEEN", };
}

export { blackPawn, blackRook, blackKnight, blackBishop, blackKing, blackQueen,
  whitePawn, whiteRook, whiteKnight, whiteBishop, whiteKing, whiteQueen, };