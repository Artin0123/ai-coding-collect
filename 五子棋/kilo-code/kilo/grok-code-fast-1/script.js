const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('reset-btn');
const currentTurnDisplay = document.getElementById('current-turn');
const messageDisplay = document.getElementById('message');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / (BOARD_SIZE + 1);
const OFFSET = CELL_SIZE;

let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0)); // 0: empty, 1: black, 2: white
let currentPlayer = 1; // 1: black (human), 2: white (AI)
let gameOver = false;

// Draw the board
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    for (let i = 0; i < BOARD_SIZE; i++) {
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(OFFSET, OFFSET + i * CELL_SIZE);
        ctx.lineTo(OFFSET + (BOARD_SIZE - 1) * CELL_SIZE, OFFSET + i * CELL_SIZE);
        ctx.stroke();

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(OFFSET + i * CELL_SIZE, OFFSET);
        ctx.lineTo(OFFSET + i * CELL_SIZE, OFFSET + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }

    // Draw star points
    const starPoints = [
        [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
    ];
    ctx.fillStyle = '#8B4513';
    starPoints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(OFFSET + x * CELL_SIZE, OFFSET + y * CELL_SIZE, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Draw pieces
function drawPieces() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) {
                drawPiece(i, j, board[i][j]);
            }
        }
    }
}

function drawPiece(x, y, player) {
    const centerX = OFFSET + x * CELL_SIZE;
    const centerY = OFFSET + y * CELL_SIZE;
    const radius = CELL_SIZE * 0.4;

    // Create gradient for 3D effect
    const gradient = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.3, 0, centerX, centerY, radius);
    if (player === 1) { // Black
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#000');
    } else { // White
        gradient.addColorStop(0, '#FFF');
        gradient.addColorStop(1, '#CCC');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Add highlight
    ctx.fillStyle = player === 1 ? '#333' : '#FFF';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, 2 * Math.PI);
    ctx.fill();
}

// Check for win
function checkWin(x, y, player) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1] // horizontal, vertical, diagonal
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        // Check positive direction
        let i = x + dx, j = y + dy;
        while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE && board[i][j] === player) {
            count++;
            i += dx;
            j += dy;
        }
        // Check negative direction
        i = x - dx, j = y - dy;
        while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE && board[i][j] === player) {
            count++;
            i -= dx;
            j -= dy;
        }
        if (count >= 5) return true;
    }
    return false;
}

// AI move
function aiMove() {
    if (gameOver) return;

    // Simple AI: find the best move
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === 0) {
                // Simulate move
                board[i][j] = 2;
                const score = evaluatePosition(i, j, 2);
                board[i][j] = 0;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = [i, j];
                }
            }
        }
    }

    if (bestMove) {
        const [x, y] = bestMove;
        board[x][y] = 2;
        drawPiece(x, y, 2);

        if (checkWin(x, y, 2)) {
            gameOver = true;
            messageDisplay.textContent = '白方獲勝！';
        } else {
            currentPlayer = 1;
            currentTurnDisplay.textContent = '黑方';
        }
    }
}

function evaluatePosition(x, y, player) {
    let score = 0;

    // Check all directions
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
        let count = 0;
        let blocked = 0;

        // Check positive direction
        let i = x + dx, j = y + dy;
        while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE) {
            if (board[i][j] === player) count++;
            else if (board[i][j] !== 0) { blocked++; break; }
            else break;
            i += dx;
            j += dy;
        }

        // Check negative direction
        i = x - dx, j = y - dy;
        while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE) {
            if (board[i][j] === player) count++;
            else if (board[i][j] !== 0) { blocked++; break; }
            else break;
            i -= dx;
            j -= dy;
        }

        // Score based on consecutive pieces
        if (count >= 4) score += 1000;
        else if (count === 3 && blocked < 2) score += 100;
        else if (count === 2 && blocked < 2) score += 10;
        else if (count === 1 && blocked < 2) score += 1;
    }

    return score;
}

// Handle click
canvas.addEventListener('click', (e) => {
    if (gameOver || currentPlayer !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - OFFSET) / CELL_SIZE);
    const y = Math.round((e.clientY - rect.top - OFFSET) / CELL_SIZE);

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[x][y] === 0) {
        board[x][y] = 1;
        drawPiece(x, y, 1);

        if (checkWin(x, y, 1)) {
            gameOver = true;
            messageDisplay.textContent = '黑方獲勝！';
        } else {
            currentPlayer = 2;
            currentTurnDisplay.textContent = '白方';
            setTimeout(aiMove, 500); // Delay AI move
        }
    }
});

// Reset game
resetBtn.addEventListener('click', () => {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    currentTurnDisplay.textContent = '黑方';
    messageDisplay.textContent = '';
    drawBoard();
});

// Initialize
drawBoard();