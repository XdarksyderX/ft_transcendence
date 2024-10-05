/*We select the HTML element with the id 'root' and assign it to ROOT_DIV, which
wil be used as a cointainer where the chessboad will be appended.
*/
const ROOT_DIV = document.getElementById("root");

/**
 * This function takes the cjessboard data and renders it as a HTML elements on the web page.
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
      squareDiv.classList.add(square.color, "square"); // that elemente is assigned to two CSS clasess: one for the square's color and one generic class("square").

      rowEl.appendChild(squareDiv); //squareDiv element is appended to the rowEl
    });
    rowEl.classList.add("squareRow"); //after all squares in the row have been processed, the rowEl is assigned a CSS class("squareRow") to style the row.
    ROOT_DIV.appendChild(rowEl); //the rowEl is the appended to the ROOT_DIV, adding the row to the web page
  });
}

export { initGameRender }