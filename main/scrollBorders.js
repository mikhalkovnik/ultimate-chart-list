const grid = document.getElementById("charts-scroll-container");
let columnCount = Cookies.get('column-count');
redrawChartScrollBorders();
// element.style.position = "fixed";
console.log(grid.offsetWidth);


function addChartScrollBorder() {
    cleanGrid();
    columnCount++;
    redrawChartScrollBorders()
}

function removeChartScrollBorder() {
    cleanGrid();
    columnCount--;
    redrawChartScrollBorders();
}

function redrawChartScrollBorders() {
    for (let i = 1; i < columnCount; i++) {
        const borderId = `scroll-border_${i}`;
        grid.insertAdjacentHTML("afterbegin",
            `<div id=${borderId} class="charts-container__border"></div>`);
        const element = document.getElementById(`${borderId}`);
        // element.style.width /= i;
        element.style.left = `${(grid.offsetWidth / columnCount) * i+1 - element.offsetWidth/2}px`;
    }
}

function cleanGrid() {
    while (grid.firstChild){
        grid.removeChild(grid.firstChild);
    }
}