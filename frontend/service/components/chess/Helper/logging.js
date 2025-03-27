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

// Load moves from localStorage
function reloadMoveLogger() {
    const savedMoves = JSON.parse(sessionStorage.getItem("chessMoves")) || [];
    console.log("reloading move logger to: ", savedMoves);
    const leftCol = document.getElementById("leftCol");
    const rightCol = document.getElementById("rightCol");
    savedMoves.forEach(move => {
        const row = document.createElement("div");
        row.classList.add('row');
        row.innerHTML = move.notation;
        if (move.inTurn === "white") {
            leftCol.appendChild(row);
        } else {
            rightCol.appendChild(row);
        }
    });
    num = Math.floor(savedMoves.length / 2) + 1;
}

function logMoves(logMoves, inTurn, piece, castlingType) {
    const pieceName = piece.piece_name.split('_')[1].toLowerCase();
    const pieceLetter = pieceNotation[pieceName] || "";
    const isCapture = captureNotation ? "x" : "";
    let moveNotation = `${pieceLetter}${isCapture}${logMoves.to}`;
    const leftCol = document.getElementById("leftCol");
    const rightCol = document.getElementById("rightCol");
    const targetCol = inTurn === "white" ? leftCol : rightCol;
    let row;

    if (castlingType) {
        moveNotation = castlingType;
        if (targetCol.children.length > 1) {
            targetCol.removeChild(targetCol.children[targetCol.children.length - 1]);
            if (targetCol === leftCol)
                num--;
        }
    }
    if (inTurn == "white") {
        row = document.createElement("div");
        row.classList.add('row');
        row.innerHTML = `${num}. ${moveNotation}`;
        leftCol.appendChild(row);
        num++;
    }
    else {
        row = document.createElement("div");
        row.classList.add('row');
        row.innerHTML = `${moveNotation}`;
        rightCol.appendChild(row);
    }

    // Save move to localStorage
    const savedMoves = JSON.parse(sessionStorage.getItem("chessMoves")) || [];
    savedMoves.push({ inTurn, notation: row.innerHTML });
    sessionStorage.setItem("chessMoves", JSON.stringify(savedMoves));

    // Scroll to the bottom of the move logger
    const moveLogger = document.getElementById("move-logger");
    moveLogger.scrollTop = moveLogger.scrollHeight;
}

function appendPromotion(pieceName) {
    const letter = getLetterAfterUnderscore(pieceName);
    const color = pieceName.split('_')[0];
    const col = color === "BLACK" ? "right" : "left";
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

export { logMoves, appendPromotion, reloadMoveLogger }