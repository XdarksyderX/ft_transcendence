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

/* function logMoves(logMoves, inTurn, piece) {
    const pieceName = piece.piece_name.split('_')[1].toLowerCase();
    const pieceLetter = pieceNotation[pieceName] || "";
    const isCapture = captureNotation ? "x" : "";
    const moveNotation = `${pieceLetter}${isCapture}${logMoves.to}`;
    if (inTurn == "white") {
        const list = document.createElement('li');
        //list.classList.add('d-flex');
        list.innerHTML = `<span class="leftSide">${moveNotation}</span>`;
        orderList.appendChild(list);
    }
    else {
        const allLiArray = orderList.querySelectorAll('li');
        const LastLi = allLiArray[allLiArray.length - 1];
        LastLi.innerHTML += `<span class="rightSide">${moveNotation}</span>`;
    }
} */

function logMoves(logMoves, inTurn, piece) {
    const pieceName = piece.piece_name.split('_')[1].toLowerCase();
    const pieceLetter = pieceNotation[pieceName] || "";
    const isCapture = captureNotation ? "x" : "";
    const moveNotation = `${pieceLetter}${isCapture}${logMoves.to}`;
    const leftCol = document.getElementById("leftCol");
    const rightCol = document.getElementById("rightCol");
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
}

export default logMoves;