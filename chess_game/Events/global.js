import { ROOT_DIV } from "../Helper/constants.js";
import { globalState, keySquareMapper } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { clearHighlight, globalStateRender, selfHighlight, globalPiece, circleHighlightRender } from "../Render/main.js";
import { checkOpponetPieceByElement, giveBishopHighlightIds, giveRookHighlightIds, giveKnightHighlightIds, giveQueenHighlightIds, giveKingHighlightIds } from "../Helper/commonHelper.js";
import { giveKnightCaptureIds, giveKingCaptureIds, giveBishopCaptureIds, giveRookCaptureIds, giveQueenCaptureIds } from "../Helper/commonHelper.js";
import { pawnMovesOptions, pawnCaptureOptions, getCaptureMoves, knightMovesOptions, limitKingMoves } from "../Helper/commonHelper.js";
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
let captureNotation = false;

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
    captureNotation = true;
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    captureNotation = false;
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
    if (piece?.piece_name?.toLowerCase()?.includes("pawn") && id?.includes("8"))
      return true;
    else
      return false;
  }
  else {
    if (piece?.piece_name?.toLowerCase()?.includes("pawn") && id?.includes("1"))
      return true;
    else
      return false;
  }
}

function checkWin(piece) {
  if (inTurn === "white" && piece.piece_name.includes("BLACK_KING"))
    return "White";
  else if (inTurn === "black" && piece.piece_name.includes("WHITE_KING"))
    return "Black";
  return false;
}

/**
 * This function is called during the pawn promotion process to replace
 * the original pawn with the selected promoted piece.
 *
 * The `piece` parameter is not a simple object but a function (like `whiteQueen`
 * or `blackRook` from pieces.js) that returns an object containing the promoted
 * piece's details, such as its position, image source, and name.
 *
 * Call the `piece` function with the pawn's ID (`id`) to get the new piece details.
 * 
 * Locate the current square on the board using `keySquareMapper` and update: the
 * square's piece with the new piece object (`realPiece`) and the piece's position
 * to reflect its current square (`id`).
 * 
 * Create a new `<img>` element, setting the image source (`src`) to the new piece's
 * image path and adding the "piece" class to style it appropriately.
 * 
 * Clear the current square's content (removing the old pawn image).
 * 
 * Append the new `<img>` element to the square's HTML.
 * @param {function} piece - A function returning the promoted piece's details.
 * @param {string} id - The ID of the square where the pawn is located.
 */
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
 * Update the global state with the new piece position.
 * @param {*} piece An object representing a game piece.
 * @param {*} id The new position id where the piece should be moved.
 */
function updateGlobalState(piece, id) {
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
}

/**
 * Update the HTML elements to reflect the new positions of the piece.
 * @param {*} piece An object representing a game piece.
 * @param {*} id The new position id where the piece should be moved.
 */
function updatePiecePosition(piece, id) {
  //Update the HTML elements to reflect the new positions of the piece
  const previousPiece = document.getElementById(piece.current_pos);
  const currentPiece = document.getElementById(id);

  piece.current_pos = null;
  previousPiece?.classList?.remove("highlightYellow");

  /*   currentPiece.innerHTML += previousPiece.querySelector('img').outerHTML;
  previousPiece.querySelector('img')?.remove(); */

  currentPiece.innerHTML = previousPiece?.innerHTML;
  if (previousPiece)
    previousPiece.innerHTML = "";

  piece.current_pos = id;
}

/**
 * move a piece by the highlight posibilities.
 * @param {*} piece an object representing a game piece.
 * @param {*} id the new position id where the piece should be moved.
 * @param {boolean} castle Indicates if the move is a castling move.
 */
function moveElement(piece, id, castle) {
  if (!piece)
    return;

  const pawnPromotionBool = checkForPawnPromotion(piece, id);
  moveTwoCastlingPieces(piece, id);
  logMoves({from: piece.current_pos, to: id, piece:piece.piece_name}, inTurn, piece);

  updateGlobalState(piece, id);
  clearHighlight();
  updatePiecePosition(piece, id);
  
  checkForCheck();

  if (winBool) {
    setTimeout(() => {
        winGame(winBool);
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

function selfHighlightSquare(piece) {
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return true;
  }
  return false;
}

function captureHightlightSquare(square, piece) {
  if (square.captureHightlight) {
    moveElement(selfHighlightState, piece.current_pos);
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return true;
  }
  return false;
}

function handlePieceClick(square, color, pieceType, row, direction) {
  const piece = square.piece;
  if (selfHighlightSquare(piece)) return;
  if (captureHightlightSquare(square, piece)) return;

  clearPreviousSelfHighlight(selfHighlightState);
  clearHighlightLocal();

  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;
  moveState = piece;

  switch (pieceType) {
    case 'pawn':
      const highlightSquareIds = pawnMovesOptions(piece.current_pos, row, direction);
      circleHighlightRender(highlightSquareIds, keySquareMapper);
      const captureIds = pawnCaptureOptions(piece.current_pos, direction);
      captureIds.forEach(element => checkOpponetPieceByElement(element, color));
      break;
    case 'bishop':
      getCaptureMoves(piece, giveBishopHighlightIds, color, true);
      break;
    case 'rook':
      getCaptureMoves(piece, giveRookHighlightIds, color, true);
      break;
    case 'knight':
      knightMovesOptions(piece, giveKnightHighlightIds, color, true);
      break;
    case 'queen':
      getCaptureMoves(piece, giveQueenHighlightIds, color, true);
      break;
    case 'king':
      const kingHighlightSquareIds = getCaptureMoves(piece, giveKingHighlightIds, color, true, (moves) => limitKingMoves(moves, color));
      circleHighlightRender(kingHighlightSquareIds, keySquareMapper);
      break;
  }
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
    const target = event.target;
    const isPieceClick = target.localName === "img";
    const isHighlightClick = target.localName === "span" || target.childNodes.length === 1;
    if (isPieceClick) // '===' compares both the value and the type without converting either value as '==' do (eg: 5 == '5')
    {
      const clickId = event.target.parentNode.id; //get the id of the parent element of the child, means the square, intead of the piece
      const square = keySquareMapper[clickId]; //Search in the flattened array for an square with the id that matched the clickId. The find method return the forst matching element
      
      if (isOpponentPiece(square)) {
        captureInTurn(square);
        return;
      }

      const pieceName = square.piece.piece_name;
      const pieceType = pieceName.split('_')[1].toLowerCase(); // Obtener el tipo de pieza pawn, bishop, etc..
      const row = pieceName.includes("PAWN") ? (inTurn === "white" ? "2" : "7") : null; //this var is only to check the row, so the we know if the pawn can do the initial special move of two squares or not. if a pawn is not clicked, its null because it doesn't matter.
      const direction = pieceName.includes("PAWN") ? (inTurn === "white" ? 1 : -1) : null; //this var is only to stablish the direction of the pawn in the table in order of it's color
      handlePieceClick(square, inTurn, pieceType, row, direction); //this is the general funciotn in charge of the movement
    }
    else if (isHighlightClick) {//this is to know if the click is in a square with the round highlight, which is the posible move of a piece. Ensure that only valid moves are processed.
      handleHighlightClickEvent(target);
    }
    else { //if the click its an impossible move clear the highlighted elements
      clearHighlightLocal();
      clearPreviousSelfHighlight(selfHighlightState);
    }
  });
}

function handleHighlightClickEvent(target) {
  clearPreviousSelfHighlight(selfHighlightState);
  const id = target.localName === "span" ? target.parentNode.id : target.id;  //if the person precisely click on the round hightlight  //gets the id of the parent node of the clickd 'span'  //if the clicked element is not a span but still has exactly one child node, means the square minus the round highlight, to ensure the proper movement either way
  moveElement(moveState, id);
  moveState = null;
}

function isOpponentPiece(square) {
  return (square.piece.piece_name.includes("WHITE") && inTurn === "black") ||
         (square.piece.piece_name.includes("BLACK") && inTurn === "white");
}

export { GlobalEvent, captureNotation };