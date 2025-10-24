const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const SIZE = 15; // 15x15
const PADDING = 20; // padding inside canvas
let boardSizePx = Math.min(canvas.width, canvas.height) - PADDING * 2;
let cellSize = boardSizePx / (SIZE - 1);
const starPoints = [3, 7, 11]; // 0-based indices for 15x15

let board = []; // 0 empty, 1 black, 2 white
let currentTurn = 1; // 1 black (player), 2 white (AI)
let gameOver = false;

const turnLabel = document.getElementById('turn');
const restartBtn = document.getElementById('restart');
const messageDiv = document.getElementById('message');

function init() {
    // initialize board
    board = new Array(SIZE).fill(0).map(() => new Array(SIZE).fill(0));
    currentTurn = 1;
    gameOver = false;
    updateTurnLabel();
    messageDiv.textContent = '';
    fitCanvas();
    drawBoard();
}

function fitCanvas() {
    // adjust for devicePixelRatio for crisp lines
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    boardSizePx = Math.min(canvas.width / dpr, canvas.height / dpr) - PADDING * 2;
    cellSize = boardSizePx / (SIZE - 1);
}

function drawBoard() {
    // background is handled by parent. Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const startX = (w - boardSizePx) / 2;
    const startY = (h - boardSizePx) / 2;

    ctx.fillStyle = '#DEB887';
    ctx.fillRect(startX - PADDING/2, startY - PADDING/2, boardSizePx + PADDING, boardSizePx + PADDING);

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // draw grid lines
    for (let i = 0; i < SIZE; i++) {
        const x = startX + i * cellSize;
        const y0 = startY;
        const y1 = startY + boardSizePx;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, y0);
        ctx.lineTo(Math.round(x) + 0.5, y1);
        ctx.stroke();

        const y = startY + i * cellSize;
        const x0 = startX;
        const x1 = startX + boardSizePx;
        ctx.beginPath();
        ctx.moveTo(x0, Math.round(y) + 0.5);
        ctx.lineTo(x1, Math.round(y) + 0.5);
        ctx.stroke();
    }

    // draw star points
    const starRadius = 5;
    for (let i of starPoints) {
        for (let j of starPoints) {
            const cx = startX + i * cellSize;
            const cy = startY + j * cellSize;
            ctx.beginPath();
            ctx.fillStyle = '#8B4513';
            ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // draw pieces
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const p = board[i][j];
            if (p !== 0) drawPiece(i, j, p === 1 ? 'black' : 'white');
        }
    }
}

function drawPiece(i, j, color) {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const startX = (w - boardSizePx) / 2;
    const startY = (h - boardSizePx) / 2;
    const cx = startX + i * cellSize;
    const cy = startY + j * cellSize;
    const r = cellSize * 0.42;

    // create radial gradient for glossy effect
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
    if (color === 'black') {
        grad.addColorStop(0, '#666');
        grad.addColorStop(1, '#000');
    } else {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#CFCFCF');
    }

    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // small highlight
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.arc(cx - r*0.35, cy - r*0.35, r*0.25, 0, Math.PI * 2);
    ctx.fill();
}

function updateTurnLabel() {
    turnLabel.textContent = currentTurn === 1 ? '黑方' : '白方';
}

function coordToIndex(x, y) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cx = (x - rect.left);
    const cy = (y - rect.top);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const startX = (w - boardSizePx) / 2;
    const startY = (h - boardSizePx) / 2;

    const rx = (cx - startX);
    const ry = (cy - startY);
    if (rx < -cellSize/2 || ry < -cellSize/2 || rx > boardSizePx + cellSize/2 || ry > boardSizePx + cellSize/2) return null;

    const ix = Math.round(rx / cellSize);
    const iy = Math.round(ry / cellSize);
    if (ix < 0 || ix >= SIZE || iy < 0 || iy >= SIZE) return null;
    return {i: ix, j: iy};
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    if (currentTurn !== 1) return; // only player
    const pos = coordToIndex(e.clientX, e.clientY);
    if (!pos) return;
    if (board[pos.i][pos.j] !== 0) return;
    board[pos.i][pos.j] = 1;
    drawBoard();
    if (checkWin(pos.i, pos.j, 1)) {
        gameOver = true;
        messageDiv.textContent = '黑方（你）獲勝！';
        return;
    }
    currentTurn = 2;
    updateTurnLabel();
    // AI move after slight delay
    setTimeout(aiMove, 250);
});

function aiMove() {
    if (gameOver) return;
    const move = findBestMove();
    if (!move) {
        messageDiv.textContent = '和局';
        gameOver = true;
        return;
    }
    board[move.i][move.j] = 2;
    drawBoard();
    if (checkWin(move.i, move.j, 2)) {
        gameOver = true;
        messageDiv.textContent = '白方（AI）獲勝！';
        return;
    }
    currentTurn = 1;
    updateTurnLabel();
}

// simple scoring AI that considers attack and defense
function findBestMove() {
    const scores = new Array(SIZE).fill(0).map(() => new Array(SIZE).fill(0));

    const directions = [ [1,0], [0,1], [1,1], [1,-1] ];

    function lineScore(count, openEnds) {
        if (count >= 5) return 100000;
        if (count === 4 && openEnds === 2) return 10000;
        if (count === 4 && openEnds === 1) return 1000;
        if (count === 3 && openEnds === 2) return 5000;
        if (count === 3 && openEnds === 1) return 200;
        if (count === 2 && openEnds === 2) return 50;
        if (count === 2 && openEnds === 1) return 10;
        if (count === 1) return 5;
        return 0;
    }

    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (board[i][j] !== 0) continue;
            let total = 0;
            // evaluate for both players
            for (let color = 2; color >= 1; color--) {
                for (let [dx,dy] of directions) {
                    let count = 1; // if we place here
                    let openEnds = 0;
                    // forward
                    let x = i + dx; let y = j + dy;
                    while (x>=0 && x<SIZE && y>=0 && y<SIZE && board[x][y]===color) { count++; x+=dx; y+=dy; }
                    if (x>=0 && x<SIZE && y>=0 && y<SIZE && board[x][y]===0) openEnds++;
                    // backward
                    x = i - dx; y = j - dy;
                    while (x>=0 && x<SIZE && y>=0 && y<SIZE && board[x][y]===color) { count++; x-=dx; y-=dy; }
                    if (x>=0 && x<SIZE && y>=0 && y<SIZE && board[x][y]===0) openEnds++;

                    const s = lineScore(count, openEnds);
                    // weight defense higher to block
                    if (color === 1) total += s * 0.95; else total += s * 1.0;
                }
            }
            // small preference to center
            const center = (SIZE-1)/2;
            const dist = Math.hypot(i-center, j-center);
            total += (7 - dist);
            scores[i][j] = total;
        }
    }

    // find max
    let best = null; let bestScore = -Infinity;
    for (let i=0;i<SIZE;i++) for (let j=0;j<SIZE;j++) {
        if (board[i][j] === 0 && scores[i][j] > bestScore) {
            bestScore = scores[i][j];
            best = {i,j};
        }
    }
    return best;
}

function checkWin(i, j, color) {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (let [dx,dy] of dirs) {
        let count = 1;
        let x = i+dx, y = j+dy;
        while (x>=0 && x<SIZE && y>=0 && y<SIZE && board[x][y]===color) { count++; x+=dx; y+=dy; }
        x = i-dx; y = j-dy;
        while (x>=0 && x<SIZE && y>=0 && y<SIZE && board[x][y]===color) { count++; x-=dx; y-=dy; }
        if (count >= 5) return true;
    }
    return false;
}

restartBtn.addEventListener('click', () => {
    init();
});

window.addEventListener('resize', () => {
    fitCanvas();
    drawBoard();
});

// initial sizing
(function setupCanvasSize() {
    // set a CSS size for canvas
    const sizePx = 600;
    canvas.style.width = sizePx + 'px';
    canvas.style.height = sizePx + 'px';
    // after CSS size set, fit
    fitCanvas();
})();

init();
