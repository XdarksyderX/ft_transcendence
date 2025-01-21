import * as pieces from "../Data/pieces.js";
import { imgStyle } from "../index.js";
import { navigateTo } from "../../../app/router.js";

/**
 * This class  is a design pattern aimed at creating
 * and managing modals like a pop-up windows or dialogs on a web page.
 * Upon creation its visibility state its set to false and body saves
 * the HTML content of the modal that will be manipulated.
 * 
 * Both methods change the visibility, add/remove the modal's content
 * to the end of the document, which cause the modal to be or not displayed
 * on the page, and finally add/remove a CSS class to the root element of the page.
 */
class ModalCreator {
  constructor(body) {
    if (!body){
      throw new Error("Please pass the body");
    }
    this.open = false;
    this.body = body;
  }
  
  show() {
    this.open = true;
    document.body.appendChild(this.body);
    document.getElementById("root").classList.add("blur");
  }
  
  hide(){
    this.open = false;
    document.body.removeChild(this.body);
    document.getElementById("root").classList.remove("blur");
  }
}

/**
 * This function handles the promotion of a pawn when it reaches the opposite
 * end of the board. The function displays a modal with the available promotion
 * options.
 * It uses **callback functions** to delegate the responsibility of handling the
 * selected piece.
 * 
 * A callback function is passed as an argument to another function and executed within it.
 * This is useful here because `pawnPromotion` doesn't decide what to do with the selected
 * promoted piece — that decision is delegated to the callback function.
 * 
 * Create a mapping (`piecesMap`) of piece names to their respective piece functions
 * based on color.
 * Dynamically create an image for each promotion option and attach a callback function
 * to handle the selection.
 * @param {string} color 
 * @param {function} callback - callbackPiece from global.js
 * @param {string} id - The ID of the square where the pawn promotion is happening.
 */
function pawnPromotion(color, callback, id) {
  const piecesMap = {
    rook: pieces[color === "white" ? "whiteRook" : "blackRook"],
    knight: pieces[color === "white" ? "whiteKnight" : "blackKnight"],
    bishop: pieces[color === "white" ? "whiteBishop" : "blackBishop"],
    queen: pieces[color === "white" ? "whiteQueen" : "blackQueen"],
  };

  const createPieceImage = (pieceName) => {
    const img = document.createElement("img");
    img.src = `components/chess/Assets/pieces/${imgStyle}/${color}/${pieceName}.png`;
    img.onclick = () => {
      callback(piecesMap[pieceName], id);
      modal.hide();
    };
    return img;
  };

  const imageContainer = document.createElement("div");
  ["rook", "knight", "bishop", "queen"].forEach((pieceName) => {
    imageContainer.appendChild(createPieceImage(pieceName));
  });

  const msg = document.createElement("p");
  msg.textContent = "Your Pawn has been promoted";

  const finalContainer = document.createElement("div");
  finalContainer.appendChild(msg);
  finalContainer.appendChild(imageContainer);
  finalContainer.classList.add("chess-modal");
  
  const modal = new ModalCreator(finalContainer);
  modal.show();
}

//aqui habria que conectar los distintos botones a distintas paginas del front -> ver con Eli
function winGame(winBool) {
  if(!winBool)
    return;
  const msg = document.createElement("p");
  msg.textContent = `${winBool} Wins!`;

  const retryButton = document.createElement("button");
  retryButton.textContent = "Retry";
  retryButton.classList.add("retry-button");
  retryButton.onclick = () => {
    alert("oh shit here I go again");
    location.reload(); //esto simplemente recarga la pagina, no es definitivo -> aqui guardariamos la victoria y/o derrota en el historial
    modal.hide();
  }
  
  const homeButton = document.createElement("button");
  homeButton.textContent = "Home";
  homeButton.classList.add("home-button");
  homeButton.onclick = () => {
    alert("jaja no ka pasao");
    //location.reload(); //esto simplemente recarga la pagina, no es definitivo -> aqui guardariamos la victoria y/o derrota en el historial
    navigateTo('/start-game');
    modal.hide();
  }
  
  const buttonContainer = document.createElement("div");
  buttonContainer.appendChild(retryButton);
  buttonContainer.appendChild(homeButton);
  
  const finalContainer = document.createElement("div");
  finalContainer.appendChild(msg);
  finalContainer.appendChild(buttonContainer);
  finalContainer.classList.add("chess-modal");
  const modal = new ModalCreator(finalContainer);
  modal.show();
}

//aqui habria que conectar los distintos botones a distintas paginas del front -> ver con Eli
function resingOption() {
  const msg = document.createElement("p");
  msg.textContent = `You are about to resign the game\nAre you sure?`;

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.classList.add("cancel-button");
  cancelButton.onclick = () => {
    modal.hide();
  }
  
  const resignButton = document.createElement("button");
  resignButton.textContent = "Resign";
  resignButton.classList.add("resign-button");
  resignButton.onclick = () => {
    alert("Tenemos muuuuucho miero\nSon la 3 de la banana!");
    //location.reload(); //esto simplemente recarga la pagina, no es definitivo -> aqui guardariamos la victorio y/o derrota en el historial
    navigateTo('/start-game');
    modal.hide();
  }
  
  const buttonContainer = document.createElement("div");
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(resignButton);
  
  const finalContainer = document.createElement("div");
  finalContainer.appendChild(msg);
  finalContainer.appendChild(buttonContainer);
  finalContainer.classList.add("chess-modal");
  const modal = new ModalCreator(finalContainer);
  modal.show();
}

export { pawnPromotion, winGame, resingOption };