import * as piece from "../Data/pieces.js";
import { ROOT_DIV } from "../Helper/constants.js";
import { globalState } from "../index.js";

const globalPiece = new Object();

/**
 * funciton globlaStateRendere is usefull to render pieces from globalStateData,
 * when updating globalState
 */

function globalStateRender() {
  globalState.forEach(row => {
    row.forEach(element => {
      if (element.highlight) {
        const highlightSpan = document.createElement("span");
        highlightSpan.classList.add("highlight");
        document.getElementById(element.id).appendChild(highlightSpan);
      }
      //else if (element.highlight === null) {
      else {
        const el = document.getElementById(element.id);
        const highlights = Array.from(el.getElementsByClassName("highlight"));
        //const highlights = Array.from(el.getElementsByTagName("span"));
        highlights.forEach(element => {
          el.removeChild(element);
        });
        //document.getElementById(element.id).innerHTML = "";
      }
    });
  });
}

//simple function that highlight in the square you click if there is a piece on it
function selfHighlight(piece)
{
  document.getElementById(piece.current_pos).classList.add("highlightYellow");
}

/**
 * Used when you want to render pieces on board, whether its theinitial setup or an ongoing game.
 * We double iterate over each row and square cheking if the current square contains a piece. If piece is not
 * null, we retrieve the HTML element corresponding to the current square using its 'id', which its unique.
 * Then, we create a new <img> element, set the 'src' attribute of the <img> element to the URL of the piece.
 * We add a CSS class to the <img> element for styling  * purpose, and finally we append that new element
 * representing the piece to the square's HTML element.
 * @param {*} data data 2D array representing the chessboard
 */
function pieceRender(data)
{
  data.forEach(row => {
    row.forEach(square => {
      //if square has piece
      if (square.piece) {
       const squareEl = document.getElementById(square.id);

       //create piece
       const piece = document.createElement("img");
       piece.src = square.piece.img;
       piece.classList.add("piece");
       
       //inset piece into square element
       squareEl.appendChild(piece);
      }
    });
  });
}

/**
 * This function takes the chessboard data and renders it as a HTML elements on the web page.
 * its only called when game starts (only for one time)
 * @param {*} data a 2D array representing the chessboard, where each element is a row of squares.
 * In this code, we assign generic CSS classes because ensure have consistet appereance, border or color
 * for the squares, an consistent layout, such as discplay properties (flexbox or grid), spacing and
 * aligment for the rows. By using generic classes, we can easily update the appearance of all squares 
 * or rows by modifying a single CSS rule, rather than having to update each element individually.
 * 
 * piecePosition: Its an objet that maps the initial positions of the pieces to their rendering functions,
 * which we'll then use to assign the pieces to the board squares.
 */

const piecePositions = {
  "a8": piece.blackRook,
  "h8": piece.blackRook,
  "b8": piece.blackKnight,
  "g8": piece.blackKnight,
  "c8": piece.blackBishop,
  "f8": piece.blackBishop,
  "d8": piece.blackQueen,
  "e8": piece.blackKing,
  "a1": piece.whiteRook,
  "h1": piece.whiteRook,
  "b1": piece.whiteKnight,
  "g1": piece.whiteKnight,
  "c1": piece.whiteBishop,
  "f1": piece.whiteBishop,
  "d1": piece.whiteQueen,
  "e1": piece.whiteKing
};

const globalPieceMap = {
  "a8": "black_rook",
  "h8": "black_rook",
  "b8": "black_knight",
  "g8": "black_knight",
  "c8": "black_bishop",
  "f8": "black_bishop",
  "d8": "black_queen",
  "e8": "black_king",
  "a1": "white_rook",
  "h1": "white_rook",
  "b1": "white_knight",
  "g1": "white_knight",
  "c1": "white_bishop",
  "f1": "white_bishop",
  "d1": "white_queen",
  "e1": "white_king"
};

function initGameRender(data)
{
  data.forEach(element => {
    const rowEl = document.createElement("div"); //for each row, a new div element (rowEl) is created to represent the row
    element.forEach((square) => { //iterate for each swquare in a row
      const squareDiv = document.createElement("div"); // a new div element (squareDiv) is created to represent the square.
      squareDiv.id = square.id;
      squareDiv.classList.add(square.color, "square"); // that elemente is assigned to two CSS clasess: one for the square's color and one generic class("square").
      
/*       const labelId = document.createElement("span");
      labelId.textContent = square.id;
      labelId.classList.add("labelId", `${square.color}-label-id`);
      squareDiv.append(labelId); */

      if (square.id[1] == 7) {  //render blackpawn row
        square.piece = piece.blackPawn(square.id);
        globalPiece.black_pawn = square.piece;
      }
      else if (square.id[1] == 2) { //render whitepawn row
        square.piece = piece.whitePawn(square.id);
        globalPiece.white_pawn = square.piece;
      }
      else if (piecePositions[square.id]) {
        square.piece = piecePositions[square.id](square.id); // render specific piece like if square.id == "d8") -> square.piece = piece.blackKing(square.id)
        if (square.id == "e8")
          globalPiece.black_king = square.piece;
        else if (square.id == "e1")
          globalPiece.white_king = square.piece;
        else if (square.id == "d8")
          globalPiece.black_queen = square.piece;
        else if (square.id == "d1")
          globalPiece.white_queen = square.piece;
        else if (square.id == "a8" || square.id == "h8") {
          if (globalPiece.black_rook_1)
            globalPiece.black_rook_2 = square.piece;
          else
            globalPiece.black_rook_1 = square.piece;
        }
        else if (square.id == "a1" || square.id == "h1") {
          if (globalPiece.white_rook_1)
            globalPiece.white_rook_2 = square.piece;
          else
            globalPiece.white_rook_1 = square.piece;
        }
        else if (square.id == "b8" || square.id == "g8") {
          if (globalPiece.black_knight_1)
            globalPiece.black_knight_2 = square.piece;
          else
            globalPiece.black_knight_1 = square.piece;
        }
        else if (square.id == "b1" || square.id == "g1") {
          if (globalPiece.white_knight_1)
            globalPiece.white_knight_2 = square.piece;
          else
            globalPiece.white_knight_1 = square.piece;
        }
        else if (square.id == "c8" || square.id == "f8") {
          if (globalPiece.black_bishop_1)
            globalPiece.black_bishop_2 = square.piece;
          else
            globalPiece.black_bishop_1 = square.piece;
        }
        else if (square.id == "c1" || square.id == "f1") {
          if (globalPiece.white_bishop_1)
            globalPiece.white_bishop_2 = square.piece;
          else
            globalPiece.white_bishop_1 = square.piece;
        }
/*         const globalPieceKey = globalPieceMap[square.id]; //alternativa
        if (globalPieceKey) {
          globalPiece[globalPieceKey] = square.piece;
        } */
      }
      
      rowEl.appendChild(squareDiv); //squareDiv element is appended to the rowEl
    });
    rowEl.classList.add("squareRow"); //after all squares in the row have been processed, the rowEl is assigned a CSS class("squareRow") to style the row.
    ROOT_DIV.appendChild(rowEl); //the rowEl is the appended to the ROOT_DIV, adding the row to the web page
  });
  pieceRender(data);
}

// render highlight circle
function renderHighlight(squareId)
{
  const highlightSpan = document.createElement("span");
  highlightSpan.classList.add("highlight");
  document.getElementById(squareId).appendChild(highlightSpan);
}

// clear all hightlight from the board
function clearHighlight()
{
  const flatData =  globalState.flat();
  flatData.forEach((el) => {
    if (el.captureHightlight) {
      document.getElementById(el.id).classList.remove("captureColor");
      el.captureHightlight = false;
    }
    if (el.highlight) {
      el.highlight = null;
    }
    globalStateRender();
  });
}

export { initGameRender, renderHighlight, clearHighlight, selfHighlight, globalStateRender, globalPiece };