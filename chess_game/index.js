/**
 * this file initializes the chess game.
 * with 'import' we take the functions from their files
*/

import { initGame } from "./Data/data.js";
import { initGameRender, clearHighlight } from "./Render/main.js";
import { GlobalEvent, clearYellowHighlight } from "./Events/global.js";
import { resingOption } from "./Helper/modalCreator.js";

//will be usefull until game ends
const globalState = initGame();
let keySquareMapper = {};
let imgStyle = "modern";

globalState.flat().forEach((square) => {
    keySquareMapper[square.id] = square;
});

initGameRender(globalState);
GlobalEvent();

let highlightColor = 'rgba(0, 0, 0, 0.15)'; // Color por defecto

document.addEventListener('DOMContentLoaded', () => {
    const button1 = document.getElementById('button1');
    const button2 = document.getElementById('button2');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsButton = document.getElementById('save-settings');
    const cancelSettingsButton = document.getElementById('cancel-settings');
    const pieceStyleSelect = document.getElementById('piece-style');

    button1.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden');
    });
  
    button2.addEventListener('click', () => {
      resingOption();
    });

    saveSettingsButton.addEventListener('click', () => {
        const pieceStyle = pieceStyleSelect.value.toLowerCase();
        const boardColor = document.getElementById('board-color').value;
        const [whiteTileColor, blackTileColor] = boardColor.split(';').map(style => style.split(':')[1]);

        //Limpiar cualquier highlight del tablero antes de cambiar de color por si acaso
        clearHighlight();
        clearYellowHighlight();
        
        // Aplicar los colores seleccionados a las celdas del tablero
        document.querySelectorAll('.white').forEach(cell => {
            cell.style.backgroundColor = whiteTileColor;
        });
        document.querySelectorAll('.black').forEach(cell => {
            cell.style.backgroundColor = blackTileColor;
        });

        // Cambiar el color de .highlight si el estilo es "Black"
        if (boardColor === 'white:#ffffff;black:#000000') {
            highlightColor = 'rgba(113, 113, 113, 0.52)'; // Color para el estilo "Black"
        } else {
            highlightColor = 'rgba(0, 0, 0, 0.15)'; // Color por defecto
        }

        changePieceStyle(pieceStyle);

        settingsPanel.classList.add('hidden');
    });
    
    cancelSettingsButton.addEventListener('click', () => {
        settingsPanel.classList.add('hidden');
    });

    function changePieceStyle(style) {
        imgStyle = style;
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => {
            function extractString(input) {
                const secondLastSlash = input.lastIndexOf('/', input.lastIndexOf('/') - 1);
                const lastDotIndex = input.lastIndexOf('.');
                if (secondLastSlash !== -1 && lastDotIndex !== -1 && lastDotIndex > secondLastSlash) {
                    return input.substring(secondLastSlash + 1, lastDotIndex);
                }
                return null;
            }
            const pieceType = extractString(piece.src);
            piece.src = `Assets/pieces/${style}/${pieceType}.png`; 
        });
    }

    document.addEventListener('click', (event) => {
        if (!settingsPanel.contains(event.target) && !button1.contains(event.target)) {
            settingsPanel.classList.add('hidden');
        }
    });

});

/*add a custom method to String prototipe that replace a part of an
string in a specific position. Ex: str = "hello" -> str = str.replaceAt(1, "a") = "hallo" */

String.prototype.replaceAt = function (index, replacement) {
    return (this.substring(0, index) + replacement + this.substring(index + replacement.length));
};

export { globalState, keySquareMapper, highlightColor, imgStyle };