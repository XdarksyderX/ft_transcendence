import * as piece from "../Data/pieces.js";
import { globalState, highlightColor, keySquareMapper } from "../index.js";
import { getChess960Piece } from "../Variants/chess960.js";
import { renderHordePieces } from "../Variants/horde.js";
import { initGame } from "../Data/data.js";

const globalPiece = new Object();
const chessVariantTmp = sessionStorage.getItem('chessVariant'); //borrar -> solucion temporal para asegurar la persistencia de la variable hasta que tengamos backend

/**
 * funciton globlaStateRender is usefull to render pieces from globalStateData,
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
      else {
        const el = document.getElementById(element.id);
        const highlights = Array.from(el.getElementsByClassName("highlight"));
        highlights.forEach(element => {
          el.removeChild(element);
        });
      }
    });
  });
}

//simple function that highlight in the square you click if there is a piece on it
function selfHighlight(piece){
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

/**
 * This function takes the chessboard data and renders it as HTML elements on the web page.
 * It is only called when the game starts (only for one time).
 * 
 * We double iterate over each row and square checking if the current square contains a pieceand creating
 * a new div element for each square.
 * If the piece is not null, we retrieve the HTML element corresponding to the current square using its 'id',
 * which is unique.
 * Then, we create a new <img> element, set the 'src' attribute of the <img> element to the URL of the piece.
 * We add a CSS class to the <img> element for styling purposes, and finally we append that new element
 * representing the piece to the square's HTML element.
 * @param {*} data a 2D array representing the chessboard, where each element is a row of squares.
 */
function initGameRender(data, piecePositions, detail)
{
  globalPiece.black_pawns = [];
  globalPiece.white_pawns = [];

  if (detail.gameMode === "960")
    getChess960Piece();

  document.getElementById('root').innerHTML = '';
  data.forEach(element => {
    const rowEl = document.createElement("div");
    element.forEach((square) => {
      const squareDiv = document.createElement("div");
      squareDiv.id = square.id;
      squareDiv.classList.add(square.color, "square");
      
      assignSpecificPiece(square, piecePositions);
      rowEl.appendChild(squareDiv);
      });
      rowEl.classList.add("squareRow");
      document.getElementById('root').appendChild(rowEl);
    });
    pieceRender(data);
    // migración enpassant
    const enpassantItem = detail.inTurn ? 'enPassantCapture' : 'enPassantTarget'
    const enPassantState = JSON.parse(localStorage.getItem(enpassantItem));
    if (enPassantState) {
      const { position, move } = enPassantState;
      if (keySquareMapper[position] && keySquareMapper[position].piece) {
          keySquareMapper[position].piece.move = move;
      }
    }
}

function assignSpecificPiece(square, piecePositions) {
  if (!piecePositions[square.id]) {
    square.piece = null;
    return;
  }
  const fullName = piecePositions[square.id].name;
  const color = fullName.startsWith("black") ? "black" : "white";
  const pieceType = fullName.replace(color, '').toLowerCase();
  
  if (pieceType === 'rook' || pieceType === 'knight' || pieceType === 'bishop'){
    square.piece = piecePositions[square.id](square.id)
    assignRepeatedPiece(square, color, pieceType);
  }
  else if (pieceType == 'pawn') {
    if (color == "black"){
      square.piece = piece.blackPawn(square.id);
      globalPiece.black_pawns.push(square.piece);
    }
    else {
      square.piece = piece.whitePawn(square.id);
      globalPiece.white_pawns.push(square.piece);
    }
  }
  else if (pieceType == 'king' || pieceType == 'queen'){
    square.piece = piecePositions[square.id](square.id)
    globalPiece[`${color}_${pieceType}`] = square.piece;
  }
}

function assignRepeatedPiece(square, color, pieceType) {
  if (globalPiece[`${color}_${pieceType}_1`])
    globalPiece[`${color}_${pieceType}_2`] = square.piece;
  else
    globalPiece[`${color}_${pieceType}_1`] = square.piece;
}


// render highlight circle
function renderHighlight(squareId) {
  const highlightSpan = document.createElement("span");
  highlightSpan.classList.add("highlight");
  highlightSpan.style.backgroundColor = highlightColor; // Aplicar el color de highlight
  document.getElementById(squareId).appendChild(highlightSpan);
}

// clear all hightlight from the board
function clearHighlight() {
  const flatData =  globalState.flat();
  flatData.forEach((el) => {
    if (el.captureHightlight) {
      document.getElementById(el.id).classList.remove("captureColor");
      el.captureHightlight = false;
    }
    if (el.highlight) {
      const highlightElement = document.getElementById(el.id).querySelector('.highlight');
      if (highlightElement) {
        highlightElement.remove();
      }
      el.highlight = null;
    }
    globalStateRender();
  });
}

function circleHighlightRender(highlightSquareIds, keySquareMapper) {
  highlightSquareIds.forEach(highlight => {
    const element = keySquareMapper[highlight];
    element.highlight = true;

    // create and add the element .highlight if doesn't exist
    let highlightSpan = document.getElementById(highlight).querySelector('.highlight');
    if (!highlightSpan) {
      highlightSpan = document.createElement("span");
      highlightSpan.classList.add("highlight");
      document.getElementById(highlight).appendChild(highlightSpan);
    }
    highlightSpan.style.backgroundColor = highlightColor;
  });
}

export { initGameRender, renderHighlight, clearHighlight, selfHighlight, globalStateRender, globalPiece, circleHighlightRender, piecePositions };