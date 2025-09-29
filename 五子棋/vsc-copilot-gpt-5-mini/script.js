// 五子棋 (Gomoku) - 人機對戰
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 15; // 15x15
const boardPx = canvas.width;
const cellSize = boardPx / (size - 1);

let board = [];
let currentPlayer = 1; // 1 黑, 2 白
let humanPlayer = 1;
let aiPlayer = 2;
let gameOver = false;

const statusEl = document.getElementById('status');
const newGameBtn = document.getElementById('newGame');
const playerColorEl = document.getElementById('playerColor');
const aiLevelEl = document.getElementById('aiLevel');

function init() {
    board = Array.from({ length: size }, () => Array(size).fill(0));
    gameOver = false;
    humanPlayer = Number(playerColorEl.value);
    aiPlayer = humanPlayer === 1 ? 2 : 1;
    currentPlayer = 1; // 黑先
    statusEl.textContent = humanPlayer === 1 ? '你的回合（黑）' : '電腦先手（黑）';
    drawBoard();
    if (humanPlayer === 2) {
        // AI goes first
        setTimeout(aiMove, 300);
    }
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background already set by css
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i++) {
        // horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
        // vertical
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
    }

    // draw stones
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] !== 0) drawStone(r, c, board[r][c]);
        }
    }
}

function drawStone(r, c, player) {
    const x = c * cellSize;
    const y = r * cellSize;
    const radius = cellSize * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    if (player === 1) {
        grad.addColorStop(0, '#000'); grad.addColorStop(1, '#444');
    } else {
        grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ddd');
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#222'; ctx.stroke();
}

function canvasCoordsToCell(x, y) {
    // map pixel coords to nearest intersection
    const rect = canvas.getBoundingClientRect();
    const cx = x - rect.left;
    const cy = y - rect.top;
    const c = Math.round(cx / cellSize);
    const r = Math.round(cy / cellSize);
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    return { r, c };
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    const cell = canvasCoordsToCell(e.clientX, e.clientY);
    if (!cell) return;
    if (currentPlayer !== humanPlayer) return;
    if (board[cell.r][cell.c] !== 0) return;
    board[cell.r][cell.c] = humanPlayer;
    drawBoard();
    if (checkWin(cell.r, cell.c, humanPlayer)) {
        statusEl.textContent = '你贏了！'; gameOver = true; return;
    }
    currentPlayer = aiPlayer;
    statusEl.textContent = '電腦思考中...';
    setTimeout(aiMove, 200);
});

function aiMove() {
    if (gameOver) return;
    const level = Number(aiLevelEl.value);
    let move;
    if (level === 1) move = ai_findRandomOrGreedy();
    else move = ai_findBestMove(2); // depth 2
    if (!move) { statusEl.textContent = '和局'; gameOver = true; return; }
    board[move.r][move.c] = aiPlayer;
    drawBoard();
    if (checkWin(move.r, move.c, aiPlayer)) {
        statusEl.textContent = '電腦贏了'; gameOver = true; return;
    }
    currentPlayer = humanPlayer;
    statusEl.textContent = '你的回合';
}

function ai_findRandomOrGreedy() {
    // try to win or block immediate threats, else random near existing stones
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] === 0) {
        board[r][c] = aiPlayer; if (checkWin(r, c, aiPlayer)) { board[r][c] = 0; return { r, c }; } board[r][c] = 0;
    }
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] === 0) {
        board[r][c] = humanPlayer; if (checkWin(r, c, humanPlayer)) { board[r][c] = 0; return { r, c }; } board[r][c] = 0;
    }
    // random but prefer near existing stones
    const candidates = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] === 0) {
        if (hasNeighbor(r, c, 2)) candidates.push({ r, c });
    }
    if (candidates.length === 0) {
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] === 0) candidates.push({ r, c });
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function hasNeighbor(r, c, distance) {
    for (let dr = -distance; dr <= distance; dr++) for (let dc = -distance; dc <= distance; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] !== 0) return true;
    }
    return false;
}

// simple heuristic minimax with alpha-beta and shallow depth
function ai_findBestMove(depth) {
    const start = performance.now();
    let best = null; let bestScore = -Infinity;
    const moves = generateMoves();
    if (moves.length === 0) return null;
    for (const m of moves) {
        board[m.r][m.c] = aiPlayer;
        const score = minimax(depth - 1, false, -Infinity, Infinity);
        board[m.r][m.c] = 0;
        if (score > bestScore) { bestScore = score; best = m; }
    }
    //console.log('ai calc ms', performance.now()-start, 'moves', moves.length, 'best', bestScore);
    return best;
}

function generateMoves() {
    const moves = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] === 0 && hasNeighbor(r, c, 2)) moves.push({ r, c });
    if (moves.length === 0) moves.push({ r: Math.floor(size / 2), c: Math.floor(size / 2) });
    return moves;
}

function minimax(depth, isMax, alpha, beta) {
    // terminal or depth 0 -> evaluate
    if (depth === 0) return evaluateBoard();
    const moves = generateMoves();
    if (moves.length === 0) return 0;
    if (isMax) {
        let value = -Infinity;
        for (const m of moves) {
            board[m.r][m.c] = aiPlayer;
            if (checkWin(m.r, m.c, aiPlayer)) { board[m.r][m.c] = 0; return 100000; }
            const s = minimax(depth - 1, false, alpha, beta);
            board[m.r][m.c] = 0;
            value = Math.max(value, s);
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return value;
    } else {
        let value = Infinity;
        for (const m of moves) {
            board[m.r][m.c] = humanPlayer;
            if (checkWin(m.r, m.c, humanPlayer)) { board[m.r][m.c] = 0; return -100000; }
            const s = minimax(depth - 1, true, alpha, beta);
            board[m.r][m.c] = 0;
            value = Math.min(value, s);
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return value;
    }
}

function evaluateBoard() {
    // simple pattern-based heuristic: count open sequences for each player
    const scores = { 1: 0, 2: 0 };
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] !== 0) {
        const p = board[r][c];
        scores[p] += scoreAt(r, c, p);
    }
    return scores[aiPlayer] - scores[humanPlayer];
}

function scoreAt(r, c, p) {
    // check four directions and sum
    let s = 0;
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
        let len = 1; let openEnds = 0;
        // forward
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === p) { len++; rr += dr; cc += dc }
        if (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === 0) openEnds++;
        // backward
        rr = r - dr; cc = c - dc;
        while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === p) { len++; rr -= dr; cc -= dc }
        if (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === 0) openEnds++;
        s += patternScore(len, openEnds);
    }
    return s;
}

function patternScore(len, openEnds) {
    if (len >= 5) return 100000;
    if (len === 4 && openEnds === 2) return 10000; // open four
    if (len === 4 && openEnds === 1) return 1000; // closed four
    if (len === 3 && openEnds === 2) return 1000; // open three
    if (len === 3 && openEnds === 1) return 100; // closed three
    if (len === 2 && openEnds === 2) return 100; // open two
    if (len === 2 && openEnds === 1) return 10;
    return 0;
}

function checkWin(r, c, player) {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
        let count = 1;
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === player) { count++; rr += dr; cc += dc }
        rr = r - dr; cc = c - dc;
        while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === player) { count++; rr -= dr; cc -= dc }
        if (count >= 5) return true;
    }
    return false;
}

newGameBtn.addEventListener('click', init);
playerColorEl.addEventListener('change', init);
aiLevelEl.addEventListener('change', () => { });

init();
