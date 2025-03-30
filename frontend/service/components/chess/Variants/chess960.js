import * as piece from "../Data/pieces.js";
import { piecePositions } from "../Render/main.js";

//reasign the intial positions of the pieces in the piecePostion var
// function getChess960Piece() {
//     const chess960Positions = generateChess960Position();
//     Object.keys(chess960Positions).forEach(key => {
//         piecePositions[key] = (key[1] === '1' ? piece[`white${chess960Positions[key]}`] : piece[`black${chess960Positions[key]}`]);
//     });
// }

/**
 * This function generates a random initial position for the Chess960 variant.
 * 
 * The rules for Chess960 are:
 * - The two bishops must be placed on opposite-colored squares.
 * - The king must be placed between the two rooks.
 * - The opponent's pieces mirror the player's pieces.
 * 
 * The function follows these steps:
 * 1. Initialize an array `positions` with 8 null values to represent the 8 squares on the first rank.
 * 2. Randomly place the two bishops on opposite-colored squares.
 * 3. Randomly place the queen and the knights on one of the remaining empty squares.
 * 5. Place the two rooks and the king on the remaining three squares, ensuring the king is between the rooks.
 * 6. Create a `positionMap` object to map the file (a-h) and rank (1 for white, 8 for black) to the piece type.
 * @returns {Object} An object representing the initial positions of the pieces for Chess960.
 */
function generateChess960Position() {
    const positions = Array(8).fill(null);

    const bishop1Pos = Math.floor(Math.random() * 4) * 2;
    const bishop2Pos = Math.floor(Math.random() * 4) * 2 + 1;
    positions[bishop1Pos] = "Bishop";
    positions[bishop2Pos] = "Bishop";

    placePiece(positions, "Queen");
    placePiece(positions, "Knight");
    placePiece(positions, "Knight");

    const remainingPositions = positions.map((pos, index) => pos === null ? index : null).filter(pos => pos !== null);
    positions[remainingPositions[0]] = "Rook";
    positions[remainingPositions[1]] = "King";
    positions[remainingPositions[2]] = "Rook";

    const positionMap = {};
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    positions.forEach((piece, index) => {
        positionMap[`${files[index]}1`] = piece;
        positionMap[`${files[index]}8`] = piece;
    });
    return positionMap;
}

/**
 * This helper function places a given piece in a random empty position on the board.
 * 
 * First, we identify all empty positions in the `positions` array, then we select a
 * random empty position, so we can finally place the given piece in the selected position.
 * @param {Array} positions The actual randomized positions of the pieces.
 * @param {string} piece The piece to be placed
 */
function placePiece(positions, piece) {
    const remainingPositions = positions.map((pos, index) => pos === null ? index : null).filter(pos => pos !== null);
    const pos = remainingPositions[Math.floor(Math.random() * remainingPositions.length)];
    positions[pos] = piece;
}

export { generateChess960Position }