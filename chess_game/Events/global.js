import { ROOT_DIV } from "../Helper/constants.js";
import { globalState } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { renderHighlight, selfHighlight } from "../Render/main.js";
import { clearHighlight, clearPreviousSelfHighlight, moveElement, globalStateRender } from "../Render/main.js";
import { checkOpponetPieceByElement } from "../Helper/commonHelper.js";


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
  //console.log(from, to);
}

//white pawn event
function whitePawnClick({piece})
{
/*   if (highlight_state)
    return; */
  
  clearPreviousSelfHighlight(selfHighlightState);

  //if clicked on same element twice
  if (piece == selfHighlightState) {
    selfHighlightState = null;
    clearHighlightLocal();
    return;
  }
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;

  //add piece as move state
  moveState = piece;

  const curr_pos = piece.current_pos;
  const flatArray = globalState.flat();
  //on intial postion, pwns moves different
  if (curr_pos[1] == "2")
  {
    const highlightSquareIds = [
      `${curr_pos[0]}${Number(curr_pos[1]) + 1}`,
      `${curr_pos[0]}${Number(curr_pos[1]) + 2}`, ];

    clearHighlightLocal();
      
    highlightSquareIds.forEach(highlight => {
      globalState.forEach(row => {
        row.forEach(element => {
          if (element.id == highlight) {
            element.highlight = true;
          }
        });
      });
    });

    globalStateRender();
  }
  else {
    const col1 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) - 1)}${Number(curr_pos[1]) + 1}`;
    const col2 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) + 1)}${Number(curr_pos[1]) + 1}`;

    const captureIds = [col1, col2];

    const highlightSquareIds = [`${curr_pos[0]}${Number(curr_pos[1]) + 1}`,];

    captureIds.forEach(element => {
      checkOpponetPieceByElement(element, "white");
    });
      
    highlightSquareIds.forEach(highlight => {
      globalState.forEach(row => {
        row.forEach(element => {
          if (element.id == highlight) {
            element.highlight = true;
          }
        });
      });
    });
    globalStateRender();
  }
  //console.log(globalState);
}

//black pawn funciton
function blackPawnClick({piece})
{
  if (highlight_state)
  {
    movePieceFromXToY(selfHighlightState, piece);
    return;
  }

  clearPreviousSelfHighlight(selfHighlightState);

  //if clicked on same element twice
  if (piece == selfHighlightState) {
    selfHighlightState = null;
    clearHighlightLocal();
    return;
  }
  
  //highlighting logic
  selfHighlight(piece);
  highlight_state = true;
  selfHighlightState = piece;

  //add piece as move state
  moveState = piece;

  const curr_pos = piece.current_pos;
  const flatArray = globalState.flat();
  //on intial postion, pwns moves different
  if (curr_pos[1] == "7")
  {
    const highlightSquareIds = [
      `${curr_pos[0]}${Number(curr_pos[1]) - 1}`,
      `${curr_pos[0]}${Number(curr_pos[1]) - 2}`, ];

    clearHighlightLocal();
      
    highlightSquareIds.forEach(highlight => {
      globalState.forEach(row => {
        row.forEach(element => {
          if (element.id == highlight) {
            element.highlight = true;
          }
        });
      });
    });

    globalStateRender();
  }
  else {
    const col1 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) - 1)}${Number(curr_pos[1]) + 1}`;
    const col2 = `${String.fromCharCode(curr_pos[0].charCodeAt(0) + 1)}${Number(curr_pos[1]) + 1}`;

    const captureIds = [col1, col2];

    const highlightSquareIds = [`${curr_pos[0]}${Number(curr_pos[1]) - 1}`,];

    captureIds.forEach(element => {
      checkOpponetPieceByElement(element, "black");
    });
      
    highlightSquareIds.forEach(highlight => {
      globalState.forEach(row => {
        row.forEach(element => {
          if (element.id == highlight) {
            element.highlight = true;
          }
        });
      });
    });
    globalStateRender();
  }
  //console.log(globalState);
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
      const flatArray = globalState.flat(); //flattens the 2D globalState array into a 1D array,to asily search a specific square by its id.
      const square = flatArray.find((el) => el.id == clickId); //Search in the flattened array for an square with the id that matched the clickId. The find method return the forst matching element
      if (square.piece.piece_name == "WHITE_PAWN") {
        whitePawnClick(square);
      }
      else if (square.piece.piece_name == "BLACK_PAWN") {
        blackPawnClick(square);
      }
    }
    else //this is to know if the click is in a square with the round highlight, which is the posible move of a piece. Ensure that only valid moves are processed.
    {
      selfHighlightState = null;
      const childElementsOfclickedEl = Array.from(event.target.childNodes); //Converts the child nodes (possible moves) of the clickd element into a array to manipulate it better
      if (childElementsOfclickedEl.length == 1 || event.target.localName == "span") {
        if (event.target.localName == "span") //if the person precisely click on the round hightlight
        {
          const id =  event.target.parentNode.id; //gets the id of the parent node of the clickd 'span'
          moveElement(moveState, id); //call the function to move the piece to the new position
          moveState = null; //reset the oceState to null indicating the move is done.
        }
        else //if the clicked element is not a span but still has exactly one child node, means the square minus the round highlight, to ensure the proper movement either way
        {
          const id =  event.target.id; //gets the id of the clicked element
          moveElement(moveState, id);
          moveState = null;
        }
/*         clearHighlight();
        clearPreviousSelfHighlight(selfHighlightState);
        selfHighlightState = null; */
      }
      else { //if the click its an impossible move clear the highlighted elements
        clearHighlightLocal();
        clearPreviousSelfHighlight(selfHighlightState);
      }
    }
  });
}

export { GlobalEvent };