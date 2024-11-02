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

/*function to calculate diagonal moves for a bishop in chess, first we extract the letter of the 
position of the piece, and then the number. We do a loop until the position reaches the limits of
the cheeseboard. */
function diagonalMove(id, charLimit, numLimit, alphaStep, numStep) {
    let alpha = id[0];
    let num = Number(id[1]);
    let resArr = [];
    
    while (alpha != charLimit && num != numLimit) {
        alpha = String.fromCharCode(alpha.charCodeAt(0) + alphaStep); //we 'move' the letter part of the position; if the value is positive we go one letter up in the alphabeth, and if the value is negative we go down
        num = num + numStep; //we 'move' the number part of the position; if the value is positive we add , and if the value is negative we substract
        resArr.push(`${alpha}${num}`);
    }
    return resArr;
}

function giveBishopHighlightIds(id) {
    return {
        topLeft: diagonalMove(id, 'a', 8, -1, 1),
        topRight: diagonalMove(id, 'h', 8, 1, 1),
        bottomLeft: diagonalMove(id, 'a', 1, -1, -1),
        bottomRight: diagonalMove(id, 'h', 1, 1, -1),
    };
}

/* original function to give highlight ids for bishop. The movement is diagonal
I'm going to keep this for a while to be sure */
/* function giveBishopHighlightIds(id) {
    let finalReturnArray = [];
    
    function topLeft(id) {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];
        
        while (alpha != "a" && num != 8) {
            alpha = String.fromCharCode(alpha.charCodeAt(0) - 1);
            num = num + 1;
            resArr.push(`${alpha}${num}`);
        }
        return resArr;
    }

    function bottomLeft(id) {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];

        while (alpha != "a" && num != 1) {
            alpha = String.fromCharCode(alpha.charCodeAt(0) - 1);
            num = num - 1;
            resArr.push(`${alpha}${num}`);
        }
        return resArr;
    }

    function topRight(id) {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];

        while (alpha != "h" && num != 8) {
            alpha = String.fromCharCode(alpha.charCodeAt(0) + 1);
            num = num + 1;
            resArr.push(`${alpha}${num}`);
        }
        return resArr;
    }

    function bottomRight(id) {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];

        while (alpha != "h" && num != 1) {
            alpha = String.fromCharCode(alpha.charCodeAt(0) + 1);
            num = num - 1;
            resArr.push(`${alpha}${num}`);
        }
        return resArr;
    }

    return {
        topLeft: topLeft(id),
        topRight: topRight(id),
        bottomLeft: bottomLeft(id),
        bottomRight: bottomRight(id),
    };
} */

export { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds };