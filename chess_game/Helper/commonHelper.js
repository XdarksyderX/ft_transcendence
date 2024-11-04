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

//function to check weather piece exists or not by square-id
function checkPieceExist(squareId) {
    const square = keySquareMapper[squareId];
    if (square.piece)
        return square;
    else
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
        num += numStep; //we 'move' the number part of the position; if the value is positive we add , and if the value is negative we substract
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

function straightMove(id, alphaStep, numStep) {
    let alpha = id[0];
    let num = Number(id[1]);
    let resArr = [];
    
    while (true) {
        alpha = String.fromCharCode(alpha.charCodeAt(0) + alphaStep); // Move the letter part
        num += numStep; // Move the number part
        // Verify if the coordinates are within the limits of the chessboard
        if (alpha < 'a' || alpha > 'h' || num < 1 || num > 8) {
            break;
        }
        resArr.push(`${alpha}${num}`);
    }
    return resArr;
}

function giveRookHighlightIds(id) {
    return {
        front: straightMove(id, 0, 1),
        back: straightMove(id, 0, -1),
        left: straightMove(id, -1, 0),
        right: straightMove(id, 1, 0),
    };
}

function giveKnightHighlightIds(id) {
    if (!id)
        return;
    function left() {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];

        let tmp = 0;

        while (alpha != "a") {
            if (tmp == 2)
                break;
            alpha = String.fromCharCode(alpha.charCodeAt(0) - 1);
            //num = num + 1;
            resArr.push(`${alpha}${num}`);
            tmp += 1;
        }
        
        if (resArr.length == 2) {
            let finalArr = [];
            const lastElement = resArr[resArr.length - 1];
            let alpha = lastElement[0];
            let num = Number(lastElement[1]);
            if (num < 8) {
                finalArr.push(`${alpha}${Number(num + 1)}`)
            }
            if (num > 1) {
                finalArr.push(`${alpha}${Number(num - 1)}`)
            }
            //resArr.push(`${Number(lastElement[1])}`)
            return finalArr;
        }
        else {
            return [];
        }
    }
    function right() {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];

        let tmp = 0;

        while (alpha != "h") {
            if (tmp == 2)
                break;
            alpha = String.fromCharCode(alpha.charCodeAt(0) + 1);
            //num = num + 1;
            resArr.push(`${alpha}${num}`);
            tmp += 1;
        }
        
        if (resArr.length == 2) {
            let finalArr = [];
            const lastElement = resArr[resArr.length - 1];
            let alpha = lastElement[0];
            let num = Number(lastElement[1]);
            if (num < 8) {
                finalArr.push(`${alpha}${Number(num + 1)}`)
            }
            if (num > 1) {
                finalArr.push(`${alpha}${Number(num - 1)}`)
            }
            //resArr.push(`${Number(lastElement[1])}`)
            return finalArr;
        }
        else {
            return [];
        }
    }
    function top() {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];

        let tmp = 0;

        while (num != 8) {
            if (tmp == 2)
                break;
            //alpha = String.fromCharCode(alpha.charCodeAt(0) + 1);
            num += 1;
            resArr.push(`${alpha}${num}`);
            tmp += 1;
        }
        
        if (resArr.length == 2) {
            let finalArr = [];
            const lastElement = resArr[resArr.length - 1];
            let alpha = lastElement[0];
            let num = Number(lastElement[1]);
            if (alpha != "a") {
                let alpha2 = String.fromCharCode(alpha.charCodeAt(0) - 1);
                finalArr.push(`${alpha2}${num}`)
            }
            if (alpha != "h") {
                let alpha2 = String.fromCharCode(alpha.charCodeAt(0) + 1);
                finalArr.push(`${alpha2}${num}`)
            }
            //resArr.push(`${Number(lastElement[1])}`)
            return finalArr;
        }
        else {
            return [];
        }
    }
    function bottom() {
        let alpha = id[0];
        let num = Number(id[1]);
        let resArr = [];

        let tmp = 0;

        while (num != 1) {
            if (tmp == 2)
                break;
            //alpha = String.fromCharCode(alpha.charCodeAt(0) + 1);
            num -= 1;
            resArr.push(`${alpha}${num}`);
            tmp += 1;
        }
        
        if (resArr.length == 2) {
            let finalArr = [];
            const lastElement = resArr[resArr.length - 1];
            let alpha = lastElement[0];
            let num = Number(lastElement[1]);
            if (alpha != "a") {
                let alpha2 = String.fromCharCode(alpha.charCodeAt(0) - 1);
                finalArr.push(`${alpha2}${num}`)
            }
            if (alpha != "h") {
                let alpha2 = String.fromCharCode(alpha.charCodeAt(0) + 1);
                finalArr.push(`${alpha2}${num}`)
            }
            //resArr.push(`${Number(lastElement[1])}`)
            return finalArr;
        }
        else {
            return [];
        }
    }
/*     console.log("left", left());
    console.log("right", right());
    console.log("bottom", bottom());
    console.log("top", top()); */
    return [...top(), ...bottom(), ...left(), ...right()]
}

export { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds, checkPieceExist, giveRookHighlightIds, giveKnightHighlightIds };