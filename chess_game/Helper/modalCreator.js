import * as pieces from "../Data/pieces.js";

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

function pawnPromotion(color, callback, id) {
  const rook = document.createElement("img");
  rook.onclick = rookCallback;
  rook.src = `/chess_game/Assets/pieces/${color}/rook.png`;
  
  const knight = document.createElement("img");
  knight.onclick = knightCallback;
  knight.src = `/chess_game/Assets/pieces/${color}/knight.png`;
  
  const bishop = document.createElement("img");
  bishop.onclick = bishopCallback;
  bishop.src = `/chess_game/Assets/pieces/${color}/bishop.png`;
  
  const queen = document.createElement("img");
  queen.onclick = queenCallback;
  queen.src = `/chess_game/Assets/pieces/${color}/queen.png`;

  const imageContainer = document.createElement("div");
  imageContainer.appendChild(rook);
  imageContainer.appendChild(knight);
  imageContainer.appendChild(bishop);
  imageContainer.appendChild(queen);

  const msg = document.createElement("p");
  msg.textContent = "Your Pawn has been promoted";

  const finalContainer = document.createElement("div");
  finalContainer.appendChild(msg);
  finalContainer.appendChild(imageContainer);
  finalContainer.classList.add("modal");
  
  const modal = new ModalCreator(finalContainer);
  modal.show();

  function rookCallback() {
    if (color == "white") {
      callback(pieces.whiteRook, id);
    }
    else {
      callback(pieces.blackRook, id);
    }
    modal.hide();
  };
  function knightCallback() {
    if (color == "white") {
      callback(pieces.whiteKnight, id);
    }
    else {
      callback(pieces.blackKnight, id);
    }
    modal.hide();
  };
  function bishopCallback() {
    if (color == "white") {
      callback(pieces.whiteBishop, id);
    }
    else {
      callback(pieces.blackBishop, id);
    }
    modal.hide();
  };
  function queenCallback() {
    if (color == "white") {
      callback(pieces.whiteQueen, id);
    }
    else {
      callback(pieces.blackQueen, id);
    }
    modal.hide();
  };
}

function winGame(winBool) {
  if(!winBool)
    return;
  const msg = document.createElement("p");
  msg.textContent = `${winBool} Wins!`;

  const retryButton = document.createElement("button");
  retryButton.textContent = "Retry";
  retryButton.onclick = () => {
    alert("oh shit here I go again");
    location.reload(); //esto simplemente recarga la pagina, no es definitivo -> aqui guardariamos la victorio y/o derrota en el historial
    modal.hide();
  }
  
  const homeButton = document.createElement("button");
  homeButton.textContent = "Home";
  homeButton.onclick = () => {
    alert("jaja no ka pasao");
    location.reload(); //esto simplemente recarga la pagina, no es definitivo -> aqui guardariamos la victorio y/o derrota en el historial
    modal.hide();
  }
  
  const buttonContainer = document.createElement("div");
  buttonContainer.appendChild(retryButton);
  buttonContainer.appendChild(homeButton);
  
  const finalContainer = document.createElement("div");
  finalContainer.appendChild(msg);
  finalContainer.appendChild(buttonContainer);
  finalContainer.classList.add("modal");
  const modal = new ModalCreator(finalContainer);
  modal.show();
}

export { pawnPromotion, winGame };