import { globalState, keySquareMapper } from "../index.js";

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
    console.log("un rehplandó y hase PUUUUM");
    const affectedPieces = getAllAffectedPieces(pos);
    affectedPieces.forEach(element => {
        const opSquare = keySquareMapper[element]
        const opPiece = document.getElementById(element);
        const flatData = globalState.flat();

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
}

export { removeSurroundingPieces }