document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const gridSize = 15;
    const cellSize = canvas.width / (gridSize - 1); // 600 / 14 ≈ 42.857
    let board = Array(gridSize).fill().map(() => Array(gridSize).fill(0)); // 0: empty, 1: black, 2: white
    let currentPlayer = 1; // 1: black, 2: white
    let gameOver = false;

    // Star points: positions 3,7,11
    const stars = [[3, 3], [3, 7], [3, 11], [7, 3], [7, 7], [7, 11], [11, 3], [11, 7], [11, 11]];

    // Initialize
    updateTurn();
    drawBoard();

    // Draw the board grid and stars
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        // Horizontal lines
        for (let i = 0; i < gridSize; i++) {
            let y = i * cellSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Vertical lines
        for (let i = 0; i < gridSize; i++) {
            let x = i * cellSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Draw stars
        for (let star of stars) {
            let x = star[1] * cellSize;
            let y = star[0] * cellSize;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#8B4513';
            ctx.fill();
        }
    }

    // Draw all pieces
    function drawPieces() {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (board[r][c] !== 0) {
                    drawPiece(r, c, board[r][c]);
                }
            }
        }
    }

    // Draw a single piece
    function drawPiece(r, c, player) {
        let x = c * cellSize;
        let y = r * cellSize;
        let radius = cellSize * 0.4; // 80% of cell, radius 40%
        let gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 10, x, y, radius);
        if (player === 1) { // Black with gradient for highlight
            gradient.addColorStop(0, '#606060');
            gradient.addColorStop(1, '#000000');
        } else { // White
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(1, '#C0C0C0');
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Handle canvas click
    canvas.addEventListener('click', function (e) {
        if (gameOver) return;

        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let c = Math.round(x / cellSize);
        let r = Math.round(y / cellSize);

        if (c < 0 || c >= gridSize || r < 0 || r >= gridSize || board[r][c] !== 0) {
            return;
        }

        placePiece(r, c, currentPlayer);
        currentPlayer = 3 - currentPlayer;
        updateTurn();

        let winner = checkWin(r, c);
        if (winner) {
            gameOver = true;
            showMessage(winner === 1 ? '黑方獲勝！' : 'AI獲勝！');
        } else {
            // AI move after 0.5 seconds
            setTimeout(aiMove, 500);
        }
    });

    // Place a piece
    function placePiece(r, c, player) {
        board[r][c] = player;
        drawPiece(r, c, player);
    }

    // Update turn display
    function updateTurn() {
        document.getElementById('turn').textContent = `當前回合：${currentPlayer === 1 ? '黑方' : '白方'}`;
    }

    // Show message
    function showMessage(msg) {
        document.getElementById('message').textContent = msg;
    }

    // Check win after placing at (r,c)
    function checkWin(r, c) {
        let player = board[r][c];
        const directions = [
            [0, 1], // right
            [1, 0], // down
            [1, 1], // down-right
            [1, -1] // down-left
        ];

        for (let dir of directions) {
            let count = 1;
            let dr = dir[0], dc = dir[1];
            // Forward
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && board[nr][nc] === player) {
                count++;
                nr += dr;
                nc += dc;
            }
            // Backward
            nr = r - dr; nc = c - dc;
            while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && board[nr][nc] === player) {
                count++;
                nr -= dr;
                nc -= dc;
            }
            if (count >= 5) return player;
        }
        return 0;
    }

    // AI move logic
    function aiMove() {
        if (gameOver) return;

        let candidates = getCandidates();
        let bestMove = null;
        let maxScore = -1;

        for (let [r, c] of candidates) {
            let score = evaluateMove(r, c, 2); // for AI (white)
            if (score > maxScore) {
                maxScore = score;
                bestMove = [r, c];
            }
        }

        if (bestMove) {
            placePiece(bestMove[0], bestMove[1], 2);
            currentPlayer = 1;
            updateTurn();
            let winner = checkWin(bestMove[0], bestMove[1]);
            if (winner) {
                gameOver = true;
                showMessage('AI獲勝！');
            }
        }
    }

    // Get candidate moves: empty spots near existing pieces
    function getCandidates() {
        let candidates = new Set();
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (board[r][c] !== 0) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            let nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && board[nr][nc] === 0) {
                                candidates.add(nr * gridSize + nc);
                            }
                        }
                    }
                }
            }
        }
        if (candidates.size === 0) {
            // First move: center
            candidates.add(7 * gridSize + 7);
        }
        return Array.from(candidates).map(pos => [Math.floor(pos / gridSize), pos % gridSize]);
    }

    // Evaluate move for player (1 or 2) at (r,c)
    function evaluateMove(r, c, player) {
        board[r][c] = player; // Temp place
        let score = 0;

        // Distance from center
        let dist = Math.abs(r - 7) + Math.abs(c - 7);
        score += 15 / (dist + 1);

        // Check if win
        if (checkWin(r, c) === player) {
            score += 10000;
            board[r][c] = 0;
            return score;
        }

        // Check threats: max consecutive for self and opponent
        let selfThreat = getMaxConsecutive(r, c, player);
        let oppThreat = getMaxConsecutive(r, c, 3 - player);

        score += oppThreat * 100; // Blocking opponent
        score += selfThreat * 50;  // Extending own

        board[r][c] = 0; // Undo temp
        return score;
    }

    // Get max consecutive in any direction (for threat level)
    function getMaxConsecutive(r, c, player) {
        board[r][c] = player; // Temp
        let maxCount = 0;
        for (let dir of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
            let count = 0;
            let dr = dir[0], dc = dir[1];
            // Forward
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && board[nr][nc] === player) {
                count++;
                nr += dr;
                nc += dc;
            }
            // Backward
            nr = r - dr; nc = c - dc;
            while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && board[nr][nc] === player) {
                count++;
                nr -= dr;
                nc -= dc;
            }
            maxCount = Math.max(maxCount, count);
        }
        board[r][c] = 0; // Undo
        return maxCount;
    }

    // Restart game
    document.getElementById('restart').addEventListener('click', function () {
        board = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        currentPlayer = 1;
        gameOver = false;
        updateTurn();
        showMessage('');
        drawBoard();
    });
});
