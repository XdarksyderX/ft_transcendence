import { globalState } from "../index.js";

//function to check if opponnet piece exist
function checkOpponetPieceByElement(id, color) {
    const flatArray = globalState.flat();
    const opponentColor = color === "white" ? "BLACK" : "WHITE";

    for (let i = 0; i < flatArray.length; i++) {
        const element = flatArray[i];
        if (element.id == id) {
            if (element.piece && element.piece.piece_name.includes(opponentColor)) {
                const el = document.getElementById(id);
                el.classList.add("captureColor");
                element.captureHightlight = true;
            }
            break;
        }
    }
    return false;
}

export { checkOpponetPieceByElement };