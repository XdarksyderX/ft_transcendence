//black pieces
function blackPawn(current_pos) {
  return { current_pos, img: "Assets/pieces/black/pawn.png", piece_name: "BLACK_PAWN", };
}

function blackRook(current_pos) {
  return { current_pos, img: "Assets/pieces/black/rook.png", piece_name: "BLACK_ROOK", };
}

function blackKnight(current_pos) {
  return { current_pos, img: "Assets/pieces/black/knight.png", piece_name: "BLACK_KNIGHT", };
}

function blackBishop(current_pos) {
  return { current_pos, img: "Assets/pieces/black/bishop.png", piece_name: "BLACK_BISHOP", };
}

function blackKing(current_pos) {
  return { current_pos, img: "Assets/pieces/black/king.png", piece_name: "BLACK_KING", };
}

function blackQueen(current_pos) {
  return { current_pos, img: "Assets/pieces/black/queen.png", piece_name: "BLACK_QUEEN", };
}

//white pieces
function whitePawn(current_pos) {
  return { current_pos, img: "Assets/pieces/white/pawn.png", piece_name: "WHITE_PAWN", };
}

function whiteRook(current_pos) {
  return { current_pos, img: "Assets/pieces/white/rook.png", piece_name: "WHITE_ROOK", };
}

function whiteKnight(current_pos) {
  return { current_pos, img: "Assets/pieces/white/knight.png", piece_name: "WHITE_KNIGHT", };
}

function whiteBishop(current_pos) {
  return { current_pos, img: "Assets/pieces/white/bishop.png", piece_name: "WHITE_BISHOP", };
}

function whiteKing(current_pos) {
  return { current_pos, img: "Assets/pieces/white/king.png", piece_name: "WHITE_KING", };
}

function whiteQueen(current_pos) {
  return { current_pos, img: "Assets/pieces/white/queen.png", piece_name: "WHITE_QUEEN", };
}

export { blackPawn, blackRook, blackKnight, blackBishop, blackKing, blackQueen,
  whitePawn, whiteRook, whiteKnight, whiteBishop, whiteKing, whiteQueen, };