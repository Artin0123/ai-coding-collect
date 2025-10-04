document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gobang-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const currentPlayerSpan = document.getElementById('current-player');

    const GRID_SIZE = 15;
    const PADDING = 20;
    const CELL_SIZE = (canvas.width - 2 * PADDING) / (GRID_SIZE - 1);
    const PIECE_RADIUS = CELL_SIZE * 0.4; // 80% of cell width

    let board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    let currentPlayer = 1; // 1 for black, 2 for white
    let gameOver = false;

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        for (let i = 0; i < GRID_SIZE; i++) {
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

        drawStarPoints();
    }

    function drawStarPoints() {
        const starPoints = [
            { x: 3, y: 3 }, { x: 11, y: 3 },
            { x: 3, y: 11 }, { x: 11, y: 11 },
            { x: 7, y: 7 }
        ];

        ctx.fillStyle = '#8B4513';
        starPoints.forEach(p => {
            ctx.beginPath();
            ctx.arc(PADDING + p.x * CELL_SIZE, PADDING + p.y * CELL_SIZE, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawPiece(x, y, player) {
        const canvasX = PADDING + x * CELL_SIZE;
        const canvasY = PADDING + y * CELL_SIZE;

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

    function redrawBoard() {
        drawBoard();
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (board[y][x] !== 0) {
                    drawPiece(x, y, board[y][x]);
                }
            }
        }
    }

    function checkWin(x, y, player) {
        // Directions: horizontal, vertical, diagonal (down-right), diagonal (up-right)
        const directions = [
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 }
        ];

        for (const { dx, dy } of directions) {
            let count = 1;
            // Check in one direction
            for (let i = 1; i < 5; i++) {
                const newX = x + i * dx;
                const newY = y + i * dy;
                if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && board[newY][newX] === player) {
                    count++;
                } else {
                    break;
                }
            }
            // Check in the opposite direction
            for (let i = 1; i < 5; i++) {
                const newX = x - i * dx;
                const newY = y - i * dy;
                if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && board[newY][newX] === player) {
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

    function handleCanvasClick(event) {
        if (gameOver || currentPlayer !== 1) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const x = Math.round((mouseX - PADDING) / CELL_SIZE);
        const y = Math.round((mouseY - PADDING) / CELL_SIZE);

        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

        if (board[y][x] === 0) {
            placePiece(x, y, currentPlayer);
        }
    }

    function placePiece(x, y, player) {
        board[y][x] = player;
        drawPiece(x, y, player);

        if (checkWin(x, y, player)) {
            gameOver = true;
            setTimeout(() => {
                alert(`${player === 1 ? '黑方' : '白方'} 獲勝!`);
            }, 100);
            return;
        }

        currentPlayer = player === 1 ? 2 : 1;
        updateCurrentPlayerDisplay();

        if (!gameOver && currentPlayer === 2) {
            setTimeout(aiMove, 500);
        }
    }

    function updateCurrentPlayerDisplay() {
        currentPlayerSpan.textContent = currentPlayer === 1 ? '黑方' : '白方';
    }

    function aiMove() {
        if (gameOver) return;

        let bestMove = findBestMove();
        placePiece(bestMove.x, bestMove.y, 2);
    }

    function findBestMove() {
        // 1. Check if AI can win
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
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

        // 2. Check if player is about to win and block
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
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
        let possibleMoves = [];
        let maxScore = -1;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (board[y][x] === 0) {
                    let score = 0;
                    // Check neighbors
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const newX = x + dx;
                            const newY = y + dy;
                            if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && board[newY][newX] !== 0) {
                                score++;
                            }
                        }
                    }
                    // Prioritize center
                    score += (7 - Math.abs(7 - x)) * 0.1;
                    score += (7 - Math.abs(7 - y)) * 0.1;

                    if (score > maxScore) {
                        maxScore = score;
                        possibleMoves = [{ x, y }];
                    } else if (score === maxScore) {
                        possibleMoves.push({ x, y });
                    }
                }
            }
        }

        // 4. Randomly choose from the best moves
        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }

        // Fallback: if board is empty, play in the center
        if (board[7][7] === 0) return { x: 7, y: 7 };

        // Fallback: find any empty spot
        let emptySpots = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (board[y][x] === 0) {
                    emptySpots.push({ x, y });
                }
            }
        }
        return emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }

    function restartGame() {
        board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        currentPlayer = 1;
        gameOver = false;
        updateCurrentPlayerDisplay();
        redrawBoard();
    }

    // Initial setup
    canvas.addEventListener('click', handleCanvasClick);
    restartButton.addEventListener('click', restartGame);
    drawBoard();
});
