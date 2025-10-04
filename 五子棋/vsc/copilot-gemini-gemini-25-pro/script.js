const canvas = document.getElementById('gomoku-board');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restart-btn');
const statusEl = document.getElementById('status');
const winMessageEl = document.getElementById('win-message');
const winTextEl = document.getElementById('win-text');

const BOARD_SIZE = 15;
const GRID_SIZE = canvas.width / (BOARD_SIZE + 1);
const PIECE_RADIUS = GRID_SIZE * 0.4;
const STAR_POINTS = [
    [3, 3], [11, 3], [3, 11], [11, 11],
    [7, 7]
];

let board = [];
let currentPlayer = 1; // 1 for black, 2 for white
let gameOver = false;

function initGame() {
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    drawBoard();
    updateStatus();
    winMessageEl.classList.add('hidden');
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;

    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(GRID_SIZE * (i + 1), GRID_SIZE);
        ctx.lineTo(GRID_SIZE * (i + 1), canvas.height - GRID_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(GRID_SIZE, GRID_SIZE * (i + 1));
        ctx.lineTo(canvas.width - GRID_SIZE, GRID_SIZE * (i + 1));
        ctx.stroke();
    }

    // Draw star points
    ctx.fillStyle = '#8B4513';
    STAR_POINTS.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(GRID_SIZE * (x + 1), GRID_SIZE * (y + 1), 5, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Redraw pieces
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== 0) {
                drawPiece(x, y, board[y][x]);
            }
        }
    }
}

function drawPiece(x, y, player) {
    const canvasX = GRID_SIZE * (x + 1);
    const canvasY = GRID_SIZE * (y + 1);

    let gradient;
    if (player === 1) { // Black piece
        gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#000');
    } else { // White piece
        gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#ccc');
    }

    ctx.beginPath();
    ctx.arc(canvasX, canvasY, PIECE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
}

function updateStatus() {
    statusEl.textContent = `輪到 ${currentPlayer === 1 ? '黑方' : '白方'}`;
}

function checkWin(x, y, player) {
    const directions = [
        [1, 0], [0, 1], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        for (let i = 1; i < 5; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else {
                break;
            }
        }
        for (let i = 1; i < 5; i++) {
            const nx = x - i * dx;
            const ny = y - i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else {
                break;
            }
        }
        if (count >= 5) {
            return true;
        }
    }
    return false;
}

function handlePlayerMove(event) {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left - GRID_SIZE) / GRID_SIZE);
    const y = Math.round((event.clientY - rect.top - GRID_SIZE) / GRID_SIZE);

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === 0) {
        board[y][x] = currentPlayer;
        drawPiece(x, y, currentPlayer);

        if (checkWin(x, y, currentPlayer)) {
            gameOver = true;
            winTextEl.textContent = `${currentPlayer === 1 ? '黑方' : '白方'} 獲勝!`;
            winMessageEl.classList.remove('hidden');
            return;
        }

        currentPlayer = 2;
        updateStatus();
        setTimeout(aiMove, 500);
    }
}

function aiMove() {
    if (gameOver) return;

    let bestMove = findBestMove();
    if (bestMove) {
        const { x, y } = bestMove;
        board[y][x] = currentPlayer;
        drawPiece(x, y, currentPlayer);

        if (checkWin(x, y, currentPlayer)) {
            gameOver = true;
            winTextEl.textContent = '白方 獲勝!';
            winMessageEl.classList.remove('hidden');
            return;
        }

        currentPlayer = 1;
        updateStatus();
    }
}

function findBestMove() {
    // 1. Check if AI can win
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                board[y][x] = 2;
                if (checkWin(x, y, 2)) {
                    board[y][x] = 0;
                    return { x, y };
                }
                board[y][x] = 0;
            }
        }
    }

    // 2. Block player's winning move
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                board[y][x] = 1;
                if (checkWin(x, y, 1)) {
                    board[y][x] = 0;
                    return { x, y };
                }
                board[y][x] = 0;
            }
        }
    }

    // 3. Simple heuristic: play near existing pieces
    const possibleMoves = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                let score = 0;
                // Prioritize center
                score += (7 - Math.abs(x - 7)) + (7 - Math.abs(y - 7));

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] !== 0) {
                            score += board[ny][nx] === 2 ? 2 : 1;
                        }
                    }
                }
                if (score > 0) {
                    possibleMoves.push({ x, y, score });
                }
            }
        }
    }

    if (possibleMoves.length > 0) {
        possibleMoves.sort((a, b) => b.score - a.score);
        return possibleMoves[0];
    }

    // 4. Fallback to center if board is empty
    if (board[7][7] === 0) {
        return { x: 7, y: 7 };
    }

    // 5. Fallback to random move
    let emptySpots = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                emptySpots.push({ x, y });
            }
        }
    }
    if (emptySpots.length > 0) {
        return emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }

    return null; // No moves left
}


canvas.addEventListener('click', handlePlayerMove);
restartBtn.addEventListener('click', initGame);

initGame();
