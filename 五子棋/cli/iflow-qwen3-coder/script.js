class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1 for black, 2 for white
        this.gameOver = false;
        this.boardElement = document.getElementById('board');
        this.currentPlayerElement = document.getElementById('current-player');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.initBoard();
        this.setupEventListeners();
    }
    
    initBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.width = `${this.boardSize * 30}px`;
        this.boardElement.style.height = `${this.boardSize * 30}px`;
        
        // Create cells
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.left = `${i * 30}px`;
                cell.style.top = `${j * 30}px`;
                cell.dataset.row = j;
                cell.dataset.col = i;
                
                // Add star points
                if ((i === 3 && j === 3) || (i === 3 && j === 11) || 
                    (i === 11 && j === 3) || (i === 11 && j === 11) || 
                    (i === 7 && j === 7)) {
                    cell.classList.add('star-point');
                }
                
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 1) return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.board[row][col] === 0) {
                this.placePiece(row, col, 1);
                if (!this.gameOver) {
                    this.switchPlayer();
                    setTimeout(() => this.aiMove(), 500);
                }
            }
        });
        
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    placePiece(row, col, player) {
        this.board[row][col] = player;
        
        const piece = document.createElement('div');
        piece.className = player === 1 ? 'black-piece' : 'white-piece';
        
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.appendChild(piece);
        
        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            const winner = player === 1 ? '黑方' : '白方';
            setTimeout(() => alert(`${winner}獲勝！`), 100);
        }
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.currentPlayerElement.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
    }
    
    checkWin(row, col, player) {
        // Check horizontal
        let count = 1;
        for (let i = col - 1; i >= 0 && this.board[row][i] === player; i--) count++;
        for (let i = col + 1; i < this.boardSize && this.board[row][i] === player; i++) count++;
        if (count >= 5) return true;
        
        // Check vertical
        count = 1;
        for (let i = row - 1; i >= 0 && this.board[i][col] === player; i--) count++;
        for (let i = row + 1; i < this.boardSize && this.board[i][col] === player; i++) count++;
        if (count >= 5) return true;
        
        // Check diagonal (top-left to bottom-right)
        count = 1;
        for (let i = 1; row - i >= 0 && col - i >= 0 && this.board[row - i][col - i] === player; i++) count++;
        for (let i = 1; row + i < this.boardSize && col + i < this.boardSize && this.board[row + i][col + i] === player; i++) count++;
        if (count >= 5) return true;
        
        // Check diagonal (top-right to bottom-left)
        count = 1;
        for (let i = 1; row - i >= 0 && col + i < this.boardSize && this.board[row - i][col + i] === player; i++) count++;
        for (let i = 1; row + i < this.boardSize && col - i >= 0 && this.board[row + i][col - i] === player; i++) count++;
        if (count >= 5) return true;
        
        return false;
    }
    
    restartGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.currentPlayerElement.textContent = '黑方';
        this.initBoard();
    }
    
    aiMove() {
        if (this.gameOver || this.currentPlayer !== 2) return;
        
        let bestMove = this.getBestMove();
        this.placePiece(bestMove.row, bestMove.col, 2);
        
        if (!this.gameOver) {
            this.switchPlayer();
        }
    }
    
    getBestMove() {
        let bestScore = -Infinity;
        let bestMoves = [];
        
        // Evaluate each empty position
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    // Check if this move can win the game
                    this.board[i][j] = 2;
                    if (this.checkWin(i, j, 2)) {
                        this.board[i][j] = 0; // Reset
                        return {row: i, col: j};
                    }
                    this.board[i][j] = 0; // Reset
                    
                    // Check if this move can block player's win
                    this.board[i][j] = 1;
                    if (this.checkWin(i, j, 1)) {
                        this.board[i][j] = 0; // Reset
                        return {row: i, col: j};
                    }
                    this.board[i][j] = 0; // Reset
                    
                    // Evaluate the position
                    const score = this.evaluatePosition(i, j);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [{row: i, col: j}];
                    } else if (score === bestScore) {
                        bestMoves.push({row: i, col: j});
                    }
                }
            }
        }
        
        // If no good moves found, return a random valid move
        if (bestMoves.length === 0) {
            let emptyCells = [];
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    if (this.board[i][j] === 0) {
                        emptyCells.push({row: i, col: j});
                    }
                }
            }
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        
        // Return a random move from the best moves
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    
    evaluatePosition(row, col) {
        let score = 0;
        
        // Prefer center positions
        const center = Math.floor(this.boardSize / 2);
        score += (this.boardSize - Math.abs(row - center) - Math.abs(col - center)) * 2;
        
        // Prefer positions near existing pieces
        for (let i = Math.max(0, row - 2); i <= Math.min(this.boardSize - 1, row + 2); i++) {
            for (let j = Math.max(0, col - 2); j <= Math.min(this.boardSize - 1, col + 2); j++) {
                if (this.board[i][j] !== 0) {
                    score += 3;
                }
            }
        }
        
        // Evaluate potential for creating patterns
        // Check horizontal
        let count = 1;
        for (let i = col - 1; i >= 0 && this.board[row][i] === 2; i--) count++;
        for (let i = col + 1; i < this.boardSize && this.board[row][i] === 2; i++) count++;
        if (count >= 3) score += count * 5;
        
        // Check vertical
        count = 1;
        for (let i = row - 1; i >= 0 && this.board[i][col] === 2; i--) count++;
        for (let i = row + 1; i < this.boardSize && this.board[i][col] === 2; i++) count++;
        if (count >= 3) score += count * 5;
        
        // Check diagonal (top-left to bottom-right)
        count = 1;
        for (let i = 1; row - i >= 0 && col - i >= 0 && this.board[row - i][col - i] === 2; i++) count++;
        for (let i = 1; row + i < this.boardSize && col + i < this.boardSize && this.board[row + i][col + i] === 2; i++) count++;
        if (count >= 3) score += count * 5;
        
        // Check diagonal (top-right to bottom-left)
        count = 1;
        for (let i = 1; row - i >= 0 && col + i < this.boardSize && this.board[row - i][col + i] === 2; i++) count++;
        for (let i = 1; row + i < this.boardSize && col - i >= 0 && this.board[row + i][col - i] === 2; i++) count++;
        if (count >= 3) score += count * 5;
        
        return score;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});