document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gobang-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const restartButtonWin = document.getElementById('restart-button-win');
    const currentTurnSpan = document.getElementById('current-turn');
    const winMessageDiv = document.getElementById('win-message');
    const winnerText = document.getElementById('winner-text');

    const BOARD_SIZE = 15;
    const PADDING = 20;
    const CELL_SIZE = (canvas.width - 2 * PADDING) / (BOARD_SIZE - 1);
    const PIECE_RADIUS = CELL_SIZE * 0.8 / 2;
    const STAR_POINTS = [
        { x: 3, y: 3 }, { x: 11, y: 3 }, { x: 7, y: 7 },
        { x: 3, y: 11 }, { x: 11, y: 11 }
    ];

    let board = [];
    let currentPlayer = 1; // 1 for black, 2 for white
    let gameOver = false;

    function initGame() {
        board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
        currentPlayer = 1;
        gameOver = false;
        drawBoard();
        updateTurnDisplay();
        winMessageDiv.classList.add('hidden');
    }

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
        const cx = PADDING + x * CELL_SIZE;
        const cy = PADDING + y * CELL_SIZE;
        ctx.beginPath();
        ctx.arc(cx, cy, PIECE_RADIUS, 0, 2 * Math.PI);

        let gradient;
        if (player === 1) { // Black piece
            gradient = ctx.createRadialGradient(cx - PIECE_RADIUS * 0.3, cy - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, cx, cy, PIECE_RADIUS);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else { // White piece
            gradient = ctx.createRadialGradient(cx - PIECE_RADIUS * 0.3, cy - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, cx, cy, PIECE_RADIUS);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
        }
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function updateTurnDisplay() {
        currentTurnSpan.textContent = currentPlayer === 1 ? '黑方' : '白方';
        currentTurnSpan.style.color = currentPlayer === 1 ? 'black' : '#A0A0A0';
    }

    function handleCanvasClick(event) {
        if (gameOver || currentPlayer !== 1) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridX = Math.round((x - PADDING) / CELL_SIZE);
        const gridY = Math.round((y - PADDING) / CELL_SIZE);

        if (gridX < 0 || gridX >= BOARD_SIZE || gridY < 0 || gridY >= BOARD_SIZE) return;

        if (board[gridY][gridX] === 0) {
            placePiece(gridX, gridY, 1);
        }
    }

    function placePiece(x, y, player) {
        board[y][x] = player;
        drawPiece(x, y, player);

        if (checkWin(x, y, player)) {
            endGame(player);
            return;
        }

        currentPlayer = player === 1 ? 2 : 1;
        updateTurnDisplay();

        if (currentPlayer === 2 && !gameOver) {
            setTimeout(aiTurn, 500);
        }
    }

    function checkWin(x, y, player) {
        const directions = [
            { dx: 1, dy: 0 },  // Horizontal
            { dx: 0, dy: 1 },  // Vertical
            { dx: 1, dy: 1 },  // Diagonal \
            { dx: 1, dy: -1 }  // Diagonal /
        ];

        for (const dir of directions) {
            let count = 1;
            // Check in one direction
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dir.dx;
                const ny = y + i * dir.dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break;
                }
            }
            // Check in the opposite direction
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dir.dx;
                const ny = y - i * dir.dy;
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

    function endGame(winner) {
        gameOver = true;
        winnerText.textContent = `${winner === 1 ? '黑方' : '白方'}獲勝！`;
        winMessageDiv.classList.remove('hidden');
    }

    function aiTurn() {
        if (gameOver) return;

        let bestMove = findBestMove();
        if (bestMove) {
            placePiece(bestMove.x, bestMove.y, 2);
        }
    }

    function findBestMove() {
        let bestScore = -Infinity;
        let move = null;

        // 1. Check if AI can win in the next move
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    board[y][x] = 2; // Try the move
                    if (checkWin(x, y, 2)) {
                        board[y][x] = 0; // Revert
                        return { x, y };
                    }
                    board[y][x] = 0; // Revert
                }
            }
        }

        // 2. Check if player can win in the next move and block them
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    board[y][x] = 1; // Try player's move
                    if (checkWin(x, y, 1)) {
                        board[y][x] = 0; // Revert
                        return { x, y }; // Block this spot
                    }
                    board[y][x] = 0; // Revert
                }
            }
        }

        // 3. Use a scoring heuristic for other moves
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    let score = calculateScore(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        move = { x, y };
                    }
                }
            }
        }
        
        // Fallback to the first available spot if no move is found (should not happen in a normal game)
        if (!move) {
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y][x] === 0) {
                        return { x, y };
                    }
                }
            }
        }

        return move;
    }

    function calculateScore(x, y) {
        let score = 0;
        // Add a small random factor to avoid deterministic play
        score += Math.random() * 10;

        // Prioritize center
        const center = Math.floor(BOARD_SIZE / 2);
        score += (center - Math.abs(x - center)) * 5;
        score += (center - Math.abs(y - center)) * 5;

        // Evaluate based on proximity to existing pieces
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const nx = x + i;
                const ny = y + j;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] !== 0) {
                    score += 20; // Add score for being next to any piece
                }
            }
        }
        
        // More advanced scoring for creating lines (simplified)
        // A full implementation would be much more complex, checking for open 2s, 3s, etc.
        // This provides a basic but reasonable heuristic.
        board[y][x] = 2; // Temporarily place AI piece
        score += evaluateLines(x, y, 2) * 100; // AI's potential
        board[y][x] = 1; // Temporarily place player piece
        score += evaluateLines(x, y, 1) * 90; // Blocking player's potential
        board[y][x] = 0; // Revert

        return score;
    }

    function evaluateLines(x, y, player) {
        let lineScore = 0;
        const directions = [
            { dx: 1, dy: 0 }, { dx: 0, dy: 1 },
            { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
        ];

        for (const dir of directions) {
            let count = 1;
            let openEnds = 0;

            // Forward
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dir.dx;
                const ny = y + i * dir.dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            // Backward
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dir.dx;
                const ny = y - i * dir.dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            if (count === 4 && openEnds > 0) lineScore += 1000;
            if (count === 3 && openEnds === 2) lineScore += 500;
            if (count === 3 && openEnds === 1) lineScore += 100;
            if (count === 2 && openEnds === 2) lineScore += 50;
        }
        return lineScore;
    }

    // Event Listeners
    canvas.addEventListener('click', handleCanvasClick);
    restartButton.addEventListener('click', initGame);
    restartButtonWin.addEventListener('click', initGame);

    // Initial game setup
    initGame();
});
