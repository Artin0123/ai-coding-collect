// 五子棋 - 人機對戰 (15x15)
// 作者: Cline
// 語言: JavaScript (純前端，無外部函式庫)

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const BOARD_SIZE = 15;               // 15x15 棋盤
const MARGIN = 30;                   // 棋盤與 canvas 邊緣的距離
const CELL_SIZE = (canvas.width - 2 * MARGIN) / (BOARD_SIZE - 1);
const STAR_POINTS = [3, 7, 11];      // 星位索引 (0‑based)

let board = [];                       // 0: 空, 1: 黑子(玩家), 2: 白子(AI)
let gameOver = false;

// 初始化棋盤陣列
function initBoard() {
    board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    gameOver = false;
    document.getElementById('turn').textContent = '黑子 (玩家)';
    draw();
}

// 繪製棋盤、星位與棋子
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawStars();
    drawPieces();
}

// 畫棋盤格線
function drawBoard() {
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;

    for (let i = 0; i < BOARD_SIZE; i++) {
        const pos = MARGIN + i * CELL_SIZE;
        // 水平線
        ctx.beginPath();
        ctx.moveTo(MARGIN, pos);
        ctx.lineTo(canvas.width - MARGIN, pos);
        ctx.stroke();

        // 垂直線
        ctx.beginPath();
        ctx.moveTo(pos, MARGIN);
        ctx.lineTo(pos, canvas.height - MARGIN);
        ctx.stroke();
    }
}

// 畫星位 (9 個)
function drawStars() {
    const radius = 4;
    ctx.fillStyle = '#8B4513';
    for (let i of STAR_POINTS) {
        for (let j of STAR_POINTS) {
            const x = MARGIN + i * CELL_SIZE;
            const y = MARGIN + j * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 畫棋子 (使用漸層模擬反光)
function drawPieces() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const piece = board[i][j];
            if (piece === 0) continue;

            const x = MARGIN + j * CELL_SIZE;
            const y = MARGIN + i * CELL_SIZE;
            const radius = CELL_SIZE * 0.4;

            const gradient = ctx.createRadialGradient(
                x - radius * 0.3,
                y - radius * 0.3,
                radius * 0.1,
                x,
                y,
                radius
            );

            if (piece === 1) { // 黑子
                gradient.addColorStop(0, '#555');
                gradient.addColorStop(1, '#000');
            } else { // 白子
                gradient.addColorStop(0, '#FFF');
                gradient.addColorStop(1, '#DDD');
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 判斷是否有五子連線
function checkWin(row, col, player) {
    const dirs = [
        { dr: 0, dc: 1 },   // 水平
        { dr: 1, dc: 0 },   // 垂直
        { dr: 1, dc: 1 },   // 主對角線
        { dr: 1, dc: -1 }   // 副對角線
    ];

    for (let { dr, dc } of dirs) {
        let count = 1;

        // 正向搜尋
        for (let step = 1; step < 5; step++) {
            const r = row + dr * step;
            const c = col + dc * step;
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
            if (board[r][c] === player) count++;
            else break;
        }

        // 反向搜尋
        for (let step = 1; step < 5; step++) {
            const r = row - dr * step;
            const c = col - dc * step;
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
            if (board[r][c] === player) count++;
            else break;
        }

        if (count >= 5) return true;
    }
    return false;
}

// AI 行動：簡易攻防策略
function aiMove() {
    if (gameOver) return;

    // 1. 嘗試直接贏棋
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) continue;
            board[i][j] = 2; // 假設下白子
            if (checkWin(i, j, 2)) {
                finalizeMove(i, j, 2);
                return;
            }
            board[i][j] = 0; // 還原
        }
    }

    // 2. 阻止玩家立即贏棋
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) continue;
            board[i][j] = 1; // 假設玩家下黑子
            if (checkWin(i, j, 1)) {
                board[i][j] = 2; // AI 阻擋
                finalizeMove(i, j, 2);
                return;
            }
            board[i][j] = 0;
        }
    }

    // 3. 隨機選擇一個空位
    const empty = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === 0) empty.push([i, j]);
        }
    }
    if (empty.length === 0) return; // 平局

    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    finalizeMove(r, c, 2);
}

// 完成一步棋的共用流程
function finalizeMove(row, col, player) {
    board[row][col] = player;
    draw();

    if (checkWin(row, col, player)) {
        gameOver = true;
        const winner = player === 1 ? '黑子 (玩家)' : '白子 (AI)';
        document.getElementById('status').textContent = `${winner} 獲勝！`;
        return;
    }

    // 切換回玩家回合
    if (player === 2) {
        document.getElementById('turn').textContent = '黑子 (玩家)';
    }
}

// 轉換滑鼠座標為棋盤交叉點
function getBoardPosition(x, y) {
    const rect = canvas.getBoundingClientRect();
    const cx = x - rect.left - MARGIN;
    const cy = y - rect.top - MARGIN;
    const col = Math.round(cx / CELL_SIZE);
    const row = Math.round(cy / CELL_SIZE);
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return null;
    return { row, col };
}

// 玩家點擊事件
canvas.addEventListener('click', (e) => {
    if (gameOver) return;
    const pos = getBoardPosition(e.clientX, e.clientY);
    if (!pos) return;
    const { row, col } = pos;
    if (board[row][col] !== 0) return; // 已有棋子

    // 玩家下黑子
    finalizeMove(row, col, 1);
    document.getElementById('turn').textContent = '白子 (AI)';

    // AI 延遲回應，讓玩家有感覺
    setTimeout(aiMove, 300);
});

// 重新開始按鈕
document.getElementById('restart').addEventListener('click', () => {
    initBoard();
});

// 初始化
initBoard();
