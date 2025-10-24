const canvas = document.getElementById('gobanaru-board');
const ctx = canvas.getContext('2d');
const currentTurnEl = document.getElementById('current-turn');
const gameMessageEl = document.getElementById('game-message');
const resetBtn = document.getElementById('reset-btn');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / BOARD_SIZE;
const PIECE_RADIUS = CELL_SIZE / 2 - 2;

let board = [];
let currentPlayer = 'black'; // 'black' or 'white'
let gameOver = false;

// 星位位置
const STAR_POSITIONS = [
    [3, 3], [11, 3], [3, 11], [11, 11], [7, 7]
];

function initBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = null;
        }
    }
    currentPlayer = 'black';
    gameOver = false;
    currentTurnEl.textContent = '黑方回合';
    gameMessageEl.textContent = '';
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製線條
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;

    for (let i = 0; i < BOARD_SIZE; i++) {
        const pos = i * CELL_SIZE + CELL_SIZE / 2;

        // 垂直線
        ctx.beginPath();
        ctx.moveTo(pos, CELL_SIZE / 2);
        ctx.lineTo(pos, canvas.height - CELL_SIZE / 2);
        ctx.stroke();

        // 水平線
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE / 2, pos);
        ctx.lineTo(canvas.width - CELL_SIZE / 2, pos);
        ctx.stroke();
    }

    // 繪製星位
    ctx.fillStyle = '#8B4513';
    STAR_POSITIONS.forEach(([x, y]) => {
        const cx = x * CELL_SIZE + CELL_SIZE / 2;
        const cy = y * CELL_SIZE + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPiece(x, y, color) {
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;

    const gradient = ctx.createRadialGradient(cx - PIECE_RADIUS / 3, cy - PIECE_RADIUS / 3, 0, cx, cy, PIECE_RADIUS);
    if (color === 'black') {
        gradient.addColorStop(0, '#2C2C2C');
        gradient.addColorStop(1, '#000000');
    } else {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#DDDDDD');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, PIECE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // 增加邊框
    ctx.strokeStyle = color === 'black' ? '#000000' : '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function isValidMove(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[x][y] === null;
}

function checkWin(x, y, color) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1] // 右、下、右下、左下
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        count += countInDirection(x, y, color, dx, dy);
        count += countInDirection(x, y, color, -dx, -dy);
        if (count >= 5) return true;
    }
    return false;
}

function countInDirection(x, y, color, dx, dy) {
    let count = 0;
    let cx = x + dx;
    let cy = y + dy;

    while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && board[cx][cy] === color) {
        count++;
        cx += dx;
        cy += dy;
    }

    return count;
}

function makeMove(x, y, color) {
    if (!isValidMove(x, y) || gameOver) return false;

    board[x][y] = color;
    drawPiece(x, y, color);

    if (checkWin(x, y, color)) {
        gameOver = true;
        gameMessageEl.textContent = color === 'black' ? '黑方勝利！' : '白方勝利！';
        return true;
    }

    return true;
}

function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: Math.round(((event.clientX - rect.left) * scaleX - CELL_SIZE / 2) / CELL_SIZE),
        y: Math.round(((event.clientY - rect.top) * scaleY - CELL_SIZE / 2) / CELL_SIZE)
    };
}

// AI 邏輯
function aiMove() {
    if (gameOver) return;

    // 檢查防守移動（阻止玩家連五）
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === null) {
                board[x][y] = 'white'; // 暫時放置
                if (checkWin(x, y, 'white')) {
                    board[x][y] = 'white';
                    drawPiece(x, y, 'white');
                    currentPlayer = 'black';
                    currentTurnEl.textContent = '黑方回合';
                    return;
                }
                board[x][y] = null; // 撤回
            }
        }
    }

    // 檢查防守移動（阻止玩家連線）
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === null) {
                board[x][y] = 'black'; // 模擬玩家下一步
                if (checkWin(x, y, 'black')) {
                    board[x][y] = 'white';
                    drawPiece(x, y, 'white');
                    currentPlayer = 'black';
                    currentTurnEl.textContent = '黑方回合';
                    return;
                }
                board[x][y] = null;
            }
        }
    }

    // 隨機選擇有效位置（簡單AI）
    const emptyCells = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === null) {
                emptyCells.push([x, y]);
            }
        }
    }

    if (emptyCells.length > 0) {
        const [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        makeMove(x, y, 'white');
        currentPlayer = 'black';
        currentTurnEl.textContent = '黑方回合';
    }
}

function handleClick(event) {
    const { x, y } = getCanvasPosition(event);

    if (makeMove(x, y, 'black')) {
        currentPlayer = 'white';
        currentTurnEl.textContent = '白方回合';

        // AI 移動
        setTimeout(aiMove, 500);
    }
}

resetBtn.addEventListener('click', () => {
    initBoard();
    drawBoard();
});

canvas.addEventListener('click', handleClick);

// 初始化
initBoard();
drawBoard();
