import { globalState } from "../index.js";
import { keySquareMapper } from "../index.js";

//function to check if opponnet piece exist
function checkOpponetPieceByElement(id, color) {
    const opponentColor = color === "white" ? "BLACK" : "WHITE";
    const element = keySquareMapper[id];

    if (!element)
        return false;

    if (element.piece && element.piece.piece_name.includes(opponentColor)) {
        const el = document.getElementById(id);
        el.classList.add("captureColor");
        element.captureHightlight = true;
        return true;
    }
    return false;
}

//function to check capture id square
function checkSquareCaptureId(array) {
    let returnArray = [];

    for (let i = 0; i < array.length; i++) {
        const squareId = array[i];
        const square = keySquareMapper[squareId];

        if (square.piece) {
            break;
        }
        returnArray.push(squareId);
    }
    return (returnArray);
}

//function to give highlight ids for bishop
function giveBishopHighlightIds(id) {
    console.log(keySquareMapper[id]);
    return [];
}

export { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds };