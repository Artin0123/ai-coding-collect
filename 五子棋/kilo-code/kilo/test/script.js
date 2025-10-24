const canvas = document.getElementById('chessboard');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restart-btn');
const turnIndicator = document.getElementById('turn-indicator');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / (BOARD_SIZE + 1);
const OFFSET = CELL_SIZE;

let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0)); // 0: empty, 1: black, 2: white
let currentPlayer = 1; // 1: black (human), 2: white (AI)
let gameOver = false;

// Star positions
const stars = [
    [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
];

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

    // Draw stars
    ctx.fillStyle = '#8B4513';
    stars.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(OFFSET + x * CELL_SIZE, OFFSET + y * CELL_SIZE, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw pieces
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

    // Gradient for 3D effect
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

    // Highlight
    ctx.fillStyle = player === 1 ? '#333' : '#FFF';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, 2 * Math.PI);
    ctx.fill();
}

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
}

function getGridPos(mouseX, mouseY) {
    const gridX = Math.round((mouseX - OFFSET) / CELL_SIZE);
    const gridY = Math.round((mouseY - OFFSET) / CELL_SIZE);
    return { gridX, gridY };
}

function isValidMove(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[x][y] === 0;
}

function makeMove(x, y, player) {
    if (!isValidMove(x, y) || gameOver) return false;
    board[x][y] = player;
    return true;
}

function checkWin(x, y, player) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
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

function aiMove() {
    if (gameOver) return;

    // Simple AI: find the best move
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === 0) {
                board[i][j] = 2; // Temporarily place white piece
                const score = evaluateBoard();
                board[i][j] = 0; // Remove temporary piece

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { x: i, y: j };
                }
            }
        }
    }

    if (bestMove) {
        makeMove(bestMove.x, bestMove.y, 2);
        drawBoard();
        if (checkWin(bestMove.x, bestMove.y, 2)) {
            gameOver = true;
            alert('白方獲勝！');
        } else {
            currentPlayer = 1;
            updateTurnIndicator();
        }
    }
}

function evaluateBoard() {
    let score = 0;
    // Simple evaluation: count potential lines
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) {
                score += evaluatePosition(i, j, board[i][j]);
            }
        }
    }
    return score;
}

function evaluatePosition(x, y, player) {
    let score = 0;
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        let openEnds = 0;

        // Check positive direction
        let i = x + dx, j = y + dy;
        let blocked = false;
        while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE) {
            if (board[i][j] === player) {
                count++;
            } else if (board[i][j] === 0) {
                openEnds++;
                break;
            } else {
                blocked = true;
                break;
            }
            i += dx;
            j += dy;
        }

        // Check negative direction
        i = x - dx, j = y - dy;
        while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE) {
            if (board[i][j] === player) {
                count++;
            } else if (board[i][j] === 0) {
                openEnds++;
                break;
            } else {
                blocked = true;
                break;
            }
            i -= dx;
            j -= dy;
        }

        if (!blocked) {
            if (count >= 5) score += 10000;
            else if (count === 4 && openEnds >= 1) score += 1000;
            else if (count === 3 && openEnds >= 1) score += 100;
            else if (count === 2 && openEnds >= 1) score += 10;
        }
    }

    return score;
}

function updateTurnIndicator() {
    turnIndicator.textContent = `當前回合：${currentPlayer === 1 ? '黑方' : '白方'}`;
}

function resetGame() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    drawBoard();
    updateTurnIndicator();
}

canvas.addEventListener('click', (event) => {
    if (currentPlayer !== 1 || gameOver) return;

    const { x, y } = getMousePos(event);
    const { gridX, gridY } = getGridPos(x, y);

    if (makeMove(gridX, gridY, 1)) {
        drawBoard();
        if (checkWin(gridX, gridY, 1)) {
            gameOver = true;
            alert('黑方獲勝！');
        } else {
            currentPlayer = 2;
            updateTurnIndicator();
            setTimeout(aiMove, 500); // AI moves after a short delay
        }
    }
});

restartBtn.addEventListener('click', resetGame);

// Initialize
drawBoard();
updateTurnIndicator();