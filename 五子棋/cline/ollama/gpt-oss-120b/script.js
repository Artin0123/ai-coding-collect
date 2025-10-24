// 五子棋 (15x15) 人機對戰
const BOARD_SIZE = 15;               // 15x15 棋盤
const CANVAS_SIZE = 600;             // canvas 寬高 (px)
const CELL_SIZE = CANVAS_SIZE / (BOARD_SIZE - 1); // 交叉點間距

const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');

let board = [];          // 0: 空, 1: 黑子(玩家), 2: 白子(AI)
let currentPlayer = 1;   // 1: 黑子先手, 2: 白子
let gameOver = false;

// 初始化棋盤陣列
function initBoard() {
    board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    document.getElementById('status').textContent = '輪到: 黑子 (玩家)';
    drawBoard();
}

// 繪製棋盤、星位與棋子
function drawBoard() {
    // 清空
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 背景已由 CSS 設定，這裡只畫線與星位
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;

    // 畫橫線與直線
    for (let i = 0; i < BOARD_SIZE; i++) {
        const pos = i * CELL_SIZE;
        // 橫線
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_SIZE, pos);
        ctx.stroke();
        // 直線
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_SIZE);
        ctx.stroke();
    }

    // 畫星位 (5 個)
    const starPoints = [
        [3, 3],
        [3, 11],
        [7, 7],
        [11, 3],
        [11, 11]
    ];
    ctx.fillStyle = '#8B4513';
    starPoints.forEach(([x, y]) => {
        const cx = x * CELL_SIZE;
        const cy = y * CELL_SIZE;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 畫已落子的棋子
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== 0) {
                drawPiece(x, y, board[y][x] === 1);
            }
        }
    }
}

// 繪製單顆棋子，isBlack 為 true 時畫黑子，否則白子
function drawPiece(x, y, isBlack) {
    const cx = x * CELL_SIZE;
    const cy = y * CELL_SIZE;
    const radius = CELL_SIZE * 0.4;

    const gradient = ctx.createRadialGradient(
        cx - radius / 3,
        cy - radius / 3,
        radius / 5,
        cx,
        cy,
        radius
    );
    if (isBlack) {
        gradient.addColorStop(0, '#555555');
        gradient.addColorStop(1, '#000000');
    } else {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#AAAAAA');
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
}

// 取得滑鼠點擊的棋盤座標 (若點擊在交叉點附近則回傳座標，否則回傳 null)
function getBoardPos(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ix = Math.round(x / CELL_SIZE);
    const iy = Math.round(y / CELL_SIZE);

    // 確保點擊在棋盤範圍內
    if (ix < 0 || ix >= BOARD_SIZE || iy < 0 || iy >= BOARD_SIZE) {
        return null;
    }
    // 檢查點擊是否足夠接近交叉點 (容差 0.4 * CELL_SIZE)
    if (Math.abs(x - ix * CELL_SIZE) > CELL_SIZE * 0.4 ||
        Math.abs(y - iy * CELL_SIZE) > CELL_SIZE * 0.4) {
        return null;
    }
    return { x: ix, y: iy };
}

// 判斷是否有玩家在 (x, y) 位置獲勝
function checkWin(x, y, player) {
    const dirs = [
        { dx: 1, dy: 0 },   // 水平
        { dx: 0, dy: 1 },   // 垂直
        { dx: 1, dy: 1 },   // 主對角線
        { dx: 1, dy: -1 }   // 副對角線
    ];
    for (const { dx, dy } of dirs) {
        let count = 1;
        // 正向搜尋
        for (let step = 1; step < 5; step++) {
            const nx = x + dx * step;
            const ny = y + dy * step;
            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
            if (board[ny][nx] === player) count++;
            else break;
        }
        // 反向搜尋
        for (let step = 1; step < 5; step++) {
            const nx = x - dx * step;
            const ny = y - dy * step;
            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
            if (board[ny][nx] === player) count++;
            else break;
        }
        if (count >= 5) return true;
    }
    return false;
}

// AI 簡易策略：
// 1. 若有必勝步驟直接下
// 2. 若對手有必勝步驟則阻擋
// 3. 否則隨機落子
function aiMove() {
    if (gameOver) return;

    // 1. 嘗試找出能讓 AI 獲勝的點
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== 0) continue;
            board[y][x] = 2; // 假設下子
            if (checkWin(x, y, 2)) {
                finalizeMove(x, y, 2);
                return;
            }
            board[y][x] = 0; // 還原
        }
    }

    // 2. 阻擋玩家必勝
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== 0) continue;
            board[y][x] = 1; // 假設玩家下子
            if (checkWin(x, y, 1)) {
                board[y][x] = 2; // 真正下白子阻擋
                finalizeMove(x, y, 2);
                return;
            }
            board[y][x] = 0; // 還原
        }
    }

    // 3. 隨機落子
    const emptyPoints = [];
    for (let yy = 0; yy < BOARD_SIZE; yy++) {
        for (let xx = 0; xx < BOARD_SIZE; xx++) {
            if (board[yy][xx] === 0) emptyPoints.push({ x: xx, y: yy });
        }
    }
    if (emptyPoints.length === 0) return;
    const idx = Math.floor(Math.random() * emptyPoints.length);
    const pt = emptyPoints[idx];
    finalizeMove(pt.x, pt.y, 2);
}

// 完成落子後的處理
function finalizeMove(x, y, player) {
    board[y][x] = player;
    drawBoard();
    if (checkWin(x, y, player)) {
        gameOver = true;
        const winner = player === 1 ? '黑子 (玩家)' : '白子 (AI)';
        document.getElementById('status').textContent = winner + ' 獲勝！';
        return;
    }
    // 換手
    currentPlayer = player === 1 ? 2 : 1;
    document.getElementById('status').textContent = '輪到: ' + (currentPlayer === 1 ? '黑子 (玩家)' : '白子 (AI)');
    if (currentPlayer === 2) {
        // AI 思考稍作延遲
        setTimeout(aiMove, 200);
    }
}

// 監聽玩家點擊
canvas.addEventListener('click', (e) => {
    if (gameOver || currentPlayer !== 1) return;
    const pos = getBoardPos(e);
    if (!pos) return;
    const { x, y } = pos;
    if (board[y][x] !== 0) return;
    finalizeMove(x, y, 1);
});

// 重新開始按鈕
document.getElementById('restartBtn').addEventListener('click', initBoard);

// 初始化
initBoard();
