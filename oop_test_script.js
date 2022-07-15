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
        const bundleHtml = this.generateBundleHtml();
        containerElement.insertAdjacentHTML('beforeend', bundleHtml)
        this.chartBundle = document.getElementById(this.chartBundleId)
        this.chartDiv = document.getElementById(this.chartDivId)
        this.percentChangeSpan = document.getElementById(this.percentChangeId)
        this.percentChangeSpan.style.color = this.percentChange >= 0 ? 'green' : 'red'
        this.tvChart = this.createLightweightChart(this.chartDiv)
        this.candlestickSeries = this.tvChart.addCandlestickSeries()
        this.applyScalesVisibilityFromCookies()
        // setTimeout(() => {
        //     this.tvChart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
        //         const windowHeight = window.innerHeight;
        //         const windowScroll = window.scrollY;
        //         const windowBottom = windowHeight + windowScroll;
        //         for (const chart of chartsContainer.charts.values()) {
        //             if (chart === this.tvChart) return
        //             const chartRect = chart.chartDiv.getBoundingClientRect();
        //             if (chartRect.top < windowScroll) return;
        //             if (chartRect.bottom > windowBottom) return;
        //             console.log(chart.chartDiv)
        //             // chart.tvChart.timeScale().setVisibleLogicalRange(logicalRange)
        //             chart.chartDiv.classList.add('alarm')
        //             setTimeout(() => {
        //                 // chart.chartDiv.classList.remove('alarm')
        //             }, 1000)
        //         }
        //     })
        // }, 2000)

        this.chartBundle.style.order = `${this.volume}`
    }

    /**
     * Create 'HTML string' with chart bundle from template inserting soe info: section with header and div for tradingview chart
     * @return {string} - HTML string
     */
    generateBundleHtml() {
        return `
                <section id="${this.chartBundleId}" class="chart-bundle">
                    <header class="chart-bundle__header">
                        <h3 class="chart-bundle__header__symbol">${this.symbol}</h3>
                        <span class="chart-bundle__header__capitalization">Capitalization: ${this.capitalization}$</span>
                        <span class="chart-bundle__header__volume">24hr Volume: ${this.volume}$</span>
                        <span class="chart-bundle__header__percent-change">24hr Change: <span id="${this.percentChangeId}">${this.percentChange}</span>%</span>
                    </header>
                    <main id="${this.chartDivId}" class="chart-bundle__div"></main>
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

}

/**
 * Container for all interactive charts.
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
        this.charts = new Map()

        window.addEventListener('resize', () => {
            clearTimeout(this.timerId);
            this.timerId = setTimeout(() => {
                for (const chart of chartsContainer.charts.values()) {
                    chart.updateChartWidth()
                    chart.fitContent()
                }
            }, 50)
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
                    } else {
                        // chartBundle.style.contentVisibility = 'auto'
                        chartBundle.classList.remove('alarm')
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

const chartsContainer = new ChartsContainer()
// noinspection SpellCheckingInspection
const cachedSymbols = [
    {
        symbol: "BTCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ETHUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BCHUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "XRPUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "EOSUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "LTCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "TRXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ETCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "LINKUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "XLMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ADAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "XMRUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DASHUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ZECUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "XTZUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BNBUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ATOMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ONTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "IOTAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BATUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "VETUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "NEOUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "QTUMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "IOSTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "THETAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ALGOUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ZILUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "KNCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ZRXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "COMPUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "OMGUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DOGEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SXPUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "KAVAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BANDUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "RLCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "WAVESUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "MKRUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SNXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DOTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DEFIUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "YFIUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BALUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CRVUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "TRBUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "RUNEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SUSHIUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SRMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "EGLDUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SOLUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ICXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "STORJUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BLZUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "UNIUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "AVAXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "FTMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "HNTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ENJUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "FLMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "TOMOUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "RENUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "KSMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "NEARUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "AAVEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "FILUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "RSRUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "LRCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "MATICUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "OCEANUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CVCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BELUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CTKUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "AXSUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ALPHAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ZENUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SKLUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "GRTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "1INCHUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CHZUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SANDUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ANKRUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BTSUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "LITUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "UNFIUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "REEFUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "RVNUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "SFPUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "XEMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "COTIUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CHRUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "MANAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ALICEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "HBARUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ONEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "LINAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "STMXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DENTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CELRUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "HOTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "MTLUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "OGNUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "NKNUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DGBUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "1000SHIBUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BAKEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "GTCUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BTCDOMUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "IOTXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "AUDIOUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "RAYUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "C98USDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "MASKUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ATAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DYDXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "1000XECUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "GALAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CELOUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ARUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "KLAYUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ARPAUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "CTSIUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "LPTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ENSUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "PEOPLEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ANTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ROSEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DUSKUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "FLOWUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "IMXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "API3USDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "GMTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "APEUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BTCUSDT_220624",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ETHUSDT_220624",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BNXUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "WOOUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "FTTUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "JASMYUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "DARUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "GALUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "OPUSDT",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "BTCUSDT_220930",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
    {
        symbol: "ETHUSDT_220930",
        volume: randomizeInt(1, 1000),
        capitalization: randomizeInt(0, 1e6),
        percentChange: randomizeInt(-100, 100)
    },
]

/**
 * Toggle commenting in these lines to change number of generated charts
 */
// for (let i = 0; i < cachedSymbols.length; i++) {
for (let i = 0; i < 20; i++) {
    const chart = chartsContainer.spawnChart(
        cachedSymbols[i].symbol,
        cachedSymbols[i].volume,
        cachedSymbols[i].capitalization,
        cachedSymbols[i].percentChange
    )

    const dataLength = randomizeInt(10, 100)
    const data = []
    for (let i = 0; i < dataLength; i++) {
        data.push(randomizeCandlestick(i * 60 * 60 * 24))
    }
    chart.setCandlestickData(data)
    chart.fitContent()
}


// #=============0!0=============#

/**
 * Generate candlestick with random data
 * @param time
 * @return {{time: number, open: number, high: number, low: number, close: number}}
 */
function randomizeCandlestick(time) {
    const positive = Math.random() > 0.5
    const open = randomizeInt(100, 200);
    let close;
    if (positive) {
        close = randomizeInt(open, open * 2)
    } else {
        close = randomizeInt(open * 0.5, open)
    }
    return {
        time: time,
        open: open,
        high: randomizeInt(open, open * 1.75),
        low: randomizeInt(close * 0.75, close),
        close: close
    }
}

function randomizeInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
