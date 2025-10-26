class GobangGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1 for black, 2 for white
        this.gameOver = false;
        this.canvas = null;
        this.ctx = null;
        this.cellSize = 40;
        this.stoneRadius = 18;
        
        this.init();
    }
    
    init() {
        const boardElement = document.getElementById('gobang-board');
        this.canvas = document.createElement('canvas');
        this.canvas.width = 600;
        this.canvas.height = 600;
        this.ctx = this.canvas.getContext('2d');
        boardElement.appendChild(this.canvas);
        
        this.drawBoard();
        this.addEventListeners();
        
        // Initial UI update
        this.updatePlayerDisplay();
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const boardSize = this.boardSize;
        const cellSize = this.cellSize;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board background
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        
        // Draw horizontal lines
        for (let i = 0; i < boardSize; i++) {
            ctx.beginPath();
            ctx.moveTo(cellSize, cellSize + i * cellSize);
            ctx.lineTo(cellSize + (boardSize - 1) * cellSize, cellSize + i * cellSize);
            ctx.stroke();
        }
        
        // Draw vertical lines
        for (let j = 0; j < boardSize; j++) {
            ctx.beginPath();
            ctx.moveTo(cellSize + j * cellSize, cellSize);
            ctx.lineTo(cellSize + j * cellSize, cellSize + (boardSize - 1) * cellSize);
            ctx.stroke();
        }
        
        // Draw star points (天元和星位)
        const starPoints = [
            [3, 3], [3, 11],
            [7, 7],
            [11, 3], [11, 11]
        ];
        
        ctx.fillStyle = '#8B4513';
        starPoints.forEach(point => {
            const [x, y] = point;
            ctx.beginPath();
            ctx.arc(
                cellSize + x * cellSize,
                cellSize + y * cellSize,
                4, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        // Draw stones
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (this.board[i][j] !== 0) {
                    this.drawStone(i, j, this.board[i][j]);
                }
            }
        }
    }
    
    drawStone(row, col, player) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const stoneRadius = this.stoneRadius;
        
        const x = cellSize + col * cellSize;
        const y = cellSize + row * cellSize;
        
        // Create gradient for stone
        const gradient = ctx.createRadialGradient(
            x - 3, y - 3, 2,
            x, y, stoneRadius
        );
        
        if (player === 1) { // Black stone
            gradient.addColorStop(0, '#000');
            gradient.addColorStop(1, '#666');
        } else { // White stone
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
        }
        
        // Draw stone
        ctx.beginPath();
        ctx.arc(x, y, stoneRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    addEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 1) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const col = Math.round((x - this.cellSize) / this.cellSize);
            const row = Math.round((y - this.cellSize) / this.cellSize);
            
            if (this.isValidMove(row, col)) {
                this.makeMove(row, col, 1);
                if (!this.gameOver) {
                    this.switchPlayer();
                    this.updatePlayerDisplay();
                    // AI makes a move after a short delay
                    setTimeout(() => this.aiMove(), 500);
                }
            }
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === 0;
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.drawStone(row, col, player);
        
        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            const winner = player === 1 ? '黑方' : '白方';
            setTimeout(() => alert(`${winner}獲勝！`), 100);
        }
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }
    
    updatePlayerDisplay() {
        const playerText = this.currentPlayer === 1 ? '黑方' : '白方';
        document.getElementById('current-player').textContent = playerText;
    }
    
    checkWin(row, col, player) {
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal /
            [1, -1]  // diagonal \
        ];
        
        for (let [dx, dy] of directions) {
            let count = 1;
            
            // Check in positive direction
            for (let i = 1; i < 5; i++) {
                const r = row + dx * i;
                const c = col + dy * i;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                    this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // Check in negative direction
            for (let i = 1; i < 5; i++) {
                const r = row - dx * i;
                const c = col - dy * i;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                    this.board[r][c] === player) {
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
    
    restart() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.drawBoard();
        this.updatePlayerDisplay();
    }
    
    // AI implementation will be added here
    aiMove() {
        if (this.gameOver) return;
        
        // Simple AI strategy:
        // 1. Check if AI can win in one move
        // 2. Check if player can win in one move and block
        // 3. Otherwise, make a strategic move
        
        let move = this.findWinningMove(2); // Check for AI win
        if (!move) {
            move = this.findWinningMove(1); // Check for player win to block
        }
        if (!move) {
            move = this.findStrategicMove();
        }
        
        if (move) {
            this.makeMove(move.row, move.col, 2);
            if (!this.gameOver) {
                this.switchPlayer();
                this.updatePlayerDisplay();
            }
        }
    }
    
    findWinningMove(player) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    // Temporarily make the move
                    this.board[row][col] = player;
                    const isWinning = this.checkWin(row, col, player);
                    // Revert the move
                    this.board[row][col] = 0;
                    
                    if (isWinning) {
                        return { row, col };
                    }
                }
            }
        }
        return null;
    }
    
    findStrategicMove() {
        // Simple strategy: find an empty spot near existing stones
        // Prioritize center area
        
        // First, try to place near existing stones
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0 && this.hasAdjacentStone(row, col)) {
                    return { row, col };
                }
            }
        }
        
        // If no adjacent stone, place in center area
        const center = Math.floor(this.boardSize / 2);
        const offsets = [0, -1, 1, -2, 2];
        
        for (let offsetRow of offsets) {
            for (let offsetCol of offsets) {
                const row = center + offsetRow;
                const col = center + offsetCol;
                if (row >= 0 && row < this.boardSize && 
                    col >= 0 && col < this.boardSize && 
                    this.board[row][col] === 0) {
                    return { row, col };
                }
            }
        }
        
        // Fallback: first empty spot
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    return { row, col };
                }
            }
        }
        
        return null;
    }
    
    hasAdjacentStone(row, col) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (let [dx, dy] of directions) {
            const r = row + dx;
            const c = col + dy;
            if (r >= 0 && r < this.boardSize && 
                c >= 0 && c < this.boardSize && 
                this.board[r][c] !== 0) {
                return true;
            }
        }
        return false;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new GobangGame();
    window.gobangGame = game; // Make it globally accessible for debugging
});