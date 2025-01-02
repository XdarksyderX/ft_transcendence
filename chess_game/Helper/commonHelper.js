import { keySquareMapper } from "../index.js";
import { circleHighlightRender } from "../Render/main.js";
import { globalPiece } from "../Render/main.js";

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

//???
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

//??
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

//??
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

//??
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

//??
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


function checkEnPassant(curr_pos, color, num) {
    const row = color === "white" ? 5 : 4; // Row where en passant is possible
    if (curr_pos[1] != row) return false;

    const leftPos = `${String.fromCharCode(curr_pos[0].charCodeAt(0) - 1)}${curr_pos[1]}`;
    const rightPos = `${String.fromCharCode(curr_pos[0].charCodeAt(0) + 1)}${curr_pos[1]}`;
    const opponentColor = color === "white" ? "black" : "white";
    
    // Helper function to check if a position is valid for en passant
    function isValidEnPassant(pos) {
        return pos[0] >= 'a' && pos[0] <= 'h' &&
        checkPieceExist(pos) &&
        keySquareMapper[pos].piece.piece_name.toLowerCase().includes(opponentColor) &&
        keySquareMapper[pos].piece.move;
    }
    if (isValidEnPassant(leftPos))
        return `${leftPos[0]}${Number(leftPos[1]) + num}`;
    if (isValidEnPassant(rightPos))
        return `${rightPos[0]}${Number(rightPos[1]) + num}`;
    return false;
}

function pawnMovesOptions(curr_pos, row, num, color) {
    let highlightSquareIds = null;
    //on intial postion, pawns moves different
    if (curr_pos[1] == row) {
        highlightSquareIds = [
            `${curr_pos[0]}${Number(curr_pos[1]) + num}`,
            `${curr_pos[0]}${Number(curr_pos[1]) + (num * 2)}`, ];
        }
    else {
        highlightSquareIds = [`${curr_pos[0]}${Number(curr_pos[1]) + num}`,];
        let enPassant = "";
        if (enPassant = checkEnPassant(curr_pos, color, num)) {
            highlightSquareIds.push(enPassant);
        }
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

/* this function check if the path of the castling is safe from a chekmate */
function isPathSafeForCastling(kingPath, color) {
    const opponentMoves = getOpponentMoves(color);
    return kingPath.every(square => !opponentMoves.has(square));
}  

/*this function check whether all castling conditions are true, and the push that possible move
 * to array tha contains all the moves that a king can make.*/
function castlingCheck(piece, color, res) {
    if (piece.piece_name.includes("KING") && !piece.move) {
        const rook1 = globalPiece[`${color}_rook_1`];
        const rook2 = globalPiece[`${color}_rook_2`];

        if (!rook1.move) {
            const b = keySquareMapper[`${color === "white" ? 'b1' : 'b8'}`];
            const c = keySquareMapper[`${color === "white" ? 'c1' : 'c8'}`];
            const d = keySquareMapper[`${color === "white" ? 'd1' : 'd8'}`];
            const kingPath = [`${color === "white" ? 'e1' : 'e8'}`, `${color === "white" ? 'd1' : 'd8'}`, `${color === "white" ? 'c1' : 'c8'}`];
            
            if (!b.piece && !c.piece && !d.piece && isPathSafeForCastling(kingPath, color)) {
                res.push(`${color === "white" ? 'c1' : 'c8'}`);
            }
        }
        if (!rook2.move) {
            const f = keySquareMapper[`${color === "white" ? 'f1' : 'f8'}`];
            const g = keySquareMapper[`${color === "white" ? 'g1' : 'g8'}`];
            const kingPath = [`${color === "white" ? 'e1' : 'e8'}`, `${color === "white" ? 'f1' : 'f8'}`, `${color === "white" ? 'g1' : 'g8'}`];
            
            if (!f.piece && !g.piece && isPathSafeForCastling(kingPath, color)) {
                res.push(`${color === "white" ? 'g1' : 'g8'}`);
            }
        }
    }
}

/**
 * this is a general funtion to take bishop, rook, queen, and king possible moves, render the
 * highlight circles to show the posibilities to the player and return its value. Its a refactored
 * function that does some different things.
 * @param {*} piece all the propierties of the piece clicked
 * @param {*} highlightIdsFunc this is the real funtion that calculates the moves
 * @param {*} color the color of the piece clicked
 * @param {*} renderBool this bool is used is you want to render the highlight cicles (when you click a piece) or if you just need to return the possible moves of a piece
 * @param {*} preRenderCallback this callback funcion is just for the king, that call limitKingMoves to avoid an auto checkmate
 * @returns 
 */
function getCaptureMoves(piece, highlightIdsFunc, color, renderBool = false, preRenderCallback = null, skipCastlingCheck = false) {
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
    if (skipCastlingCheck)
        castlingCheck(piece, color, res);
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
                if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes(color))
                    break;
                if (checkOpponetPieceByElement(element, color))
                    break;
            }
        }
    }
    return highlightSquareIds;
}

// this funciton return all the possible moves of the opponent pices
function getOpponentMoves(color) {
    let res = new Set();
    const enemyColor = color === "white" ? "black" : "white";
    const pawnDirection = enemyColor === "white" ? 1 : -1;

    res = new Set([...res, ...getCaptureMoves(globalPiece[`${enemyColor}_bishop_1`], giveBishopHighlightIds, enemyColor)]);
    res = new Set([...res, ...getCaptureMoves(globalPiece[`${enemyColor}_bishop_2`], giveBishopHighlightIds, enemyColor)]);
    res = new Set([...res, ...getCaptureMoves(globalPiece[`${enemyColor}_rook_1`], giveRookHighlightIds, enemyColor)]);
    res = new Set([...res, ...getCaptureMoves(globalPiece[`${enemyColor}_rook_2`], giveRookHighlightIds, enemyColor)]);
    res = new Set([...res, ...getCaptureMoves(globalPiece[`${enemyColor}_queen`], giveQueenHighlightIds, enemyColor)]);
    res = new Set([...res, ...knightMovesOptions(globalPiece[`${enemyColor}_knight_1`], giveKnightHighlightIds, enemyColor)]);
    res = new Set([...res, ...knightMovesOptions(globalPiece[`${enemyColor}_knight_2`], giveKnightHighlightIds, enemyColor)]);
    res = new Set([...res, ...getCaptureMoves(globalPiece[`${enemyColor}_king`], giveKingHighlightIds, enemyColor)]);

    for (let pawn of globalPiece[`${enemyColor}_pawns`]) {
        let auxCapture = pawnCaptureOptions(pawn.current_pos, pawnDirection);
        if (auxCapture) {
            res = new Set([...res, ...auxCapture]);
        }
    }
    return res;
}
  
/*function that recieve the initia king moves and then check if one of those possible options
can be a direct checkmate, the it remove that option to avoid the checkmate*/
function limitKingMoves(kingInitialMoves, color) {
    let res = getOpponentMoves(color);

    for (let i = kingInitialMoves.length - 1; i >= 0; i--) {
        if (res.has(kingInitialMoves[i])) {
        kingInitialMoves.splice(i, 1);
        }
    }
}

//this funtion is to fix some bug for the knight circle highlight moves
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
    pawnMovesOptions, pawnCaptureOptions, getCaptureMoves, knightMovesOptions, limitKingMoves, checkEnPassant };