let xMax = 400;
let yMax = 600;

let table;
let validRows = [];

// Stato per gestione finestre cliccabili
let activeGraph = 0; // 0 = nessuno, 1 = primo, 2 = secondo, 3 = terzo
let windowStates = [false, false, false]; // stato di ogni finestra

// Variabili globali per i bounds delle finestre
let chart1Left, chart1Right, chart2Left, chart2Right, chart3Left, chart3Right;
let chartTop, chartBottom;

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

    // moda colonna 2 (filtrata)
    const col2 = validRows.map(r => r[2]);
    let mode2 = 0;
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

    // media, deviazione standard e mediana colonna 4 (filtrata)
    const col4 = validRows.map(r => r[4]);
    let std4 = 0;
    let mean4 = 0;
    let median4 = 0;
    let minVal4 = 0;
    let maxVal4 = 1;
    if (col4.length > 1) {
        mean4 = col4.reduce((a, b) => a + b, 0) / col4.length;
        const sumSq4 = col4.reduce((a, v) => a + (v - mean4) * (v - mean4), 0);
        std4 = Math.sqrt(sumSq4 / (col4.length - 1));
        minVal4 = Math.min(...col4);
        maxVal4 = Math.max(...col4);
        
        // calcolo mediana
        const sortedCol4 = [...col4].sort((a, b) => a - b);
        const n4 = sortedCol4.length;
        if (n4 % 2 === 1) {
            median4 = sortedCol4[(n4 - 1) / 2];
        } else {
            const mid = n4 / 2;
            median4 = (sortedCol4[mid - 1] + sortedCol4[mid]) / 2;
        }
    }

    background(0);

    // Prepariamo i valori da mostrare nella tabella header HTML
    let headerItems = [
        {label: 'Media colonna 0 (filtrata)', value: nf(average, 1, 2)},
        {label: 'Dev. std colonna 1 (filtrata)', value: nf(std1, 1, 2)},
        {label: 'Moda colonna 2 (filtrata)', value: nf(mode2, 1, 2)},
        {label: 'Media colonna 4 (filtrata) μ', value: nf(mean4, 1, 2)},
        {label: 'Dev. std colonna 4 (filtrata) σ', value: nf(std4, 1, 2)},
        {label: 'Mediana colonna 4 (filtrata)', value: nf(median4, 1, 2)}
    ];

    // renderizziamo la tabella header (HTML)
    if (typeof document !== 'undefined') {
        renderHeaderTable(headerItems);
    }

    // Calcola i bounds per le finestre
    calculateWindowBounds();

    // Renderizza le finestre cliccabili
    renderClickableWindows();

    // Renderizza il grafico attivo se necessario
    if (activeGraph > 0) {
        renderActiveGraph();
    }
}

// Funzione per calcolare i bounds delle finestre
function calculateWindowBounds() {
    // Margini e spazi per layout orizzontale
    const topMargin = 40;
    const headerGap = 8;
    const bottomMargin = 20;
    const leftMargin = 40;
    const rightMargin = 40;
    const gapBetween = 20; // spazio orizzontale tra finestre
    
    // Calcolo dimensioni per layout orizzontale
    const totalInnerW = width - leftMargin - rightMargin - gapBetween * 2;
    const panelWidth = Math.max(150, totalInnerW / 3); // larghezza per ogni finestra
    const chartTopTemp = topMargin + headerGap;
    const chartBottomTemp = height - bottomMargin;
    
    // Bounds per ogni finestra - assegnazione alle variabili globali
    chart1Left = leftMargin;
    chart1Right = chart1Left + panelWidth;
    chart2Left = chart1Right + gapBetween;
    chart2Right = chart2Left + panelWidth;
    chart3Left = chart2Right + gapBetween;
    chart3Right = chart3Left + panelWidth;
    chartTop = chartTopTemp;
    chartBottom = chartBottomTemp;
}

// Funzione per renderizzare le finestre cliccabili
function renderClickableWindows() {
    console.log("Rendering windows with bounds:", {
        chart1Left, chart1Right, chart2Left, chart2Right, chart3Left, chart3Right,
        chartTop, chartBottom
    });
    
    const titles = [
        "Istogramma colonna 0 (filtrata)",
        "Curva normale colonna 1 (filtrata)",
        "Istogramma colonna 4 (filtrata)"
    ];
    
    const colors = [
        [120, 170, 250],
        [120, 170, 250], 
        [120, 170, 250]
    ];
    
    for (let i = 0; i < 3; i++) {
        const left = i === 0 ? chart1Left : i === 1 ? chart2Left : chart3Left;
        const right = i === 0 ? chart1Right : i === 1 ? chart2Right : chart3Right;
        const top = chartTop;
        const bottom = chartBottom;
        
        // Bordo della finestra
        stroke(255);
        strokeWeight(2);
        noFill();
        rect(left, top, right - left, bottom - top);
        
        // Sfondo semi-trasparente
        noStroke();
        fill(colors[i][0], colors[i][1], colors[i][2], 30);
        rect(left, top, right - left, bottom - top);
        
        // Titolo della finestra
        fill(255);
        textSize(12);
        textAlign(CENTER, CENTER);
        text(titles[i], left + (right - left) / 2, top + (bottom - top) / 2);
        
        // Indicatore di click
        fill(255);
        textSize(10);
        textAlign(CENTER, CENTER);
        text("Click per aprire", left + (right - left) / 2, top + (bottom - top) / 2 + 20);
    }
}

// Funzione per renderizzare il grafico attivo
function renderActiveGraph() {
    if (activeGraph === 1) {
        renderGraph1();
    } else if (activeGraph === 2) {
        renderGraph2();
    } else if (activeGraph === 3) {
        renderGraph3();
    }
}

// Funzione per gestire i click
function mousePressed() {
    // Controlla se il click è dentro una finestra
    if (mouseY >= chartTop && mouseY <= chartBottom) {
        if (mouseX >= chart1Left && mouseX <= chart1Right) {
            // Click su finestra 1
            activeGraph = activeGraph === 1 ? 0 : 1;
            redraw();
        } else if (mouseX >= chart2Left && mouseX <= chart2Right) {
            // Click su finestra 2
            activeGraph = activeGraph === 2 ? 0 : 2;
            redraw();
        } else if (mouseX >= chart3Left && mouseX <= chart3Right) {
            // Click su finestra 3
            activeGraph = activeGraph === 3 ? 0 : 3;
            redraw();
        }
    }
}

// Funzione per renderizzare il primo grafico
function renderGraph1() {
    const chart1LeftLocal = chart1Left;
    const chart1RightLocal = chart1Right;
    const chartTopLocal = chartTop;
    const chartBottomLocal = chartBottom;

    // scala Y per i valori di colonna 0
    const dataMin = sortedArr.length > 0 ? Math.min(...sortedArr) : 0;
    const dataMax = sortedArr.length > 0 ? Math.max(...sortedArr) : 1;
    const yForVal0 = (v) => {
        const t = constrain((v - dataMin) / (dataMax - dataMin || 1), 0, 1);
        return chartBottomLocal - t * (chartBottomLocal - chartTopLocal);
    };

    // assi
    stroke(200);
    strokeWeight(2);
    line(chart1LeftLocal, chartBottomLocal, chart1RightLocal, chartBottomLocal); // X
    line(chart1LeftLocal, chartTopLocal, chart1LeftLocal, chartBottomLocal);     // Y

    // titolo del primo grafico
    noStroke();
    fill(255);
    textSize(8);
    textAlign(LEFT, BOTTOM);
    text("Istogramma colonna 0 (filtrata) – colonne e linea media", chart1LeftLocal, chartTopLocal - 6);

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
    textSize(8);
    textAlign(RIGHT, CENTER);
    if (dataMax !== dataMin) {
        const stepY = niceStep(dataMin, dataMax, 6);
        const startYVal = Math.ceil(dataMin / stepY) * stepY;
        const endYVal = Math.floor(dataMax / stepY) * stepY;
        for (let v = startYVal; v <= endYVal + 1e-9; v += stepY) {
            const yy = yForVal0(v);
            line(chart1LeftLocal - 3, yy, chart1LeftLocal, yy);
            text(nf(v, 1, 0), chart1LeftLocal - 6, yy);
        }
    }

    // colonne (campionamento se troppi)
    const maxBars = 40;
    const stepBars = Math.ceil((sortedArr.length || 1) / maxBars);
    const countBars = Math.ceil(sortedArr.length / stepBars);
    const gap = 1;
    const barBand = (chart1RightLocal - chart1LeftLocal) / Math.max(1, countBars);
    const barWidth = Math.max(1, barBand - gap);

    noStroke();
    fill(120, 170, 250, 200);
    let barIndex = 0;
    for (let i = 0; i < sortedArr.length; i += stepBars) {
        const v = sortedArr[i];
        const x1 = chart1LeftLocal + barIndex * barBand + gap * 0.5;
        const yTop = yForVal0(v);
        rect(x1, yTop, barWidth, chartBottomLocal - yTop);
        barIndex++;
    }

    // ticks/etichette asse X: una etichetta ogni 10 valori nell'ordine ordinato
    stroke(170);
    strokeWeight(1);
    fill(255);
    textSize(7);
    textAlign(CENTER, TOP);
    for (let i = 0; i < sortedArr.length; i += 15) {
        const bin = Math.floor(i / stepBars);
        const tickX = chart1LeftLocal + bin * barBand + gap * 0.5 + barWidth * 0.5;
        line(tickX, chartBottomLocal, tickX, chartBottomLocal + 4);
        text(i, tickX, chartBottomLocal + 6);
    }

    // linea orizzontale alla media (stile "average line")
    const yAvg = yForVal0(average);
    stroke(240, 120, 90);
    strokeWeight(2);
    line(chart1LeftLocal, yAvg, chart1RightLocal, yAvg);
    noStroke();
    fill(240, 120, 90);
    textSize(7);
    textAlign(LEFT, BOTTOM);
    text("media = " + nf(average, 1, 2), chart1LeftLocal + 4, yAvg - 3);

    // etichette Y min/max per contesto
    fill(255);
    textAlign(RIGHT, CENTER);
    textSize(7);
    text(nf(dataMax, 1, 0), chart1LeftLocal - 6, yForVal0(dataMax));
    text(nf(dataMin, 1, 0), chart1LeftLocal - 6, yForVal0(dataMin));
}

// Funzione per renderizzare il secondo grafico
function renderGraph2() {
    const chart2LeftLocal = chart2Left;
    const chart2RightLocal = chart2Right;
    const chartTopLocal = chartTop;
    const chartBottomLocal = chartBottom;

    // assi
    stroke(200);
    strokeWeight(2);
    line(chart2LeftLocal, chartBottomLocal, chart2RightLocal, chartBottomLocal); // X
    line(chart2LeftLocal, chartTopLocal, chart2LeftLocal, chartBottomLocal);     // Y

    // mapping funzioni per la curva
    const xForVal = (v) => {
        if (maxVal1 === minVal1) return (chart2LeftLocal + chart2RightLocal) * 0.5;
        const t = constrain((v - minVal1) / (maxVal1 - minVal1), 0, 1);
        return chart2LeftLocal + t * (chart2RightLocal - chart2LeftLocal);
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
    const usableH = chartBottomLocal - chartTopLocal;
    const yForPdf = (p) => {
        const t = peakPdf > 0 ? p / peakPdf : 0;
        return chartBottomLocal - constrain(t, 0, 1) * usableH * 0.85;
    };

    // ticks asse X ogni 10 unità (valori della colonna 1)
    stroke(170);
    strokeWeight(1);
    fill(255);
    textSize(7);
    textAlign(CENTER, TOP);
    if (maxVal1 !== minVal1) {
        const stepX = 20;
        const startXVal = Math.ceil(minVal1 / stepX) * stepX;
        const endXVal = Math.floor(maxVal1 / stepX) * stepX;
        for (let v = startXVal; v <= endXVal; v += stepX) {
            const xx = xForVal(v);
            line(xx, chartBottomLocal, xx, chartBottomLocal + 4);
            text(v, xx, chartBottomLocal + 6);
        }
    }

    // ticks asse Y ogni 10% (0%..100% del picco)
    fill(255);
    textAlign(RIGHT, CENTER);
    textSize(7);
    for (let p = 0; p <= 1.00001; p += 0.2) {
        const yy = yForPdf(peakPdf * p);
        line(chart2LeftLocal - 3, yy, chart2LeftLocal, yy);
        text(nf(p * 100, 1, 0) + '%', chart2LeftLocal - 6, yy);
    }

    // banda ±1σ
    const bandXL = xForVal(mean1 - std1);
    const bandXR = xForVal(mean1 + std1);
    noStroke();
    fill(240, 120, 90, 60);
    rect(Math.min(bandXL, bandXR), chartTopLocal, Math.abs(bandXR - bandXL), chartBottomLocal - chartTopLocal);

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
    line(xMu, chartTopLocal, xMu, chartBottomLocal);

    stroke(120, 120, 120, 180);
    strokeWeight(1.5);
    line(xMuL, chartTopLocal, xMuL, chartBottomLocal);
    line(xMuR, chartTopLocal, xMuR, chartBottomLocal);

    // legenda e testi
    noStroke();
    fill(255);
    textAlign(LEFT, BOTTOM);
    textSize(8);
    text("Curva normale colonna 1 (filtrata) – μ e ±1σ", chart2LeftLocal, chartTopLocal - 6);
    textAlign(LEFT, TOP);
    textSize(7);
    text("μ = " + nf(mean1, 1, 2) + ", σ = " + nf(std1, 1, 2), chart2LeftLocal + 3, chartTopLocal + 4);
    textAlign(CENTER, TOP);
    fill(255);
    textSize(7);
    text("μ", xMu, chartTopLocal + 4);
    text("μ−σ", xMuL, chartTopLocal + 4);
    text("μ+σ", xMuR, chartTopLocal + 4);
}

// Funzione per renderizzare il terzo grafico
function renderGraph3() {
    const chart3LeftLocal = chart3Left;
    const chart3RightLocal = chart3Right;
    const chartTopLocal = chartTop;
    const chartBottomLocal = chartBottom;

    // assi
    stroke(200);
    strokeWeight(2);
    line(chart3LeftLocal, chartBottomLocal, chart3RightLocal, chartBottomLocal); // X
    line(chart3LeftLocal, chartTopLocal, chart3LeftLocal, chartBottomLocal);     // Y

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
        if (maxVal4 === minVal4) return (chart3LeftLocal + chart3RightLocal) * 0.5;
        const t = constrain((v - minVal4) / (maxVal4 - minVal4), 0, 1);
        return chart3LeftLocal + t * (chart3RightLocal - chart3LeftLocal);
    };
    const yForCount4 = (c) => {
        const t = maxBin4 ? c / maxBin4 : 0;
        return chartBottomLocal - t * (chartBottomLocal - chartTopLocal);
    };

    noStroke();
    fill(120, 170, 250, 190);
    for (let b = 0; b < binCount4; b++) {
        const binStartVal = minVal4 + b * binWVal4;
        const binEndVal = binStartVal + binWVal4;
        const x1c = xForVal4(binStartVal);
        const x2c = xForVal4(binEndVal);
        const barWc = Math.max(1, x2c - x1c - 1);
        const yTopc = yForCount4(bins4[b]);
        rect(x1c + 0.5, yTopc, barWc, chartBottomLocal - yTopc);
    }

    // banda ±1σ e linea media per col4
    const bandLeft4 = xForVal4(mean4 - std4);
    const bandRight4 = xForVal4(mean4 + std4);
    noStroke();
    fill(240, 120, 90, 90);
    rect(Math.min(bandLeft4, bandRight4), chartTopLocal, Math.abs(bandRight4 - bandLeft4), chartBottomLocal - chartTopLocal);

    // marcatori ai bordi della ±1σ
    stroke(240, 120, 90, 220);
    strokeWeight(2);
    line(bandLeft4, chartTopLocal, bandLeft4, chartBottomLocal);
    line(bandRight4, chartTopLocal, bandRight4, chartBottomLocal);
    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(7);
    text("μ−σ", bandLeft4, chartTopLocal + 4);
    text("μ+σ", bandRight4, chartTopLocal + 4);

    // linea orizzontale alla media (stile grafico 1)
    const yMean4 = chartTopLocal + (chartBottomLocal - chartTopLocal) * 0.5; // posizione fissa a metà altezza
    stroke(240, 120, 90);
    strokeWeight(2);
    line(chart3LeftLocal, yMean4, chart3RightLocal, yMean4);
    noStroke();
    fill(240, 120, 90);
    textAlign(LEFT, BOTTOM);
    textSize(7);
    text("media = " + nf(mean4, 1, 2), chart3LeftLocal + 4, yMean4 - 3);

    // ticks X ogni 10
    stroke(170);
    strokeWeight(1);
    fill(255);
    textSize(7);
    textAlign(CENTER, TOP);
    if (maxVal4 !== minVal4) {
        const stepX4 = 20;
        const startX4 = Math.ceil(minVal4 / stepX4) * stepX4;
        const endX4 = Math.floor(maxVal4 / stepX4) * stepX4;
        for (let v = startX4; v <= endX4; v += stepX4) {
            const xx = xForVal4(v);
            line(xx, chartBottomLocal, xx, chartBottomLocal + 4);
            text(v, xx, chartBottomLocal + 6);
        }
    }

    // ticks Y ogni 10 (conteggi dell'istogramma)
    textAlign(RIGHT, CENTER);
    textSize(7);
    if (maxBin4 > 0) {
        const stepY4 = niceStep(0, maxBin4, 4);
        for (let v = 0; v <= maxBin4 + 1e-9; v += stepY4) {
            const yy = yForCount4(v);
            line(chart3LeftLocal - 3, yy, chart3LeftLocal, yy);
            text(nf(v, 1, 0), chart3LeftLocal - 6, yy);
        }
    }

    // etichette
    noStroke();
    fill(255);
    textAlign(LEFT, BOTTOM);
    textSize(8);
    text("Istogramma colonna 4 (filtrata) con μ e ±1σ", chart3LeftLocal, chartTopLocal - 6);
    textAlign(LEFT, TOP);
    textSize(7);
    text("μ = " + nf(mean4, 1, 2) + ", σ = " + nf(std4, 1, 2), chart3LeftLocal + 3, chartTopLocal + 4);
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