document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const currentPlayerSpan = document.getElementById('current-player');

    const BOARD_SIZE = 15;
    const PADDING = 20;
    const CELL_SIZE = (canvas.width - 2 * PADDING) / (BOARD_SIZE - 1);
    const PIECE_RADIUS = CELL_SIZE * 0.4;
    const STAR_POINTS = [
        { x: 3, y: 3 }, { x: 11, y: 3 }, { x: 7, y: 7 },
        { x: 3, y: 11 }, { x: 11, y: 11 }
    ];

    let board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    let currentPlayer = 1; // 1 for Black, 2 for White
    let gameOver = false;

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        for (let i = 0; i < BOARD_SIZE; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
            ctx.lineTo(PADDING + i * CELL_SIZE, canvas.height - PADDING);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
            ctx.lineTo(canvas.width - PADDING, PADDING + i * CELL_SIZE);
            ctx.stroke();
        }

        // Draw star points
        ctx.fillStyle = '#8B4513';
        STAR_POINTS.forEach(p => {
            ctx.beginPath();
            ctx.arc(PADDING + p.x * CELL_SIZE, PADDING + p.y * CELL_SIZE, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawPiece(x, y, player) {
        const canvasX = PADDING + x * CELL_SIZE;
        const canvasY = PADDING + y * CELL_SIZE;

        let gradient = (player === 1)
            ? ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS)
            : ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);

        if (player === 1) { // Black piece
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else { // White piece
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
        }

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, PIECE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function updateTurnIndicator() {
        if (gameOver) return;
        currentPlayerSpan.textContent = (currentPlayer === 1) ? '黑方' : '白方';
    }

    function checkWin(x, y, player) {
        // Check horizontal, vertical, and two diagonals
        const directions = [
            { dx: 1, dy: 0 }, // Horizontal
            { dx: 0, dy: 1 }, // Vertical
            { dx: 1, dy: 1 }, // Diagonal \
            { dx: 1, dy: -1 }  // Diagonal /
        ];

        for (const { dx, dy } of directions) {
            let count = 1;
            // Check in one direction
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break;
                }
            }
            // Check in the opposite direction
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break;
                }
            }
            if (count >= 5) return true;
        }
        return false;
    }
    
    function findBestMove() {
        // 1. Check if AI can win
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    board[y][x] = 2; // AI's player number
                    if (checkWin(x, y, 2)) {
                        board[y][x] = 0; // backtrack
                        return { x, y };
                    }
                    board[y][x] = 0; // backtrack
                }
            }
        }
    
        // 2. Block player's winning move
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    board[y][x] = 1; // Player's number
                    if (checkWin(x, y, 1)) {
                        board[y][x] = 0; // backtrack
                        return { x, y };
                    }
                    board[y][x] = 0; // backtrack
                }
            }
        }
    
        // 3. Simple heuristic: play near existing pieces
        const moves = [];
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    let score = 0;
                    // Check neighbors
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const ny = y + dy;
                            const nx = x + dx;
                            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] !== 0) {
                                score++;
                            }
                        }
                    }
                    if (score > 0) {
                        moves.push({ x, y, score });
                    }
                }
            }
        }
    
        if (moves.length > 0) {
            moves.sort((a, b) => b.score - a.score);
            return moves[0];
        }
    
        // 4. Fallback: play in the center
        const center = Math.floor(BOARD_SIZE / 2);
        if (board[center][center] === 0) {
            return { x: center, y: center };
        }
    
        // 5. Absolute fallback: play a random empty spot
        const emptySpots = [];
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    emptySpots.push({ x, y });
                }
            }
        }
        return emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }

    function aiMove() {
        if (gameOver) return;

        setTimeout(() => {
            const move = findBestMove();
            if (move && board[move.y][move.x] === 0) {
                board[move.y][move.x] = 2;
                drawPiece(move.x, move.y, 2);
                if (checkWin(move.x, move.y, 2)) {
                    gameOver = true;
                    setTimeout(() => alert('白方獲勝！'), 100);
                } else {
                    currentPlayer = 1;
                    updateTurnIndicator();
                }
            }
        }, 500);
    }

    canvas.addEventListener('click', (event) => {
        if (gameOver || currentPlayer !== 1) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridX = Math.round((x - PADDING) / CELL_SIZE);
        const gridY = Math.round((y - PADDING) / CELL_SIZE);

        if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE && board[gridY][gridX] === 0) {
            board[gridY][gridX] = 1;
            drawPiece(gridX, gridY, 1);
            if (checkWin(gridX, gridY, 1)) {
                gameOver = true;
                setTimeout(() => alert('黑方獲勝！'), 100);
            } else {
                currentPlayer = 2;
                updateTurnIndicator();
                aiMove();
            }
        }
    });

    function resetGame() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        currentPlayer = 1;
        gameOver = false;
        drawBoard();
        for(let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if(board[y][x] !== 0) {
                    drawPiece(x, y, board[y][x]);
                }
            }
        }
        updateTurnIndicator();
    }
    
    restartButton.addEventListener('click', resetGame);

    // Initial draw
    drawBoard();
    updateTurnIndicator();
});
