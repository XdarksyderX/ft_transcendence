/**
 * this file initializes the chess game.
 * with 'import' we take the functions from their files
*/

import { initGame } from "./Data/data.js";
import { initGameRender } from "./Render/main.js";

initGameRender(initGame());