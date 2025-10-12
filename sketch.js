let xMax = 400;
let yMax = 600;

let table;
let validRows = [];

// Variabili per l'hover del primo grafico
let hoveredBarIndex = -1;
let hoveredValue = 0;
let hoveredX = 0;
let hoveredY = 0;

// Variabili per l'hover del terzo grafico
let hoveredBarIndex3 = -1;
let hoveredValue3 = 0;
let hoveredX3 = 0;
let hoveredY3 = 0;

// Variabili per l'hover del secondo grafico
let hoveredCurveIndex = -1;
let hoveredCurveValue = 0;
let hoveredCurveX = 0;
let hoveredCurveY = 0;

function preload () {
    table = loadTable("dataset.csv", "csv", "header")
}

// Calcola l'altezza disponibile per il canvas sottraendo l'altezza della tabella header
function getAvailableCanvasHeight() {
    try {
        const header = document.getElementById('header-table');
        const headerH = header ? header.getBoundingClientRect().height : 0;
        const marginBelow = 8; // margine aggiuntivo
        return Math.max(200, windowHeight - headerH - marginBelow);
    } catch (e) {
        return windowHeight;
    }
}

// Variabili globali per i dati calcolati
let sortedArr, average, std1, mean1, minVal1, maxVal1, mode2, median3, std4, mean4, minVal4, maxVal4, col1, col4;

function setup() {
    // crea canvas usando l'altezza disponibile così da far stare tutto in una pagina
    createCanvas(windowWidth, getAvailableCanvasHeight());
    // Imposta il font Helvetica per i testi disegnati nel canvas (se disponibile)
    try { textFont('Helvetica'); } catch (e) { /* fallback automatico */ }
    // Imposta il font Helvetica per i testi disegnati nel canvas (se disponibile)
    try { textFont('Helvetica'); } catch (e) { /* fallback automatico */ }

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
    sortedArr = [...arr].sort((a, b) => a - b);

    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }

    average = arr.length > 0 ? sum / arr.length : 0;
    print("average:", average);

    // deviazione standard colonna 1 (filtrata)
    col1 = validRows.map(r => r[1]);
    std1 = 0;
    mean1 = 0;
    minVal1 = 0;
    maxVal1 = 1;
    if (col1.length > 1) {
        mean1 = col1.reduce((a, b) => a + b, 0) / col1.length;
        const sumSq = col1.reduce((a, v) => a + (v - mean1) * (v - mean1), 0);
        std1 = Math.sqrt(sumSq / (col1.length - 1));
        minVal1 = Math.min(...col1);
        maxVal1 = Math.max(...col1);
    }

    // moda colonna 2 (filtrata)
    const col2 = validRows.map(r => r[2]);
    mode2 = 0;
    if (col2.length > 0) {
        const counts = new Map();
        for (const v of col2) {
            counts.set(v, (counts.get(v) || 0) + 1);
        }
        let modeCount = 0;
        counts.forEach((count, value) => {
            if (count > modeCount) {
                modeCount = count;
                mode2 = value;
            }
        });
    }

    // mediana colonna 3 (filtrata)
    const col3 = validRows.map(r => r[3]);
    median3 = 0;
    if (col3.length > 0) {
        const sortedCol3 = [...col3].sort((a, b) => a - b);
        const n3 = sortedCol3.length;
        if (n3 % 2 === 1) {
            median3 = sortedCol3[(n3 - 1) / 2];
        } else {
            const mid = n3 / 2;
            median3 = (sortedCol3[mid - 1] + sortedCol3[mid]) / 2;
        }
    }

    // media e deviazione standard colonna 4 (filtrata)
    col4 = validRows.map(r => r[4]);
    std4 = 0;
    mean4 = 0;
    minVal4 = 0;
    maxVal4 = 1;
    if (col4.length > 1) {
        mean4 = col4.reduce((a, b) => a + b, 0) / col4.length;
        const sumSq4 = col4.reduce((a, v) => a + (v - mean4) * (v - mean4), 0);
        std4 = Math.sqrt(sumSq4 / (col4.length - 1));
        minVal4 = Math.min(...col4);
        maxVal4 = Math.max(...col4);
    }

    // Prepariamo i valori da mostrare nella tabella header HTML
    let headerItems = [
        {label: 'Media colonna 0 (filtrata)', value: nf(average, 1, 2)},
        {label: 'Dev. std colonna 1 (filtrata)', value: nf(std1, 1, 2)},
        {label: 'Moda colonna 2 (filtrata)', value: nf(mode2, 1, 2)},
        {label: 'Mediana colonna 3 (filtrata)', value: nf(median3, 1, 2)},
        {label: 'Media colonna 4 (filtrata) μ', value: nf(mean4, 1, 2)},
        {label: 'Dev. std colonna 4 (filtrata) σ', value: nf(std4, 1, 2)}
    ];

    // renderizziamo la tabella header (HTML)
    if (typeof document !== 'undefined') {
        renderHeaderTable(headerItems);
    }
}

function draw() {
    background(0);

    if (!table) return;

    // ---------------- Primo grafico: colonne + linea media (stile Excel) ----------------
    const left = 120; // aumentato ulteriormente per rendere i grafici ancora meno larghi
    const right = width - 120;

    // layout condiviso per avere tre grafici della stessa altezza
    // spazi ridotti per far stare tutto su una pagina
    const topMargin = 40;
    const headerGap = 8; // extra space between header and first graph (ridotto)
    const bottomMargin = 20;
    const gapBetween = 60; // spazio tra grafici aumentato
    const chartsScale = 0.90; // percentuale dello spazio interno da assegnare ai grafici
    const totalInnerH = height - topMargin - headerGap - bottomMargin - gapBetween * 2;
    const panelH = Math.max(60, (totalInnerH * chartsScale) / 3); // altezza per ogni pannello

    const chart1Top = topMargin + headerGap;
    const chart1Bottom = chart1Top + panelH;
    const chart2Top = chart1Bottom + gapBetween;
    const chart2Bottom = chart2Top + panelH;
    const chart3Top = chart2Bottom + gapBetween;
    const chart3Bottom = chart3Top + panelH;

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

    // titolo del primo grafico
    noStroke();
    fill(255);
    textSize(10);
    textAlign(LEFT, BOTTOM);
    text("Istogramma colonna 0 (filtrata) – colonne e linea media", left, chart1Top - 8);

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

    // Reset hover state per primo grafico
    hoveredBarIndex = -1;

    noStroke();
    let barIndex = 0;
    for (let i = 0; i < sortedArr.length; i += stepBars) {
        const v = sortedArr[i];
        const x1 = left + barIndex * barBand + gap * 0.5;
        const yTop = yForVal0(v);
        
        // Check if mouse is over this bar
        if (mouseX >= x1 && mouseX <= x1 + barWidth && 
            mouseY >= yTop && mouseY <= chart1Bottom &&
            mouseX >= left && mouseX <= right &&
            mouseY >= chart1Top && mouseY <= chart1Bottom) {
            hoveredBarIndex = barIndex;
            hoveredValue = v;
            hoveredX = x1 + barWidth / 2;
            hoveredY = yTop;
            fill(120, 170, 250, 255); // Colore più intenso per hover
        } else {
            fill(120, 170, 250, 200); // Colore normale
        }
        
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

    // Tooltip per hover
    if (hoveredBarIndex >= 0) {
        // Background del tooltip
        noStroke();
        fill(0, 0, 0, 200);
        const tooltipW = 80;
        const tooltipH = 30;
        const tooltipX = hoveredX - tooltipW / 2;
        const tooltipY = hoveredY - tooltipH - 10;
        
        // Assicurati che il tooltip non esca dai bordi
        const finalTooltipX = constrain(tooltipX, left, right - tooltipW);
        const finalTooltipY = constrain(tooltipY, chart1Top, chart1Bottom - tooltipH);
        
        rect(finalTooltipX, finalTooltipY, tooltipW, tooltipH, 4);
        
        // Testo del tooltip
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(10);
        text("Valore: " + nf(hoveredValue, 1, 2), finalTooltipX + tooltipW / 2, finalTooltipY + tooltipH / 2);
        
        // Linea di collegamento
        stroke(255, 255, 255, 150);
        strokeWeight(1);
        line(hoveredX, hoveredY, finalTooltipX + tooltipW / 2, finalTooltipY + tooltipH);
    }

    // ---------------- Secondo grafico: curva normale con banda ±1σ (stile didattico) ----------------
    const chartTop = chart2Top;
    const chartBottom = chart2Bottom;
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

    // Reset hover state per secondo grafico
    hoveredCurveIndex = -1;

    // curva di Gauss
    noFill();
    stroke(120, 170, 250, 220);
    strokeWeight(2);
    beginShape();
    const samples = 200;
    let curvePoints = [];
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const xVal = minVal1 + t * (maxVal1 - minVal1);
        const px = xForVal(xVal);
        const py = yForPdf(normalPdf(xVal, mean1, std1));
        curvePoints.push({x: px, y: py, value: xVal});
        vertex(px, py);
    }
    endShape();

    // Check hover sulla curva
    if (mouseX >= chartLeft && mouseX <= chartRight && 
        mouseY >= chartTop && mouseY <= chartBottom) {
        let minDistance = Infinity;
        let closestIndex = -1;
        
        for (let i = 0; i < curvePoints.length; i++) {
            const point = curvePoints[i];
            const distance = dist(mouseX, mouseY, point.x, point.y);
            if (distance < minDistance && distance < 15) { // soglia di 15 pixel
                minDistance = distance;
                closestIndex = i;
            }
        }
        
        if (closestIndex >= 0) {
            hoveredCurveIndex = closestIndex;
            hoveredCurveValue = curvePoints[closestIndex].value;
            hoveredCurveX = curvePoints[closestIndex].x;
            hoveredCurveY = curvePoints[closestIndex].y;
        }
    }

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

    // Tooltip per hover del secondo grafico
    if (hoveredCurveIndex >= 0) {
        // Background del tooltip
        noStroke();
        fill(0, 0, 0, 200);
        const tooltipW = 80;
        const tooltipH = 30;
        const tooltipX = hoveredCurveX - tooltipW / 2;
        const tooltipY = hoveredCurveY - tooltipH - 10;
        
        // Assicurati che il tooltip non esca dai bordi
        const finalTooltipX = constrain(tooltipX, chartLeft, chartRight - tooltipW);
        const finalTooltipY = constrain(tooltipY, chartTop, chartBottom - tooltipH);
        
        rect(finalTooltipX, finalTooltipY, tooltipW, tooltipH, 4);
        
        // Testo del tooltip
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(10);
        text("X: " + nf(hoveredCurveValue, 1, 2), finalTooltipX + tooltipW / 2, finalTooltipY + tooltipH / 2);
        
        // Linea di collegamento
        stroke(255, 255, 255, 150);
        strokeWeight(1);
        line(hoveredCurveX, hoveredCurveY, finalTooltipX + tooltipW / 2, finalTooltipY + tooltipH);
        
        // Punto sulla curva
        noStroke();
        fill(255, 255, 0);
        ellipse(hoveredCurveX, hoveredCurveY, 6, 6);
    }

    // ---------------- Terzo grafico: visualizzazione deviazione standard colonna 4 ----------------
    const chart3Left = left;
    const chart3Right = right;

    // assi
    stroke(200);
    strokeWeight(2);
    line(chart3Left, chart3Bottom, chart3Right, chart3Bottom); // X
    line(chart3Left, chart3Top, chart3Left, chart3Bottom);     // Y

    // istogramma col4
    const binCount4 = 16;
    const bins4 = new Array(binCount4).fill(0);
    const range4 = (maxVal4 - minVal4) || 1;
    const binWVal4 = range4 / binCount4;
    for (let i = 0; i < col4.length; i++) {
        const v = col4[i];
        let idx = Math.floor((v - minVal4) / range4 * binCount4);
        if (idx < 0) idx = 0;
        if (idx >= binCount4) idx = binCount4 - 1;
        bins4[idx]++;
    }
    const maxBin4 = bins4.length ? Math.max(...bins4) : 1;

    const xForVal4 = (v) => {
        if (maxVal4 === minVal4) return (chart3Left + chart3Right) * 0.5;
        const t = constrain((v - minVal4) / (maxVal4 - minVal4), 0, 1);
        return chart3Left + t * (chart3Right - chart3Left);
    };
    const yForCount4 = (c) => {
        const t = maxBin4 ? c / maxBin4 : 0;
        return chart3Bottom - t * (chart3Bottom - chart3Top);
    };

    // Reset hover state per terzo grafico
    hoveredBarIndex3 = -1;

    // disegna le barre dell'istogramma
    noStroke();
    for (let b = 0; b < binCount4; b++) {
        const binStartVal = minVal4 + b * binWVal4;
        const binEndVal = binStartVal + binWVal4;
        const x1c = xForVal4(binStartVal);
        const x2c = xForVal4(binEndVal);
        const barWc = Math.max(1, x2c - x1c - 1);
        const yTopc = yForCount4(bins4[b]);
        
        // Check if mouse is over this bar
        if (mouseX >= x1c + 0.5 && mouseX <= x1c + 0.5 + barWc && 
            mouseY >= yTopc && mouseY <= chart3Bottom &&
            mouseX >= chart3Left && mouseX <= chart3Right &&
            mouseY >= chart3Top && mouseY <= chart3Bottom) {
            hoveredBarIndex3 = b;
            hoveredValue3 = binStartVal + binWVal4 / 2; // valore centrale del bin
            hoveredX3 = x1c + 0.5 + barWc / 2;
            hoveredY3 = yTopc;
            fill(120, 170, 250, 255); // Colore più intenso per hover
        } else {
            fill(120, 170, 250, 190); // Colore normale
        }
        
        rect(x1c + 0.5, yTopc, barWc, chart3Bottom - yTopc);
    }

    // banda ±1σ per evidenziare la deviazione standard
    const bandLeft4 = xForVal4(mean4 - std4);
    const bandRight4 = xForVal4(mean4 + std4);
    noStroke();
    fill(240, 120, 90, 90);
    rect(Math.min(bandLeft4, bandRight4), chart3Top, Math.abs(bandRight4 - bandLeft4), chart3Bottom - chart3Top);

    // marcatori ai bordi della ±1σ
    stroke(240, 120, 90, 220);
    strokeWeight(2);
    line(bandLeft4, chart3Top, bandLeft4, chart3Bottom);
    line(bandRight4, chart3Top, bandRight4, chart3Bottom);

    // linea verticale alla media
    const xMean4 = xForVal4(mean4);
    stroke(120, 170, 250, 220);
    strokeWeight(2);
    line(xMean4, chart3Top, xMean4, chart3Bottom);

    // linea orizzontale alla media (stile grafico 1)
    const yMean4 = chart3Top + (chart3Bottom - chart3Top) * 0.5; // posizione fissa a metà altezza
    stroke(240, 120, 90);
    strokeWeight(2);
    line(chart3Left, yMean4, chart3Right, yMean4);
    noStroke();
    fill(240, 120, 90);
    textAlign(LEFT, BOTTOM);
    text("media = " + nf(mean4, 1, 2), chart3Left + 6, yMean4 - 4);

    // etichette per i marcatori
    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    text("μ−σ", bandLeft4, chart3Top + 6);
    text("μ+σ", bandRight4, chart3Top + 6);
    text("μ", xMean4, chart3Top + 6);

    // ticks X ogni 10
    stroke(170);
    strokeWeight(1);
    fill(255);
    textSize(10);
    textAlign(CENTER, TOP);
    if (maxVal4 !== minVal4) {
        const stepX4 = 10;
        const startX4 = Math.ceil(minVal4 / stepX4) * stepX4;
        const endX4 = Math.floor(maxVal4 / stepX4) * stepX4;
        for (let v = startX4; v <= endX4; v += stepX4) {
            const xx = xForVal4(v);
            line(xx, chart3Bottom, xx, chart3Bottom + 6);
            text(v, xx, chart3Bottom + 8);
        }
    }

    // ticks Y ogni 10 (conteggi dell'istogramma)
    textAlign(RIGHT, CENTER);
    if (maxBin4 > 0) {
        const stepY4 = niceStep(0, maxBin4, 6);
        for (let v = 0; v <= maxBin4 + 1e-9; v += stepY4) {
            const yy = yForCount4(v);
            line(chart3Left - 4, yy, chart3Left, yy);
            text(nf(v, 1, 0), chart3Left - 8, yy);
        }
    }

    // etichette
    noStroke();
    fill(255);
    textAlign(LEFT, BOTTOM);
    text("Istogramma colonna 4 (filtrata) con deviazione standard ±1σ", chart3Left, chart3Top - 8);
    textAlign(LEFT, TOP);
    text("μ = " + nf(mean4, 1, 2) + ", σ = " + nf(std4, 1, 2), chart3Left + 4, chart3Top + 6);

    // Tooltip per hover del terzo grafico
    if (hoveredBarIndex3 >= 0) {
        // Background del tooltip
        noStroke();
        fill(0, 0, 0, 200);
        const tooltipW = 100;
        const tooltipH = 40;
        const tooltipX = hoveredX3 - tooltipW / 2;
        const tooltipY = hoveredY3 - tooltipH - 10;
        
        // Assicurati che il tooltip non esca dai bordi
        const finalTooltipX = constrain(tooltipX, chart3Left, chart3Right - tooltipW);
        const finalTooltipY = constrain(tooltipY, chart3Top, chart3Bottom - tooltipH);
        
        rect(finalTooltipX, finalTooltipY, tooltipW, tooltipH, 4);
        
        // Testo del tooltip
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(10);
        text("Valore: " + nf(hoveredValue3, 1, 2), finalTooltipX + tooltipW / 2, finalTooltipY + tooltipH / 2 - 5);
        text("Freq: " + bins4[hoveredBarIndex3], finalTooltipX + tooltipW / 2, finalTooltipY + tooltipH / 2 + 5);
        
        // Linea di collegamento
        stroke(255, 255, 255, 150);
        strokeWeight(1);
        line(hoveredX3, hoveredY3, finalTooltipX + tooltipW / 2, finalTooltipY + tooltipH);
    }

}

function windowResized() {
    // ridimensiona il canvas tenendo conto dell'altezza della tabella header
    resizeCanvas(windowWidth, getAvailableCanvasHeight());
    redraw();
}

// Costruisce una tabella HTML con i valori header e la inserisce nel DOM
function renderHeaderTable(items) {
    try {
        const container = document.getElementById('header-table');
        if (!container) return;

        let html = '<table aria-label="Valori header">';
        html += '<thead><tr>';
        for (const it of items) {
            html += `<th>${it.label}</th>`;
        }
        html += '</tr></thead>';
        html += '<tbody><tr>';
        for (const it of items) {
            html += `<td>${it.value}</td>`;
        }
        html += '</tr></tbody>';
        html += '</table>';

        container.innerHTML = html;
    } catch (e) {
        console.warn('renderHeaderTable failed:', e);
    }
}