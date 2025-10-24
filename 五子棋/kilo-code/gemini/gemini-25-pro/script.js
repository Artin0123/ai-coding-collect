document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gobang-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const currentTurnSpan = document.getElementById('current-turn');

    const GRID_SIZE = 40;
    const BOARD_SIZE = 15;
    const PIECE_RADIUS = 18;
    const STAR_POINTS = [
        { x: 3, y: 3 }, { x: 11, y: 3 },
        { x: 3, y: 11 }, { x: 11, y: 11 },
        { x: 7, y: 7 }
    ];

    let board = [];
    let currentPlayer = 'black'; // black: player, white: AI
    let gameOver = false;

    function init() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        currentPlayer = 'black';
        gameOver = false;
        drawBoard();
        updateTurnIndicator();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        for (let i = 0; i < BOARD_SIZE; i++) {
            const pos = GRID_SIZE + i * GRID_SIZE;
            ctx.beginPath();
            ctx.moveTo(pos, GRID_SIZE);
            ctx.lineTo(pos, GRID_SIZE * BOARD_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(GRID_SIZE, pos);
            ctx.lineTo(GRID_SIZE * BOARD_SIZE, pos);
            ctx.stroke();
        }

        // Draw star points
        ctx.fillStyle = '#8B4513';
        STAR_POINTS.forEach(p => {
            ctx.beginPath();
            const x = GRID_SIZE + p.x * GRID_SIZE;
            const y = GRID_SIZE + p.y * GRID_SIZE;
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawPiece(x, y, player) {
        const canvasX = GRID_SIZE + x * GRID_SIZE;
        const canvasY = GRID_SIZE + y * GRID_SIZE;

        let gradient;
        if (player === 'black') {
            gradient = ctx.createRadialGradient(canvasX - 5, canvasY - 5, 5, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#111');
        } else {
            gradient = ctx.createRadialGradient(canvasX - 5, canvasY - 5, 5, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#FFF');
            gradient.addColorStop(1, '#DDD');
        }

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, PIECE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function updateTurnIndicator() {
        currentTurnSpan.textContent = currentPlayer === 'black' ? '黑方' : '白方';
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
            if (count >= 5) {
                return true;
            }
        }
        return false;
    }

    function handlePlayerMove(event) {
        if (gameOver || currentPlayer !== 'black') return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const x = Math.round((mouseX - GRID_SIZE) / GRID_SIZE);
        const y = Math.round((mouseY - GRID_SIZE) / GRID_SIZE);

        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x]) {
            return;
        }

        board[y][x] = 'black';
        drawPiece(x, y, 'black');

        if (checkWin(x, y, 'black')) {
            gameOver = true;
            setTimeout(() => alert('恭喜！黑方獲勝！'), 100);
            return;
        }

        currentPlayer = 'white';
        updateTurnIndicator();
        setTimeout(aiMove, 500);
    }

    function aiMove() {
        if (gameOver) return;

        let bestScore = -Infinity;
        let move = { x: -1, y: -1 };

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (!board[y][x]) {
                    const score = calculateScore(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        move = { x, y };
                    }
                }
            }
        }

        if (move.x !== -1) {
            board[move.y][move.x] = 'white';
            drawPiece(move.x, move.y, 'white');

            if (checkWin(move.x, move.y, 'white')) {
                gameOver = true;
                setTimeout(() => alert('AI 獲勝！'), 100);
                return;
            }

            currentPlayer = 'black';
            updateTurnIndicator();
        }
    }

    function calculateScore(x, y) {
        // Simple scoring: prioritize blocking player's lines and extending its own.
        // A more complex AI would evaluate patterns (fours, threes, etc.)
        let playerScore = getLineScore(x, y, 'black');
        let aiScore = getLineScore(x, y, 'white');

        // Give slightly more weight to offensive moves
        return playerScore + aiScore * 1.1;
    }

    function getLineScore(x, y, player) {
        let score = 0;
        const directions = [
            { dx: 1, dy: 0 }, { dx: 0, dy: 1 },
            { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
        ];

        for (const { dx, dy } of directions) {
            let count = 1;
            let openEnds = 0;

            // Check one direction
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && !board[ny][nx]) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            // Check opposite direction
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && !board[ny][nx]) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            // Assign score based on line length and open ends
            if (count >= 5) score += 100000; // Winning move
            else if (count === 4 && openEnds === 2) score += 10000; // Open four
            else if (count === 4 && openEnds === 1) score += 1000; // Half-open four
            else if (count === 3 && openEnds === 2) score += 1000; // Open three
            else if (count === 3 && openEnds === 1) score += 100; // Half-open three
            else if (count === 2 && openEnds === 2) score += 10; // Open two
            else if (count === 2 && openEnds === 1) score += 5; // Half-open two
            else if (count === 1 && openEnds === 2) score += 1; // Single piece with space
        }
        return score;
    }

    canvas.addEventListener('click', handlePlayerMove);
    restartButton.addEventListener('click', init);

    init();
});