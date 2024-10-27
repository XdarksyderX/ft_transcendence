/**
 * this file initializes the chess game.
 * with 'import' we take the functions from their files
*/

import { initGame } from "./Data/data.js";
import { initGameRender } from "./Render/main.js";
import { GlobalEvent } from "./Events/global.js";

//will be usefull until game ends
const globalState = initGame();
let keySquareMapper = {};

globalState.flat().forEach((square) => {
    keySquareMapper[square.id] = square;
});

initGameRender(globalState);
GlobalEvent();

export { globalState, keySquareMapper };