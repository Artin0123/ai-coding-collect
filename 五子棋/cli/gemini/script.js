document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gomoku-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const currentPlayerSpan = document.getElementById('current-player');

    const GRID_SIZE = 15;
    const PADDING = 20;
    const CELL_SIZE = (canvas.width - 2 * PADDING) / (GRID_SIZE - 1);
    const PIECE_RADIUS = CELL_SIZE / 2 * 0.85;

    let board = [];
    let currentPlayer = 1; // 1 for Black (Player), 2 for White (AI)
    let gameOver = false;

    function initGame() {
        board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
        currentPlayer = 1;
        gameOver = false;
        drawBoard();
        updateTurnIndicator();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        for (let i = 0; i < GRID_SIZE; i++) {
            const pos = PADDING + i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(pos, PADDING);
            ctx.lineTo(pos, canvas.height - PADDING);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(PADDING, pos);
            ctx.lineTo(canvas.width - PADDING, pos);
            ctx.stroke();
        }

        drawStarPoints();
    }

    function drawStarPoints() {
        const starPoints = [
            [3, 3], [11, 3], [3, 11], [11, 11], [7, 7]
        ];
        ctx.fillStyle = '#8B4513';
        starPoints.forEach(([x, y]) => {
            const canvasX = PADDING + x * CELL_SIZE;
            const canvasY = PADDING + y * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawPiece(x, y, player) {
        const canvasX = PADDING + x * CELL_SIZE;
        const canvasY = PADDING + y * CELL_SIZE;

        let gradient;
        if (player === 1) { // Black piece
            gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#6b6b6b');
            gradient.addColorStop(1, '#1a1a1a');
        } else { // White piece
            gradient = ctx.createRadialGradient(canvasX - PIECE_RADIUS * 0.3, canvasY - PIECE_RADIUS * 0.3, PIECE_RADIUS * 0.1, canvasX, canvasY, PIECE_RADIUS);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#d1d1d1');
        }

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, PIECE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function updateTurnIndicator() {
        if (gameOver) return;
        currentPlayerSpan.textContent = currentPlayer === 1 ? '黑方' : '白方';
        currentPlayerSpan.style.color = currentPlayer === 1 ? 'black' : '#555';
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
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break;
                }
            }
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break;
                }
            }
            if (count >= 5) return true;
        }
        return false;
    }

    function handlePlayerMove(event) {
        if (gameOver || currentPlayer !== 1) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left - PADDING) / CELL_SIZE);
        const y = Math.round((event.clientY - rect.top - PADDING) / CELL_SIZE);

        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || board[y][x] !== 0) {
            return;
        }

        board[y][x] = 1;
        drawPiece(x, y, 1);

        if (checkWin(x, y, 1)) {
            gameOver = true;
            setTimeout(() => alert('恭喜！黑方獲勝！'), 100);
            return;
        }

        currentPlayer = 2;
        updateTurnIndicator();
        setTimeout(aiMove, 500);
    }

    function aiMove() {
        if (gameOver) return;

        const move = findBestMove();
        if (move) {
            const { x, y } = move;
            board[y][x] = 2;
            drawPiece(x, y, 2);

            if (checkWin(x, y, 2)) {
                gameOver = true;
                setTimeout(() => alert('AI 獲勝！'), 100);
                return;
            }
        }

        currentPlayer = 1;
        updateTurnIndicator();
    }

    function findBestMove() {
        let bestScore = -Infinity;
        let move = null;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (board[y][x] === 0) {
                    let score = calculateScore(x, y, 2) + calculateScore(x, y, 1);
                    if (score > bestScore) {
                        bestScore = score;
                        move = { x, y };
                    }
                }
            }
        }
        return move;
    }

    function calculateScore(x, y, player) {
        let score = 0;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            let line = [0];
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx, ny = y + i * dy;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) line.push(board[ny][nx]); else { line.push(3); break; }
            }
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx, ny = y - i * dy;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) line.unshift(board[ny][nx]); else { line.unshift(3); break; }
            }

            score += evaluateLine(line, player);
        }
        return score;
    }

    function evaluateLine(line, player) {
        const opponent = player === 1 ? 2 : 1;
        const lineStr = line.join('');
        let score = 0;

        const patterns = {
            // Winning patterns
            [player.toString().repeat(5)]: 100000,
            // Block opponent's win
            ['0' + opponent.toString().repeat(4) + '0']: player === 2 ? 50000 : 0, // AI blocks player's live four
            // Live four
            ['0' + player.toString().repeat(4) + '0']: 10000,
            // Dead four
            ['0' + player.toString().repeat(4)]: 1000,
            [player.toString().repeat(4) + '0']: 1000,
            // Live three
            ['0' + player.toString().repeat(3) + '0']: 500,
            // Dead three
            ['00' + player.toString().repeat(3)]: 100,
            [player.toString().repeat(3) + '00']: 100,
            // Live two
            ['00' + player.toString().repeat(2) + '0']: 50,
            ['0' + player.toString().repeat(2) + '00']: 50,
            // Others
            [player.toString()]: 1
        };

        for (const pattern in patterns) {
            if (lineStr.includes(pattern)) {
                score += patterns[pattern];
            }
        }
        
        // Simplified blocking logic
        if (lineStr.includes('0' + opponent.toString().repeat(3) + '0')) score += 2000; // Block live three
        if (lineStr.includes('0' + opponent.toString().repeat(4))) score += 20000; // Block dead four
        if (lineStr.includes(opponent.toString().repeat(4) + '0')) score += 20000; // Block dead four

        return score;
    }

    canvas.addEventListener('click', handlePlayerMove);
    restartButton.addEventListener('click', initGame);

    initGame();
});
