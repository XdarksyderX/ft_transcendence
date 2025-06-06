import * as pieces from "../Data/pieces.js";
import { imgStyle, inTurn, resetGameState } from "../index.js";
import { navigateTo } from "../../../app/router.js";
import { isClick } from "../Events/global.js";
import { chessSocket } from "../Handlers/online.js";
import { resetGlobalPiece } from "../Render/main.js";

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
    document.getElementById("app-container")?.classList.add("blur");
  }
  
  hide(){
    this.open = false;
    document.body.removeChild(this.body);
    document.getElementById("app-container")?.classList.remove("blur");
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
async function pawnPromotion(color, callback, id, pieceTo = null) {
  const isClickBool = isClick();
  const piecesMap = {
    rook: pieces[color === "white" ? "whiteRook" : "blackRook"],
    knight: pieces[color === "white" ? "whiteKnight" : "blackKnight"],
    bishop: pieces[color === "white" ? "whiteBishop" : "blackBishop"],
    queen: pieces[color === "white" ? "whiteQueen" : "blackQueen"],
  };
  
  const createPieceImage = (pieceName) => {
    const img = document.createElement("img");
    img.classList.add("promotion-choice")
    img.src = `components/chess/Assets/pieces/${imgStyle}/${color}/${pieceName}.png`;
    img.onclick = () => {
      callback(piecesMap[pieceName], id);
      handlePromotionChoice(pieceName);
      modal.hide();
    };
    return img;
  };
  
  if (!isClickBool) {
    const promotionData = await waitForPromotionChoice();
    const {pieceColor, pieceType, to} = promotionData;
    callback(piecesMap[promotionData.pieceType], promotionData.to); 
    return;
  }
  
  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  ["rook", "knight", "bishop", "queen"].forEach((pieceName) => {
    imageContainer.appendChild(createPieceImage(pieceName));
  });

  const msg = document.createElement("p");
  msg.textContent = "Your Pawn has been promoted";
  msg.classList.add('ctm-text-title')

  const finalContainer = document.createElement("div");
  finalContainer.appendChild(msg);
  finalContainer.appendChild(imageContainer);
  finalContainer.classList.add("chess-modal");
  
  const modal = new ModalCreator(finalContainer);
  modal.show();
}

function handlePromotionChoice(pieceType) {
  if (!chessSocket) return ;
  const data = {
    action: "promotion_choice",
    piece_type: pieceType
  };
  try {
    chessSocket.send(JSON.stringify(data));
    //console.log("Sending promotion choice through WebSocket:", data);
  } catch (e) {
    console.error(e);
  }
}

function waitForPromotionChoice() {
  return new Promise((resolve, reject) => {
    function onMessage(event) {
      const data = JSON.parse(event.data);
      if (data?.promotion) {
        chessSocket.removeEventListener('message', onMessage);
        resolve({ pieceColor: data.promotion.color, pieceType: data.promotion.piece_type, to: data.promotion.square });
      }
    }
    chessSocket.addEventListener('message', onMessage);
  });
}

function winGame(winBool, online = false) {

  let winMsg = winBool ? `${winBool} Wins!` : 'there is a tie!';
  const modalBody = document.createElement("div");
  modalBody.innerHTML = `

    <div class="tv mx-4 position-relative mb-3">
       <p class="ctm-text-title">${winMsg}</p>
      <img class="dancing-bot" src="../../resources/win.gif">
    </div>
       
       `;

  const homeButton = document.createElement("button");
  homeButton.textContent = "Got it!";
  homeButton.classList.add("btn");
  homeButton.classList.add("ctm-btn-secondary");
  homeButton.onclick = () => {

  // this is to handle the case when someone with the winModal still open accepts a new game
    const inGameValue = sessionStorage.getItem('inGame');
    sessionStorage.clear(); // Clear all sessionStorage
    if (inGameValue !== null && online) { //online to prevent us to not be able to clear in local chess in bug case
        sessionStorage.setItem('inGame', inGameValue); // Restore 'inGame' if it existed
    }
    resetGlobalPiece();
    resetGameState();
    navigateTo('/home');
    modal.hide();
  }
  
  const buttonContainer = document.createElement("div");
  buttonContainer.appendChild(homeButton);
  
  const finalContainer = document.createElement("div");
  finalContainer.appendChild(modalBody);
  finalContainer.appendChild(buttonContainer);
  finalContainer.classList.add("chess-modal");
  const modal = new ModalCreator(finalContainer);
  setTimeout(() => { modal.show(); }, 500);

}

function resingOption() {
  const resignButton = document.getElementById("resign-button");
  resignButton.onclick = () => {
    
    if (chessSocket && chessSocket.readyState === WebSocket.OPEN) {
      const data = { action: "resign" };
      //console.log("Attempting to send data through WebSocket:", data);
      chessSocket.send(JSON.stringify(data));
      //console.log("Sending data through WebSocket:", data);
    } else if (!chessSocket) {
        const winner = inTurn === 'white' ? 'black' : 'white';
        winGame(winner);
    }
  }
}

export { pawnPromotion, winGame, resingOption };