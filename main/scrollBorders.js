const grid = document.getElementById("charts-container");

// element.style.position = "fixed";
console.log(grid.offsetWidth);
const columnCount = Cookies.get('column-count');
for (let columnIndex of columnCount) {
    const borderId = `scroll-border_${columnIndex}`;
    console.log(columnCount);
    grid.insertAdjacentHTML("afterbegin",
        `<div id=${borderId} class="charts-container__border"></div>`);
    const element = document.getElementById(`${borderId}`);
    element.style.left = `${(grid.offsetWidth / columnCount) * columnIndex - element.offsetWidth/columnCount}px`;
}