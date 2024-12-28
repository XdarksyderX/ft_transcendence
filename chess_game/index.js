/**
 * this file initializes the chess game.
 * with 'import' we take the functions from their files
*/

import { initGame } from "./Data/data.js";
import { initGameRender } from "./Render/main.js";
import { GlobalEvent } from "./Events/global.js";
import { resingOption } from "./Helper/modalCreator.js";

//will be usefull until game ends
const globalState = initGame();
let keySquareMapper = {};

globalState.flat().forEach((square) => {
    keySquareMapper[square.id] = square;
});

initGameRender(globalState);
GlobalEvent();

document.addEventListener('DOMContentLoaded', () => {
    const button1 = document.getElementById('button1');
    const button2 = document.getElementById('button2');
  
    button1.addEventListener('click', () => {
      console.log('Settings Button clicked');
    });
  
    button2.addEventListener('click', () => {
      console.log('Resign Button clicked');
      resingOption();
    });
  });

/*add a custom method to String prototipe that replace a part of an
string in a specific position. Ex: str = "hello" -> str = str.replaceAt(1, "a") = "hallo" */

String.prototype.replaceAt = function (index, replacement) {
    return (this.substring(0, index) + replacement + this.substring(index + replacement.length));
};

export { globalState, keySquareMapper };