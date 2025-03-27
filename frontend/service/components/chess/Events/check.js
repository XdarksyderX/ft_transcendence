import { globalState, keySquareMapper, inTurn, updateInTurn, gameMode } from "../index.js"; //import globalState object, a 2D array representing the state of the chessboard
import { clearHighlight, globalStateRender, selfHighlight, globalPiece, circleHighlightRender } from "../Render/main.js";
import * as help from "../Helper/commonHelper.js"
import { checkWin } from "./global.js";
let whoInCheck = null;

function checkForCheck() {
	if (gameMode === "horde" && inTurn === "white") {
	console.log("returning on checkForCheck");
	return null;
	} else {
	console.log("on checkForCheck: ", gameMode, inTurn);
	}

	whoInCheck = null;

	const kingPosition = inTurn === "white" ? globalPiece.white_king.current_pos : globalPiece.black_king.current_pos;
	const enemyColor = inTurn === "white" ? "black" : "white";
	const enemyPieces = Object.values(globalPiece).flat().filter(piece => piece && piece.piece_name && piece.piece_name.includes(enemyColor.toUpperCase())); // Add null check here
	let finalListCheck = [];
	let checkingPieces = []; // To store the pieces putting the king in check

	enemyPieces.forEach(piece => {
	if (!piece) return; // Skip null pieces
	const pieceType = piece.piece_name.split('_')[1].toLowerCase();
	let possibleMoves = [];
	switch (pieceType) {
		case 'pawn':
		possibleMoves = help.pawnCaptureOptions(piece.current_pos, enemyColor) || []; // Fallback to empty array
		break;
		case 'knight':
		possibleMoves = help.giveKnightCaptureIds(piece.current_pos, enemyColor) || []; // Fallback to empty array
		break;
		case 'king':
		possibleMoves = help.giveKingCaptureIds(piece.current_pos, enemyColor) || []; // Fallback to empty array
		break;
		case 'bishop':
		possibleMoves = help.giveBishopCaptureIds(piece.current_pos, enemyColor) || []; // Fallback to empty array
		break;
		case 'rook':
		possibleMoves = help.giveRookCaptureIds(piece.current_pos, enemyColor) || []; // Fallback to empty array
		break;
		case 'queen':
		possibleMoves = help.giveQueenCaptureIds(piece.current_pos, enemyColor) || []; // Fallback to empty array
		break;
	}
	if (possibleMoves.length > 0 && possibleMoves.includes(kingPosition)) {
		checkingPieces.push(piece); // Add the piece putting the king in check
	}
	finalListCheck.push(...possibleMoves);
	});

	finalListCheck = finalListCheck.flat();
	const checkOrNot = finalListCheck.find(element => element === kingPosition);
	if (checkOrNot) {
	whoInCheck = inTurn;
	}

	console.log("Checking pieces:", checkingPieces);
	return checkingPieces; // Return the pieces putting the king in check
}

function checkForCheckmate() {
	console.log("Checking for checkmate...");
	const checkingPieces = checkForCheck(); // Get the pieces putting the king in check
	if (!whoInCheck) {
	console.log("No check detected. Not a checkmate.");
	return false; // If not in check, it's not checkmate
	}

	console.log(`${inTurn} is in check. Checking for possible moves to escape...`);
	const currentColor = inTurn; // The color of the player in turn
	const allPieces = Object.values(globalPiece).flat().filter(piece =>
	piece && piece.piece_name && piece.current_pos != null && piece.piece_name.includes(currentColor.toUpperCase())
	);

	// Check if any piece can move to escape the check
	for (let piece of allPieces) {
	const pieceType = piece.piece_name.split('_')[1].toLowerCase();
	const possibleMoves = getPossibleMovesForPiece(piece, pieceType, currentColor);

	console.log(`Piece: ${piece.piece_name}, Position: ${piece.current_pos}, Possible Moves:`, possibleMoves);

	
	// Check if this piece can capture any of the checking pieces
	const captureOptions = returnOnePieceCaptureOptions(piece, pieceType, currentColor);
	for (let checkingPiece of checkingPieces) {
		if (captureOptions.includes(checkingPiece.current_pos)) {
		console.log(
			`${piece.piece_name} at ${piece.current_pos} can capture ${checkingPiece.piece_name} at ${checkingPiece.current_pos}`
		);
		return false; // Not checkmate
		}
	}
	const safeMoves = [];
	simulateMoves(piece, possibleMoves, safeMoves, currentColor);
	if (safeMoves.length > 0) {
		console.log(`Safe moves found for ${piece.piece_name} at ${piece.current_pos}:`, safeMoves);
		return false; // Not checkmate
	}
	}

	console.log("No safe moves found. Checkmate!");
	return true;
}

function getPossibleMovesForPiece(piece, pieceType, color) {
	switch (pieceType) {
	case 'pawn':
		return help.pawnMovesOptions(piece, help.pawnCaptureOptions, color);
	case 'knight':
		return help.knightMovesOptions(piece, help.giveKnightHighlightIds, color);
	case 'bishop':
		return help.getPossibleMoves(piece, help.giveBishopHighlightIds, color);
	case 'rook':
		return help.getPossibleMoves(piece, help.giveRookHighlightIds, color);
	case 'queen':
		return help.getPossibleMoves(piece, help.giveQueenHighlightIds, color);
	case 'king':
		return help.getPossibleMoves(
		piece,
		help.giveKingHighlightIds,
		color,
		true, // Include castling logic
		(moves) => help.limitKingMoves(moves, color), // Limit king moves to avoid checks
		true // Ensure king-specific rules are applied
		);
	default:
		return []; // If the piece type is unknown, return an empty array
	}
}


function simulateMoves(piece, possibleMoves, safeMoves, color) {
	possibleMoves.forEach(move => {
	const originalPosition = piece.current_pos;

	updateGlobalState(piece, move);
	updatePiecePosition(piece, move);

	checkForCheck();
	if (whoInCheck !== color)
		safeMoves.push(move);

	updateGlobalState(piece, originalPosition);
	updatePiecePosition(piece, originalPosition);
	});
}

function returnOnePieceCaptureOptions(piece, pieceType, opponentColor) {
	let captureMoves = [];
	switch (pieceType) {
	case 'pawn':
		captureMoves = help.pawnCaptureOptions(piece.current_pos, opponentColor);
		break;
	case 'knight':
		captureMoves = help.giveKnightCaptureIds(piece.current_pos, opponentColor);
		break;
	case 'bishop':
		captureMoves = help.giveBishopCaptureIds(piece.current_pos, opponentColor);
		break;
	case 'rook':
		captureMoves = help.giveRookCaptureIds(piece.current_pos, opponentColor);
		break;
	case 'queen':
		captureMoves = help.giveQueenCaptureIds(piece.current_pos, opponentColor);
		break;
	case 'king':
		captureMoves = help.giveKingCaptureIds(piece.current_pos, opponentColor);
		break;
	}
	return captureMoves;
}

function filterMovesForKingProtection(piece, color, movesGetterFunc, highlightIdsFunc, pieceType = null) {
	let possibleMoves = movesGetterFunc(piece, highlightIdsFunc, color);
	const safeMoves = [];
	let captureOptions = [];

	if (pieceType == "knight")
	possibleMoves = possibleMoves.filter(move => !help.checkPieceExist(move));

	simulateMoves(piece, possibleMoves, safeMoves, color);
	selfHighlight(piece);

	if (pieceType != "knight" && pieceType != "pawn")
	captureOptions = help.markCaptureMoves(Object.values(highlightIdsFunc(piece.current_pos)), color);
	else {
	captureOptions = highlightIdsFunc(piece.current_pos, color);
	captureOptions.forEach(element => {
		help.checkOpponetPieceByElement(element, color);
	});
	}

	checkForCheck();
	if (whoInCheck === color) {
	const opponentColor = color === "white" ? "black" : "white";
	captureOptions.forEach(element => {
		const square = keySquareMapper[element];
		if (square && square.piece) {
		const piece = square.piece;
		const pieceType = piece.piece_name.split('_')[1].toLowerCase();
		let captureMoves = [];

		captureMoves = returnOnePieceCaptureOptions(piece, pieceType, opponentColor);

		let kingInDangerBool = false;
		for (let i = 0; i < captureMoves.length; i++) {
			if (captureMoves[i] === globalPiece[`${color}_king`].current_pos) {
			kingInDangerBool = true;
			break;
			}
		}
		if (!kingInDangerBool) {
			const flatData = globalState.flat();
			const el = flatData.find(el => el.id === element && el.captureHightlight);
			if (el) {
			document.getElementById(el.id).classList.remove("captureColor");
			el.captureHightlight = false;
			}
		}
		}
	});
	}
	circleHighlightRender(safeMoves, keySquareMapper);
}

/**
 * Update the global state with the new piece position.
 * @param {*} piece An object representing a game piece.
 * @param {*} id The new position id where the piece should be moved.
 */
function updateGlobalState(piece, id) {
	const flatData =  globalState.flat();
	//iterate throught each element to update the positions id the pieces.
	flatData.forEach((el) => {
	  if (el.id == piece.current_pos) {
		delete el.piece; //when the element with the current position is find, delete the piece property from it
	  }
	  if (el.id == id) {
		if (el.piece) {
		  el.piece.current_pos = null;
		  checkWin(el.piece);
		}
		el.piece = piece; //find the element with the new position and asign the piece to it
	  }
	});
  }

  
  
  /**
   * Update the HTML elements to reflect the new positions of the piece.
   * @param {*} piece An object representing a game piece.
   * @param {*} id The new position id where the piece should be moved.
   */
  function updatePiecePosition(piece, id) {
	const previousPiece = document.getElementById(piece.current_pos);
	const currentPiece = document.getElementById(id);
  
	piece.current_pos = null;
	previousPiece?.classList?.remove("highlightYellow");
  
	currentPiece.innerHTML = previousPiece?.innerHTML;
	if (previousPiece)
	  previousPiece.innerHTML = "";
  
	piece.current_pos = id;
  }

export { checkForCheck, checkForCheckmate, filterMovesForKingProtection, updateGlobalState, updatePiecePosition}