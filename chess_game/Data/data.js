import { globalState } from "../index.js";
import { renderHighlight } from "../Render/main.js";


//Creates a square object for the chessboard. Right now, piece is null always
function Square(color, id, piece) {

  const highlight = function () {
    renderHighlight(this.id);
    this.highlighted = true;
  };

  return { color, id, piece, highlight };
}

/*Create a row of squares for the chessboard. From row 1 to 8, we iterate to create rows
alternating colors for the squares. We append it the square with the desired color to the
squareRow array. Then, returns the array of the square objects representing a row on the 
chessboard */

function SquareRow(rowId) {
  const squareRow = [];
  const col = ["a", "b", "c", "d", "e", "f", "g", "h"];

  if (rowId % 2 == 0) {
    col.forEach((element, i) => {
      if (i % 2 == 0) {
        squareRow.push(Square("white", element + rowId, null));
      }
      else {
        squareRow.push(Square("black", element + rowId, null));
      }
    });
  }
  else {
    col.forEach((element, i) => {
      if (i % 2 == 0) {
        squareRow.push(Square("black", element + rowId, null));
      }
      else {
        squareRow.push(Square("white", element + rowId, null));
      }
    });
  }
  return squareRow;
}

//Initializes the chessboard with all rows. Collects the rows objects into an array.
//Return a 2D array representing the entire chessboard.

function initGame() {
  const chessboard = [];
  for (let i = 8; i >= 1; i--) {
    chessboard.push(SquareRow(i));
  }
  return chessboard;
}

/*
function SquareRow() {
  const chessboard = [];
  const col = ["a", "b", "c", "d", "e", "f", "g", "h"];

  for (let rowId = 8; rowId >= 1; rowId--) {
    const squareRow = [];
    if (rowId % 2 == 0) {
      col.forEach((element, index) => {
        if (index % 2 == 0) {
          squareRow.push(Square("white", element + rowId, null));
        }
        else {
          squareRow.push(Square("black", element + rowId, null));
        }
      });
    }
    else {
      col.forEach((element, index) => {
        if (index % 2 == 0) {
          squareRow.push(Square("black", element + rowId, null));
        }
        else {
          squareRow.push(Square("white", element + rowId, null));
        }
      });
    }
    chessboard.push(squareRow);
  }
  return chessboard;
}

function initGame() {
  return SquareRow();
}
*/

export { initGame };