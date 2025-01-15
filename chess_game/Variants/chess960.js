import * as piece from "../Data/pieces.js";
import { piecePositions } from "../Render/main.js";

function generateChess960Position() {
  const positions = Array(8).fill(null);
  const pieces = ["Rook", "Knight", "Bishop", "Queen", "King", "Bishop", "Knight", "Rook"];

  // Place bishops on different color squares
  const bishop1Pos = Math.floor(Math.random() * 4) * 2;
  const bishop2Pos = Math.floor(Math.random() * 4) * 2 + 1;
  positions[bishop1Pos] = "Bishop";
  positions[bishop2Pos] = "Bishop";

  // Place the queen
  let remainingPositions = positions.map((pos, index) => pos === null ? index : null).filter(pos => pos !== null);
  const queenPos = remainingPositions[Math.floor(Math.random() * remainingPositions.length)];
  positions[queenPos] = "Queen";

  // Place the knights
  remainingPositions = positions.map((pos, index) => pos === null ? index : null).filter(pos => pos !== null);
  const knight1Pos = remainingPositions[Math.floor(Math.random() * remainingPositions.length)];
  positions[knight1Pos] = "Knight";
  remainingPositions = positions.map((pos, index) => pos === null ? index : null).filter(pos => pos !== null);
  const knight2Pos = remainingPositions[Math.floor(Math.random() * remainingPositions.length)];
  positions[knight2Pos] = "Knight";

  // Place the rooks and king
  remainingPositions = positions.map((pos, index) => pos === null ? index : null).filter(pos => pos !== null);
  positions[remainingPositions[0]] = "Rook";
  positions[remainingPositions[1]] = "King";
  positions[remainingPositions[2]] = "Rook";

  const positionMap = {};
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  positions.forEach((piece, index) => {
    positionMap[`${files[index]}1`] = piece;
    positionMap[`${files[index]}8`] = piece;
  });

  console.log(positionMap)
  return positionMap;
}

function getChess960Piece() {
    const chess960Positions = generateChess960Position();
    Object.keys(chess960Positions).forEach(key => {
      piecePositions[key] = (key[1] === '1' ? piece[`white${chess960Positions[key]}`] : piece[`black${chess960Positions[key]}`]);
    });
}
/*   switch (position) {
    case "Rook":
      return color === "white" ? piece.whiteRook : piece.blackRook;
    case "Knight":
      return color === "white" ? piece.whiteKnight : piece.blackKnight;
    case "Bishop":
      return color === "white" ? piece.whiteBishop : piece.blackBishop;
    case "Queen":
      return color === "white" ? piece.whiteQueen : piece.blackQueen;
    case "King":
      return color === "white" ? piece.whiteKing : piece.blackKing;
  } */

export { generateChess960Position, getChess960Piece };