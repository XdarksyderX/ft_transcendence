import { globalState, keySquareMapper } from "../index.js"
import { circleHighlightRender, selfHighlight } from "../Render/main.js";
import { highlight_state, selfHighlightState, circleHighlightRender, clearHighlight } from "../Events/global.js"
import { clearHighlight } from "../Render/main.js";

let duckPosition = null;

function duck() {
    //moveState === "duck"
    const moves = getDuckMoves();
    circleHighlightRender(moves, keySquareMapper);

    // Configurar el evento de clic para manejar el movimiento del pato
    const root = document.getElementById('root');
    root.addEventListener("click", handleDuckClick);

}

function handleDuckClick(event) {
    const target = event.target;
    const isHighlightClick = target.localName === "span" || target.childNodes.length === 2;

    if (isHighlightClick) {
        handleDuckHighlightClickEvent(target);
    } else {
        // Si no se hace clic en un highlight, volver a configurar el evento
        const root = document.getElementById('root');
        root.addEventListener("click", handleDuckClick);
    }
}

function handleDuckHighlightClickEvent(target) {
    const id = target.localName === "span" ? target.parentNode.id : target.id;

    if (!duckPosition) {
        duckPosition = id;
        renderDuck(duckPosition);
    } else {
        moveDuck(duckPosition, id);
        duckPosition = id;
    }
    clearHighlight();
    removeDuckClickListener()
}

function moveDuck(from, to) {
    const fromSquare = globalState.flat().find(square => square.id === from);
    const toSquare = globalState.flat().find(square => square.id === to);

    // Actualizar la posición del pato en el estado global
    fromSquare.piece = null;
    toSquare.piece = duckPiece(to);

    // Actualizar la posición del pato en el DOM
    const fromEl = document.getElementById(from);
    const toEl = document.getElementById(to);
    fromEl.innerHTML = '';
    const piece = document.createElement("img");
    piece.src = toSquare.piece.img;
    piece.classList.add("piece");
    toEl.appendChild(piece);
}

function duckPiece(current_pos) {
    return { current_pos, img: "components/chess/Assets/duck/Duck.png", piece_name: "DUCK" };
}

function getDuckMoves() {
    const flatData =  globalState.flat();
    const res = [];
    flatData.forEach(square => {
        if (!square.piece || square.piece === null) {
            res.push(square.id);
        }
    });
    return res;
}

function renderDuck(position) {
    const duckSquare = globalState.flat().find(square => square.id === position);
    duckSquare.piece = duckPiece(position);

    const squareEl = document.getElementById(duckSquare.id);
    const piece = document.createElement("img");
    piece.src = duckSquare.piece.img;
    piece.classList.add("piece");
    squareEl.appendChild(piece);
}

function removeDuckClickListener() {
    const root = document.getElementById('root');
    root.removeEventListener("click", handleDuckClick);
}

export { duck }