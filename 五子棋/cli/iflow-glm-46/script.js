class Gomoku {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = 40;
        this.boardPadding = 20;
        this.board = [];
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.isPlayerTurn = true;
        
        this.initializeBoard();
        this.drawBoard();
        this.bindEvents();
        this.updateTurnDisplay();
    }
    
    initializeBoard() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const padding = this.boardPadding;
        
        // 清空畫布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製棋盤背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製網格線
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.boardSize; i++) {
            // 橫線
            ctx.beginPath();
            ctx.moveTo(padding, padding + i * cellSize);
            ctx.lineTo(padding + (this.boardSize - 1) * cellSize, padding + i * cellSize);
            ctx.stroke();
            
            // 豎線
            ctx.beginPath();
            ctx.moveTo(padding + i * cellSize, padding);
            ctx.lineTo(padding + i * cellSize, padding + (this.boardSize - 1) * cellSize);
            ctx.stroke();
        }
        
        // 繪製星位
        const starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
        ];
        
        ctx.fillStyle = '#8B4513';
        starPoints.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(
                padding + x * cellSize,
                padding + y * cellSize,
                4,
                0,
                2 * Math.PI
            );
            ctx.fill();
        });
        
        // 重新繪製所有棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col]);
                }
            }
        }
    }
    
    drawPiece(row, col, player) {
        const ctx = this.ctx;
        const x = this.boardPadding + col * this.cellSize;
        const y = this.boardPadding + row * this.cellSize;
        const radius = this.cellSize * 0.4;
        
        // 創建漸層效果
        const gradient = ctx.createRadialGradient(
            x - radius/3, y - radius/3, 0,
            x, y, radius
        );
        
        if (player === 1) {
            // 黑子漸層
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(0.7, '#000000');
            gradient.addColorStop(1, '#000000');
        } else {
            // 白子漸層
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#F0F0F0');
            gradient.addColorStop(1, '#CCCCCC');
        }
        
        // 繪製棋子
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加邊框
        ctx.strokeStyle = player === 1 ? '#000000' : '#888888';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }
    
    handleClick(event) {
        if (this.gameOver || !this.isPlayerTurn) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const col = Math.round((x - this.boardPadding) / this.cellSize);
        const row = Math.round((y - this.boardPadding) / this.cellSize);
        
        if (this.isValidMove(row, col)) {
            this.makeMove(row, col, this.currentPlayer);
            
            if (this.checkWin(row, col, this.currentPlayer)) {
                this.endGame('黑方獲勝！');
                return;
            }
            
            if (this.isBoardFull()) {
                this.endGame('平局！');
                return;
            }
            
            this.currentPlayer = 2;
            this.isPlayerTurn = false;
            this.updateTurnDisplay();
            
            // AI延遲下棋
            setTimeout(() => this.aiMove(), 500);
        }
    }
    
    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === 0;
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.drawPiece(row, col, player);
    }
    
    checkWin(row, col, player) {
        const directions = [
            [[0, 1], [0, -1]],   // 橫向
            [[1, 0], [-1, 0]],   // 縱向
            [[1, 1], [-1, -1]],  // 主對角線
            [[1, -1], [-1, 1]]   // 副對角線
        ];
        
        for (const direction of directions) {
            let count = 1;
            
            for (const [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.boardSize && 
                       c >= 0 && c < this.boardSize && 
                       this.board[r][c] === player) {
                    count++;
                    r += dr;
                    c += dc;
                }
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
            this.makeMove(move.row, move.col, this.currentPlayer);
            
            if (this.checkWin(move.row, move.col, this.currentPlayer)) {
                this.endGame('白方獲勝！');
                return;
            }
            
            if (this.isBoardFull()) {
                this.endGame('平局！');
                return;
            }
            
            this.currentPlayer = 1;
            this.isPlayerTurn = true;
            this.updateTurnDisplay();
        }
    }
    
    getBestMove() {
        // 評估所有可能的位置
        let bestScore = -Infinity;
        let bestMove = null;
        
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
        
        // 檢查是否可以立即獲勝
        this.board[row][col] = 2;
        if (this.checkWin(row, col, 2)) {
            this.board[row][col] = 0;
            return 10000;
        }
        this.board[row][col] = 0;
        
        // 檢查是否需要阻止玩家獲勝
        this.board[row][col] = 1;
        if (this.checkWin(row, col, 1)) {
            this.board[row][col] = 0;
            return 9000;
        }
        this.board[row][col] = 0;
        
        // 評估攻擊和防守潛力
        score += this.evaluateLine(row, col, 2) * 10; // AI攻擊
        score += this.evaluateLine(row, col, 1) * 8;  // 防守
        
        // 中心位置加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance);
        
        return score;
    }
    
    evaluateLine(row, col, player) {
        let score = 0;
        const directions = [
            [[0, 1], [0, -1]],   // 橫向
            [[1, 0], [-1, 0]],   // 縱向
            [[1, 1], [-1, -1]],  // 主對角線
            [[1, -1], [-1, 1]]   // 副對角線
        ];
        
        this.board[row][col] = player;
        
        for (const direction of directions) {
            let count = 1;
            let openEnds = 0;
            
            for (const [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                let consecutive = 0;
                
                while (r >= 0 && r < this.boardSize && 
                       c >= 0 && c < this.boardSize && 
                       this.board[r][c] === player) {
                    consecutive++;
                    r += dr;
                    c += dc;
                }
                
                count += consecutive;
                
                // 檢查開放端
                if (r >= 0 && r < this.boardSize && 
                    c >= 0 && c < this.boardSize && 
                    this.board[r][c] === 0) {
                    openEnds++;
                }
            }
            
            // 根據連子數和開放端評分
            if (count >= 5) score += 10000;
            else if (count === 4 && openEnds === 2) score += 5000;
            else if (count === 4 && openEnds === 1) score += 1000;
            else if (count === 3 && openEnds === 2) score += 500;
            else if (count === 3 && openEnds === 1) score += 100;
            else if (count === 2 && openEnds === 2) score += 50;
            else if (count === 2 && openEnds === 1) score += 10;
        }
        
        this.board[row][col] = 0;
        return score;
    }
    
    updateTurnDisplay() {
        const playerText = this.currentPlayer === 1 ? '黑方' : '白方';
        document.getElementById('current-player').textContent = playerText;
    }
    
    endGame(message) {
        this.gameOver = true;
        this.showMessage(message);
    }
    
    showMessage(text) {
        const messageEl = document.getElementById('game-message');
        messageEl.textContent = text;
        messageEl.classList.remove('hidden');
        messageEl.classList.add('show');
        
        setTimeout(() => {
            messageEl.classList.remove('show');
            messageEl.classList.add('hidden');
        }, 3000);
    }
    
    restart() {
        this.gameOver = false;
        this.currentPlayer = 1;
        this.isPlayerTurn = true;
        this.initializeBoard();
        this.drawBoard();
        this.updateTurnDisplay();
        
        const messageEl = document.getElementById('game-message');
        messageEl.classList.remove('show');
        messageEl.classList.add('hidden');
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new Gomoku();
});