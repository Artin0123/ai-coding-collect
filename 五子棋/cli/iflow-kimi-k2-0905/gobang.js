class GobangGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
        
        this.initBoard();
        this.drawBoard();
        this.bindEvents();
    }
    
    initBoard() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    }
    
    drawBoard() {
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize, this.cellSize + i * this.cellSize);
            this.ctx.lineTo(this.boardSize * this.cellSize, this.cellSize + i * this.cellSize);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize + i * this.cellSize, this.cellSize);
            this.ctx.lineTo(this.cellSize + i * this.cellSize, this.boardSize * this.cellSize);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#8B4513';
        this.starPoints.forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.arc(
                (x + 1) * this.cellSize,
                (y + 1) * this.cellSize,
                4,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
        });
        
        this.drawPieces();
    }
    
    drawPieces() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j]) {
                    this.drawPiece(j, i, this.board[i][j]);
                }
            }
        }
    }
    
    drawPiece(x, y, color) {
        const centerX = (x + 1) * this.cellSize;
        const centerY = (y + 1) * this.cellSize;
        const radius = this.cellSize * 0.4;
        
        const gradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            0,
            centerX,
            centerY,
            radius
        );
        
        if (color === 'black') {
            gradient.addColorStop(0, '#666666');
            gradient.addColorStop(0.7, '#333333');
            gradient.addColorStop(1, '#000000');
        } else {
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#F0F0F0');
            gradient.addColorStop(1, '#E0E0E0');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = color === 'black' ? '#000000' : '#CCCCCC';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 'black') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const boardX = Math.round((x - this.cellSize) / this.cellSize);
            const boardY = Math.round((y - this.cellSize) / this.cellSize);
            
            if (boardX >= 0 && boardX < this.boardSize && 
                boardY >= 0 && boardY < this.boardSize && 
                !this.board[boardY][boardX]) {
                
                this.makeMove(boardX, boardY, 'black');
                
                if (!this.gameOver) {
                    setTimeout(() => this.aiMove(), 500);
                }
            }
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    makeMove(x, y, color) {
        if (this.gameOver || this.board[y][x]) return false;
        
        this.board[y][x] = color;
        this.drawBoard();
        
        if (this.checkWin(x, y, color)) {
            this.gameOver = true;
            const winner = color === 'black' ? '黑方' : '白方';
            this.showMessage(`${winner}獲勝！`);
            return true;
        }
        
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateTurnDisplay();
        return true;
    }
    
    checkWin(x, y, color) {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        for (let direction of directions) {
            let count = 1;
            
            for (let [dx, dy] of direction) {
                let nx = x + dx;
                let ny = y + dy;
                
                while (nx >= 0 && nx < this.boardSize && 
                       ny >= 0 && ny < this.boardSize && 
                       this.board[ny][nx] === color) {
                    count++;
                    nx += dx;
                    ny += dy;
                }
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        const move = this.findBestMove();
        if (move) {
            this.makeMove(move.x, move.y, 'white');
        }
    }
    
    findBestMove() {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (!this.board[y][x]) {
                    const score = this.evaluatePosition(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { x, y };
                    }
                }
            }
        }
        
        return bestMove;
    }
    
    evaluatePosition(x, y) {
        let score = 0;
        
        this.board[y][x] = 'white';
        score += this.getPositionScore(x, y, 'white') * 2;
        this.board[y][x] = null;
        
        this.board[y][x] = 'black';
        score += this.getPositionScore(x, y, 'black');
        this.board[y][x] = null;
        
        return score;
    }
    
    getPositionScore(x, y, color) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        let maxScore = 0;
        
        for (let [dx, dy] of directions) {
            let count = 1;
            let blocked = 0;
            
            for (let direction of [[dx, dy], [-dx, -dy]]) {
                let nx = x + direction[0];
                let ny = y + direction[1];
                
                while (nx >= 0 && nx < this.boardSize && 
                       ny >= 0 && ny < this.boardSize) {
                    if (this.board[ny][nx] === color) {
                        count++;
                    } else {
                        if (this.board[ny][nx] !== null) {
                            blocked++;
                        }
                        break;
                    }
                    nx += direction[0];
                    ny += direction[1];
                }
            }
            
            let score = 0;
            if (count >= 5) {
                score = 100000;
            } else if (count === 4 && blocked === 0) {
                score = 10000;
            } else if (count === 4 && blocked === 1) {
                score = 1000;
            } else if (count === 3 && blocked === 0) {
                score = 1000;
            } else if (count === 3 && blocked === 1) {
                score = 100;
            } else if (count === 2 && blocked === 0) {
                score = 100;
            } else if (count === 2 && blocked === 1) {
                score = 10;
            } else if (count === 1) {
                score = 10;
            }
            
            maxScore = Math.max(maxScore, score);
        }
        
        return maxScore;
    }
    
    updateTurnDisplay() {
        const turnDisplay = document.getElementById('turn-display');
        turnDisplay.textContent = this.currentPlayer === 'black' ? '黑方' : '白方';
    }
    
    showMessage(message) {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
        messageElement.className = 'game-message win-message';
    }
    
    restart() {
        this.initBoard();
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.drawBoard();
        this.updateTurnDisplay();
        
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = '';
        messageElement.className = 'game-message';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GobangGame();
});