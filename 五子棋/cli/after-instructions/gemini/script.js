document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gomoku-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const turnSpan = document.getElementById('current-turn');
    const winMessage = document.getElementById('win-message');

    const BOARD_SIZE = 15;
    const PADDING = 20; // Canvas 內邊距
    const CELL_SIZE = (canvas.width - 2 * PADDING) / (BOARD_SIZE - 1);
    const PIECE_RADIUS = CELL_SIZE * 0.8 / 2;

    let board = [];
    let currentPlayer = 1; // 1 for Black (Player), 2 for White (AI)
    let gameOver = false;

    function initGame() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        currentPlayer = 1;
        gameOver = false;
        winMessage.classList.add('hidden');
        winMessage.textContent = '';
        updateTurnDisplay();
        drawBoard();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 棋盤背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 棋盤線條
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        for (let i = 0; i < BOARD_SIZE; i++) {
            // 垂直線
            ctx.beginPath();
            ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
            ctx.lineTo(PADDING + i * CELL_SIZE, canvas.height - PADDING);
            ctx.stroke();
            // 水平線
            ctx.beginPath();
            ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
            ctx.lineTo(canvas.width - PADDING, PADDING + i * CELL_SIZE);
            ctx.stroke();
        }

        // 星位
        const starPoints = [
            [3, 3], [11, 3], [3, 11], [11, 11], // 角星
            [7, 7], // 天元
            [3, 7], [11, 7], [7, 3], [7, 11] // 邊星
        ];
        ctx.fillStyle = '#8B4513';
        starPoints.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(PADDING + x * CELL_SIZE, PADDING + y * CELL_SIZE, 5, 0, 2 * Math.PI);
            ctx.fill();
        });

        // 繪製已有的棋子
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] !== 0) {
                    drawPiece(x, y, board[y][x]);
                }
            }
        }
    }

    function drawPiece(x, y, player) {
        const canvasX = PADDING + x * CELL_SIZE;
        const canvasY = PADDING + y * CELL_SIZE;

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, PIECE_RADIUS, 0, 2 * Math.PI);

        let gradient;
        if (player === 1) { // Black piece
            gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#999');
            gradient.addColorStop(1, '#000');
        } else { // White piece
            gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
        }

        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function handleCanvasClick(event) {
        if (gameOver || currentPlayer !== 1) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left - PADDING) / CELL_SIZE);
        const y = Math.round((event.clientY - rect.top - PADDING) / CELL_SIZE);

        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x] !== 0) {
            return;
        }

        makeMove(x, y, 1);

        if (!gameOver) {
            currentPlayer = 2;
            updateTurnDisplay();
            setTimeout(aiTurn, 500);
        }
    }

    function makeMove(x, y, player) {
        board[y][x] = player;
        drawPiece(x, y, player);

        if (checkWin(x, y, player)) {
            gameOver = true;
            const winner = player === 1 ? '黑方' : '白方';
            winMessage.textContent = `${winner}獲勝！`;
            winMessage.classList.remove('hidden');
            turnSpan.parentElement.classList.add('hidden');
        }
    }

    function updateTurnDisplay() {
        if (gameOver) {
            turnSpan.parentElement.classList.add('hidden');
            return;
        }
        turnSpan.parentElement.classList.remove('hidden');
        turnSpan.textContent = currentPlayer === 1 ? '黑方' : '白方';
        turnSpan.style.color = currentPlayer === 1 ? 'black' : '#555';
    }

    function checkWin(x, y, player) {
        // Check horizontal, vertical, and two diagonals
        const directions = [
            [1, 0],  // Horizontal
            [0, 1],  // Vertical
            [1, 1],  // Diagonal \
            [1, -1]  // Diagonal /
        ];

        for (const [dx, dy] of directions) {
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

    function aiTurn() {
        if (gameOver) return;

        const bestMove = findBestMove();
        makeMove(bestMove.x, bestMove.y, 2);

        if (!gameOver) {
            currentPlayer = 1;
            updateTurnDisplay();
        }
    }

    function findBestMove() {
        // 1. Check if AI can win in one move
        let move = findWinningMove(2);
        if (move) return move;

        // 2. Check if player can win in one move, and block
        move = findWinningMove(1);
        if (move) return move;

        // 3. Heuristic: find the best spot based on scores
        return calculateBestHeuristicMove();
    }

    function findWinningMove(player) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    board[y][x] = player; // Try the move
                    if (checkWin(x, y, player)) {
                        board[y][x] = 0; // Revert
                        return { x, y };
                    }
                    board[y][x] = 0; // Revert
                }
            }
        }
        return null;
    }

    function calculateBestHeuristicMove() {
        let bestScore = -1;
        let bestMove = null;
        const moves = [];

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    const score = calculateScore(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { x, y };
                    }
                    moves.push({x, y, score});
                }
            }
        }
        
        // If no good move, play near center or existing pieces
        if (!bestMove) {
            const center = Math.floor(BOARD_SIZE / 2);
            if (board[center][center] === 0) return {x: center, y: center};
            const candidates = getCandidateMoves();
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        // Add some randomness to moves with the same high score
        const bestMoves = moves.filter(m => m.score === bestScore);
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function calculateScore(x, y) {
        let score = 0;
        // Prioritize center
        const center = Math.floor(BOARD_SIZE / 2);
        score += (center - Math.abs(x - center)) + (center - Math.abs(y - center));

        // Score based on potential lines for both AI and player
        score += evaluatePosition(x, y, 2) * 1.1; // AI's potential is slightly more important
        score += evaluatePosition(x, y, 1);
        return score;
    }

    function evaluatePosition(x, y, player) {
        let score = 0;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        const opponent = player === 1 ? 2 : 1;

        for (const [dx, dy] of directions) {
            let consecutive = 0;
            let openEnds = 0;

            // Check one side
            if (isCellEmpty(x - dx, y - dy)) openEnds++;
            // Check other side
            if (isCellEmpty(x + dx, y + dy)) openEnds++;

            // Count consecutive pieces
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (isCellPlayer(nx, ny, player)) consecutive++;
                else if (isCellPlayer(nx, ny, opponent)) { consecutive = -1; break; } // Blocked
                else break;
            }
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (isCellPlayer(nx, ny, player)) consecutive++;
                else if (isCellPlayer(nx, ny, opponent)) { consecutive = -1; break; } // Blocked
                else break;
            }

            if (consecutive >= 0) {
                score += getScoreForLine(consecutive + 1, openEnds);
            }
        }
        return score;
    }

    function getScoreForLine(count, openEnds) {
        if (openEnds === 0 && count < 5) return 0;
        switch (count) {
            case 5: return 100000; // Should be handled by findWinningMove
            case 4:
                return openEnds === 2 ? 5000 : (openEnds === 1 ? 1000 : 0);
            case 3:
                return openEnds === 2 ? 500 : (openEnds === 1 ? 100 : 0);
            case 2:
                return openEnds === 2 ? 50 : (openEnds === 1 ? 10 : 0);
            case 1:
                return openEnds === 2 ? 5 : 0;
            default: return 0;
        }
    }

    function getCandidateMoves() {
        const candidates = [];
        const hasNeighbors = (x, y) => {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    if (!isCellEmpty(x + i, y + j)) return true;
                }
            }
            return false;
        };

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0 && hasNeighbors(x, y)) {
                    candidates.push({ x, y });
                }
            }
        }
        return candidates.length > 0 ? candidates : [{ x: 7, y: 7 }];
    }

    const isCellEmpty = (x, y) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === 0;
    const isCellPlayer = (x, y, player) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === player;

    // Event Listeners
    canvas.addEventListener('click', handleCanvasClick);
    restartButton.addEventListener('click', initGame);

    // Initial game start
    initGame();
});
