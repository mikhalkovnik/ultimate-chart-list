const scrollContainer = document.getElementById("charts-scroll-container");
let columnCount = Cookies.get('column-count');

redrawChartScrollBorders();

window.addEventListener('resize', (e) =>{
    cleanScrollContainer();
    redrawChartScrollBorders();
})

function addChartScrollBorder() {
    cleanScrollContainer();
    columnCount++;
    redrawChartScrollBorders()
}

function removeChartScrollBorder() {
    cleanScrollContainer();
    columnCount--;
    redrawChartScrollBorders();
}

function redrawChartScrollBorders() {
    for (let i = 1; i < columnCount; i++) {
        const borderId = `scroll-border_${i}`;
        scrollContainer.insertAdjacentHTML("afterbegin",
            `<div id=${borderId} class="charts-scroll-container__border"></div>`);
        const element = document.getElementById(`${borderId}`);
        element.style.width = `${window.outerWidth / columnCount / 3}px`
        element.style.left = `${(scrollContainer.offsetWidth / columnCount) * i+1 - element.offsetWidth/2}px`;
    }
}

function cleanScrollContainer() {
    while (scrollContainer.firstChild){
        scrollContainer.removeChild(scrollContainer.firstChild);
    }
}

