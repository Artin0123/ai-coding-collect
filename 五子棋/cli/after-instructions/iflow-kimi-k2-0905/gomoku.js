class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = [];
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
        
        this.initGame();
        this.setupEventListeners();
    }
    
    initGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.updateTurnDisplay();
        this.hideMessage();
        this.drawBoard();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('restart-btn').addEventListener('click', () => this.initGame());
    }
    
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const offset = this.cellSize;
        const boardLength = (this.boardSize - 1) * this.cellSize;
        
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(offset, offset, boardLength, boardLength);
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(offset, offset + i * this.cellSize);
            this.ctx.lineTo(offset + boardLength, offset + i * this.cellSize);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(offset + i * this.cellSize, offset);
            this.ctx.lineTo(offset + i * this.cellSize, offset + boardLength);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#8B4513';
        this.starPoints.forEach(([x, y]) => {
            const centerX = offset + x * this.cellSize;
            const centerY = offset + y * this.cellSize;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        
        this.drawPieces();
    }
    
    drawPieces() {
        const offset = this.cellSize;
        const pieceRadius = this.cellSize * 0.4;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece !== 0) {
                    const centerX = offset + col * this.cellSize;
                    const centerY = offset + row * this.cellSize;
                    
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, pieceRadius, 0, 2 * Math.PI);
                    this.ctx.clip();
                    
                    if (piece === 'black') {
                        const gradient = this.ctx.createRadialGradient(
                            centerX - pieceRadius * 0.3, centerY - pieceRadius * 0.3, 0,
                            centerX, centerY, pieceRadius
                        );
                        gradient.addColorStop(0, '#666666');
                        gradient.addColorStop(0.7, '#000000');
                        gradient.addColorStop(1, '#333333');
                        this.ctx.fillStyle = gradient;
                    } else {
                        const gradient = this.ctx.createRadialGradient(
                            centerX - pieceRadius * 0.3, centerY - pieceRadius * 0.3, 0,
                            centerX, centerY, pieceRadius
                        );
                        gradient.addColorStop(0, '#FFFFFF');
                        gradient.addColorStop(0.7, '#E0E0E0');
                        gradient.addColorStop(1, '#B0B0B0');
                        this.ctx.fillStyle = gradient;
                    }
                    
                    this.ctx.fill();
                    this.ctx.strokeStyle = piece === 'black' ? '#000000' : '#888888';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }
    
    handleClick(event) {
        if (this.gameOver || this.currentPlayer !== 'black') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const offset = this.cellSize;
        const col = Math.round((x - offset) / this.cellSize);
        const row = Math.round((y - offset) / this.cellSize);
        
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
            if (this.board[row][col] === 0) {
                this.makeMove(row, col);
            }
        }
    }
    
    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawBoard();
        
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            const winner = this.currentPlayer === 'black' ? '黑方' : '白方';
            this.showMessage(`${winner}獲勝！`);
            return;
        }
        
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.showMessage('平局！');
            return;
        }
        
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateTurnDisplay();
        
        if (this.currentPlayer === 'white') {
            setTimeout(() => this.aiMove(), 500);
        }
    }
    
    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]],   // 水平
            [[1, 0], [-1, 0]],   // 垂直
            [[1, 1], [-1, -1]],  // 對角線1
            [[1, -1], [-1, 1]]   // 對角線2
        ];
        
        const player = this.board[row][col];
        
        for (let direction of directions) {
            let count = 1;
            
            for (let [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                       this.board[r][c] === player) {
                    count++;
                    r += dr;
                    c += dc;
                }
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }
    
    isBoardFull() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) return false;
            }
        }
        return true;
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        const move = this.findBestMove();
        if (move) {
            this.makeMove(move.row, move.col);
        }
    }
    
    findBestMove() {
        let bestMove = null;
        let bestScore = -1;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    const score = this.evaluatePosition(row, col);
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
        
        if (this.canWin(row, col, 'white')) {
            score += 10000;
        }
        
        if (this.canWin(row, col, 'black')) {
            score += 9000;
        }
        
        score += this.countPatterns(row, col, 'white') * 100;
        score += this.countPatterns(row, col, 'black') * 90;
        
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += Math.max(0, 14 - centerDistance) * 5;
        
        score += Math.random() * 10;
        
        return score;
    }
    
    canWin(row, col, player) {
        this.board[row][col] = player;
        const canWin = this.checkWin(row, col);
        this.board[row][col] = 0;
        return canWin;
    }
    
    countPatterns(row, col, player) {
        this.board[row][col] = player;
        let patternCount = 0;
        
        const directions = [
            [[0, 1], [0, -1]],   // 水平
            [[1, 0], [-1, 0]],   // 垂直
            [[1, 1], [-1, -1]],  // 對角線1
            [[1, -1], [-1, 1]]   // 對角線2
        ];
        
        for (let direction of directions) {
            let count = 1;
            let blocked = 0;
            
            for (let [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                    if (this.board[r][c] === player) {
                        count++;
                        r += dr;
                        c += dc;
                    } else if (this.board[r][c] === 0) {
                        break;
                    } else {
                        blocked++;
                        break;
                    }
                }
            }
            
            if (count >= 2 && blocked < 2) {
                patternCount += count * count;
            }
        }
        
        this.board[row][col] = 0;
        return patternCount;
    }
    
    updateTurnDisplay() {
        const turnElement = document.getElementById('current-turn');
        turnElement.textContent = this.currentPlayer === 'black' ? '黑方' : '白方';
        turnElement.style.color = this.currentPlayer === 'black' ? '#000000' : '#4A90E2';
    }
    
    showMessage(message) {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
        messageElement.classList.add('show');
    }
    
    hideMessage() {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = '';
        messageElement.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});