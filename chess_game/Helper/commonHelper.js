import { keySquareMapper } from "../index.js";
import { circleHighlightRender } from "../Render/main.js";
import { limitKingMoves } from "../Events/global.js";

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

//function to check if opponnet piece exist
function checkOpponetPieceByElementNoDom(id, color) {
    const opponentColor = color === "white" ? "BLACK" : "WHITE";
    const element = keySquareMapper[id];

    if (!element)
        return false;

    if (element.piece && element.piece.piece_name.includes(opponentColor)) {
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
    let moves = [];
    if (!id)
        return moves;
    let alpha = id[0];
    let num = Number(id[1]);
    
    while (alpha != charLimit && num != numLimit) {
        alpha = String.fromCharCode(alpha.charCodeAt(0) + alphaStep); //we 'move' the letter part of the position; if the value is positive we go one letter up in the alphabeth, and if the value is negative we go down
        num += numStep; //we 'move' the number part of the position; if the value is positive we add , and if the value is negative we substract
        moves.push(`${alpha}${num}`);
    }
    return moves;
}

function giveBishopHighlightIds(id) {
    return {
        topLeft: diagonalMove(id, 'a', 8, -1, 1),
        topRight: diagonalMove(id, 'h', 8, 1, 1),
        bottomLeft: diagonalMove(id, 'a', 1, -1, -1),
        bottomRight: diagonalMove(id, 'h', 1, 1, -1),
    };
}

function giveBishopCaptureIds(id, color) {
    if (!id)
        return [];
    let highlightSquareIds = giveBishopHighlightIds(id);
    let tmp = [];
    const { bottomLeft, bottomRight, topLeft, topRight } = highlightSquareIds;
    let returnArr = [];
  
    tmp.push(bottomLeft);
    tmp.push(bottomRight);
    tmp.push(topLeft);
    tmp.push(topRight);

    for (let i = 0; i < tmp.length; i++) {
        const arr = tmp[i];
    
        for (let j = 0; j < arr.length; j++) {
          const element = arr[j];
          let pieceRes = checkPieceExist(element);
          if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes(color)) {
            break;
          }
          if (checkOpponetPieceByElementNoDom(element, color)) {
            returnArr.push(element);
            break;
          }
        }
    }
    return returnArr;
}

function straightMove(id, alphaStep, numStep) {
    let moves = [];
    if (!id)
        return moves;
    let alpha = id[0];
    let num = Number(id[1]);
    
    while (true) {
        alpha = String.fromCharCode(alpha.charCodeAt(0) + alphaStep); // Move the letter part
        num += numStep; // Move the number part
        if (alpha < 'a' || alpha > 'h' || num < 1 || num > 8) { // Verify if the coordinates are within the limits of the chessboard
            break;
        }
        moves.push(`${alpha}${num}`);
    }
    return moves;
}

function giveRookHighlightIds(id) {
    return {
        top: straightMove(id, 0, 1),
        bottom: straightMove(id, 0, -1),
        left: straightMove(id, -1, 0),
        right: straightMove(id, 1, 0),
    };
}

function giveRookCaptureIds(id, color) {
    if (!id)
        return [];
    let highlightSquareIds = giveRookHighlightIds(id);
    let tmp = [];
    const { top, bottom, left, right } = highlightSquareIds;
    let returnArr = [];
  
    tmp.push(top);
    tmp.push(bottom);
    tmp.push(left);
    tmp.push(right);

    for (let i = 0; i < tmp.length; i++) {
        const arr = tmp[i];
    
        for (let j = 0; j < arr.length; j++) {
          const element = arr[j];
          let pieceRes = checkPieceExist(element);
          if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes(color)) {
            break;
          }
          if (checkOpponetPieceByElementNoDom(element, color)) {
            returnArr.push(element);
            break;
          }
        }
    }
    return returnArr;
}

function knightMoves(id, alphaStep, numStep, alphaStep2, numStep2)
{
    let moves = [];
    if (!id)
        return moves;
    let alpha = id[0];
    let num = Number(id[1]);

    //first direction of L movement
    let newAlpha1 = String.fromCharCode(alpha.charCodeAt(0) + alphaStep);
    let newNum1 = num + numStep;
    if (newAlpha1 >= 'a' && newAlpha1 <= 'h' && newNum1 >= 1 && newNum1 <= 8) {
        moves.push(`${newAlpha1}${newNum1}`);
    }
    //second direction of L movement
    let newAlpha2 = String.fromCharCode(alpha.charCodeAt(0) + alphaStep2);
    let newNum2 = num + numStep2;
    if (newAlpha2 >= 'a' && newAlpha2 <= 'h' && newNum2 >= 1 && newNum2 <= 8) {
        moves.push(`${newAlpha2}${newNum2}`);
    }
    return moves;
}

function giveKnightHighlightIds(id) {
    return [
        ...knightMoves(id, -1, 2, 1, 2),   // top moves
        ...knightMoves(id, -1, -2, 1, -2),  // bottom moves
        ...knightMoves(id, -2, 1, -2, -1), // left moves
        ...knightMoves(id, 2, 1, 2, -1)   // right moves
    ];
}

function giveKnightCaptureIds(id, color) {
    if (!id)
        return [];
    let resArr =  giveKnightHighlightIds(id);

    resArr = resArr.filter(element => {
        if (checkOpponetPieceByElementNoDom(element, color)) {
            return true;
        }
    });
    return resArr;
}

function giveQueenHighlightIds(id) {
    return {
        "top": giveRookHighlightIds(id).top,
        "bottom": giveRookHighlightIds(id).bottom,
        "left": giveRookHighlightIds(id).left,
        "right": giveRookHighlightIds(id).right,
        "topLeft": giveBishopHighlightIds(id).topLeft,
        "topRight": giveBishopHighlightIds(id).topRight,
        "bottomLeft": giveBishopHighlightIds(id).bottomLeft,
        "bottomRight": giveBishopHighlightIds(id).bottomRight
    }
}


function giveQueenCaptureIds(id, color) {
    if (!id)
        return [];
    let returnArr = [];
    returnArr.push(giveBishopCaptureIds(id, color));
    returnArr.push(giveRookCaptureIds(id, color));
    return returnArr.flat();
}

function giveKingHighlightIds(id) {
    const res = {
        "top": giveRookHighlightIds(id).top,
        "bottom": giveRookHighlightIds(id).bottom,
        "left": giveRookHighlightIds(id).left,
        "right": giveRookHighlightIds(id).right,
        "topLeft": giveBishopHighlightIds(id).topLeft,
        "topRight": giveBishopHighlightIds(id).topRight,
        "bottomLeft": giveBishopHighlightIds(id).bottomLeft,
        "bottomRight": giveBishopHighlightIds(id).bottomRight
    }

    for (const key in res) {
        if (Object.prototype.hasOwnProperty.call(res, key)) {
            const element = res[key];
            
            if (element.length != 0) {
                res[key] = new Array(element[0]);
            }
        }
    }
    return res;
}

function giveKingCaptureIds(id, color) {
    if (!id)
        return [];
    let res = giveKingHighlightIds(id);
    res = Object.values(res).flat();
    res = res.filter(element => {
        if (checkOpponetPieceByElementNoDom(element, color))
            return true;
    })
    return res;
}

function pawnMovesOptions(curr_pos, row, num) {
    let highlightSquareIds = null;
    //on intial postion, pawns moves different
    if (curr_pos[1] == row) {
    highlightSquareIds = [
      `${curr_pos[0]}${Number(curr_pos[1]) + num}`,
      `${curr_pos[0]}${Number(curr_pos[1]) + (num * 2)}`, ];
    }
    else {
      highlightSquareIds = [`${curr_pos[0]}${Number(curr_pos[1]) + num}`,];
    }
    highlightSquareIds = checkSquareCaptureId(highlightSquareIds);

    return highlightSquareIds;
}

function pawnCaptureOptions(curr_pos, num) {
	if (!curr_pos)
		return null;

    const validColumns = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const col1 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) - 1)}${Number(curr_pos[1]) + num}`;
    const col2 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) + 1)}${Number(curr_pos[1]) + num}`;

    let captureIds = [col1, col2].filter(pos => validColumns.has(pos[0]));
    return captureIds;
}

//funcion devuelve los posibles movimientos de los alfiles en la posicion actual
//hay que refactorizar
function getCaptureMoves(piece, highlightIdsFunc, color, renderBool = false, preRenderCallback = null) {
    const curr_pos = piece.current_pos;
    let highlightSquareIds = highlightIdsFunc(curr_pos);
    let tmp = [], res = [];
  
    for (const direction in highlightSquareIds) {
      if (highlightSquareIds.hasOwnProperty(direction)) {
        const squares = highlightSquareIds[direction];
        res.push(checkSquareCaptureId(squares));
        tmp.push(squares);
      }
    }
    highlightSquareIds = res.flat();
    
    if (preRenderCallback)
        preRenderCallback(highlightSquareIds);
    if (renderBool) {
        circleHighlightRender(highlightSquareIds, keySquareMapper);
    
        for (let i = 0; i < tmp.length; i++) {
            const arr = tmp[i];
            for (let j = 0; j < arr.length; j++) {
                const element = arr[j];
                let pieceRes = checkPieceExist(element);
                if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes(color)) {
                break;
                }
                if (checkOpponetPieceByElement(element, color)) {
                break;
                }
            }
        }
    }
    return highlightSquareIds;
}

function adjustKnightHighlighting(id) {
    const element = keySquareMapper[id];
    if (element.highlight == true && element.captureHightlight == true) {
      element.highlight = false;
    }
  }

function knightMovesOptions(piece, highlightIdsFunc, color, renderBool = false) {
    const curr_pos = piece.current_pos;
    let highlightSquareIds = highlightIdsFunc(curr_pos);
    
    for (let i = 0; i < highlightSquareIds.length; i++) {
        if (checkPieceExist(highlightSquareIds[i])) {
            let str = keySquareMapper[highlightSquareIds[i]].piece.piece_name;
            if (highlightSquareIds[i], str.includes(color.toUpperCase())) {
                highlightSquareIds.splice(i, 1);
                i--;
            }
        }
    }
    
    if (renderBool) {
        circleHighlightRender(highlightSquareIds, keySquareMapper);
        
        highlightSquareIds.forEach(element => {
            let bool = checkOpponetPieceByElement(element, color);
            if (bool)
                adjustKnightHighlighting(element);
        });
    }
    return highlightSquareIds;
}

export { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds, checkPieceExist, giveRookHighlightIds, giveKnightHighlightIds, giveQueenHighlightIds, giveKingHighlightIds,
    giveKnightCaptureIds, giveKingCaptureIds, giveBishopCaptureIds, giveRookCaptureIds, giveQueenCaptureIds,
    pawnMovesOptions, pawnCaptureOptions, getCaptureMoves, knightMovesOptions };