
import * as piece from "../Data/pieces.js";
import { globalState, updateInTurn, keySquareMapper } from "../index.js";
import { getChessMatchDetail } from "../../../app/chess.js";
import { getUsername } from "../../../app/auth.js";
import { initGameRender } from "../Render/main.js";
import { moveElement } from "../Events/global.js";
import { reloadMoveLogger } from "../Helper/logging.js";
import { winGame } from "../Helper/modalCreator.js";
import { renderPlayers } from "../Render/main.js";
import { GATEWAY_HOST } from "../../../app/sendRequest.js";
import { consoleSuccess } from "../../../app/render.js";


let onlineInfo = {
	gameMode: null,
	isInTurn: null
};

let whoIsWho = {};
let chessSocket = null;


async function initOnlineChess(key, clean) {
    await handleGetChessMatchDetail(key);
    renderPlayers(whoIsWho)
    initializeChessSocket(key);

    if (clean) {
        sessionStorage.removeItem('chessMoves')
    }
    const data = await waitForBoardStatus();
    const piecePositions = convertToPiecePositions(data.board);
	onlineInfo.isInTurn = getUserColor(getUsername()) === data.current_player;

    initGameRender(globalState, piecePositions, onlineInfo);
	reloadMoveLogger();
}


async function handleGetChessMatchDetail(key) {
    const res = await getChessMatchDetail(key);

    if (res.status === "success") {
        const white = res.match.player_white;
        const black = res.match.player_black;

        whoIsWho[white] = "white";
        whoIsWho[black] = "black";
        onlineInfo.gameMode = res.match.game_mode;
        console.log("setting game mode to: ", onlineInfo.gameMode, res)
    }
    console.log("on handleGetChessMatchDetail: ", res)
}

// initializes the chess socket
function initializeChessSocket(game_key) {
	chessSocket = new WebSocket(`wss://${GATEWAY_HOST}/ws/chess/${game_key}/`);

	chessSocket.onopen = () => {
		//sessionStorage.setItem('inGame', '/chess');
        document.getElementById('lc-text').style.display = 'none';
        consoleSuccess("[ChessSocket] Connection established succesfully");
		chessSocket.send(JSON.stringify({ action: "ready", color: getUserColor(getUsername()), username: getUsername() }));
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

// handles the socket received messages
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
            gameOverHandler(data);

        }
        if (data?.current_player) {
			updateInTurn(data.current_player);
        }
    }
    catch (e) {
        console.error("Error parsing WS message: ", e);
    }
}


function gameOverHandler(data) {
    console.log("on gameOverHandler: ", data)
    const amIwinner = getUserColor(getUsername()) == data.winner;
    let delay = 50;
    if (!amIwinner) {
        if (data.last_move) {
            delay = 2000;
            const { from, to } = data.last_move;
            const piece = keySquareMapper[from].piece;
            if (piece) {
                console.log("Moving element: ", piece, to);
                moveElement(piece, to, false); // Emulate the last move
            }
        }
    }
    chessSocket.close();
    chessSocket = null;

    // Delay showing the winGame modal to allow the last move to render
    setTimeout(() => {
        winGame(data.winner, true);
    }, delay);
}

function checkPawnDoubleMoveInLastTurn(from, to) {
    let tmp = keySquareMapper[to].piece;
    if (tmp.piece_name.includes("PAWN")){
        if (Math.abs(to[1] - from[1]) === 2) {
            tmp.move = true;
            sessionStorage.setItem("enPassantCapture", JSON.stringify({ position: to, color: tmp.color, move: tmp.move }));
        } else {
            tmp.move = false;
            if (sessionStorage.getItem("enPassantCapture"))
                sessionStorage.removeItem("enPassantCapture");
        }
    }
}

// gets the user's piece color
function getUserColor(username) {
    return whoIsWho[username];
}

// waits for the backend to send the board by socket
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

// Converts the board into a map with each piece's functions
function convertToPiecePositions(boardMap) {
	const piecePositionsTmp = {};

	Object.keys(boardMap).forEach(key => {
	  const square = boardMap[key];
	  if (!square) {
		piecePositionsTmp[key] = null;
	  } else {
		const pieceType = square.type.toLowerCase();
		const pieceColor = square.color === "white" ? "white" : "black";
		const pieceKey = `${pieceColor}${pieceType.charAt(0).toUpperCase() + pieceType.slice(1)}`;
		piecePositionsTmp[key] = piece[pieceKey];
	  }
	});
	console.log("piecePositions: ", piecePositionsTmp);
	return piecePositionsTmp;
}

export {initOnlineChess, getUserColor, convertToPiecePositions, onlineInfo, chessSocket}