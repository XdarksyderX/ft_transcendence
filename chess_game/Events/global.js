import { ROOT_DIV } from "../Helper/constants.js";
import { globalState } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { renderHighlight, selfHighlight } from "../Render/main.js";
import { clearHighlight, clearPreviousSelfHighlight } from "../Render/main.js";

//highlighted or not => state
let highlight_state = false;

//current self-highlighted square state
let selfHighlightState = null;

//in move state or not
let moveState = null;

function whitePawnClick({piece})
{

  console.log(moveState);

  clearPreviousSelfHighlight(selfHighlightState);
  selfHighlight(piece);
  selfHighlightState = piece;

  //add piece as move state
  moveState = piece;

  const curr_pos = piece.current_pos;
  const flatArray = globalState.flat();
  //on intial postion, pwns moves different
  if (curr_pos[1] == "2")
  {
    const highlight = [
      `${curr_pos[0]}${Number(curr_pos[1]) + 1}`,
      `${curr_pos[0]}${Number(curr_pos[1]) + 2}`, ]; //(curr_pos[1] + 1 = 21???)

    clearHighlight();
      
    highlight.forEach(highlight => {

      globalState.forEach(row => {
        row.forEach(element => {
          if (element.id == highlight) {
            element.highlight(true);
          }
        });
      });
    });
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
      //console.log(`Cicked on ${clickId}, piece name is` + square.piece.piece_name);
      if (square.piece.piece_name == "WHITE_PAWN")
      {
        whitePawnClick(square);
      }
    }
  });
}

export { GlobalEvent };