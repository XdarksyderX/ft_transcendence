//black pieces
function blackPawn(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/pawn.png", };
}

function blackRook(current_pos)
{
  return { current_pos, img: "Assets/pieces/black/rook.png", };
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

export { blackPawn, whitePawn };