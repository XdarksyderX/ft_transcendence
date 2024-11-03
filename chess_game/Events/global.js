import { ROOT_DIV } from "../Helper/constants.js";
import { globalState, keySquareMapper } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { renderHighlight, selfHighlight } from "../Render/main.js";
import { clearHighlight, moveElement, globalStateRender } from "../Render/main.js";
import { checkOpponetPieceByElement, checkSquareCaptureId, giveBishopHighlightIds, checkPieceExist } from "../Helper/commonHelper.js";


//highlighted or not => state
let highlight_state = false;

//current self-highlighted square state
let selfHighlightState = null;

//in move state or not
let moveState = null;

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
    //movePieceFromXToY();
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
  const flatArray = globalState.flat();

  let highlightSquareIds = null;
  //on intial postion, pawns moves different
  if (curr_pos[1] == "2") {
  highlightSquareIds = [
    `${curr_pos[0]}${Number(curr_pos[1]) + 1}`,
    `${curr_pos[0]}${Number(curr_pos[1]) + 2}`, ];
  }
  else {
    highlightSquareIds = [`${curr_pos[0]}${Number(curr_pos[1]) + 1}`,];
  }
  highlightSquareIds = checkSquareCaptureId(highlightSquareIds);

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });


  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  //capture id logic
  const col1 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) - 1)}${Number(curr_pos[1]) + 1}`;
  const col2 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) + 1)}${Number(curr_pos[1]) + 1}`;

  let captureIds = [col1, col2];
  //captureIds = checkSquareCaptureId(captureIds);

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
    //movePieceFromXToY();
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
  const flatArray = globalState.flat();

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
    //movePieceFromXToY();
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
  const flatArray = globalState.flat();

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
    //movePieceFromXToY();
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
  const flatArray = globalState.flat();

  let highlightSquareIds = null;

  //on intial postion, pwns moves different
  if (curr_pos[1] == "7") {
    highlightSquareIds = [
      `${curr_pos[0]}${Number(curr_pos[1]) - 1}`,
      `${curr_pos[0]}${Number(curr_pos[1]) - 2}`, ];
  }
  else {
    highlightSquareIds = [`${curr_pos[0]}${Number(curr_pos[1]) - 1}`,];
  }

  highlightSquareIds = checkSquareCaptureId(highlightSquareIds);

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;
  });

  //capture id logic
  const col1 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) - 1)}${Number(curr_pos[1]) - 1}`;
  const col2 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) + 1)}${Number(curr_pos[1]) - 1}`;

  let captureIds = [col1, col2];
  //captureIds = checkSquareCaptureId(captureIds);

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
    //console.log(piece);
    //selfHighlight = false;
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
      //const flatArray = globalState.flat(); //flattens the 2D globalState array into a 1D array,to asily search a specific square by its id.
      //const square = flatArray.find((el) => el.id == clickId); //Search in the flattened array for an square with the id that matched the clickId. The find method return the forst matching element
      const square = keySquareMapper[clickId]; //Search in the flattened array for an square with the id that matched the clickId. The find method return the forst matching element
      if (square.piece.piece_name == "WHITE_PAWN") {
        whitePawnClick(square);
      }
      else if (square.piece.piece_name == "BLACK_PAWN") {
        blackPawnClick(square);
      }
      else if (square.piece.piece_name == "WHITE_BISHOP") {
        whiteBishopClick(square);
      }
      else if (square.piece.piece_name == "BLACK_BISHOP") {
        blackBishopClick(square);
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