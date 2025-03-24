import { initGame } from "./Data/data.js";
import { initGameRender, clearHighlight, renderPlayers, toggleTurn } from "./Render/main.js";
import { GlobalEvent, clearYellowHighlight, moveElement } from "./Events/global.js";
import { resingOption } from "./Helper/modalCreator.js";
import { winGame } from "./Helper/modalCreator.js";
import { getChessMatchDetail, getChessPendingMatches } from "../../app/chess.js";
import { getUsername } from "../../app/auth.js";
import { convertToPiecePositions } from "./Render/main.js";
import { reloadMoveLogger } from "./Helper/logging.js";



let globalState = initGame();
let keySquareMapper = {};
let imgStyle = "modern";
let backgroundMusicChess = new Audio('components/chess/Assets/music/wiiChess.mp3');
let backgroundMusicPong = new Audio('components/chess/Assets/music/wiiSport.mp3');
backgroundMusicChess.loop = true;
backgroundMusicPong.loop = true;
let isMusicPlaying = false;
let currentMusic = null;
let chessSocket = null;
let attemptedReconnection = null;
let whoIsWho = {};
let inTurn;

globalState.flat().forEach((square) => {
    keySquareMapper[square.id] = square;
});

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

    if (key) {
        console.log("on chess, key: ", key)
        await initOnlineChess(key)
    } else {
        let res = await getChessPendingMatches();
        if (res.status === "success" && res.match) {
            key = res?.match?.game_key;
            console.log("RECARGAR PAGINA");
            await initOnlineChess(key);
        }
    }
    const data = await waitForBoardStatus();
    const inTurn = getUserColor(getUsername()) === data.current_player;
    const piecePositions = convertToPiecePositions(data.board);


    initGameRender(globalState, piecePositions, inTurn);
    GlobalEvent();
    generateCoordinates();
    reloadMoveLogger();
    setupButtonEvents(settingsPanel, saveSettingsButton, cancelSettingsButton, pieceStyleSelect)

    document.addEventListener('click', (event) => {
        if (!settingsPanel.contains(event.target) && !button1.contains(event.target)) {
            settingsPanel.classList.add('hidden');
        }
    });
}

let gameMode = null;

async function handleGetChessMatchDetail(key) {
    const res = await getChessMatchDetail(key);
    if (res.status === "success") {
        const white = res.match.player_white;
        const black = res.match.player_black;

        whoIsWho[white] = "white";
        whoIsWho[black] = "black";

        gameMode = res.match.game_mode;
    }
    console.log("on handleGetChessMatchDetail: ", res)
}



async function initOnlineChess(key) {
    // white or black 
    //getChessMatchDetail(key);
    await handleGetChessMatchDetail(key);
    renderPlayers(whoIsWho);
    initializeChessSocket(key);
    // initialize socket
    
}

function checkPawnDoubleMoveInLastTurn(from, to) {
    let tmp = keySquareMapper[to].piece;
    if (tmp.piece_name.includes("PAWN")){
        if (Math.abs(to[1] - from[1]) === 2) {
            tmp.move = true;
            localStorage.setItem("enPassantCapture", JSON.stringify({ position: to, color: tmp.color, move: tmp.move }));
        } else {
            tmp.move = false;
            if (localStorage.getItem("enPassantCapture"))
                localStorage.removeItem("enPassantCapture");
        }
    }
}

function handleGetChessReceivedMessage(event) {
    try {
        const data = JSON.parse(event.data);
        if (data.status === "game_update" && !data.promotion) {
            const { from, to } = data.last_move;
            const piece = keySquareMapper[from].piece;
            if (piece) {
                moveElement(piece, to, false);
                checkPawnDoubleMoveInLastTurn(from, to);
            }
        }
        if (data.status === "game_over") {
            winGame(data.winner);
            localStorage.removeItem("chessMoves");
            if (localStorage.getItem("enPassantCapture"))
                localStorage.removeItem("enPassantCapture");
            chessSocket.close(); // i forgot xd
        }
        if (data?.current_player) {
            inTurn = data.current_player;
            console.log('updating turn to: ', inTurn);
            toggleTurn(inTurn);
        }
    }
    catch (e) {
        console.error("Error parsing WS message: ", e);
    }
}

function initializeChessSocket(game_key) {
    chessSocket = new WebSocket(`ws://localhost:5090/ws/chess/${game_key}/`);

    chessSocket.onopen = () => {
        sessionStorage.setItem('inGame', '/chess');
        console.log("Chess WebSocket connected");
        chessSocket.send(JSON.stringify({ action: "ready", color: getUserColor(getUsername()), username: getUsername() }));
        attemptedReconnection = false;
    }

    chessSocket.onmessage = (event) => {
        handleGetChessReceivedMessage(event);
    }

    chessSocket.onerror = (error) => {
        console.error("ChessSocket error:", error);
    };

    chessSocket.onclose = async (event) => {
        sessionStorage.removeItem('inGame');
        console.log("Chess WebSocket closed");
    }

}

function waitForBoardStatus() {
    return new Promise((resolve, reject) => {
        function onMessage(event) {
            const data = JSON.parse(event.data);
            if (data.status === "game_starting") {
                chessSocket.removeEventListener('message', onMessage);
                resolve(data);
            }
        }
        chessSocket.addEventListener('message', onMessage);
    });
}


function getUserColor(username) {
    return whoIsWho[username];
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


/*add a custom method to String prototipe that replace a part of an
string in a specific position. Ex: str = "hello" -> str = str.replaceAt(1, "a") = "hallo" */ //borrar?

String.prototype.replaceAt = function (index, replacement) {
    return (this.substring(0, index) + replacement + this.substring(index + replacement.length));
};

export { globalState, keySquareMapper, highlightColor, imgStyle, stopBackgroundMusic, toggleBackgroundMusic, getUserColor , chessSocket, inTurn, gameMode};