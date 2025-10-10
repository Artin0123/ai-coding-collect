const canvas = document.getElementById('gomoku-board');
const ctx = canvas.getContext('2d');
const turnDisplay = document.getElementById('turn-display');
const restartButton = document.getElementById('restart-button');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / BOARD_SIZE;
const STAR_POINTS = [
    { row: 3, col: 3 },
    { row: 3, col: 11 },
    { row: 11, col: 3 },
    { row: 11, col: 11 },
    { row: 7, col: 7 } // Center star point
];

let board = [];
let currentPlayer = 1; // 1 for Black, 2 for White (AI)
let gameOver = false;

function initBoard() {
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    turnDisplay.textContent = '當前回合: 黑方';
    drawBoard();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw board lines
    ctx.strokeStyle = '#8B4513'; // 深褐色
    ctx.lineWidth = 2;
    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2);
        ctx.lineTo(i * CELL_SIZE + CELL_SIZE / 2, canvas.height - CELL_SIZE / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
        ctx.lineTo(canvas.width - CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
        ctx.stroke();
    }

    // Draw star points
    ctx.fillStyle = '#8B4513';
    STAR_POINTS.forEach(point => {
        const x = point.col * CELL_SIZE + CELL_SIZE / 2;
        const y = point.row * CELL_SIZE + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw pieces
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) {
                drawPiece(r, c, board[r][c]);
            }
        }
    }
}

function drawPiece(row, col, player) {
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2; // Slightly smaller than half cell size

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 2, x, y, radius);

    if (player === 1) { // Black piece
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(1, '#000000');
    } else { // White piece
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#CCCCCC');
    }

    ctx.fillStyle = gradient;
    ctx.fill();

    // Add a subtle reflection effect
    ctx.beginPath();
    ctx.arc(x - radius / 3, y - radius / 3, radius / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
}

function handleClick(event) {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const col = Math.floor(mouseX / CELL_SIZE);
    const row = Math.floor(mouseY / CELL_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === 0) {
        board[row][col] = currentPlayer;
        drawBoard();
        if (checkWin(row, col, currentPlayer)) {
            alert((currentPlayer === 1 ? '黑方' : '白方') + '獲勝！');
            gameOver = true;
            return;
        }
        currentPlayer = 3 - currentPlayer; // Toggle player (1 -> 2, 2 -> 1)
        turnDisplay.textContent = '當前回合: ' + (currentPlayer === 1 ? '黑方' : '白方');

        if (currentPlayer === 2 && !gameOver) {
            setTimeout(aiMove, 500); // AI makes a move after a short delay
        }
    }
}

function checkWin(row, col, player) {
    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \\
        { dr: 1, dc: -1 }  // Diagonal //
    ];

    for (const { dr, dc } of directions) {
        let count = 1;
        // Check in one direction
        for (let i = 1; i < 5; i++) {
            const r = row + i * dr;
            const c = col + i * dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
                count++;
            } else {
                break;
            }
        }
        // Check in the opposite direction
        for (let i = 1; i < 5; i++) {
            const r = row - i * dr;
            const c = col - i * dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
                count++;
            } else {
                break;
            }
        }
        if (count >= 5) return true;
    }
    return false;
}

function aiMove() {
    // Simple AI: find a random empty spot for now
    // TODO: Implement a proper AI strategy
    let bestMove = { row: -1, col: -1 };
    let maxScore = -1;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                // Evaluate this spot for AI (player 2)
                let score = evaluatePosition(r, c, 2); // Evaluate for AI
                // Also consider blocking player (player 1)
                score += evaluatePosition(r, c, 1) * 0.8; // Give blocking a slightly lower priority

                if (score > maxScore) {
                    maxScore = score;
                    bestMove = { row: r, col: c };
                }
            }
        }
    }

    if (bestMove.row !== -1) {
        board[bestMove.row][bestMove.col] = currentPlayer;
        drawBoard();
        if (checkWin(bestMove.row, bestMove.col, currentPlayer)) {
            alert('白方獲勝！');
            gameOver = true;
            return;
        }
        currentPlayer = 3 - currentPlayer;
        turnDisplay.textContent = '當前回合: ' + (currentPlayer === 1 ? '黑方' : '白方');
    } else {
        // No moves left, it's a draw (shouldn't happen in Gomoku usually)
        alert('平局！');
        gameOver = true;
    }
}

// A simple evaluation function for a given position and player
// This is a very basic heuristic and needs significant improvement for a strong AI
function evaluatePosition(row, col, player) {
    let score = 0;
    const opponent = (player === 1) ? 2 : 1;

    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \\
        { dr: 1, dc: -1 }  // Diagonal //
    ];

    for (const { dr, dc } of directions) {
        let playerCount = 0;
        let opponentCount = 0;
        let emptyCount = 0;

        for (let i = -4; i <= 4; i++) { // Check 9 cells around the current position
            const r = row + i * dr;
            const c = col + i * dc;

            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === player) {
                    playerCount++;
                } else if (board[r][c] === opponent) {
                    opponentCount++;
                } else if (board[r][c] === 0) {
                    emptyCount++;
                }
            }
        }

        // Basic scoring (needs much more sophistication)
        if (playerCount >= 4 && emptyCount >= 1) score += 1000; // Potential win for player
        if (opponentCount >= 4 && emptyCount >= 1) score += 800; // Block opponent's potential win
        if (playerCount === 3 && emptyCount >= 2) score += 100; // Three in a row with open ends
        if (opponentCount === 3 && emptyCount >= 2) score += 80; // Block opponent's three in a row
        if (playerCount === 2 && emptyCount >= 3) score += 10; // Two in a row with open ends
    }

    return score;
}

canvas.addEventListener('click', handleClick);
restartButton.addEventListener('click', initBoard);

initBoard();
