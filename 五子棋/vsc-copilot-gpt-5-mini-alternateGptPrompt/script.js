// 五子棋（簡易實作）
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 15; // 15x15
const cell = canvas.width / (size - 1);

let board = Array.from({ length: size }, () => Array(size).fill(0)); // 0空，1黑，2白
let currentPlayer = 1; // 1 玩家(黑), 2 電腦(白)
let gameOver = false;
let moveHistory = []; // [y,x,player]
let difficulty = parseInt(document.getElementById('difficulty')?.value || '2', 10);

document.getElementById('difficulty').addEventListener('change', (e) => {
    difficulty = parseInt(e.target.value, 10);
});

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i++) {
        ctx.beginPath();
        ctx.moveTo(cell * i, 0);
        ctx.lineTo(cell * i, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, cell * i);
        ctx.lineTo(canvas.width, cell * i);
        ctx.stroke();
    }

}
// 簡單檢測：將該點歸為該 player，檢查是否會同時創造 >=2 個活三/活四 等威脅
function evaluateDoubleThreat(r, c) {
    // 回傳 1 表示發現雙重威脅，否則 0
    let threats = 0;
    const testPlayer = 2;
    board[r][c] = testPlayer;
    // 檢查每個方向，如果放了會形成 count>=3 且至少一邊空的情形視為威脅
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const d of dirs) {
        let count = 1; let openEnds = 0;
        for (let s = 1; s < 5; s++) { const nr = r + d[0] * s, nc = c + d[1] * s; if (nr < 0 || nr >= size || nc < 0 || nc >= size) break; if (board[nr][nc] === testPlayer) count++; else if (board[nr][nc] === 0) { openEnds++; break; } else break; }
        for (let s = 1; s < 5; s++) { const nr = r - d[0] * s, nc = c - d[1] * s; if (nr < 0 || nr >= size || nc < 0 || nc >= size) break; if (board[nr][nc] === testPlayer) count++; else if (board[nr][nc] === 0) { openEnds++; break; } else break; }
        if (count >= 3 && openEnds > 0) threats++;
    }
    board[r][c] = 0;
    return threats >= 2 ? 1 : 0;

}

function drawPieces() {
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (board[y][x] === 0) continue;
            const cx = x * cell;
            const cy = y * cell;
            const r = cell * 0.4;
            const grd = ctx.createRadialGradient(cx - r / 3, cy - r / 3, r * 0.1, cx, cy, r);
            if (board[y][x] === 1) { // black
                grd.addColorStop(0, '#555');
                grd.addColorStop(1, '#000');
            } else {
                grd.addColorStop(0, '#fff');
                grd.addColorStop(1, '#ddd');
            }
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function render() {
    drawBoard();
    drawPieces();
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / cell);
    const y = Math.round((e.clientY - rect.top) / cell);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    if (board[y][x] !== 0) return;
    board[y][x] = 1;
    moveHistory.push([y, x, 1]);
    render();
    if (checkWin(y, x, 1)) {
        document.getElementById('status').textContent = '你贏了！';
        gameOver = true;
        return;
    }
    currentPlayer = 2;
    document.getElementById('status').textContent = '電腦思考中...';
    setTimeout(() => { aiMove(); render(); }, 200);
});

function aiMove() {
    if (gameOver) return;
    // 1) 先檢查是否有直接獲勝的步
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (board[y][x] !== 0) continue;
            board[y][x] = 2;
            if (checkWin(y, x, 2)) {
                moveHistory.push([y, x, 2]);
                document.getElementById('status').textContent = '電腦贏了';
                gameOver = true;
                return;
            }
            board[y][x] = 0;
        }
    }

    // 2) 阻擋玩家即勝
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (board[y][x] !== 0) continue;
            board[y][x] = 1;
            if (checkWin(y, x, 1)) {
                board[y][x] = 2; moveHistory.push([y, x, 2]); currentPlayer = 1; document.getElementById('status').textContent = '輪到你 (黑)'; return;
            }
            board[y][x] = 0;
        }
    }

    // 3) 評分所有空格並選最佳
    let scores;
    if (difficulty === 1) {
        // 簡單：隨機分數
        scores = Array.from({ length: size }, () => Array(size).fill(1));
    } else if (difficulty === 2) {
        // 中等：原本評分
        scores = evaluateAll();
    } else {
        // 困難：加上位置權重與強化評估
        const base = evaluateAll();
        scores = Array.from({ length: size }, () => Array(size).fill(0));
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
            if (board[y][x] !== 0) continue;
            // 中心靠近中心更好
            const centerDist = Math.hypot(y - (size - 1) / 2, x - (size - 1) / 2);
            const posBonus = Math.max(0, (size / 2 - centerDist));
            scores[y][x] = base[y][x] + posBonus * 5 + evaluateDoubleThreat(y, x) * 2000;
        }
    }
    let best = -Infinity; let bestList = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (board[y][x] !== 0) continue;
        const s = scores[y][x];
        if (s > best) { best = s; bestList = [[y, x]]; } else if (s === best) { bestList.push([y, x]); }
    }
    if (bestList.length === 0) { document.getElementById('status').textContent = '平手'; gameOver = true; return; }
    const choice = bestList[Math.floor(Math.random() * bestList.length)];
    board[choice[0]][choice[1]] = 2; moveHistory.push([choice[0], choice[1], 2]);
    if (checkWin(choice[0], choice[1], 2)) {
        document.getElementById('status').textContent = '電腦贏了'; gameOver = true; return;
    }
    currentPlayer = 1; document.getElementById('status').textContent = '輪到你 (黑)';
}
// 評分：對每個空點計算我方與對方潛力分
function evaluateAll() {
    const scores = Array.from({ length: size }, () => Array(size).fill(0));
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (board[y][x] !== 0) continue;
        scores[y][x] = evaluatePoint(y, x, 2) + evaluatePoint(y, x, 1) * 0.9; // 自己分略高，但也重視阻擋
    }
    return scores;
}

function evaluatePoint(r, c, player) {
    // 簡單計分：沿四方向計算連續同色與被堵情況
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let total = 0;
    for (const d of dirs) {
        let count = 1; let openEnds = 0;
        // forward
        for (let s = 1; s < 5; s++) {
            const nr = r + d[0] * s, nc = c + d[1] * s; if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
            if (board[nr][nc] === player) count++; else if (board[nr][nc] === 0) { openEnds++; break; } else break;
        }
        // backward
        for (let s = 1; s < 5; s++) {
            const nr = r - d[0] * s, nc = c - d[1] * s; if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
            if (board[nr][nc] === player) count++; else if (board[nr][nc] === 0) { openEnds++; break; } else break;
        }
        // 分值表 (非常簡化)
        if (count >= 5) return 100000;
        if (count === 4 && openEnds > 0) total += 10000;
        else if (count === 3 && openEnds > 0) total += 1000;
        else if (count === 2 && openEnds > 0) total += 100;
        else if (count === 1) total += 10;
    }
    return total;
}

function checkWin(r, c, player) {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const d of dirs) {
        let cnt = 1;
        for (let s = 1; s < 5; s++) {
            const nr = r + d[0] * s, nc = c + d[1] * s;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
            if (board[nr][nc] === player) cnt++; else break;
        }
        for (let s = 1; s < 5; s++) {
            const nr = r - d[0] * s, nc = c - d[1] * s;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
            if (board[nr][nc] === player) cnt++; else break;
        }
        if (cnt >= 5) return true;
    }
    return false;
}

// 初始化
render();

document.getElementById('restart').addEventListener('click', () => {
    board = Array.from({ length: size }, () => Array(size).fill(0));
    gameOver = false;
    currentPlayer = 1;
    document.getElementById('status').textContent = '輪到你 (黑)';
    render();
});

document.getElementById('undo').addEventListener('click', () => {
    if (moveHistory.length === 0) return;
    // 撤回最近一步，若最近是電腦則同時撤回玩家前一步
    let last = moveHistory.pop();
    board[last[0]][last[1]] = 0;
    if (last[2] === 2 && moveHistory.length > 0) { // 若剛撤回的是電腦，撤回玩家的
        const p = moveHistory.pop(); board[p[0]][p[1]] = 0;
    }
    gameOver = false; currentPlayer = 1; document.getElementById('status').textContent = '輪到你 (黑)'; render();
});
