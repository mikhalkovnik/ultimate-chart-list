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
