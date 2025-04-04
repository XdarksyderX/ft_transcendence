import { globalState, keySquareMapper, inTurn } from "../index.js";
import { winGame } from "../Helper/modalCreator.js";
import { chessSocket } from "../Handlers/online.js";

function getSurroundingSquares(pos) {
    const alpha = pos[0];
    const num = Number(pos[1]);
    const surroundingPositions = [];
    const alphaOffsets = [-1, 0, 1];
    const numOffsets = [-1, 0, 1];

    alphaOffsets.forEach(alphaOffset => {
        numOffsets.forEach(numOffset => {
            if (alphaOffset !== 0 || numOffset !== 0) {
                const newAlpha = String.fromCharCode(alpha.charCodeAt(0) + alphaOffset);
                const newNum = num + numOffset;
                if (newAlpha >= 'a' && newAlpha <= 'h' && newNum >= 1 && newNum <= 8) {
                    surroundingPositions.push(`${newAlpha}${newNum}`);
                }
            }
        });
    });
    return surroundingPositions;
}

function getAllAffectedPieces(pos) {
    let surrondingSquares = getSurroundingSquares(pos);
    let res = [];
    surrondingSquares.forEach(element => {
        const sq = keySquareMapper[element];
        if (sq.piece && !sq.piece.piece_name.includes("PAWN")) {
            res.push(element);
        }
    });
    return res;
}
  
function removeSurroundingPieces(pos) {
    const affectedPieces = getAllAffectedPieces(pos);
    let kingHasDied = false;

    affectedPieces.forEach(element => {
        const opSquare = keySquareMapper[element];
        const opPiece = document.getElementById(element);
        const flatData = globalState.flat();

        // Check if the piece being removed is a king
        if (opSquare.piece && opSquare.piece.piece_name.includes("KING")) {
            kingHasDied = true;
        }

        opPiece.classList.add('animate__animated', 'animate__tada', 'explosion-red');
        setTimeout(() => {
            flatData.forEach(el => {
                if (el.id === element)
                    el.piece.current_pos = null;
            });
            opPiece.innerHTML = "";
            delete opSquare.piece;
            opPiece.classList.remove('animate__animated', 'animate__tada', 'explosion-red');
        }, 1000);
    });
    if (kingHasDied && !chessSocket) {
        const winner = inTurn === 'white' ? 'black' : 'white';
        console.log(`[CHESS] not to be dramatic but ${inTurn} king has exploded`);
        setTimeout(() => { winGame(winner); }, 50);
    }
}

export { removeSurroundingPieces }