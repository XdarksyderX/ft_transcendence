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

//function to give highlight ids for bishop. The movement is diagonal
function giveBishopHighlightIds(id) {
    //will give top left ids
    function topLeft(id) {
        let alpha = id[0];
        let num = Number(id[1]);
        let returnArr = [];

        while (alpha == "a" || num == 8) {
            num = Number(id[1]) + 1;
            alpha = String.fromCharCode(id[0].charCodeAt(0) - 1);
            returnArr.push(`${alpha}${num}`);
        }
    
        //return `${String.fromCharCode(id[0].charCodeAt(0) - 1)}${num}`;
        return returnArr;
    }
    //will give bottom left ids
    function bottonLeft(id) {
        if (id[0] == "a" || Number(id[1]) == 1)
            return false;
        let num = Number(id[1]) - 1;
        return `${String.fromCharCode(id[0].charCodeAt(0) - 1)}${num}`;
    }
    //will give top right ids
    function topRight(id) {
        if (id[0] == "h" || Number(id[1]) == 8)
            return false;
        
        let num = Number(id[1]) + 1;
        return `${String.fromCharCode(id[0].charCodeAt(0) + 1)}${num}`;
    }
    //will give bottom right ids
    function bottonRight(id) {
        if (id[0] == "h" || Number(id[1]) == 1)
            return false;
        let num = Number(id[1]) - 1;
        return `${String.fromCharCode(id[0].charCodeAt(0) + 1)}${num}`;
    }
    
    //console.log(keySquareMapper[id]);
    console.log(topLeft("g7"));
    //console.log(bottonLeft("a7"));
    return [];
}

export { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds };