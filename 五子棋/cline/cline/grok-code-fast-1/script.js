const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('reset-btn');
const currentTurnDiv = document.getElementById('current-turn');
const messageDiv = document.getElementById('message');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / BOARD_SIZE;
let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
let currentPlayer = 1; // 1: 黑，2: 白
let gameOver = false;

// 星位
const stars = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];

// 繪製棋盤
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 繪製線條
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 橫線
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE / 2, CELL_SIZE / 2 + i * CELL_SIZE);
        ctx.lineTo(canvas.width - CELL_SIZE / 2, CELL_SIZE / 2 + i * CELL_SIZE);
        ctx.stroke();
        // 豎線
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE / 2 + i * CELL_SIZE, CELL_SIZE / 2);
        ctx.lineTo(CELL_SIZE / 2 + i * CELL_SIZE, canvas.height - CELL_SIZE / 2);
        ctx.stroke();
    }
    // 繪製星位
    ctx.fillStyle = '#8B4513';
    stars.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(CELL_SIZE / 2 + x * CELL_SIZE, CELL_SIZE / 2 + y * CELL_SIZE, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// 繪製棋子
function drawPiece(x, y, color) {
    const centerX = CELL_SIZE / 2 + x * CELL_SIZE;
    const centerY = CELL_SIZE / 2 + y * CELL_SIZE;
    const radius = CELL_SIZE / 2 - 2;
    const gradient = ctx.createRadialGradient(centerX - radius / 3, centerY - radius / 3, 0, centerX, centerY, radius);
    if (color === 1) {
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(1, '#666666');
    } else {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#CCCCCC');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
}

// 更新顯示
function updateDisplay() {
    currentTurnDiv.textContent = `當前回合：${currentPlayer === 1 ? '黑方' : '白方'}`;
}

// 檢查勝利
function checkWin(x, y) {
    const directions = [
        [1, 0], [0, 1], [1, 1], [1, -1]
    ];
    for (const [dx, dy] of directions) {
        let count = 1;
        for (let i = 1; i < 5; i++) {
            const nx = x + i * dx, ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === currentPlayer) {
                count++;
            } else break;
        }
        for (let i = 1; i < 5; i++) {
            const nx = x - i * dx, ny = y - i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === currentPlayer) {
                count++;
            } else break;
        }
        if (count >= 5) return true;
    }
    return false;
}

// AI策略：簡單優先阻塞玩家五連，否則隨機
function aiMove() {
    if (gameOver) return;

    // 檢查玩家可能連五的位置
    const opponent = currentPlayer === 1 ? 2 : 1;
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === 0) {
                board[x][y] = opponent;
                if (checkWin(x, y)) {
                    board[x][y] = currentPlayer;
                    drawPiece(x, y, currentPlayer);
                    if (checkWin(x, y)) {
                        messageDiv.textContent = `玩家贏了！`;
                        gameOver = true;
                    } else {
                        currentPlayer = opponent;
                        updateDisplay();
                    }
                    return;
                }
                board[x][y] = 0;
            }
        }
    }
    // 如果沒有阻塞，嘗試自己的連線
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === 0) {
                board[x][y] = currentPlayer;
                if (checkWin(x, y)) {
                    drawPiece(x, y, currentPlayer);
                    messageDiv.textContent = `AI贏了！`;
                    gameOver = true;
                    return;
                }
                board[x][y] = 0;
            }
        }
    }
    // 隨機下棋
    const emptyCells = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === 0) emptyCells.push([x, y]);
        }
    }
    if (emptyCells.length > 0) {
        const [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[x][y] = currentPlayer;
        drawPiece(x, y, currentPlayer);
        currentPlayer = opponent;
        updateDisplay();
    }
}

// 處理點擊
canvas.addEventListener('click', (e) => {
    if (gameOver || currentPlayer !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - CELL_SIZE / 2) / CELL_SIZE);
    const y = Math.round((e.clientY - rect.top - CELL_SIZE / 2) / CELL_SIZE);
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[x][y] === 0) {
        board[x][y] = currentPlayer;
        drawPiece(x, y, currentPlayer);
        if (checkWin(x, y)) {
            messageDiv.textContent = `玩家贏了！`;
            gameOver = true;
        } else {
            currentPlayer = 2;
            updateDisplay();
            setTimeout(aiMove, 500);
        }
    }
});

// 重新開始
resetBtn.addEventListener('click', () => {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    messageDiv.textContent = '';
    drawBoard();
    updateDisplay();
});

// 初始化
drawBoard();
updateDisplay();
