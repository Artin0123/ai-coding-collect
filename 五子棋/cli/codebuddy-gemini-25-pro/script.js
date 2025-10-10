document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gobang-board');
    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restart-button');
    const currentPlayerSpan = document.getElementById('current-player');

    const BOARD_SIZE = 15;
    const PADDING = 20; // Corresponds to the padding in CSS
    const GRID_SIZE = (canvas.width - 2 * PADDING) / (BOARD_SIZE - 1);
    const PIECE_RADIUS = GRID_SIZE / 2 * 0.9;

    let board = [];
    let isPlayerTurn = true;
    let gameOver = false;

    function init() {
        // Reset game state
        board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
        isPlayerTurn = true;
        gameOver = false;
        updateTurnIndicator();
        drawBoard();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#DEB887'; // Board color from CSS
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        // Draw grid lines
        for (let i = 0; i < BOARD_SIZE; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(PADDING + i * GRID_SIZE, PADDING);
            ctx.lineTo(PADDING + i * GRID_SIZE, canvas.height - PADDING);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(PADDING, PADDING + i * GRID_SIZE);
            ctx.lineTo(canvas.width - PADDING, PADDING + i * GRID_SIZE);
            ctx.stroke();
        }

        // Draw star points
        const starPoints = [
            [3, 3], [11, 3],
            [3, 11], [11, 11],
            [7, 7] // Center
        ];
        ctx.fillStyle = '#8B4513';
        starPoints.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(PADDING + x * GRID_SIZE, PADDING + y * GRID_SIZE, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawPiece(x, y, player) {
        const cx = PADDING + x * GRID_SIZE;
        const cy = PADDING + y * GRID_SIZE;
        
        ctx.beginPath();
        ctx.arc(cx, cy, PIECE_RADIUS, 0, 2 * Math.PI);

        let gradient;
        if (player === 1) { // Black piece
            gradient = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, PIECE_RADIUS);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else { // White piece
            gradient = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, PIECE_RADIUS);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    function updateTurnIndicator() {
        if (gameOver) return;
        currentPlayerSpan.textContent = isPlayerTurn ? '黑方' : '白方';
    }

    function handleCanvasClick(event) {
        if (gameOver || !isPlayerTurn) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left - PADDING) / GRID_SIZE);
        const y = Math.round((event.clientY - rect.top - PADDING) / GRID_SIZE);

        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;

        if (board[y][x] === 0) {
            placePiece(x, y, 1); // Player is black (1)

            if (checkWin(x, y, 1)) {
                endGame('恭喜！黑方獲勝！');
                return;
            }

            isPlayerTurn = false;
            updateTurnIndicator();
            setTimeout(aiMove, 500); // AI moves after a short delay
        }
    }
    
    function placePiece(x, y, player) {
        board[y][x] = player;
        drawPiece(x, y, player);
    }

    function endGame(message) {
        gameOver = true;
        // Use setTimeout to ensure the last piece is drawn before the alert
        setTimeout(() => {
            alert(message);
        }, 100);
    }

    function checkWin(x, y, player) {
        // Directions: horizontal, vertical, diagonal (down-right), diagonal (up-right)
        const directions = [
            [1, 0], [0, 1], [1, 1], [1, -1]
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            // Check in positive direction
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                    count++;
                } else {
                    break;
                }
            }
            // Check in negative direction
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

    function aiMove() {
        if (gameOver) return;

        const bestMove = findBestMove();
        if (bestMove) {
            placePiece(bestMove.x, bestMove.y, 2); // AI is white (2)
            if (checkWin(bestMove.x, bestMove.y, 2)) {
                endGame('可惜！白方獲勝！');
                return;
            }
        }
        
        isPlayerTurn = true;
        updateTurnIndicator();
    }

    function findBestMove() {
        let bestScore = -Infinity;
        let move = null;

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) {
                    // Calculate score for this move
                    const score = calculateScore(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        move = { x, y };
                    }
                }
            }
        }
        return move;
    }

    function calculateScore(x, y) {
        // Score for AI (player 2)
        const offensiveScore = evaluatePosition(x, y, 2);
        // Score for blocking Player (player 1)
        const defensiveScore = evaluatePosition(x, y, 1);

        // Defensive score is slightly more important
        return offensiveScore + defensiveScore * 1.2;
    }

    function evaluatePosition(x, y, player) {
        let score = 0;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        const scores = {
            '5': 100000, // 5 in a row
            '4_live': 10000, // live 4
            '4_dead': 1000,  // dead 4
            '3_live': 1000,  // live 3
            '3_dead': 100,   // dead 3
            '2_live': 10,    // live 2
            '2_dead': 1,     // dead 2
        };

        board[y][x] = player; // Temporarily place piece

        for (const [dx, dy] of directions) {
            let consecutive = 1;
            let openEnds = 0;
            let line = [player];

            // Positive direction
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx, ny = y + i * dy;
                if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
                line.push(board[ny][nx]);
            }
            // Negative direction
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx, ny = y - i * dy;
                if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
                line.unshift(board[ny][nx]);
            }
            
            // Find our consecutive pieces around the newly placed one
            const centerIndex = line.indexOf(player, line.findIndex(p => p === player));
            
            // Right side from center
            for(let i = centerIndex + 1; i < line.length; i++){
                if(line[i] === player) consecutive++;
                else { if(line[i] === 0) openEnds++; break; }
            }
            // Left side from center
            for(let i = centerIndex - 1; i >= 0; i--){
                if(line[i] === player) consecutive++;
                else { if(line[i] === 0) openEnds++; break; }
            }

            if (consecutive >= 5) score += scores['5'];
            else if (consecutive === 4) {
                if (openEnds === 2) score += scores['4_live'];
                else if (openEnds === 1) score += scores['4_dead'];
            } else if (consecutive === 3) {
                if (openEnds === 2) score += scores['3_live'];
                else if (openEnds === 1) score += scores['3_dead'];
            } else if (consecutive === 2) {
                if (openEnds === 2) score += scores['2_live'];
                else if (openEnds === 1) score += scores['2_dead'];
            }
        }

        board[y][x] = 0; // Remove temporary piece
        return score;
    }

    // Event Listeners
    canvas.addEventListener('click', handleCanvasClick);
    restartButton.addEventListener('click', init);

    // Initial game setup
    init();
});
