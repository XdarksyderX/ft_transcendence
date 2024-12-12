import { ROOT_DIV } from "../Helper/constants.js";
import { globalState, keySquareMapper } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { clearHighlight, globalStateRender, selfHighlight, globalPiece, circleHighlightRender } from "../Render/main.js";
import { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds, checkPieceExist, giveRookHighlightIds, giveKnightHighlightIds, giveQueenHighlightIds, giveKingHighlightIds } from "../Helper/commonHelper.js";
import { giveKnightCaptureIds, giveKingCaptureIds, giveBishopCaptureIds, giveRookCaptureIds, giveQueenCaptureIds } from "../Helper/commonHelper.js";
import { pawnMovesOptions, pawnCaptureOptions, getCaptureMoves, knightMovesOptions } from "../Helper/commonHelper.js";
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

//creo que esta funcion hay que replantearla
function checkForCheck() {
  if (inTurn === "black") {
    const whiteKingCurrentPos = globalPiece.white_king.current_pos;
    const pawns = [];
    globalPiece.black_pawns.forEach(piece => {
      pawns.push(piece.current_pos);
    });
    const knight_1 = globalPiece.black_knight_1.current_pos;
    const knight_2 = globalPiece.black_knight_2.current_pos;
    const king = globalPiece.black_king.current_pos;
    const bishop_1 = globalPiece.black_bishop_1.current_pos;
    const bishop_2 = globalPiece.black_bishop_2.current_pos;
    const rook_1 = globalPiece.black_rook_1.current_pos;
    const rook_2 = globalPiece.black_rook_2.current_pos;
    const queen = globalPiece.black_queen.current_pos;
    
    let finalListCheck = [];
    pawns.forEach(piece => {
      finalListCheck.push(pawnCaptureOptions(piece, -1));
    });
    finalListCheck.push(giveKnightCaptureIds(knight_1, inTurn));
    finalListCheck.push(giveKnightCaptureIds(knight_2, inTurn));
    finalListCheck.push(giveKingCaptureIds(king, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_1, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_2, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_1, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_2, inTurn));
    finalListCheck.push(giveQueenCaptureIds(queen, inTurn));
    
    finalListCheck = finalListCheck.flat();
    //console.log(`en check for check: finalListCheck: ${finalListCheck}`);
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
    const pawns = [];
    globalPiece.white_pawns.forEach(piece => {
      pawns.push(piece.current_pos);
    });
    const knight_1 = globalPiece.white_knight_1.current_pos;
    const knight_2 = globalPiece.white_knight_2.current_pos;
    const king = globalPiece.white_king.current_pos;
    const bishop_1 = globalPiece.white_bishop_1.current_pos;
    const bishop_2 = globalPiece.white_bishop_2.current_pos;
    const rook_1 = globalPiece.white_rook_1.current_pos;
    const rook_2 = globalPiece.white_rook_2.current_pos;
    const queen = globalPiece.white_queen.current_pos;
    
    let finalListCheck = [];
    pawns.forEach(piece => {
      finalListCheck.push(pawnCaptureOptions(piece, 1));
    });
    finalListCheck.push(giveKnightCaptureIds(knight_1, inTurn));
    finalListCheck.push(giveKnightCaptureIds(knight_2, inTurn));
    finalListCheck.push(giveKingCaptureIds(king, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_1, inTurn));
    finalListCheck.push(giveBishopCaptureIds(bishop_2, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_1, inTurn));
    finalListCheck.push(giveRookCaptureIds(rook_2, inTurn));
    finalListCheck.push(giveQueenCaptureIds(queen, inTurn));
    
    finalListCheck = finalListCheck.flat();
    //console.log(`en check for check: finalListCheck: ${finalListCheck}`);
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

function moveTwoCastlingPieces(piece, id) {
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
  
  moveTwoCastlingPieces(piece, id);
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
  circleHighlightRender(highlightSquareIds, keySquareMapper);
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
 
  getCaptureMoves(piece, giveBishopHighlightIds, "white", true);
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
  
  getCaptureMoves(piece, giveRookHighlightIds, "white", true);
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
  
  knightMovesOptions(piece, giveKnightHighlightIds, "white", true);
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

  getCaptureMoves(piece, giveQueenHighlightIds, "white", true);
  globalStateRender();
}

//funcion de prueba para limitar los movimientos del rey y que no se pueda mover
//a una posicion de jaque mate aka automorision
function limitKingMoves(kingInitialMoves, color) {
  console.log(`en limitKingMoves kingInitialMoves: ${kingInitialMoves}`); //borrar
  
  let res = new Set(); //en este set se van a meter todos los movimientos de posible captura de las piezas contrarias
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
    if (auxCapture)
      res = new Set([...res, ...auxCapture]);
  }
  console.log(`res: ${Array.from(res)}`); //borrar
   //elimino las posiciones a las que se puede mover el rey que coincidan con cualquiera que hay en res, para evitar el jaque mate
  for (let i = kingInitialMoves.length - 1; i >= 0; i--) {
    if (res.has(kingInitialMoves[i])) {
      console.log(`element: ${kingInitialMoves[i]}`);
      kingInitialMoves.splice(i, 1);
    }
  }
  console.log(`resultado final: ${kingInitialMoves}`); //borrar
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
  
  let highlightSquareIds = getCaptureMoves(piece, giveKingHighlightIds, "white", true, (moves) => limitKingMoves(moves, "white"));
  circleHighlightRender(highlightSquareIds, keySquareMapper);
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
  
  let highlightSquareIds = getCaptureMoves(piece, giveKingHighlightIds, "black", true, (moves) => limitKingMoves(moves, "black"));
  circleHighlightRender(highlightSquareIds, keySquareMapper);
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

  getCaptureMoves(piece, giveQueenHighlightIds, "black", true);
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
  
  knightMovesOptions(piece, giveKnightHighlightIds, "black", true);
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
  
  getCaptureMoves(piece, giveBishopHighlightIds, "black", true);
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
 
  getCaptureMoves(piece, giveRookHighlightIds, "black", true);
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
  circleHighlightRender(highlightSquareIds, keySquareMapper);
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

export { GlobalEvent, movePieceFromXToY, limitKingMoves };