let xMax = 400;
let yMax = 600;

let table;
let validRows = [];

function preload () {
    table = loadTable("dataset.csv", "csv", "header")
}

function setup() {
    createCanvas(1100, 950);

    if (!table) return;

    // applica le regole a ogni colonna del dataset
    for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r).arr.map(Number);
        if (row[2] < 0 && row[0] % 5 === 0) {
            validRows.push(row);
        }
    }

    // colonna 0 filtrata e media
    let arr = validRows.map(r => r[0]);
    const sortedArr = [...arr].sort((a, b) => a - b);

    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }

    let average = arr.length > 0 ? sum / arr.length : 0;
    print("average:", average);

    // deviazione standard colonna 1 (filtrata)
    const col1 = validRows.map(r => r[1]);
    let std1 = 0;
    let mean1 = 0;
    let minVal1 = 0;
    let maxVal1 = 1;
    if (col1.length > 1) {
        mean1 = col1.reduce((a, b) => a + b, 0) / col1.length;
        const sumSq = col1.reduce((a, v) => a + (v - mean1) * (v - mean1), 0);
        std1 = Math.sqrt(sumSq / (col1.length - 1));
        minVal1 = Math.min(...col1);
        maxVal1 = Math.max(...col1);
    }

    background(0);
    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);
    text("Media colonna 0 (filtrata): " + nf(average, 1, 2), 16, 16);
    text("Dev. std colonna 1 (filtrata): " + nf(std1, 1, 2), 16, 36);

    // ---------------- Primo grafico: colonne + linea media (stile Excel) ----------------
    const left = 40;
    const right = width - 40;
    const chart1Top = 70;
    const chart1Bottom = height * 0.58;

    // scala Y per i valori di colonna 0
    const dataMin = sortedArr.length > 0 ? Math.min(...sortedArr) : 0;
    const dataMax = sortedArr.length > 0 ? Math.max(...sortedArr) : 1;
    const yForVal0 = (v) => {
        const t = constrain((v - dataMin) / (dataMax - dataMin || 1), 0, 1);
        return chart1Bottom - t * (chart1Bottom - chart1Top);
    };

    // assi
    stroke(200);
    strokeWeight(2);
    line(left, chart1Bottom, right, chart1Bottom); // X
    line(left, chart1Top, left, chart1Bottom);     // Y

    // tick asse Y con "nice" step in base al range
    const niceStep = (minV, maxV, targetTicks = 8) => {
        const range = Math.max(1e-9, maxV - minV);
        const rough = range / Math.max(1, targetTicks);
        const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
        const candidates = [1, 2, 5, 10].map(m => m * pow10);
        let best = candidates[0];
        let bestDiff = Infinity;
        for (const c of candidates) {
            const ticks = range / c;
            const diff = Math.abs(ticks - targetTicks);
            if (diff < bestDiff) { bestDiff = diff; best = c; }
        }
        return best;
    };

    stroke(170);
    strokeWeight(1);
    fill(255);
    textSize(10);
    textAlign(RIGHT, CENTER);
    if (dataMax !== dataMin) {
        const stepY = niceStep(dataMin, dataMax, 8);
        const startYVal = Math.ceil(dataMin / stepY) * stepY;
        const endYVal = Math.floor(dataMax / stepY) * stepY;
        for (let v = startYVal; v <= endYVal + 1e-9; v += stepY) {
            const yy = yForVal0(v);
            line(left - 4, yy, left, yy);
            text(nf(v, 1, 0), left - 8, yy);
        }
    }

    // colonne (campionamento se troppi)
    const maxBars = 80;
    const stepBars = Math.ceil((sortedArr.length || 1) / maxBars);
    const countBars = Math.ceil(sortedArr.length / stepBars);
    const gap = 2;
    const barBand = (right - left) / Math.max(1, countBars);
    const barWidth = Math.max(1, barBand - gap);

    noStroke();
    fill(120, 170, 250, 200);
    let barIndex = 0;
    for (let i = 0; i < sortedArr.length; i += stepBars) {
        const v = sortedArr[i];
        const x1 = left + barIndex * barBand + gap * 0.5;
        const yTop = yForVal0(v);
        rect(x1, yTop, barWidth, chart1Bottom - yTop);
        barIndex++;
    }

    // ticks/etichette asse X: una etichetta ogni 10 valori nell'ordine ordinato
    stroke(170);
    strokeWeight(1);
    fill(255);
    textSize(10);
    textAlign(CENTER, TOP);
    for (let i = 0; i < sortedArr.length; i += 10) {
        const bin = Math.floor(i / stepBars);
        const tickX = left + bin * barBand + gap * 0.5 + barWidth * 0.5;
        line(tickX, chart1Bottom, tickX, chart1Bottom + 6);
        text(i, tickX, chart1Bottom + 8);
    }

    // linea orizzontale alla media (stile "average line")
    const yAvg = yForVal0(average);
    stroke(240, 120, 90);
    strokeWeight(2);
    line(left, yAvg, right, yAvg);
    noStroke();
    fill(240, 120, 90);
    textAlign(LEFT, BOTTOM);
    text("media = " + nf(average, 1, 2), left + 6, yAvg - 4);

    // etichette Y min/max per contesto
    fill(255);
    textAlign(RIGHT, CENTER);
    text(nf(dataMax, 1, 0), left - 8, yForVal0(dataMax));
    text(nf(dataMin, 1, 0), left - 8, yForVal0(dataMin));

    // ---------------- Secondo grafico: curva normale con banda ±1σ (stile didattico) ----------------
    const chartTop = height * 0.68; // moved lower to avoid overlap with first chart
    const chartBottom = height - 30;
    const chartLeft = left;
    const chartRight = right;

    // assi
    stroke(200);
    strokeWeight(2);
    line(chartLeft, chartBottom, chartRight, chartBottom); // X
    line(chartLeft, chartTop, chartLeft, chartBottom);     // Y

    // mapping funzioni per la curva
    const xForVal = (v) => {
        if (maxVal1 === minVal1) return (chartLeft + chartRight) * 0.5;
        const t = constrain((v - minVal1) / (maxVal1 - minVal1), 0, 1);
        return chartLeft + t * (chartRight - chartLeft);
    };

    // normal PDF (non normalizzata verticalmente al canvas)
    const invSqrt2Pi = 1 / Math.sqrt(2 * Math.PI);
    const normalPdf = (x, mu, sigma) => {
        if (sigma <= 0) return 0;
        const z = (x - mu) / sigma;
        return (invSqrt2Pi / sigma) * Math.exp(-0.5 * z * z);
    };

    // scala verticale: mappo il picco (mu) a ~85% dell'altezza disponibile
    const peakPdf = normalPdf(mean1, mean1, std1);
    const usableH = chartBottom - chartTop;
    const yForPdf = (p) => {
        const t = peakPdf > 0 ? p / peakPdf : 0;
        return chartBottom - constrain(t, 0, 1) * usableH * 0.85;
    };

    // ticks asse X ogni 10 unità (valori della colonna 1)
    stroke(170);
    strokeWeight(1);
    fill(255);
    textSize(10);
    textAlign(CENTER, TOP);
    if (maxVal1 !== minVal1) {
        const stepX = 10;
        const startXVal = Math.ceil(minVal1 / stepX) * stepX;
        const endXVal = Math.floor(maxVal1 / stepX) * stepX;
        for (let v = startXVal; v <= endXVal; v += stepX) {
            const xx = xForVal(v);
            line(xx, chartBottom, xx, chartBottom + 6);
            text(v, xx, chartBottom + 8);
        }
    }

    // ticks asse Y ogni 10% (0%..100% del picco)
    fill(255);
    textAlign(RIGHT, CENTER);
    for (let p = 0; p <= 1.00001; p += 0.1) {
        const yy = yForPdf(peakPdf * p);
        line(chartLeft - 4, yy, chartLeft, yy);
        text(nf(p * 100, 1, 0) + '%', chartLeft - 8, yy);
    }

    // banda ±1σ
    const bandXL = xForVal(mean1 - std1);
    const bandXR = xForVal(mean1 + std1);
    noStroke();
    fill(240, 120, 90, 60);
    rect(Math.min(bandXL, bandXR), chartTop, Math.abs(bandXR - bandXL), chartBottom - chartTop);

    // curva di Gauss
    noFill();
    stroke(120, 170, 250, 220);
    strokeWeight(2);
    beginShape();
    const samples = 200;
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const xVal = minVal1 + t * (maxVal1 - minVal1);
        const px = xForVal(xVal);
        const py = yForPdf(normalPdf(xVal, mean1, std1));
        vertex(px, py);
    }
    endShape();

    // marcatori verticali a μ−σ, μ, μ+σ
    const xMu = xForVal(mean1);
    const xMuL = xForVal(mean1 - std1);
    const xMuR = xForVal(mean1 + std1);

    stroke(240, 120, 90, 220);
    strokeWeight(2);
    line(xMu, chartTop, xMu, chartBottom);

    stroke(120, 120, 120, 180);
    strokeWeight(1.5);
    line(xMuL, chartTop, xMuL, chartBottom);
    line(xMuR, chartTop, xMuR, chartBottom);

    // legenda e testi
    noStroke();
    fill(255);
    textAlign(LEFT, BOTTOM);
    text("Curva normale colonna 1 (filtrata) – μ e ±1σ", chartLeft, chartTop - 8);
    textAlign(LEFT, TOP);
    text("μ = " + nf(mean1, 1, 2) + ", σ = " + nf(std1, 1, 2), chartLeft + 4, chartTop + 6);
    textAlign(CENTER, TOP);
    fill(255);
    text("μ", xMu, chartTop + 6);
    text("μ−σ", xMuL, chartTop + 6);
    text("μ+σ", xMuR, chartTop + 6);
}