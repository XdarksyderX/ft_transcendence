//me gustaria intentar dejar esto más bonito
//black pieces
function blackPawn(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/pawn.png", };
}

function blackRook(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/rook.png", };
}

function blackKnight(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/knight.png", };
}

function blackBishop(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/bishop.png", };
}

function blackKing(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/king.png", };
}

function blackQueen(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/queen.png", };
}

//white pieces
function whitePawn(current_pos)
{
  return { current_pos, img: "Assets/pieces/white/pawn.png", };
}

function whiteRook(current_pos)
{
  return { current_pos, img: "Assets/pieces/white/rook.png", };
}

function whiteKnight(current_pos)
{
  return { current_pos, img: "Assets/pieces/white/knight.png", };
}

function whiteBishop(current_pos)
{
  return { current_pos, img: "Assets/pieces/white/bishop.png", };
}

function whiteKing(current_pos)
{
  return { current_pos, img: "Assets/pieces/white/king.png", };
}

function whiteQueen(current_pos)
{
  return { current_pos, img: "Assets/pieces/white/queen.png", };
}

export { blackPawn, blackRook, blackKnight, blackBishop, blackKing, blackQueen,
  whitePawn, whiteRook, whiteKnight, whiteBishop, whiteKing, whiteQueen, };