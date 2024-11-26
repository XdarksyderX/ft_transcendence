//const pastMoves = [];
let counter = 0;
const orderList = document.querySelector('ol')

function logMoves(logMoves, inTurn) {
    if (inTurn == "white") {
        const list = document.createElement('li');
        list.innerHTML = `<span class="leftSide">${logMoves.to}</span>`;
        orderList.appendChild(list);
    }
    else {
        const allLiArray = orderList.querySelectorAll('li');
        const LastLi = allLiArray[allLiArray.length - 1];
        LastLi.innerHTML += `<span>${logMoves.to}</span>`;
    }
}

export default logMoves;