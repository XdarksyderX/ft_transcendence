import { globalState, keySquareMapper, inTurn, updateInTurn, gameMode } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { clearHighlight, globalStateRender, selfHighlight, globalPiece, circleHighlightRender } from "../Render/main.js";
import * as help from "../Helper/commonHelper.js"
import { logMoves, appendPromotion } from "../Helper/logging.js"
import { pawnPromotion, winGame } from "../Helper/modalCreator.js";
import { removeSurroundingPieces } from "../Variants/atomic.js";
import { kirbyTransformation } from "../Variants/kirby.js";
import { checkWinForBlackHorde, whitePawnHordeRenderMoves } from "../Variants/horde.js"
import { getUserColor, chessSocket } from "../Handlers/online.js";
import { getUsername } from "../../../app/auth.js";
import { filterMovesForKingProtection, checkForCheckmate, updateGlobalState, updatePiecePosition } from "./check.js";
//highlighted or not => state
let highlight_state = false;

//current self-highlighted square state
let selfHighlightState = null;

//in move state or not
let moveState = null;

let winBool = false;
let captureNotation = false;
let oneMore = false;

const moveSound = new Audio('components/chess/Assets/music/sound2.mp3');

function changeTurn() {
  // clean the previous pawn movements for en passant reasons
  const pawns = inTurn === "white" ? globalPiece.black_pawns : globalPiece.white_pawns;
  pawns.forEach(pawn => {
    pawn.move = false;
  });
  // update turn manually if we're in local play
  if (!chessSocket) {
    const newTurn = inTurn === "white" ? "black" : "white";
    updateInTurn(newTurn);
  }
}

function captureInTurn(square) {
  const piece = square.piece;
  //console.log('capture, variant:', gameMode);
  if (piece == selfHighlightState) {
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    return;
  }
  
  if (square.captureHightlight) {
    captureNotation = true
    moveElement(selfHighlightState, piece.current_pos);
    if (gameMode === "bomb"){
      //console.log("captureInTurn: Bomb: square: ", square);
      winBool = removeSurroundingPieces(square.id);
      if (winBool && !chessSocket) {
        
      }
    }
    
    if (gameMode === "kirby"){
      //console.log("captureInTurn: Kirby: square: ", square);
      kirbyTransformation(square, piece);
    }
    clearPreviousSelfHighlight(selfHighlightState);
    clearHighlightLocal();
    captureNotation = false;
    return;
  }
  return;
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
    winBool =  "White";
  else if (inTurn === "black" && piece.piece_name.includes("WHITE_KING"))
    winBool = "Black";
  if (winBool && !chessSocket) {
    setTimeout(() => { winGame(winBool); }, 50);
  }
  winBool = false;
}

//this is the update for globalPiece when a pawn its promoted/demoted to other type of piece
function globalPieceUpdate(id, realPiece) {
  const pieceType = realPiece.piece_name.split('_')[1].toLowerCase();
  const color = realPiece.piece_name.split('_')[0].toLowerCase();
  let pieceKey = `${color}_${pieceType}`;

  if (pieceType === "pawn") {
    const pawnArray = inTurn === "white" ? globalPiece.black_pawns : globalPiece.white_pawns;
    const pawnIndex = pawnArray.findIndex(pawn => pawn.current_pos === id);
    if (pawnIndex !== -1)
      pawnArray[pawnIndex].current_pos = null;
    else
      pawnArray.push(realPiece);
  }
  else {
      let i = 1;
      while (globalPiece[`${pieceKey}_${i}`]) {
        i++;
      }
      pieceKey = `${pieceKey}_${i}`;
    }
    globalPiece[pieceKey] = realPiece;
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
  const previousPiece = currentSquare.piece;
  
  globalPieceUpdate(id, realPiece);
  
  piece.current_pos = id;
  currentSquare.piece = realPiece;
  appendPromotion(realPiece.piece_name);
  
  const image = document.createElement('img');
  image.src = realPiece.img;
  image.classList.add("piece");
  
  const currentElement = document.getElementById(id); 
  currentElement.innerHTML = '';
  currentElement.append(image);
  previousPiece.current_pos = null;
}

function moveTwoCastlingPieces(piece, id) {
  let castlingType = "";
  if (piece.piece_name.includes("KING") || piece.piece_name.includes("ROOK")) {
    piece.move = true;
    if (piece.piece_name.includes("KING") && piece.piece_name.includes("WHITE")) {
      if (id === 'c1' || id === 'g1') {
        if (id === 'g1' || id === 'g8')
          castlingType = "0-0";
        else
          castlingType = "0-0-0";
        let rook = keySquareMapper[id === 'c1' ? 'a1' : 'h1'];
        moveElement(rook.piece, id === 'c1' ? 'd1' : 'f1', true);
      }
    }
    if (piece.piece_name.includes("KING") && piece.piece_name.includes("BLACK")) {
      if (id === 'c8' || id === 'g8') {
        if (id === 'c8' || id === 'c1')
          castlingType = "0-0-0";
        else
          castlingType = "0-0";
        let rook = keySquareMapper[id === 'c8' ? 'a8' : 'h8'];
        moveElement(rook.piece, id === 'c8' ? 'd8' : 'f8', true);
      }
    }
  }
  return castlingType;
}



function makeEnPassant(piece, id) {
  if (!piece.piece_name.includes("PAWN"))
    return;
  const num = inTurn === "white" ? 1 : -1;
  const aux = `${String.fromCharCode(piece.current_pos[0].charCodeAt(0) - 1)}${Number(piece.current_pos[1]) + num}`
  const aux2 = `${String.fromCharCode(piece.current_pos[0].charCodeAt(0) + 1)}${Number(piece.current_pos[1]) + num}`
  if (id === aux || id === aux2) {
    const opPiece = `${id[0]}${Number(id[1]) - num}`
    if (help.checkPieceExist(opPiece)) {
      const opSquare = keySquareMapper[opPiece];
      const currentPiece = document.getElementById(opPiece);

      const flatData =  globalState.flat();
      flatData.forEach(el => {
        if (el.id === opPiece)
          el.piece.current_pos = null;
      });

      currentPiece.innerHTML = "";
      delete opSquare.piece;
    }
  }
}

function isClick() {
  return !(chessSocket && inTurn !== getUserColor(getUsername()));
}


/**
 * move a piece by the highlight posibilities.
 * @param {*} piece an object representing a game piece.
 * @param {*} id the new position id where the piece should be moved.
 * @param {boolean} castle Indicates if the move is a castling move.
 */

//si el mov es por socket lo importante es llamar a moveElement y el unico problema es la promocion de peones

function moveElement(piece, id, castle) {
  if (!piece)
    return;
  
  const isClickBool = isClick()
  const pawnPromotionBool = checkForPawnPromotion(piece, id);
  let capturedPiece = null;

  if (isClickBool) {
    if (chessSocket) {

      const data = {
        action: "move",
        from: piece.current_pos,
        to: id
      } 
      chessSocket.send(JSON.stringify(data));
      //console.log("Sending data through WebSocket:", data);
    }
    if (piece.piece_name.includes("PAWN") && (Math.abs(id[1] - piece.current_pos[1]) === 2 )) {
      piece.move = true;
      sessionStorage.setItem("enPassantTarget", JSON.stringify({ position: id, move: piece.move }));
    } else if (sessionStorage.getItem("enPassantTarget")) {
      sessionStorage.removeItem("enPassantTarget");
    }
  } else {
    const capturedSquare = keySquareMapper[id];
    if (capturedSquare.piece) {
      capturedPiece = capturedSquare.piece;
    }
  }

  let castlingType = moveTwoCastlingPieces(piece, id);
  const direction = piece.piece_name.includes("PAWN") ? (inTurn === "white" ? 1 : -1) : null;
  if (help.checkEnPassant(piece.current_pos, inTurn, direction))
    makeEnPassant(piece, id);

  updateGlobalState(piece, id);
  //console.log("globalState after making move: ", globalState.flat());
  clearHighlight();
  updatePiecePosition(piece, id);

  if (!chessSocket || inTurn == getUserColor(getUsername()))
    moveSound.play();
  
  
  if (pawnPromotionBool)
    pawnPromotion(inTurn, callbackPiece, id);
  
  logMoves({from: piece.current_pos, to: id, piece:piece.piece_name}, inTurn, piece, castlingType);
  if (!castle)
    changeTurn();
  if (!isClickBool && capturedPiece) {
    if (gameMode === "bomb")
      removeSurroundingPieces(id);
    
    if (gameMode === "kirby") {
      const square = keySquareMapper[piece.current_pos];
      kirbyTransformation(square, capturedPiece);
    }
  }
  //checkForCheck(); // pdte preguntar a marina

  if (!chessSocket) {
    if (gameMode === "horde" && inTurn === "white") { // white because the turn has already changed
      winBool = checkWinForBlackHorde();
    } else {
      winBool = checkForCheckmate();
    }
    if (winBool) {
      setTimeout(() => { winGame(winBool); }, 50);
      return;
    }
  }
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

function handlePieceClick(square, color, pieceType) {
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
      if (gameMode === "horde" && inTurn === "white")
        whitePawnHordeRenderMoves(piece, color, circleHighlightRender);
      else
        filterMovesForKingProtection(piece, color, help.pawnMovesOptions, help.pawnCaptureOptions, pieceType);
      break;
    case 'bishop':
      filterMovesForKingProtection(piece, color, help.getPossibleMoves, help.giveBishopHighlightIds);
      break;
    case 'rook':
      filterMovesForKingProtection(piece, color, help.getPossibleMoves, help.giveRookHighlightIds);
      break;
    case 'knight':
      filterMovesForKingProtection(piece, color, help.knightMovesOptions, help.giveKnightHighlightIds, pieceType);
      break;
      case 'queen':
      filterMovesForKingProtection(piece, color, help.getPossibleMoves, help.giveQueenHighlightIds);
      break;
    case 'king':
      oneMore = true;
      const kingHighlightSquareIds = help.getPossibleMoves(piece, help.giveKingHighlightIds, color, true, (moves) => help.limitKingMoves(moves, color), true);
      circleHighlightRender(kingHighlightSquareIds, keySquareMapper);
      oneMore = false;
      break;
  }
  globalStateRender();
}



//simple function that clear the yellow highlight when you click a square with a piece
function clearPreviousSelfHighlight(piece)
{
  if (piece) {
    const element = document.getElementById(piece.current_pos);
    if (element) {
      element.classList.remove("highlightYellow");
    }
    selfHighlightState = null;
  }
}

/**
 * Set up an event listener for click events on the root element. When a cloc event ocurrs within root, the provided
 * callback function is executed. We check if the clicked element is an <img> tag. This ensure that the code ontly runs when
 * an image of a chess piece is clicked.
 */

function GlobalEvent() {
  const root = document.getElementById('root');
  root.addEventListener("click", function(event) {
    if (chessSocket && inTurn !== getUserColor(getUsername())) { // esto iría fuera
      //console.log("oh hi :D: ", inTurn, getUserColor(getUsername()))
      return;
    };
    const target = event.target;
    const isPieceClick = target.localName === "img";
    const isHighlightClick = target.localName === "span" || target.querySelector(".highlight");
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
      handlePieceClick(square, inTurn, pieceType); //this is the general funciotn in charge of the movement
    }
    else if (isHighlightClick) { //this is to know if the click is in a square with the round highlight, which is the posible move of a piece. Ensure that only valid moves are processed.
      handleHighlightClickEvent(target);
    }
    else { //if the click its an impossible move clear the highlighted elements
      clearHighlightLocal();
      clearPreviousSelfHighlight(selfHighlightState);
    }
  });
}

 //if the person precisely click on the round hightlight  //gets the id of the parent node of the clickd 'span'  //if the clicked element is not a span but still has exactly one child node, means the square minus the round highlight, to ensure the proper movement either way
 function handleHighlightClickEvent(target) {
  clearPreviousSelfHighlight(selfHighlightState);
  const id = target.localName === "span" ? target.parentNode.id : target.id;
  if (moveState.piece_name.includes("PAWN"))
    checkDoubleMove(moveState, id);
  moveElement(moveState, id);
  moveState = null;
}

function checkDoubleMove(piece, newPosition) {
  const oldPosition = piece.current_pos;

  // Check if the pawn moved two squares
  if (Math.abs(newPosition[1] - oldPosition[1]) === 2) {
      piece.move = true;
    } else {
      piece.move = false;
  }
}

function isOpponentPiece(square) {
  return (square.piece.piece_name.includes("WHITE") && inTurn === "black") ||
         (square.piece.piece_name.includes("BLACK") && inTurn === "white");
}

// Search for any cell that have the class highlightYellow in it and clear it when the board color is changed
function clearYellowHighlight() {
  document.querySelectorAll('.highlightYellow').forEach(cell => {
    cell.classList.remove('highlightYellow');
  });
  selfHighlightState = null;
}

export { GlobalEvent, captureNotation, clearYellowHighlight, globalPieceUpdate, callbackPiece, moveElement, isClick, checkWin, oneMore };