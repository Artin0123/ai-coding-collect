document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gobang-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const currentPlayerSpan = document.getElementById('current-player');

    const GRID_SIZE = 40;
    const BOARD_SIZE = 15;
    const PADDING = GRID_SIZE;
    const canvasSize = canvas.width;

    let board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    let isPlayerTurn = true; // Player is black (1), AI is white (2)
    let gameOver = false;

    function drawBoard() {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        for (let i = 0; i < BOARD_SIZE; i++) {
            // Draw horizontal lines
            ctx.beginPath();
            ctx.moveTo(PADDING, PADDING + i * GRID_SIZE);
            ctx.lineTo(canvasSize - PADDING, PADDING + i * GRID_SIZE);
            ctx.stroke();

            // Draw vertical lines
            ctx.beginPath();
            ctx.moveTo(PADDING + i * GRID_SIZE, PADDING);
            ctx.lineTo(PADDING + i * GRID_SIZE, canvasSize - PADDING);
            ctx.stroke();
        }

        // Draw star points
        const starPoints = [
            { x: 3, y: 3 }, { x: 11, y: 3 },
            { x: 7, y: 7 },
            { x: 3, y: 11 }, { x: 11, y: 11 }
        ];
        ctx.fillStyle = '#8B4513';
        starPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(PADDING + point.x * GRID_SIZE, PADDING + point.y * GRID_SIZE, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawPiece(x, y, player) {
        const pieceRadius = GRID_SIZE / 2 - 2;
        const canvasX = PADDING + x * GRID_SIZE;
        const canvasY = PADDING + y * GRID_SIZE;

        let gradient;
        if (player === 1) { // Black piece
            gradient = ctx.createRadialGradient(canvasX - 5, canvasY - 5, 2, canvasX, canvasY, pieceRadius);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else { // White piece
            gradient = ctx.createRadialGradient(canvasX - 5, canvasY - 5, 2, canvasX, canvasY, pieceRadius);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
        }

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, pieceRadius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function redrawBoard() {
        drawBoard();
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] !== 0) {
                    drawPiece(x, y, board[y][x]);
                }
            }
        }
    }

    function checkWin(x, y, player) {
        const directions = [
            { dx: 1, dy: 0 },  // Horizontal
            { dx: 0, dy: 1 },  // Vertical
            { dx: 1, dy: 1 },  // Diagonal \
            { dx: 1, dy: -1 }  // Diagonal /
        ];

        for (const { dx, dy } of directions) {
            let count = 1;
            // Check in one direction
            for (let i = 1; i < 5; i++) {
                const newX = x + i * dx;
                const newY = y + i * dy;
                if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE && board[newY][newX] === player) {
                    count++;
                } else {
                    break;
                }
            }
            // Check in the opposite direction
            for (let i = 1; i < 5; i++) {
                const newX = x - i * dx;
                const newY = y - i * dy;
                if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE && board[newY][newX] === player) {
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

    function aiMove() {
        if (gameOver) return;

        let bestScore = -Infinity;
        let move = { x: -1, y: -1 };

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    let score = 0;
                    // Simple scoring: check adjacent pieces
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const newX = x + dx;
                            const newY = y + dy;
                            if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
                                if (board[newY][newX] === 1) score += 2; // Block player
                                if (board[newY][newX] === 2) score += 1; // Extend AI
                            }
                        }
                    }
                    // Add a small random factor to make moves less predictable
                    score += Math.random() * 0.5;

                    if (score > bestScore) {
                        bestScore = score;
                        move = { x, y };
                    }
                }
            }
        }

        // A more advanced scoring will be implemented if needed.
        // For now, this basic logic provides a starting point.
        // A better AI would evaluate lines of 2, 3, 4 and assign much higher scores.

        // Fallback if no good move is found (e.g., first move)
        if (move.x === -1) {
            do {
                move.x = Math.floor(Math.random() * BOARD_SIZE);
                move.y = Math.floor(Math.random() * BOARD_SIZE);
            } while (board[move.y][move.x] !== 0);
        }

        board[move.y][move.x] = 2;
        drawPiece(move.x, move.y, 2);

        if (checkWin(move.x, move.y, 2)) {
            gameOver = true;
            setTimeout(() => alert('白方獲勝！'), 100);
        } else {
            isPlayerTurn = true;
            currentPlayerSpan.textContent = '黑方';
        }
    }

    canvas.addEventListener('click', (event) => {
        if (gameOver || !isPlayerTurn) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const x = Math.round((mouseX - PADDING) / GRID_SIZE);
        const y = Math.round((mouseY - PADDING) / GRID_SIZE);

        if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === 0) {
            board[y][x] = 1;
            drawPiece(x, y, 1);

            if (checkWin(x, y, 1)) {
                gameOver = true;
                setTimeout(() => alert('黑方獲勝！'), 100);
            } else {
                isPlayerTurn = false;
                currentPlayerSpan.textContent = '白方';
                setTimeout(aiMove, 500); // AI moves after a short delay
            }
        }
    });

    function restartGame() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        isPlayerTurn = true;
        gameOver = false;
        currentPlayerSpan.textContent = '黑方';
        redrawBoard();
    }

    restartButton.addEventListener('click', restartGame);

    // Initial draw
    drawBoard();
});
