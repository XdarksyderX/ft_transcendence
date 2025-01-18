import { captureNotation } from "../Events/global.js";
let num = 1;
const pieceNotation = {
    "pawn": "",
    "rook": "R",
    "knight": "N",
    "bishop": "B",
    "queen": "Q",
    "king": "K"
};

function logMoves(logMoves, inTurn, piece, castlingType) {
    const pieceName = piece.piece_name.split('_')[1].toLowerCase();
    const pieceLetter = pieceNotation[pieceName] || "";
    const isCapture = captureNotation ? "x" : "";
    let moveNotation = `${pieceLetter}${isCapture}${logMoves.to}`;
    const leftCol = document.getElementById("leftCol");
    const rightCol = document.getElementById("rightCol");
    const targetCol = inTurn === "white" ? leftCol : rightCol;
    if (castlingType) {
        moveNotation = castlingType;
        if (targetCol.children.length > 1) {
            targetCol.removeChild(targetCol.children[targetCol.children.length - 1]);
            if (targetCol === leftCol)
                num--;
        }
    }
    if (inTurn == "white") {
        const row = document.createElement("div");
        row.classList.add('row');
        row.innerHTML = `${num}. ${moveNotation}`;
        leftCol.appendChild(row);
        num++;
    }
    else {
        const row = document.createElement("div");
        row.classList.add('row');
        row.innerHTML = `${moveNotation}`;
        rightCol.appendChild(row);
    }
    // Scroll to the bottom of the move logger
    const moveLogger = document.getElementById("move_logger");
    moveLogger.scrollTop = moveLogger.scrollHeight;
}

function appendPromotion(inTurn, pieceName) {
    const letter = getLetterAfterUnderscore(pieceName);
    const col = inTurn === "black" ? "left" : "right";
    const targetCol = document.getElementById(`${col}Col`);
    if (targetCol && targetCol.lastChild)
        targetCol.lastChild.innerHTML += `=${letter}`;
}

function getLetterAfterUnderscore(str) {
    const parts = str.split('_');
    if (parts.length > 1)
      return parts[1].charAt(0);
    return '';
}

export { logMoves, appendPromotion }