class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = 30;
        this.padding = 30;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1: 黑方(玩家), 2: 白方(AI)
        this.gameOver = false;
        this.starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11],
            [3, 7], [7, 3], [7, 11], [11, 7]
        ];
        
        this.init();
    }

    init() {
        // 設置畫布大小
        this.canvas.width = this.boardSize * this.cellSize + 2 * this.padding;
        this.canvas.height = this.boardSize * this.cellSize + 2 * this.padding;
        
        // 綁定事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.getElementById('restart-btn').addEventListener('click', this.restart.bind(this));
        
        // 繪製初始棋盤
        this.drawBoard();
        this.updateTurnDisplay();
    }

    drawBoard() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製棋盤背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製网格線
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < this.boardSize; i++) {
            // 橫線
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, this.padding + i * this.cellSize);
            this.ctx.lineTo(this.padding + (this.boardSize - 1) * this.cellSize, this.padding + i * this.cellSize);
            this.ctx.stroke();
            
            // 豎線
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding + i * this.cellSize, this.padding);
            this.ctx.lineTo(this.padding + i * this.cellSize, this.padding + (this.boardSize - 1) * this.cellSize);
            this.ctx.stroke();
        }
        
        // 繪製星位
        this.ctx.fillStyle = '#8B4513';
        for (const [row, col] of this.starPoints) {
            this.ctx.beginPath();
            this.ctx.arc(
                this.padding + col * this.cellSize,
                this.padding + row * this.cellSize,
                4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
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
        const x = this.padding + col * this.cellSize;
        const y = this.padding + row * this.cellSize;
        const radius = this.cellSize * 0.4;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (player === 1) {
            // 黑子漸層
            const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(1, '#000000');
            this.ctx.fillStyle = gradient;
        } else {
            // 白子漸層
            const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(1, '#CCCCCC');
            this.ctx.fillStyle = gradient;
        }
        
        this.ctx.fill();
        
        // 添加邊框
        this.ctx.strokeStyle = player === 1 ? '#000000' : '#888888';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    handleClick(event) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 計算最近的交叉點
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        
        // 檢查是否在棋盤範圍內且位置為空
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize && this.board[row][col] === 0) {
            this.makeMove(row, col);
        }
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawPiece(row, col, this.currentPlayer);
        
        if (this.checkWin(row, col, this.currentPlayer)) {
            this.gameOver = true;
            const winner = this.currentPlayer === 1 ? '黑方' : '白方';
            document.getElementById('game-status').textContent = `${winner}獲勝！`;
            return;
        }
        
        if (this.checkDraw()) {
            this.gameOver = true;
            document.getElementById('game-status').textContent = '平局！';
            return;
        }
        
        // 切換玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurnDisplay();
        
        // 如果是AI回合，延遲後自動下棋
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    updateTurnDisplay() {
        const turnText = this.currentPlayer === 1 ? '黑方' : '白方';
        document.getElementById('current-turn').textContent = `當前回合：${turnText}`;
    }

    checkWin(row, col, player) {
        // 檢查四個方向：橫、豎、左斜、右斜
        const directions = [
            [[0, 1], [0, -1]],   // 橫向
            [[1, 0], [-1, 0]],   // 豎向
            [[1, 1], [-1, -1]],  // 左斜
            [[1, -1], [-1, 1]]   // 右斜
        ];
        
        for (const direction of directions) {
            let count = 1;
            
            for (const [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
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

    checkDraw() {
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
            this.makeMove(move.row, move.col);
        }
    }

    getBestMove() {
        // 評估所有可能的位置
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    const score = this.evaluatePosition(row, col);
                    
                    // 添加一些隨機性，使AI不那麼預測
                    const randomFactor = Math.random() * 10;
                    const totalScore = score + randomFactor;
                    
                    if (totalScore > bestScore) {
                        bestScore = totalScore;
                        bestMove = { row, col };
                    }
                }
            }
        }
        
        return bestMove;
    }

    evaluatePosition(row, col) {
        let score = 0;
        
        // 檢查AI是否能在此位置獲勝
        this.board[row][col] = 2;
        if (this.checkWin(row, col, 2)) {
            this.board[row][col] = 0;
            return 10000;
        }
        this.board[row][col] = 0;
        
        // 檢查是否需要阻擋玩家獲勝
        this.board[row][col] = 1;
        if (this.checkWin(row, col, 1)) {
            this.board[row][col] = 0;
            return 9000;
        }
        this.board[row][col] = 0;
        
        // 評估位置的戰略價值
        score += this.evaluateLine(row, col, 2) * 10; // AI的連線潛力
        score += this.evaluateLine(row, col, 1) * 8;  // 阻擋玩家的連線
        
        // 中心位置優先
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;
        
        // 靠近已有棋子的位置優先
        let nearbyCount = 0;
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                    this.board[r][c] !== 0) {
                    nearbyCount++;
                }
            }
        }
        score += nearbyCount * 5;
        
        return score;
    }

    evaluateLine(row, col, player) {
        let score = 0;
        const directions = [
            [[0, 1], [0, -1]],   // 橫向
            [[1, 0], [-1, 0]],   // 豎向
            [[1, 1], [-1, -1]],  // 左斜
            [[1, -1], [-1, 1]]   // 右斜
        ];
        
        for (const direction of directions) {
            let count = 0;
            let openEnds = 0;
            
            for (const [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                       this.board[r][c] === player) {
                    count++;
                    r += dr;
                    c += dc;
                }
                
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                    this.board[r][c] === 0) {
                    openEnds++;
                }
            }
            
            // 根據連線數量和開放端計算分數
            if (count >= 4) score += 1000;
            else if (count === 3) {
                if (openEnds === 2) score += 500;
                else if (openEnds === 1) score += 100;
            }
            else if (count === 2) {
                if (openEnds === 2) score += 50;
                else if (openEnds === 1) score += 10;
            }
            else if (count === 1 && openEnds === 2) {
                score += 5;
            }
        }
        
        return score;
    }

    restart() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        document.getElementById('game-status').textContent = '';
        this.drawBoard();
        this.updateTurnDisplay();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});