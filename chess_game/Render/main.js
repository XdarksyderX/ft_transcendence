const ROOT_DIV = document.getElementById("root");

function initGameRender(data)
{
  data.forEach(element => {
    const rowEl = document.createElement("div");
    element.forEach((square) => {
      const squareDiv = document.createElement("div");
      squareDiv.classList.add(square.color, "square");

      rowEl.appendChild(squareDiv);
    });
    rowEl.classList.add("squareRow");
    ROOT_DIV.appendChild(rowEl);
  });
}

export { initGameRender }