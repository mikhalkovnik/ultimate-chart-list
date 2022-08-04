const searchItems = document.getElementById('search-items');
const searchInput = document.getElementById('search-input');


for (const symbolInfo of cachedSymbols) {
    const html = generateSymbolInfoHtml(symbolInfo);
    searchItems.insertAdjacentHTML('beforeend', html);
}

searchInput.addEventListener('input', e => {

    searchItems.innerHTML = '';

    const query = searchInput.value.toUpperCase();

    for (const symbolInfo of cachedSymbols) {

        const symbol = symbolInfo.symbol;

        if (symbol.includes(query)) {

            const position = symbol.indexOf(query);
            const queryLength = query.length;
            const queryEndPosition = position + queryLength;
            const prefix = symbol.substring(0, position);
            const suffix = symbol.substring(queryEndPosition);

            const highlight = `${prefix}<span class="search-text-highlight">${query}</span>${suffix}`

            const highlightSymbolInfo = {
                ...symbolInfo,
                symbol: highlight
            }

            const html = generateSymbolInfoHtml(highlightSymbolInfo);
            searchItems.insertAdjacentHTML('beforeend', html);

        }
    }

})

/**
 * Take symbol info and generate html section with rows of information
 * @param {{symbol: string, capitalization: number, volume: number, percentChange: number}} symbolInfo
 */
function generateSymbolInfoHtml(symbolInfo) {
    return `
                <section class="search-item">
                    <span class="search-item__symbol">${symbolInfo.symbol}</span>
                    <span class="search-item__volume">${symbolInfo.volume}</span>
                    <span class="search-item__change">${symbolInfo.percentChange}</span>
                </section>
            `;
}

function randomizeInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
