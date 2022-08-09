const debugContainer = document.getElementById('debug-container');

/**
 * Main class for handling a tradingview-lightweight-charts.
 * Contains header with additional info (symbol, volume, capitalization, etc...)
 * and the main chart canvas.
 */
class Chart {

    constructor(symbol, volume, capitalization, percentChange) {
        this.symbol = symbol
        this.volume = volume
        this.capitalization = capitalization
        this.percentChange = percentChange
        this.sortProperty = 'volume'
        this.sortDirection = -1
    }

    /**
     * Create new chart inside specified container
     * @param {ChartsContainer} chartsContainer - container where all charts are contained
     * @param {HTMLElement} containerElement - HTML element from page where this chart will be spawned
     */
    spawnBundle(chartsContainer, containerElement) {
        this.chartBundleId = `chart-bundle-${this.symbol}`
        this.chartDivId = `chart-div-${this.symbol}`
        this.percentChangeId = `chart-percent-change-${this.symbol}`
        this.link = "https://ru.tradingview.com/symbols/"+this.symbol+"/"
        const bundleHtml = this.generateBundleHtml();
        containerElement.insertAdjacentHTML('beforeend', bundleHtml)
        this.chartBundle = document.getElementById(this.chartBundleId)
        this.chartDiv = document.getElementById(this.chartDivId)
        this.percentChangeSpan = document.getElementById(this.percentChangeId)
        this.percentChangeSpan.style.color = this.percentChange >= 0 ? 'green' : 'red'
        this.tvChart = this.createLightweightChart(this.chartDiv)
        this.candlestickSeries = this.tvChart.addCandlestickSeries()
        this.applyScalesVisibilityFromCookies()
        this.tvChart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
            if (this.timeRangeChanging) return;
            chartsContainer.changeVisibleLogicalRange(this, logicalRange);
        });
        this.chartBundle.style.order = `${this.volume}`
    }

    /**
     * Create 'HTML string' with chart bundle from template inserting soe info: section with header and div for tradingview chart
     * @return {string} - HTML string
     */

    generateBundleHtml() {
        return `
                <section id="${this.chartBundleId}" class="chart-bundle">
                    <main id="${this.chartDivId}" class="chart-bundle__div">
                        <header class="chart-bundle__header">
                            <h3 class="chart-bundle__header__symbol"> <a href=${this.link} class="link" target="_blank">${this.symbol}</a> </h3>
                            <span class="chart-bundle__header__capitalization">Cap: ${this.capitalization}$</span>
                            <span class="chart-bundle__header__volume">Vol: ${this.volume}$  <span id="${this.percentChangeId}">${this.percentChange}%</span>
                            <span class="chart-bundle__header__percent-change"><span id="${this.percentChangeId}"></span></span>
                        </header>
                    </main>
                </section>
                `
    }

    // noinspection JSValidateJSDoc
    /**
     * Create and setup tradingview chart and spawn it in provided HTMLElement
     * @param {HTMLElement} chartDiv - HTMLElement where chart will be spawned
     * @return {ChartApi} - created chart for further manipulations
     */
    createLightweightChart(chartDiv) {
        return LightweightCharts.createChart(chartDiv, {
            width: 0,
            height: chartDiv.getBoundingClientRect().height
        });
    }

    /**
     * Take setting for chart scales visibility and apply it to all charts
     */
    applyScalesVisibilityFromCookies() {
        const cookies = Cookies.get()
        for (const cookieName of Object.keys(cookies)) {
            if (cookieName.endsWith('Scale')) {
                const visibility = JSON.parse(cookies[cookieName])['visible'];
                this.changeScaleVisibility(cookieName, visibility)
                const checkbox = document.getElementById(cookieName);
                checkbox.checked = visibility
            }
        }
    }

    /**
     * Set candlestick data to tradingview chart
     * @param {Array<{time: number, open: number, high: number, low: number, close: number}>} data
     */
    setCandlestickData(data) {
        this.candlestickSeries.setData(data)
    }

    /**
     * Fit all displayed data into visible area inside tradingview chart
     */
    fitContent() {
        this.tvChart.timeScale().fitContent()
    }

    /**
     * Change sort property what charts will be sorted by
     * @param {string} sortProperty - e.g.: volume, capitalization, changePercent
     */
    changeSortProperty(sortProperty) {
        if (this[sortProperty] === undefined) {
            throw new Error(`Unknown sort property: ${sortProperty}`)
        }
        this.sortProperty = sortProperty
        this.changeSort()
    }

    /**
     * Change sort direction what charts will bt sorted by
     * @param {string} sortDirection - e.g.: asc, desc
     */
    changeSortDirection(sortDirection) {
        this.sortDirection = sortDirection
        this.changeSort()
    }

    /**
     * Apply sorting for this chart (uses sortDirection and sortProperty)
     */
    changeSort() {
        this.chartBundle.style.order = `${this.sortDirection * this[this.sortProperty]}`
    }

    /**
     * Update with of tradingview chart corresponding its container because tradingview chart is not adaptive itself
     */
    updateChartWidth() {
        this.tvChart.applyOptions({width: this.chartDiv.clientWidth})
    }

    /**
     * Change (turn on/off) visibility of chart price scale
     * @param {string} scale - e.g.: rightPriceScale, timeScale
     * @param {boolean} visibility - true/false for turn the scale on/off on chart
     */
    changeScaleVisibility(scale, visibility) {
        const options = {}
        options[scale] = {
            visible: visibility
        }
        this.tvChart.applyOptions(options)
        this.fitContent()
        Cookies.set(scale, JSON.stringify({visible: visibility}))
    }

    /**
     * Change visible logical range of chart
     * @param {{from: number, to: number}} logicalRange
     */
    changeVisibleLogicalRange(logicalRange) {
        this.timeRangeChanging = true;
        this.tvChart.timeScale().setVisibleLogicalRange(logicalRange);
        this.timeRangeChanging = false;
    }

}

/**
 * Container for all interactive charts.
 *
 * HTML page must contain container element for storing chart bundles with id 'charts-container'
 * and span with id 'displayed-chart-count'
 *
 * @example
 * const chartContainer = new ChartContainer()
 * const chart = chartContainer.spawnChart('BTCUSDT', 100, 10, 1000)
 * chart.setCandlestickData([{time: 10000, open: 10, high: ...}])
 * chartsContainer.addColumn()
 */
class ChartsContainer {

    constructor() {
        this.chartsContainer = document.getElementById('charts-container')
        this.displayedChartCount = document.getElementById('displayed-chart-count')
        const storedColumnCount = Cookies.get('column-count');
        this.columnCount = storedColumnCount !== undefined ? storedColumnCount : 3
        this.charts = new Map();
        this.visibleCharts = new Map();

        window.addEventListener('resize', () => {
            clearTimeout(this.timerId);
            this.timerId = setTimeout(() => {
                for (const chart of chartsContainer.charts.values()) {
                    chart.updateChartWidth()
                    chart.fitContent()
                }
            }, 50);
        })

        window.addEventListener('scroll', () => {
            clearTimeout(this.timerId);
            this.timerId = setTimeout(() => {
                for (const chart of chartsContainer.charts.values()) {
                    const chartBundle = chart.chartBundle;
                    const rect = chartBundle.getBoundingClientRect()
                    if (rect.bottom < 0 || rect.top > window.innerHeight) {
                        // chartBundle.style.contentVisibility = 'hidden'
                        chartBundle.classList.add('alarm')
                        this.visibleCharts.delete(chart.symbol);
                        chart.changeVisibleLogicalRange(this.logicalRange)
                    } else {
                        // chartBundle.style.contentVisibility = 'auto'
                        chartBundle.classList.remove('alarm')
                        this.visibleCharts.set(chart.symbol, chart);
                    }
                    debugContainer.innerHTML = `<div>${this.visibleCharts.size}</div>`
                    for (const symbol of this.visibleCharts.keys()) {
                        debugContainer.insertAdjacentHTML('beforeend', `<div>${symbol}</div>`)
                    }

                }
            }, 1)
        })
    }

    /**
     * Spawn new chart within itself with provided metadata
     * @param {string} symbol
     * @param {number} volume
     * @param {number} capitalization
     * @param {number} percentChange
     * @return {Chart} - new created and displayed chart
     */
    spawnChart(symbol, volume, capitalization, percentChange) {
        const chart = new Chart(symbol, volume, capitalization, percentChange)
        this.charts.set(symbol, chart)
        chart.spawnBundle(this, this.chartsContainer)
        this.displayedChartCount.innerText = `${1 + parseInt(this.displayedChartCount.innerText)}`
        this.applyColumnCount()
        return chart
    }

    /**
     * Apply new grid template columns for chart container, recalculate width of all charts and store settings to cookies
     */
    applyColumnCount() {
        this.chartsContainer.style.gridTemplateColumns = `repeat(${this.columnCount}, 1fr)`
        for (const chart of this.charts.values()) {
            chart.updateChartWidth()
            chart.fitContent()
        }
        Cookies.set('column-count', `${this.columnCount}`)
    }

    /**
     * Add column count and apply style changes
     */
    addColumn() {
        this.columnCount++
        this.applyColumnCount()
    }

    /**
     * Remote column count and apply style changes
     */
    removeColumn() {
        this.columnCount = this.columnCount <= 1 ? 1 : this.columnCount - 1
        this.applyColumnCount()
    }

    /**
     * Change sort property for all charts
     * @param {string} sortProperty - e.g.: volume, capitalization, priceChange
     */
    changeSortProperty(sortProperty) {
        for (const chart of this.charts.values()) {
            chart.changeSortProperty(sortProperty)
        }
    }

    /**
     * Change sort direction for all charts
     * @param {string }sortDirection - e.g.: asc, desc
     */
    changeSortDirection(sortDirection) {
        const direction = sortDirection === 'asc' ? 1 : -1
        for (const chart of this.charts.values()) {
            chart.changeSortDirection(direction)
        }
    }

    /**
     * Change scale visibility for all charts
     * @param {string} scale - e.g.: rightPriceScale, timeScale
     * @param {boolean} visibility
     */
    changeScaleVisibility(scale, visibility) {
        for (const chart of this.charts.values()) {
            chart.changeScaleVisibility(scale, visibility)
        }
    }

    /**
     * Change visible time range for all charts
     * @param {Chart} initChart
     * @param {{from: number, to: number}} logicalRange
     */
    changeVisibleLogicalRange(initChart, logicalRange) {
        // console.log('#===================#')
        this.logicalRange = logicalRange;
        for (const chart of this.visibleCharts.values()) {
            // for (const chart of this.charts.values()) {
            if (chart === initChart) continue;
            chart.changeVisibleLogicalRange(logicalRange);
        }
    }

    /**
     * Change data source for all charts
     * @param {string} dataSource - e.g.: test-random, live-binance-spot
     */
    changeDataSource(dataSource) {
        // TODO: continue implement
    }

    // moveCrosshair(point) {
    //     // const artificialEvent = new MouseEvent('mousemove', {
    //     //     view: window,
    //     //     clientX: point.x - ,
    //     //     clientY: point.y
    //     // })
    //     // console.log(artificialEvent);
    //     for (const chart of this.charts.values()) {
    //         chart.chartDiv.querySelector('div.tv-lightweight-charts').dispatchEvent(artificialEvent)
    //     }
    // }
}


// #=============0!0=============#


const dataLength = randomizeInt(50, 100)
const chartsContainer = new ChartsContainer()

/**
 * Toggle commenting in these lines to change number of generated charts
 */
//for (let i = 0; i < cachedSymbols.length; i++) {
 for (let i = 0; i < 9; i++) {
    const chart = chartsContainer.spawnChart(
        cachedSymbols[i].symbol,
        cachedSymbols[i].volume,
        cachedSymbols[i].capitalization,
        cachedSymbols[i].percentChange
    )

    const data = []
    for (let i = 0; i < dataLength; i++) {
        data.push(randomizeCandlestick((i + 20000) * 60 * 60 * 24))
    }
    chart.setCandlestickData(data)
    chart.fitContent()
}

// const chartBundle = document.querySelectorAll(".chart-bundle");
// window.addEventListener("mousemove", e => {
//     console.log(e.target.style.pointerEvents = "auto");
//     chartBundle.forEach(chartBundleElement =>{
//         chartBundleElement.style.pointerEvents = "auto";
//     });
// });



