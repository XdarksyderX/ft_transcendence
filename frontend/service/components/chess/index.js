/**
 * this file initializes the chess game.
 * with 'import' we take the functions from their files
*/
import { getChessPendingMatches } from "../../app/chess.js";
import { initGame } from "./Data/data.js";
import { initGameRender, clearHighlight, resetGlobalPiece } from "./Render/main.js";
import { GlobalEvent, clearYellowHighlight } from "./Events/global.js";
import { resingOption } from "./Helper/modalCreator.js";
import { pawnPromotion } from "./Helper/modalCreator.js"; // fully provisional
import { winGame } from "./Helper/modalCreator.js";
import { initOnlineChess, onlineInfo } from "./Handlers/online.js";
import { offlineInfo } from "./Handlers/offline.js";
import { initOfflineChess } from "./Handlers/offline.js";
import { toggleTurn } from "./Render/main.js";
import { hideModalGently } from "../../app/render.js";

let globalState = null;
let keySquareMapper = {};
let imgStyle = "modern";
let backgroundMusicChess = new Audio('components/chess/Assets/music/wiiChess.mp3');
let backgroundMusicPong = new Audio('components/chess/Assets/music/wiiSport.mp3');
backgroundMusicChess.loop = true;
backgroundMusicPong.loop = true;
let isMusicPlaying = false;
let currentMusic = null;

let gameMode;
let inTurn;

let highlightColor = 'rgba(0, 0, 0, 0.15)';

function updateHighlightYellowColor(whiteTileColor, blackTileColor) {
    const styleSheet = document.styleSheets[14]; // 14 is the  index of chess/styles.css
    
    const whiteTileRule = `.highlightYellow { background-color: ${whiteTileColor} !important; }`;
    const blackTileRule = `.black.square.highlightYellow { background-color: ${blackTileColor} !important; }`;
    
    // Remove existing .highlightYellow rules if they exist
    for (let i = 0; i < styleSheet.cssRules.length; i++) {
        if (styleSheet.cssRules[i].selectorText === '.highlightYellow' || styleSheet.cssRules[i].selectorText === '.black.square.highlightYellow') {
            styleSheet.deleteRule(i);
            i--; // Adjust index after deletion
        }
    }

    // Add new .highlightYellow rules
    styleSheet.insertRule(whiteTileRule, styleSheet.cssRules.length);
    styleSheet.insertRule(blackTileRule, styleSheet.cssRules.length);
}

export async function initializeChessEvents(key) {
    const button1 = document.getElementById('button1');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsButton = document.getElementById('save-settings');
    const cancelSettingsButton = document.getElementById('cancel-settings');
    const pieceStyleSelect = document.getElementById('piece-style');

    initGameState();
    hideWinModal();

    
    //console.log("globalState at the beggining of the game: ", globalState);
    //console.log("squareKeyMapper at the beggining of the game: ", keySquareMapper);
    if (key) {
        await initOnlineChess(key, true);
    } else {
        let res = await getChessPendingMatches();
        if (res.status === "success" && res.match) {
            key = res?.match?.game_key;
            await initOnlineChess(key, false);
        } else {
            initOfflineChess();
        }
    }
    gameMode = onlineInfo.gameMode || offlineInfo.gameMode ;
    GlobalEvent();
    generateCoordinates();
    setupButtonEvents(settingsPanel, saveSettingsButton, cancelSettingsButton, pieceStyleSelect)
    
    document.addEventListener('click', (event) => {
        if (!settingsPanel.contains(event.target) && !button1.contains(event.target)) {
            settingsPanel.classList.add('hidden');
        }
    });
}

function initGameState() {

    // just in case the previous game ended abruptely
    resetGlobalPiece();
    resetGameState();

    // restets the default status 
    globalState = initGame();

    globalState.flat().forEach((square) => {
        keySquareMapper[square.id] = square;
    });

}

function resetGameState() {
    if (!globalState) return ;
    // Clear globalState by setting all pieces to null
    globalState.forEach(row => {
        row.forEach(square => {
            square.piece = null; // Remove references to pieces
        });
    });
    // Clear keySquareMapper by removing all keys
    for (const key in keySquareMapper) {
        delete keySquareMapper[key];
    }
    console.log("[CHESS] globalState and keySquareMapper have been reset");
}

// checks if the win modal is present at starting a new game
function hideWinModal() {
    const modals = document.getElementsByClassName('chess-modal');
    Array.from(modals).forEach(modal => {
        modal.remove();
    });
    document.getElementById("app-container")?.classList.remove("blur");
}


function setupButtonEvents(settingsPanel, saveSettingsButton, cancelSettingsButton, pieceStyleSelect) {
    const button1 = document.getElementById('button1');
    const button2 = document.getElementById('button2');
    const button3 = document.getElementById('button3');

    button1.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });

    button2.addEventListener('click', () => {
        resingOption();
    });
    button3.addEventListener('click', () => {
        flipBoard();
    });

    saveSettingsButton.addEventListener('click', () => {
        saveSettings(pieceStyleSelect, settingsPanel);
    });

    cancelSettingsButton.addEventListener('click', () => {
        settingsPanel.classList.add('hidden');
    });
}

function saveSettings(pieceStyleSelect, settingsPanel) {
    const pieceStyle = pieceStyleSelect.value.toLowerCase();
    const boardColor = document.getElementById('board-color').value;
    const [whiteTileColor, blackTileColor] = boardColor.split(';').map(style => style.split(':')[1]);

    clearHighlight();
    clearYellowHighlight();
    
    document.querySelectorAll('.white').forEach(cell => {
        cell.style.backgroundColor = whiteTileColor;
    });
    document.querySelectorAll('.black').forEach(cell => {
        cell.style.backgroundColor = blackTileColor;
    });

    if (boardColor === 'white:#84cca3;black:#5c3973') {
        updateHighlightYellowColor('var(--accent)', 'var(--dark)');
    } else {
        updateHighlightYellowColor('var(--lorange)', 'var(--lorange)');
    }
    if (boardColor === 'white:#ffffff;black:#000000') {
        highlightColor = 'rgba(113, 113, 113, 0.52)';
    } else {
        highlightColor = 'rgba(0, 0, 0, 0.15)';
    }

    changePieceStyle(pieceStyle);
    settingsPanel.classList.add('hidden');
}

function generateCoordinates() {
    const alphaCoord = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const numCoord = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const alphaCoordContainer = document.getElementById('alpha-coord');
    const alphaCoordBottomContainer = document.getElementById('alpha-coord-bottom');
    const numCoordContainer = document.getElementById('num-coord');
    const numCoordRightContainer = document.getElementById('num-coord-right');

    alphaCoordContainer.innerHTML = '<div class="empty-tile""></div>' + alphaCoord.map(letter => `<div class="tile-x">${letter}</div>`).join('');
    alphaCoordBottomContainer.innerHTML = '<div class="empty-tile""></div>' + alphaCoord.map(letter => `<div class="tile-x">${letter}</div>`).join('');
    numCoordContainer.innerHTML = numCoord.map(number => `<div class="tile-y">${number}</div>`).join('');
    numCoordRightContainer.innerHTML = numCoord.map(number => `<div class="tile-y">${number}</div>`).join('');
}

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
        piece.src = `components/chess/Assets/pieces/${style}/${pieceType}.png`; 
    });
}

function flipBoard() {
    const boardContainer = document.getElementById('root');
    const alphaCoordTop = document.getElementById('alpha-coord');
    const alphaCoordBottom = document.getElementById('alpha-coord-bottom');
    const numCoordLeft = document.getElementById('num-coord');
    const numCoordRight = document.getElementById('num-coord-right');
  
    boardContainer.classList.toggle('flipped');
    alphaCoordTop.classList.toggle('flipped');
    alphaCoordBottom.classList.toggle('flipped');
    numCoordLeft.classList.toggle('flipped');
    numCoordRight.classList.toggle('flipped');
}

function toggleBackgroundMusic(url) {
    const musicIcon = document.getElementById('music-icon');
    if (currentMusic)
        pauseBackgroundMusic();
    if (url === "/chess")
        currentMusic = backgroundMusicChess;
    else if (url === "/pong")
        currentMusic = backgroundMusicPong;
    else
        return;
    if (isMusicPlaying) {
        pauseBackgroundMusic()
        musicIcon.classList.remove('bi-volume-up-fill');
        musicIcon.classList.add('bi-volume-mute-fill');
    } else {
        startBackgroundMusic()
        musicIcon.classList.remove('bi-volume-mute-fill');
        musicIcon.classList.add('bi-volume-up-fill');
    }
    isMusicPlaying = !isMusicPlaying;
}

function startBackgroundMusic() {
    if (currentMusic)
        currentMusic.play();
}

function pauseBackgroundMusic() {
    if (currentMusic)
        currentMusic.pause();
}

function stopBackgroundMusic() {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
      }
}

function updateInTurn(to) {
    //console.log('updating turn to: ', to);
    inTurn = to;
    toggleTurn(inTurn);
}

/*custom method to String prototipe that replace a part of an
string in a specific position. Ex: str = "hello" -> str = str.replaceAt(1, "a") = "hallo" */

String.prototype.replaceAt = function (index, replacement) {
    return (this.substring(0, index) + replacement + this.substring(index + replacement.length));
};

export { globalState, keySquareMapper, highlightColor, imgStyle, stopBackgroundMusic, toggleBackgroundMusic, inTurn, gameMode, updateInTurn, resetGameState };