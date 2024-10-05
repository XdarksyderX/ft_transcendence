import { ROOT_DIV } from "../Helper/constants.js";
import { globalState } from "../index.js";

function GlobalEvent() {
  ROOT_DIV.addEventListener("click", function(event) {
    if (event.target.localName === "img") // '===' compares both the value and the type wothout converting either value as '==' do (eg: 5 == '5')
    {
      const clickId = event.target.parentNode.id; //get the parent element of the child, means the square, intead of the piece
      const flatArray = globalState.flat();
      const square = flatArray.find((el) => el.id == clickId);
      console.log(square);
    }
  });
}

export { GlobalEvent };