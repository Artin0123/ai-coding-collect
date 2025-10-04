class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.currentTurnElement = document.getElementById('current-turn');
        this.gameMessageElement = document.getElementById('game-message');
        this.restartButton = document.getElementById('restart-btn');
        
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = [];
        this.currentPlayer = 1; // 1 for black (player), 2 for white (AI)
        this.gameOver = false;
        
        this.initializeBoard();
        this.drawBoard();
        this.bindEvents();
    }
    
    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = 0;
            }
        }
        this.currentPlayer = 1;
        this.gameOver = false;
        this.updateCurrentTurn();
        this.gameMessageElement.textContent = '';
        this.gameMessageElement.className = 'game-message';
    }
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.restartButton.addEventListener('click', () => this.restart());
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        
        // Draw vertical lines
        for (let i = 0; i < this.boardSize; i++) {
            const x = cellSize + i * cellSize;
            ctx.beginPath();
            ctx.moveTo(x, cellSize);
            ctx.lineTo(x, cellSize + (this.boardSize - 1) * cellSize);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 0; i < this.boardSize; i++) {
            const y = cellSize + i * cellSize;
            ctx.beginPath();
            ctx.moveTo(cellSize, y);
            ctx.lineTo(cellSize + (this.boardSize - 1) * cellSize, y);
            ctx.stroke();
        }
        
        // Draw star points (9 points)
        const starPoints = [
            [3, 3], [3, 7], [3, 11],
            [7, 3], [7, 7], [7, 11],
            [11, 3], [11, 7], [11, 11]
        ];
        
        ctx.fillStyle = '#8B4513';
        starPoints.forEach(([row, col]) => {
            const x = cellSize + col * cellSize;
            const y = cellSize + row * cellSize;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Draw pieces
        this.drawPieces();
    }
    
    drawPieces() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const pieceRadius = cellSize * 0.4;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    const x = cellSize + col * cellSize;
                    const y = cellSize + row * cellSize;
                    
                    if (this.board[row][col] === 1) {
                        // Black piece with gradient
                        const gradient = ctx.createRadialGradient(
                            x - pieceRadius * 0.3, y - pieceRadius * 0.3, 0,
                            x, y, pieceRadius
                        );
                        gradient.addColorStop(0, '#666666');
                        gradient.addColorStop(0.7, '#222222');
                        gradient.addColorStop(1, '#000000');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(x, y, pieceRadius, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // Add highlight
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.beginPath();
                        ctx.arc(x - pieceRadius * 0.3, y - pieceRadius * 0.3, pieceRadius * 0.3, 0, 2 * Math.PI);
                        ctx.fill();
                    } else {
                        // White piece with gradient
                        const gradient = ctx.createRadialGradient(
                            x - pieceRadius * 0.3, y - pieceRadius * 0.3, 0,
                            x, y, pieceRadius
                        );
                        gradient.addColorStop(0, '#FFFFFF');
                        gradient.addColorStop(0.7, '#E0E0E0');
                        gradient.addColorStop(1, '#CCCCCC');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(x, y, pieceRadius, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // Add border
                        ctx.strokeStyle = '#999999';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }
    }
    
    handleClick(event) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert to grid coordinates
        const col = Math.round((x - this.cellSize) / this.cellSize);
        const row = Math.round((y - this.cellSize) / this.cellSize);
        
        // Check if click is within bounds
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
            if (this.board[row][col] === 0) {
                this.makeMove(row, col, 1);
            }
        }
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.drawBoard();
        
        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            const winner = player === 1 ? '黑方' : '白方';
            this.gameMessageElement.textContent = `${winner}获胜！`;
            this.gameMessageElement.className = 'game-message winner-message';
            return;
        }
        
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.gameMessageElement.textContent = '平局！';
            this.gameMessageElement.className = 'game-message winner-message';
            return;
        }
        
        this.currentPlayer = player === 1 ? 2 : 1;
        this.updateCurrentTurn();
        
        // AI move
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => {
                this.aiMove();
            }, 500);
        }
    }
    
    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];
        
        for (let [dx, dy] of directions) {
            let count = 1;
            
            // Check positive direction
            let r = row + dx;
            let c = col + dy;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                count++;
                r += dx;
                c += dy;
            }
            
            // Check negative direction
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                count++;
                r -= dx;
                c -= dy;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    isBoardFull() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        const move = this.getBestMove();
        if (move) {
            this.makeMove(move.row, move.col, 2);
        }
    }
    
    getBestMove() {
        // Priority 1: Win if possible
        let move = this.findWinningMove(2);
        if (move) return move;
        
        // Priority 2: Block player's winning move
        move = this.findWinningMove(1);
        if (move) return move;
        
        // Priority 3: Create threats or defend
        move = this.findBestStrategicMove();
        if (move) return move;
        
        // Priority 4: Random move near existing pieces
        return this.findRandomMove();
    }
    
    findWinningMove(player) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    if (this.checkWin(row, col, player)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        return null;
    }
    
    findBestStrategicMove() {
        let bestScore = -1;
        let bestMove = null;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    let score = this.evaluatePosition(row, col);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col };
                    }
                }
            }
        }
        
        return bestMove;
    }
    
    evaluatePosition(row, col) {
        let score = 0;
        
        // Center preference
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;
        
        // Adjacent to existing pieces
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                    if (this.board[r][c] !== 0) {
                        score += 10;
                    }
                }
            }
        }
        
        // Evaluate potential lines
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (let [dx, dy] of directions) {
            score += this.evaluateLine(row, col, dx, dy, 2) * 3;
            score += this.evaluateLine(row, col, dx, dy, 1) * 2;
        }
        
        return score;
    }
    
    evaluateLine(row, col, dx, dy, player) {
        let count = 0;
        let blocked = 0;
        
        // Check positive direction
        for (let i = 1; i < 5; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                blocked++;
                break;
            }
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] !== 0) {
                blocked++;
                break;
            } else {
                break;
            }
        }
        
        // Check negative direction
        for (let i = 1; i < 5; i++) {
            const r = row - i * dx;
            const c = col - i * dy;
            if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                blocked++;
                break;
            }
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] !== 0) {
                blocked++;
                break;
            } else {
                break;
            }
        }
        
        if (blocked >= 2) return 0;
        return count * count;
    }
    
    findRandomMove() {
        const moves = [];
        
        // Prefer moves near existing pieces
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    let weight = 1;
                    
                    // Check if near existing pieces
                    for (let dr = -2; dr <= 2; dr++) {
                        for (let dc = -2; dc <= 2; dc++) {
                            const r = row + dr;
                            const c = col + dc;
                            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                                if (this.board[r][c] !== 0) {
                                    weight += 5;
                                }
                            }
                        }
                    }
                    
                    // Add center preference
                    const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
                    weight += (14 - centerDistance);
                    
                    for (let i = 0; i < weight; i++) {
                        moves.push({ row, col });
                    }
                }
            }
        }
        
        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }
    
    updateCurrentTurn() {
        this.currentTurnElement.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
    }
    
    restart() {
        this.initializeBoard();
        this.drawBoard();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});