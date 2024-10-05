import * as piece from "../Data/pieces.js";
import { ROOT_DIV } from "../Helper/constants.js";

/**
 * used when you wawnt to render pieces on board
 * @param {*} data 
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
 */
function initGameRender(data)
{
  data.forEach(element => {
    const rowEl = document.createElement("div"); //for each row, a new div element (rowEl) is created to represent the row
    element.forEach((square) => { //iterate for each swquare in a row
      const squareDiv = document.createElement("div"); // a new div element (squareDiv) is created to represent the square.
      squareDiv.id = square.id;
      squareDiv.classList.add(square.color, "square"); // that elemente is assigned to two CSS clasess: one for the square's color and one generic class("square").
      
      //me gustaria intentar dejar esto más bonito
      if (square.id[1] == 7) {
        square.piece = piece.blackPawn(square.id); //render blackpawn row
      }
      else if (square.id == "h8" || square.id == "a8") {
        square.piece = piece.blackRook(square.id); //render blackrook
      }
      else if (square.id == "g8" || square.id == "b8") {
        square.piece = piece.blackKnight(square.id); //render blackknight
      }
      else if (square.id == "f8" || square.id == "c8") {
        square.piece = piece.blackBishop(square.id); //render blackbishop
      }
      else if (square.id == "d8") {
        square.piece = piece.blackKing(square.id); //render blackKing
      }
      else if (square.id == "e8") {
        square.piece = piece.blackQueen(square.id); //render blackQueen
      }
      else if (square.id[1] == 2) {
        square.piece = piece.whitePawn(square.id); //render whitepawn row
      }
      else if (square.id == "h1" || square.id == "a1") {
        square.piece = piece.whiteRook(square.id); //render whiterook
      }
      else if (square.id == "g1" || square.id == "b1") {
        square.piece = piece.whiteKnight(square.id); //render whiteknight
      }
      else if (square.id == "f1" || square.id == "c1") {
        square.piece = piece.whiteBishop(square.id); //render whitebishop
      }
      else if (square.id == "d1") {
        square.piece = piece.whiteKing(square.id); //render whiteKing
      }
      else if (square.id == "e1") {
        square.piece = piece.whiteQueen(square.id); //render whiteQueen
      }
      
      rowEl.appendChild(squareDiv); //squareDiv element is appended to the rowEl
    });
    rowEl.classList.add("squareRow"); //after all squares in the row have been processed, the rowEl is assigned a CSS class("squareRow") to style the row.
    ROOT_DIV.appendChild(rowEl); //the rowEl is the appended to the ROOT_DIV, adding the row to the web page
  });

  pieceRender(data);
}


export { initGameRender }