import { ROOT_DIV } from "../Helper/constants.js";
import { globalState, keySquareMapper } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { clearHighlight, globalStateRender, selfHighlight, globalPiece } from "../Render/main.js";
import { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds, checkPieceExist, giveRookHighlightIds, giveKnightHighlightIds, giveQueenHighlightIds, giveKingHighlightIds } from "../Helper/commonHelper.js";
import { giveKnightCaptureIds, giveKingCaptureIds, giveBishopCaptureIds, giveRookCaptureIds, giveQueenCaptureIds } from "../Helper/commonHelper.js";
import { pawnMovesOptions, pawnCaptureOptions } from "../Helper/commonHelper.js";
import logMoves from "../Helper/logging.js";
import { pawnPromotion, winGame } from "../Helper/modalCreator.js";

//highlighted or not => state
let highlight_state = false;

//current self-highlighted square state
let selfHighlightState = null;

//in move state or not
let moveState = null;
let inTurn = "white";
let whoInCheck = null;
let winBool = false;

function changeTurn() {
  inTurn = inTurn === "white" ? "black" : "white";
}

function captureInTurn(square) {
  const piece = square.piece;
  
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  return;
}

function checkForCheck() {
  if (inTurn === "black") {
    const whiteKingCurrentPos = globalPiece.white_king.current_pos;
    const knight_1 = globalPiece.black_knight_1.current_pos;
    const knight_2 = globalPiece.black_knight_2.current_pos;
    const king = globalPiece.black_king.current_pos;
    const bishop_1 = globalPiece.black_bishop_1.current_pos;
    const bishop_2 = globalPiece.black_bishop_2.current_pos;
    const rook_1 = globalPiece.black_rook_1.current_pos;
    const rook_2 = globalPiece.black_rook_2.current_pos;
    const queen = globalPiece.black_queen.current_pos;

    let finalListCheck = [];
    finalListCheck.push(giveKnightCaptureIds(knight_1, inTurn));
    finalListCheck.push(giveKnightCaptureIds(knight_2, inTurn));
    finalListCheck.push(giveKingCaptureIds(king, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_1, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_2, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_1, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_2, inTurn));
    finalListCheck.push(giveQueenCaptureIds(queen, inTurn));

    finalListCheck = finalListCheck.flat();
    //console.log(inTurn, finalListCheck);
    const checkOrNot = finalListCheck.find((element) => element === whiteKingCurrentPos);
    if (checkOrNot) {
      whoInCheck = "white";
      setTimeout(() => {
        alert("You are in check!");
      }, 300); // Ajusta el tiempo de retraso según la duración de tu animación
    }
  }
  else {
    const blackKingCurrentPos = globalPiece.black_king.current_pos;
    const knight_1 = globalPiece.white_knight_1.current_pos;
    const knight_2 = globalPiece.white_knight_2.current_pos;
    const king = globalPiece.white_king.current_pos;
    const bishop_1 = globalPiece.white_bishop_1.current_pos;
    const bishop_2 = globalPiece.white_bishop_2.current_pos;
    const rook_1 = globalPiece.white_rook_1.current_pos;
    const rook_2 = globalPiece.white_rook_2.current_pos;
    const queen = globalPiece.white_queen.current_pos;
    
    let finalListCheck = [];
    finalListCheck.push(giveKnightCaptureIds(knight_1, inTurn));
    finalListCheck.push(giveKnightCaptureIds(knight_2, inTurn));
    finalListCheck.push(giveKingCaptureIds(king, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_1, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_2, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_1, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_2, inTurn));
    finalListCheck.push(giveQueenCaptureIds(queen, inTurn));
    
    finalListCheck = finalListCheck.flat();
    //console.log(inTurn, finalListCheck);
    const checkOrNot = finalListCheck.find((element) => element === blackKingCurrentPos);
    if (checkOrNot) {
      whoInCheck = "black";
      setTimeout(() => {
        alert("You are in check!");
      }, 300); // Ajusta el tiempo de retraso según la duración de tu animación
    }
  }
}

function checkForPawnPromotion(piece, id) {
  if (inTurn === "white") {
    if (piece?.piece_name?.toLowerCase()?.includes("pawn") && id?.includes("8")) {
      return true;
    }
    else {
      return false;
    }
  }
  else {
    if (piece?.piece_name?.toLowerCase()?.includes("pawn") && id?.includes("1")) {
      return true;
    }
    else {
      return false;
    }
  }
}

function checkWin(piece) {
  if (inTurn === "white" && piece.piece_name.includes("BLACK_KING")) {
    return "White";
  }
  else if (inTurn === "black" && piece.piece_name.includes("WHITE_KING")) {
    return "Black";
  }
  return false;
}

function callbackPiece(piece, id) {
  const realPiece = piece(id);
  const currentSquare = keySquareMapper[id];
  piece.current_pos = id;
  currentSquare.piece = realPiece;
  const image = document.createElement('img');
  image.src = realPiece.img;
  image.classList.add("piece");
  const currentElement = document.getElementById(id);
  
  currentElement.innerHTML = '';
  currentElement.append(image);
}

function adjustKnightHighlighting(id) {
  const element = keySquareMapper[id];
  if (element.highlight == true && element.captureHightlight == true) {
    element.highlight = false;
  }
}

/**
 * move a piece by the highlight posibilities.
 * @param {*} piece an object representing a game piece.
 * @param {*} id the new position id where the piece should be moved.
 */
function moveElement(piece, id, castle) {
  if (!piece)
    return;

  const pawnPromotionBool = checkForPawnPromotion(piece, id);

  if (piece.piece_name.includes("KING") || piece.piece_name.includes("ROOK")) {
    piece.move = true;
    if (piece.piece_name.includes("KING") && piece.piece_name.includes("WHITE")) {
      if (id === 'c1' || id === 'g1') {
        let rook = keySquareMapper[id === 'c1' ? 'a1' : 'h1'];
        moveElement(rook.piece, id === 'c1' ? 'd1' : 'f1', true);
      }
    }
    if (piece.piece_name.includes("KING") && piece.piece_name.includes("BLACK")) {
      if (id === 'c8' || id === 'g8') {
        let rook = keySquareMapper[id === 'c8' ? 'a8' : 'h8'];
        moveElement(rook.piece, id === 'c8' ? 'd8' : 'f8', true);
      }
    }
  }
  
  logMoves({from: piece.current_pos, to: id, piece:piece.piece_name}, inTurn);
  const flatData =  globalState.flat();
  //iterate throught each element to update the positions od the pieces.
  flatData.forEach((el) => {
    if (el.id == piece.current_pos) {
      delete el.piece; //when the element with the current position is find, delete the piece property from it
    }
    if (el.id == id) {
      if (el.piece) {
        el.piece.current_pos = null;
        winBool = checkWin(el.piece);
      }
      el.piece = piece; //find the element with the new position and asign the piece to it
    }
  });
  clearHighlight();
  //Update the HTML elements to reflect the new positions of the piece
  const previousPiece = document.getElementById(piece.current_pos);
  piece.current_pos = null;
  previousPiece?.classList?.remove("highlightYellow");
  const currentPiece = document.getElementById(id);
  
/*   currentPiece.innerHTML += previousPiece.querySelector('img').outerHTML;
  previousPiece.querySelector('img')?.remove(); */

  currentPiece.innerHTML = previousPiece?.innerHTML;
  if (previousPiece)
    previousPiece.innerHTML = "";

  piece.current_pos = id;
  
  checkForCheck();

  if (winBool) {
    setTimeout(() => {
        winGame(winBool);
        //alert(`${winBool} Wins!`);
    }, 50); // Ajusta el tiempo de retraso según la duración de tu animación
    return;
  }

  if (pawnPromotionBool)
    pawnPromotion(inTurn, callbackPiece, id);
  

  if (!castle)
    changeTurn();
}

//local function that will clear hightlight with state
function clearHighlightLocal() {
  clearHighlight();
  highlight_state = false;
}

//move piece to x-square to y-square
function movePieceFromXToY(from, to) {
  to.piece = from.piece;
  from.piece = null;
  globalStateRender();
}

//white pawn event
function whitePawnClick(square)
{
  const piece = square.piece;
  
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = pawnMovesOptions(curr_pos, "2", 1);

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  let captureIds = pawnCaptureOptions(curr_pos, 1);

  captureIds.forEach(element => {
    checkOpponetPieceByElement(element, "white");
  });
    
  globalStateRender();
}

//white bishop event
function whiteBishopClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveBishopHighlightIds(curr_pos);
  let tmp = []; //for capture
  
  const { bottomLeft, bottomRight, topLeft, topRight } = highlightSquareIds;

  let res = [];
  res.push(checkSquareCaptureId(bottomLeft));
  res.push(checkSquareCaptureId(bottomRight));
  res.push(checkSquareCaptureId(topLeft));
  res.push(checkSquareCaptureId(topRight));

  tmp.push(bottomLeft);
  tmp.push(bottomRight);
  tmp.push(topLeft);
  tmp.push(topRight);

  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();
  
  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  //capture logic for bishop
  let captureIds = [];
  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];

    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("white")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "white")) {
        break;
      }
    }
  }
  globalStateRender();
}

//white rook event
function whiteRookClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveRookHighlightIds(curr_pos);
  let tmp = [];
  
  const { top, bottom, left, right } = highlightSquareIds;

  let res = [];
  res.push(checkSquareCaptureId(top));
  res.push(checkSquareCaptureId(bottom));
  res.push(checkSquareCaptureId(left));
  res.push(checkSquareCaptureId(right));

  tmp.push(top);
  tmp.push(bottom);
  tmp.push(left);
  tmp.push(right);

  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();
  
  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  let captureIds = [];
  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];

    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("white")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "white")) {
        break;
      }
    }
  } 
  globalStateRender();
}

//white knight event
function whiteKnightClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveKnightHighlightIds(curr_pos);
  
  for (let i = 0; i < highlightSquareIds.length; i++) {
    if (checkPieceExist(highlightSquareIds[i])) {
      let str = keySquareMapper[highlightSquareIds[i]].piece.piece_name;
      if (highlightSquareIds[i], str.includes("WHITE")) {
        highlightSquareIds.splice(i, 1);
        i--;
      }
    }
  }

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  highlightSquareIds.forEach(element => {
    //checkOpponetPieceByElement(element, "white");
    let bool = checkOpponetPieceByElement(element, "white");
    if (bool)
      adjustKnightHighlighting(element);
  });
  globalStateRender();
}

//white queen event
function whiteQueenClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveQueenHighlightIds(curr_pos);
  let tmp = []; //for capture
  
  const { top, bottom, left, right, bottomLeft, bottomRight, topLeft, topRight } = highlightSquareIds;

  let res = [];
  res.push(checkSquareCaptureId(top));
  res.push(checkSquareCaptureId(bottom));
  res.push(checkSquareCaptureId(left));
  res.push(checkSquareCaptureId(right));
  res.push(checkSquareCaptureId(bottomLeft));
  res.push(checkSquareCaptureId(bottomRight));
  res.push(checkSquareCaptureId(topLeft));
  res.push(checkSquareCaptureId(topRight));

  tmp.push(top);
  tmp.push(bottom);
  tmp.push(left);
  tmp.push(right);
  tmp.push(bottomLeft);
  tmp.push(bottomRight);
  tmp.push(topLeft);
  tmp.push(topRight);

  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();
  
  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });
  
  //capture logic for bishop
  let captureIds = [];
  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];
    
    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("white")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "white")) {

        break;
      }
    }
  }
  globalStateRender();
}

//funcion devuelve los posibles movimientos de los alfiles en la posicion actual
//hay que refactorizar
function test2(id) {
  let finalListCheck = giveBishopHighlightIds(id);
  const { bottomLeft, bottomRight, topLeft, topRight } = finalListCheck;
  let aux = [];
  aux.push(checkSquareCaptureId(bottomLeft));
  aux.push(checkSquareCaptureId(bottomRight));
  aux.push(checkSquareCaptureId(topLeft));
  aux.push(checkSquareCaptureId(topRight));
  finalListCheck = aux.flat();
  return finalListCheck;
}


//funcion de prueba para limitar los movimientos del rey y que no se pueda mover
//a una posicion de jaque mate aka automorision
function test(kingInitialMoves){
  console.log(`en test kingInitialMoves: ${kingInitialMoves}`)
  
  let res = [];
  res = res.concat(test2(globalPiece.black_bishop_1.current_pos));
  res = res.concat(test2(globalPiece.black_bishop_2.current_pos));
  for (let pawn of globalPiece.black_pawns) {
    let auxCapture = pawnCaptureOptions(pawn.current_pos, -1);
    res = res.concat(auxCapture);
  }
  console.log(`res: ${res}`)
  for (let i = kingInitialMoves.length - 1; i >= 0; i--) {
    if (res.find(e => e === kingInitialMoves[i])) {
      console.log(`element: ${kingInitialMoves[i]}`);
      kingInitialMoves.splice(i, 1);
    }
  }
  console.log(`resultado final: ${kingInitialMoves}`)
}

//white king event
function whiteKingClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveKingHighlightIds(curr_pos);
  let tmp = []; //for capture
  
  const { top, bottom, left, right, bottomLeft, bottomRight, topLeft, topRight } = highlightSquareIds;

  let res = [];

  if (!piece.move) {
    const rook1 = globalPiece.white_rook_1;
    const rook2 = globalPiece.white_rook_2;

    if (!rook1.move) {
      const b1 = keySquareMapper['b1'];
      const c1 = keySquareMapper['c1'];
      const d1 = keySquareMapper['d1'];
      
      if (!b1.piece && !c1.piece && !d1.piece) {
        res.push("c1");
      }
    }
    if (!rook2.move) {
      const f1 = keySquareMapper['f1'];
      const g1 = keySquareMapper['g1'];
      
      if (!f1.piece && !g1.piece) {
        res.push("g1");
      }
    }
  }

  res.push(checkSquareCaptureId(top));
  res.push(checkSquareCaptureId(bottom));
  res.push(checkSquareCaptureId(left));
  res.push(checkSquareCaptureId(right));
  res.push(checkSquareCaptureId(bottomLeft));
  res.push(checkSquareCaptureId(bottomRight));
  res.push(checkSquareCaptureId(topLeft));
  res.push(checkSquareCaptureId(topRight));

  tmp.push(top);
  tmp.push(bottom);
  tmp.push(left);
  tmp.push(right);
  tmp.push(bottomLeft);
  tmp.push(bottomRight);
  tmp.push(topLeft);
  tmp.push(topRight);

  
  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();
  test(highlightSquareIds)
  
  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  //capture logic for bishop
  let captureIds = [];
  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];

    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("white")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "white")) {
        break;
      }
    }
  }
  globalStateRender();
}

//black king event
function blackKingClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveKingHighlightIds(curr_pos);
  let tmp = []; //for capture
  
  const { top, bottom, left, right, bottomLeft, bottomRight, topLeft, topRight } = highlightSquareIds;

  let res = [];

  if (!piece.move) {
    const rook1 = globalPiece.black_rook_1;
    const rook2 = globalPiece.black_rook_2;

    if (!rook1.move) {
      const b8 = keySquareMapper['b8'];
      const c8 = keySquareMapper['c8'];
      const d8 = keySquareMapper['d8'];
      
      if (!b8.piece && !c8.piece && !d8.piece) { //anadir condicion de jaque
        res.push("c8");
      }
    }
    if (!rook2.move) {
      const f8 = keySquareMapper['f8'];
      const g8 = keySquareMapper['g8'];
      
      if (!f8.piece && !g8.piece) {
        res.push("g8");
      }
    }
  }

  res.push(checkSquareCaptureId(top));
  res.push(checkSquareCaptureId(bottom));
  res.push(checkSquareCaptureId(left));
  res.push(checkSquareCaptureId(right));
  res.push(checkSquareCaptureId(bottomLeft));
  res.push(checkSquareCaptureId(bottomRight));
  res.push(checkSquareCaptureId(topLeft));
  res.push(checkSquareCaptureId(topRight));

  tmp.push(top);
  tmp.push(bottom);
  tmp.push(left);
  tmp.push(right);
  tmp.push(bottomLeft);
  tmp.push(bottomRight);
  tmp.push(topLeft);
  tmp.push(topRight);

  //test(res);

  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();
  
  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  //capture logic for king
  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];

    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("black")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "black")) {
        break;
      }
    }
  }
  globalStateRender();
}

//black queen event
function blackQueenClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveQueenHighlightIds(curr_pos);
  let tmp = []; //for capture
  
  const { top, bottom, left, right, bottomLeft, bottomRight, topLeft, topRight } = highlightSquareIds;

  let res = [];
  res.push(checkSquareCaptureId(top));
  res.push(checkSquareCaptureId(bottom));
  res.push(checkSquareCaptureId(left));
  res.push(checkSquareCaptureId(right));
  res.push(checkSquareCaptureId(bottomLeft));
  res.push(checkSquareCaptureId(bottomRight));
  res.push(checkSquareCaptureId(topLeft));
  res.push(checkSquareCaptureId(topRight));

  tmp.push(top);
  tmp.push(bottom);
  tmp.push(left);
  tmp.push(right);
  tmp.push(bottomLeft);
  tmp.push(bottomRight);
  tmp.push(topLeft);
  tmp.push(topRight);

  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();
  
  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  //capture logic for bishop
  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];

    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("black")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "black")) {
        break;
      }
    }
  }
  globalStateRender();
}

//black knight event
function blackKnightClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;
  let highlightSquareIds = giveKnightHighlightIds(curr_pos);
  
  for (let i = 0; i < highlightSquareIds.length; i++) {
    if (checkPieceExist(highlightSquareIds[i])) {
      let str = keySquareMapper[highlightSquareIds[i]].piece.piece_name;
      if (highlightSquareIds[i], str.includes("BLACK")) {
        highlightSquareIds.splice(i, 1);
        i--;
      }
    }
  }

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  highlightSquareIds.forEach(element => {
    let bool = checkOpponetPieceByElement(element, "black");
    if (bool)
      adjustKnightHighlighting(element);
  });
  globalStateRender();
}

//black bishop event
function blackBishopClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveBishopHighlightIds(curr_pos);
  let tmp = [];
  
  const { bottomLeft, bottomRight, topLeft, topRight } = highlightSquareIds;

  let res = [];
  res.push(checkSquareCaptureId(bottomLeft));
  res.push(checkSquareCaptureId(bottomRight));
  res.push(checkSquareCaptureId(topLeft));
  res.push(checkSquareCaptureId(topRight));

  tmp.push(bottomLeft);
  tmp.push(bottomRight);
  tmp.push(topLeft);
  tmp.push(topRight);

  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];

    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("black")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "black")) {
        break;
      }
    }
  } 
  globalStateRender();
}

//black rook event
function blackRookClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clear all highlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  
  //add piece as move state
  moveState = piece;
  
  const curr_pos = piece.current_pos;

  let highlightSquareIds = giveRookHighlightIds(curr_pos);
  let tmp = [];
  
  const { top, bottom, left, right } = highlightSquareIds;

  let res = [];
  res.push(checkSquareCaptureId(top));
  res.push(checkSquareCaptureId(bottom));
  res.push(checkSquareCaptureId(left));
  res.push(checkSquareCaptureId(right));

  tmp.push(top);
  tmp.push(bottom);
  tmp.push(left);
  tmp.push(right);

  //highlightSquareIds = checkSquareCaptureId(highlightSquareIds);
  highlightSquareIds = res.flat();

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  for (let i = 0; i < tmp.length; i++) {
    const arr = tmp[i];

    for (let j = 0; j < arr.length; j++) {
      const element = arr[j];
      let pieceRes = checkPieceExist(element);
      if (pieceRes && pieceRes.piece && pieceRes.piece.piece_name.toLowerCase().includes("black")) {
        break;
      }
      if (checkOpponetPieceByElement(element, "black")) {
        break;
      }
    }
  } 
  globalStateRender();
}

//black pawn funciton
function blackPawnClick(square)
{
  const piece = square.piece;
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }

  //clears all the higlights
  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();

  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;

  //add piece as move state
  moveState = piece;

  const curr_pos = piece.current_pos;

  let highlightSquareIds = pawnMovesOptions(curr_pos, "7", -1);

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  let captureIds = pawnCaptureOptions(curr_pos, -1);

  captureIds.forEach(element => {
    checkOpponetPieceByElement(element, "black");
  });
    
  globalStateRender();
}

//simple function that clear the yellow highlight when you click a square with a piece
function clearPreviousSelfHighlight(piece)
{
  if (piece) {
    document.getElementById(piece.current_pos).classList.remove("highlightYellow");
    selfHighlightState = null;
  } 
}

/**
 * Set up an event listener for click events on the ROOT_DIV element. When a cloc event ocurrs within ROOT_DIV, the provided
 * callback function is executed. We check if the clicked element is an <img> tag. This ensure that the code ontly runs when
 * an image of a chess piece is clicked.
 */
function GlobalEvent() {
  ROOT_DIV.addEventListener("click", function(event) {
    if (event.target.localName === "img") // '===' compares both the value and the type without converting either value as '==' do (eg: 5 == '5')
    {
      const clickId = event.target.parentNode.id; //get the id of the parent element of the child, means the square, intead of the piece
      const square = keySquareMapper[clickId]; //Search in the flattened array for an square with the id that matched the clickId. The find method return the forst matching element
      
      if ((square.piece.piece_name.includes("WHITE") && inTurn === "black" || (square.piece.piece_name.includes("BLACK") && inTurn === "white"))) {
        captureInTurn(square);
        return;
      }
      
      if (square.piece.piece_name == "WHITE_PAWN" && inTurn == "white") {
        whitePawnClick(square);
      }
      else if (square.piece.piece_name == "BLACK_PAWN" && inTurn == "black") {
        blackPawnClick(square);
      }
      else if (square.piece.piece_name == "WHITE_BISHOP" && inTurn == "white") {
        whiteBishopClick(square);
      }
      else if (square.piece.piece_name == "BLACK_BISHOP" && inTurn == "black") {
        blackBishopClick(square);
      }
      else if (square.piece.piece_name == "WHITE_ROOK" && inTurn == "white") {
        whiteRookClick(square);
      }
      else if (square.piece.piece_name == "BLACK_ROOK" && inTurn == "black") {
        blackRookClick(square);
      }
      else if (square.piece.piece_name == "WHITE_KNIGHT" && inTurn == "white") {
        whiteKnightClick(square);
      }
      else if (square.piece.piece_name == "BLACK_KNIGHT" && inTurn == "black") {
        blackKnightClick(square);
      }
      else if (square.piece.piece_name == "WHITE_QUEEN" && inTurn == "white") {
        whiteQueenClick(square);
      }
      else if (square.piece.piece_name == "BLACK_QUEEN" && inTurn == "black") {
        blackQueenClick(square);
      }
      else if (square.piece.piece_name == "WHITE_KING" && inTurn == "white") {
        whiteKingClick(square);
      }
      else if (square.piece.piece_name == "BLACK_KING" && inTurn == "black") {
        blackKingClick(square);
      }
    }
    else //this is to know if the click is in a square with the round highlight, which is the posible move of a piece. Ensure that only valid moves are processed.
    {
      const childElementsOfclickedEl = Array.from(event.target.childNodes); //Converts the child nodes (possible moves) of the clickd element into a array to manipulate it better
      if (childElementsOfclickedEl.length == 1 || event.target.localName == "span") {
        if (event.target.localName == "span") //if the person precisely click on the round hightlight
        {
          clearPreviousSelfHighlight(selfHighlightState);
          const id =  event.target.parentNode.id; //gets the id of the parent node of the clickd 'span'
          moveElement(moveState, id); //call the function to move the piece to the new position
          moveState = null; //reset the oceState to null indicating the move is done.
        }
        else //if the clicked element is not a span but still has exactly one child node, means the square minus the round highlight, to ensure the proper movement either way
        {
          clearPreviousSelfHighlight(selfHighlightState);
          const id =  event.target.id; //gets the id of the clicked element
          moveElement(moveState, id);
          moveState = null;
        }
      }
      else { //if the click its an impossible move clear the highlighted elements
        clearHighlightLocal();
        clearPreviousSelfHighlight(selfHighlightState);
      }
    }
  });
}

export { GlobalEvent, movePieceFromXToY };