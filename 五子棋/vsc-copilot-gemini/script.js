const canvas = document.getElementById('chessboard');
const context = canvas.getContext('2d');
const restartButton = document.getElementById('restart');
const turnSpan = document.getElementById('turn');

const GRID_SIZE = 15;
const CELL_SIZE = 30;
const BOARD_SIZE = GRID_SIZE * CELL_SIZE;

let board = []; // 0: empty, 1: player (black), 2: AI (white)
let currentPlayer = 1; // 1 for player, 2 for AI
let gameOver = false;

// Initialize the board
function initBoard() {
    for (let i = 0; i < GRID_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            board[i][j] = 0;
        }
    }
}

// Draw the chessboard grid
function drawBoard() {
    context.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    context.strokeStyle = "#000";
    for (let i = 0; i < GRID_SIZE; i++) {
        // Vertical lines
        context.beginPath();
        context.moveTo(i * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2);
        context.lineTo(i * CELL_SIZE + CELL_SIZE / 2, BOARD_SIZE - CELL_SIZE / 2);
        context.stroke();
        // Horizontal lines
        context.beginPath();
        context.moveTo(CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
        context.lineTo(BOARD_SIZE - CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
        context.stroke();
    }
}

// Draw a piece on the board
function drawPiece(x, y, player) {
    context.beginPath();
    context.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
    context.fillStyle = (player === 1) ? 'black' : 'white';
    context.fill();
}

// Check for a win
function checkWin(x, y, player) {
    // Check horizontal
    let count = 1;
    for (let i = 1; i < 5; i++) { if (board[x + i] && board[x + i][y] === player) count++; else break; }
    for (let i = 1; i < 5; i++) { if (board[x - i] && board[x - i][y] === player) count++; else break; }
    if (count >= 5) return true;

    // Check vertical
    count = 1;
    for (let i = 1; i < 5; i++) { if (board[x] && board[x][y + i] === player) count++; else break; }
    for (let i = 1; i < 5; i++) { if (board[x] && board[x][y - i] === player) count++; else break; }
    if (count >= 5) return true;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    for (let i = 1; i < 5; i++) { if (board[x + i] && board[x + i][y + i] === player) count++; else break; }
    for (let i = 1; i < 5; i++) { if (board[x - i] && board[x - i][y - i] === player) count++; else break; }
    if (count >= 5) return true;

    // Check anti-diagonal (top-right to bottom-left)
    count = 1;
    for (let i = 1; i < 5; i++) { if (board[x + i] && board[x + i][y - i] === player) count++; else break; }
    for (let i = 1; i < 5; i++) { if (board[x - i] && board[x - i][y + i] === player) count++; else break; }
    if (count >= 5) return true;

    return false;
}

// Handle player's move
canvas.addEventListener('click', (e) => {
    if (gameOver || currentPlayer !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && board[x][y] === 0) {
        board[x][y] = 1;
        drawPiece(x, y, 1);
        if (checkWin(x, y, 1)) {
            gameOver = true;
            setTimeout(() => alert('你贏了!'), 100);
            turnSpan.textContent = '遊戲結束';
            return;
        }
        currentPlayer = 2;
        turnSpan.textContent = '電腦';
        setTimeout(aiMove, 500);
    }
});

// Simple AI move
function aiMove() {
    if (gameOver) return;

    let bestScore = -1;
    let move = { x: -1, y: -1 };

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === 0) {
                let score = calculateScore(i, j);
                if (score > bestScore) {
                    bestScore = score;
                    move = { x: i, y: j };
                }
            }
        }
    }

    if (move.x !== -1) {
        board[move.x][move.y] = 2;
        drawPiece(move.x, move.y, 2);
        if (checkWin(move.x, move.y, 2)) {
            gameOver = true;
            setTimeout(() => alert('電腦贏了!'), 100);
            turnSpan.textContent = '遊戲結束';
            return;
        }
        currentPlayer = 1;
        turnSpan.textContent = '你';
    }
}

// Calculate score for a potential move (simple version)
function calculateScore(x, y) {
    let score = 0;
    // Add some randomness
    score += Math.random();

    // Check score for AI
    score += getLineScore(x, y, 2);
    // Check score for blocking player
    score += getLineScore(x, y, 1) * 0.8; // Defensive play is slightly less prioritized

    return score;
}

function getLineScore(x, y, player) {
    let totalScore = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; // horizontal, vertical, diagonal, anti-diagonal

    directions.forEach(dir => {
        let count = 1;
        let blocked = 0;

        // Check in one direction
        for (let i = 1; i < 5; i++) {
            const newX = x + i * dir[0];
            const newY = y + i * dir[1];
            if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                if (board[newX][newY] === player) {
                    count++;
                } else if (board[newX][newY] !== 0) {
                    blocked++;
                    break;
                } else {
                    break;
                }
            } else {
                blocked++;
                break;
            }
        }

        // Check in the opposite direction
        for (let i = 1; i < 5; i++) {
            const newX = x - i * dir[0];
            const newY = y - i * dir[1];
            if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                if (board[newX][newY] === player) {
                    count++;
                } else if (board[newX][newY] !== 0) {
                    blocked++;
                    break;
                } else {
                    break;
                }
            } else {
                blocked++;
                break;
            }
        }

        // Score based on count and blocked status
        if (count >= 5) totalScore += 100000;
        else if (count === 4 && blocked === 0) totalScore += 10000;
        else if (count === 4 && blocked === 1) totalScore += 1000;
        else if (count === 3 && blocked === 0) totalScore += 1000;
        else if (count === 3 && blocked === 1) totalScore += 100;
        else if (count === 2 && blocked === 0) totalScore += 100;
        else if (count === 2 && blocked === 1) totalScore += 10;
        else if (count === 1 && blocked === 0) totalScore += 10;
        else if (count === 1 && blocked === 1) totalScore += 1;

    });

    return totalScore;
}


// Restart the game
restartButton.addEventListener('click', () => {
    initGame();
});

// Initialize the game
function initGame() {
    initBoard();
    drawBoard();
    currentPlayer = 1;
    gameOver = false;
    turnSpan.textContent = '你';
}

// Start the game
initGame();
