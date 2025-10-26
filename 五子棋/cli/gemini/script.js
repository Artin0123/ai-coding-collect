document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gomoku-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const currentPlayerSpan = document.getElementById('current-player');

    const BOARD_SIZE = 15;
    const PADDING = 20;
    const CELL_SIZE = (canvas.width - 2 * PADDING) / (BOARD_SIZE - 1);
    const PIECE_RADIUS = CELL_SIZE / 2 * 0.85;
    const STAR_POINTS = [
        [3, 3], [11, 3], [3, 11], [11, 11], [7, 7]
    ];

    let board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    let isPlayerTurn = true; // Player is black (1), AI is white (2)
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
        STAR_POINTS.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(PADDING + x * CELL_SIZE, PADDING + y * CELL_SIZE, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawPiece(x, y, player) {
        const canvasX = PADDING + x * CELL_SIZE;
        const canvasY = PADDING + y * CELL_SIZE;

        let gradient;
        if (player === 1) { // Black
            gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else { // White
            gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
        }

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, PIECE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function drawAllPieces() {
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
            if (count >= 5) return true;
        }
        return false;
    }

    function handleCanvasClick(event) {
        if (gameOver || !isPlayerTurn) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left - PADDING) / CELL_SIZE);
        const y = Math.round((event.clientY - rect.top - PADDING) / CELL_SIZE);

        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x] !== 0) {
            return;
        }

        board[y][x] = 1; // Player's move
        drawPiece(x, y, 1);

        if (checkWin(x, y, 1)) {
            gameOver = true;
            setTimeout(() => alert('恭喜！黑子獲勝！'), 100);
            return;
        }

        isPlayerTurn = false;
        currentPlayerSpan.textContent = '白子';
        setTimeout(aiMove, 500);
    }

    function aiMove() {
        if (gameOver) return;

        const bestMove = findBestMove();
        const { x, y } = bestMove;

        board[y][x] = 2; // AI's move
        drawPiece(x, y, 2);

        if (checkWin(x, y, 2)) {
            gameOver = true;
            setTimeout(() => alert('AI 獲勝！白子獲勝！'), 100);
            return;
        }

        isPlayerTurn = true;
        currentPlayerSpan.textContent = '黑子';
    }

    function findBestMove() {
        let bestScore = -Infinity;
        let move = { x: -1, y: -1 };

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    // AI score
                    board[y][x] = 2;
                    let aiScore = calculateScore(x, y, 2);
                    // Player score
                    board[y][x] = 1;
                    let playerScore = calculateScore(x, y, 1);
                    board[y][x] = 0;

                    const currentScore = aiScore + playerScore;
                    if (currentScore > bestScore) {
                        bestScore = currentScore;
                        move = { x, y };
                    }
                }
            }
        }
        return move;
    }

    function calculateScore(x, y, player) {
        const scores = [0, 1, 10, 100, 10000]; // Scores for 1, 2, 3, 4 in a row
        let totalScore = 0;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            let count = 1;
            let openEnds = 0;

            // Forward
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
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
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }
            
            if (count >= 5) return 100000; // Win condition
            if (count === 4 && openEnds === 2) totalScore += 5000;
            else if (count === 4 && openEnds === 1) totalScore += scores[4];
            else if (count === 3 && openEnds === 2) totalScore += scores[3] * 2;
            else totalScore += scores[count] * openEnds;
        }
        return totalScore;
    }

    function restartGame() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        isPlayerTurn = true;
        gameOver = false;
        currentPlayerSpan.textContent = '黑子';
        drawBoard();
    }

    // Initial setup
    drawBoard();
    canvas.addEventListener('click', handleCanvasClick);
    restartButton.addEventListener('click', restartGame);
});
