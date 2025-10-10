const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const turnDisplay = document.querySelector('.turn-display');
const messageDiv = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / BOARD_SIZE;
const MARGIN = CELL_SIZE; // 確保棋子顯示完整，最外框線條可見
const BOARD_OFFSET = MARGIN;

// 初始化棋盤狀態
let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0)); // 0=空, 1=黑, 2=白
let currentPlayer = 1; // 1=黑 (玩家), 2=白 (AI)
let gameOver = false;

// 星位位置
const STAR_POSITIONS = [
    [3, 3], [7, 7], [11, 11],
    [3, 11], [11, 3]
];

function initGame() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    messageDiv.textContent = '';
    updateTurnDisplay();
    drawBoard();
}

function drawBoard() {
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製線條
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;

    for (let i = 0; i < BOARD_SIZE; i++) {
        // 水平線
        ctx.beginPath();
        ctx.moveTo(BOARD_OFFSET, BOARD_OFFSET + i * CELL_SIZE);
        ctx.lineTo(BOARD_OFFSET + (BOARD_SIZE - 1) * CELL_SIZE, BOARD_OFFSET + i * CELL_SIZE);
        ctx.stroke();

        // 垂直線
        ctx.beginPath();
        ctx.moveTo(BOARD_OFFSET + i * CELL_SIZE, BOARD_OFFSET);
        ctx.lineTo(BOARD_OFFSET + i * CELL_SIZE, BOARD_OFFSET + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }

    // 繪製星位
    ctx.fillStyle = '#8B4513';
    STAR_POSITIONS.forEach(([row, col]) => {
        ctx.beginPath();
        ctx.arc(BOARD_OFFSET + col * CELL_SIZE, BOARD_OFFSET + row * CELL_SIZE, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // 繪製棋子
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== 0) {
                drawStone(row, col, board[row][col]);
            }
        }
    }
}

function drawStone(row, col, color) {
    const x = BOARD_OFFSET + col * CELL_SIZE;
    const y = BOARD_OFFSET + row * CELL_SIZE;
    const radius = CELL_SIZE / 2 - 2;

    const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);
    if (color === 1) { // 黑子
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(1, '#000');
    } else { // 白子
        gradient.addColorStop(0, '#FFF');
        gradient.addColorStop(1, '#CCC');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function getClickedPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - BOARD_OFFSET;
    const y = event.clientY - rect.top - BOARD_OFFSET;

    if (x < 0 || x > (BOARD_SIZE - 1) * CELL_SIZE || y < 0 || y > (BOARD_SIZE - 1) * CELL_SIZE) {
        return null;
    }

    const col = Math.round(x / CELL_SIZE);
    const row = Math.round(y / CELL_SIZE);

    return { row, col };
}

function makeMove(row, col) {
    if (board[row][col] !== 0 || gameOver) return false;

    board[row][col] = currentPlayer;
    drawStone(row, col, currentPlayer);

    if (checkWin(row, col)) {
        gameOver = true;
        messageDiv.textContent = currentPlayer === 1 ? '黑方獲勝！' : '白方獲勝！';
        return true;
    }

    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnDisplay();

    if (currentPlayer === 2) {
        setTimeout(aiMove, 500); // AI延遲回應
    }

    return true;
}

function checkWin(row, col) {
    const dirs = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of dirs) {
        let count = 1;
        // 正向
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === currentPlayer) {
            count++;
            r += dr; c += dc;
        }
        // 反向
        r = row - dr; c = col - dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === currentPlayer) {
            count++;
            r -= dr; c -= dc;
        }
        if (count >= 5) return true;
    }
    return false;
}

function evaluatePosition(row, col, player) {
    let score = 0;

    const dirs = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of dirs) {
        let count = 0;
        let openEnds = 0;

        // 正向
        let r = row + dr, c = col + dc, blocked = false;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === player) count++;
            else if (board[r][c] === 0) { openEnds++; break; }
            else { blocked = true; break; }
            r += dr; c += dc;
        }
        if (!blocked) openEnds++;

        // 反向
        r = row - dr; c = col - dc; blocked = false;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === player) count++;
            else if (board[r][c] === 0) { openEnds++; break; }
            else { blocked = true; break; }
            r -= dr; c -= dc;
        }
        if (!blocked) openEnds++;

        // 得分計算
        const total = count + 1; // 加上當前位置
        if (total >= 5) score += 10000;
        else if (total === 4 && openEnds >= 1) score += 1000;
        else if (total === 3 && openEnds >= 1) score += 100;
        else if (total === 2 && openEnds >= 2) score += 10;
        else score += total;
    }

    // 防守分數：計算對手的線條潛力
    const opponent = player === 1 ? 2 : 1;
    let defendScore = 0;

    for (const [dr, dc] of dirs) {
        let count = 0;
        let openEnds = 0;

        // 正向
        let r = row + dr, c = col + dc, blocked = false;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === opponent) count++;
            else if (board[r][c] === 0) { openEnds++; break; }
            else { blocked = true; break; }
            r += dr; c += dc;
        }
        if (!blocked) openEnds++;

        // 反向
        r = row - dr; c = col - dc; blocked = false;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === opponent) count++;
            else if (board[r][c] === 0) { openEnds++; break; }
            else { blocked = true; break; }
            r -= dr; c -= dc;
        }
        if (!blocked) openEnds++;

        // 防守得分計算（類似攻擊但權重稍高）
        const total = count + 1;
        if (total >= 5) defendScore += 10000;
        else if (total === 4 && openEnds >= 1) defendScore += 1200; // 防守活四更重要
        else if (total === 3 && openEnds >= 1) defendScore += 120;
        else if (total === 2 && openEnds >= 2) defendScore += 12;
        else defendScore += total;
    }

    return score + defendScore; // 不需要額外權重，防守得分已調整
}

function aiMove() {
    if (gameOver) return;

    let bestScore = -Infinity;
    let bestMove = null;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 0) {
                board[row][col] = 2; // 暫時下棋
                const score = evaluatePosition(row, col, 2);
                board[row][col] = 0; // 移除

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row, col };
                }
            }
        }
    }

    if (bestMove) {
        makeMove(bestMove.row, bestMove.col);
    }
}

function updateTurnDisplay() {
    turnDisplay.textContent = currentPlayer === 1 ? '黑方回合' : '白方回合';
}

canvas.addEventListener('click', (e) => {
    const pos = getClickedPosition(e);
    if (pos && currentPlayer === 1) {
        makeMove(pos.row, pos.col);
    }
});

restartBtn.addEventListener('click', initGame);

initGame();
