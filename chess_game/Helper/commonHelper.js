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
/*  part22 min13:00
    commonHelper.js:25 Uncaught TypeError: Cannot read properties of undefined (reading 'length')
    at checkSquareCaptureId (commonHelper.js:25:31)
    at whiteBishopClick (global.js:140:12)
    at HTMLDivElement.<anonymous> (global.js:277:9) */
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
    let finalReturnArray = [];
    
   //will give top left ids
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
    //will give bottom left ids
    function bottonLeft(id) {
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
    //will give top right ids
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
    //will give bottom right ids
    function bottonRight(id) {
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
        bottonLeft: bottonLeft(id),
        bottonRight: bottonRight(id),
    };
}

export { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds };