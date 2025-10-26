class Gomoku {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = 30;
        this.padding = 30;
        this.board = [];
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
        ];
        
        this.init();
    }
    
    init() {
        // 设置画布大小
        this.canvas.width = this.cellSize * (this.boardSize - 1) + this.padding * 2;
        this.canvas.height = this.cellSize * (this.boardSize - 1) + this.padding * 2;
        
        // 初始化棋盘数组
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        
        // 绑定事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.getElementById('restart-btn').addEventListener('click', this.restart.bind(this));
        
        // 绘制棋盘
        this.drawBoard();
        
        // 更新回合显示
        this.updateTurnDisplay();
    }
    
    drawBoard() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制棋盘背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格线
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < this.boardSize; i++) {
            // 横线
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, this.padding + i * this.cellSize);
            this.ctx.lineTo(this.padding + (this.boardSize - 1) * this.cellSize, this.padding + i * this.cellSize);
            this.ctx.stroke();
            
            // 竖线
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding + i * this.cellSize, this.padding);
            this.ctx.lineTo(this.padding + i * this.cellSize, this.padding + (this.boardSize - 1) * this.cellSize);
            this.ctx.stroke();
        }
        
        // 绘制星位
        this.ctx.fillStyle = '#8B4513';
        this.starPoints.forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.arc(
                this.padding + x * this.cellSize,
                this.padding + y * this.cellSize,
                4, 0, Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // 重新绘制所有棋子
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== 0) {
                    this.drawPiece(i, j, this.board[i][j]);
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
            // 黑子渐变
            const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(1, '#000000');
            this.ctx.fillStyle = gradient;
        } else {
            // 白子渐变
            const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(1, '#DDDDDD');
            this.ctx.fillStyle = gradient;
        }
        
        this.ctx.fill();
        
        // 添加边框
        this.ctx.strokeStyle = player === 1 ? '#000000' : '#888888';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    handleClick(event) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 计算点击的棋盘位置
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        
        // 检查是否在棋盘范围内
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
            // 检查位置是否为空
            if (this.board[row][col] === 0) {
                this.makeMove(row, col);
            }
        }
    }
    
    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawPiece(row, col, this.currentPlayer);
        
        // 检查胜负
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            const winner = this.currentPlayer === 1 ? '黑方' : '白方';
            this.showMessage(`${winner}获胜！`);
            return;
        }
        
        // 检查平局
        if (this.checkDraw()) {
            this.gameOver = true;
            this.showMessage('平局！');
            return;
        }
        
        // 切换玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurnDisplay();
        
        // AI下棋
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.aiMove(), 500);
        }
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [[0, 1], [0, -1]],   // 横向
            [[1, 0], [-1, 0]],   // 纵向
            [[1, 1], [-1, -1]],  // 主对角线
            [[1, -1], [-1, 1]]   // 副对角线
        ];
        
        for (const direction of directions) {
            let count = 1;
            
            // 检查正方向
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
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    aiMove() {
        const move = this.getBestMove();
        if (move) {
            this.makeMove(move.row, move.col);
        }
    }
    
    getBestMove() {
        // 评估所有可能的位置
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    const score = this.evaluatePosition(i, j);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row: i, col: j };
                    }
                }
            }
        }
        
        return bestMove;
    }
    
    evaluatePosition(row, col) {
        let score = 0;
        
        // 检查是否能直接获胜
        this.board[row][col] = 2;
        if (this.checkWin(row, col)) {
            this.board[row][col] = 0;
            return 10000;
        }
        this.board[row][col] = 0;
        
        // 检查是否需要阻止对手获胜
        this.board[row][col] = 1;
        if (this.checkWin(row, col)) {
            this.board[row][col] = 0;
            return 9000;
        }
        this.board[row][col] = 0;
        
        // 评估进攻和防守潜力
        score += this.evaluateLines(row, col, 2) * 2; // 进攻权重更高
        score += this.evaluateLines(row, col, 1) * 1.5; // 防守
        
        // 中心位置加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;
        
        // 靠近已有棋子加分
        score += this.countNearbyPieces(row, col) * 3;
        
        return score;
    }
    
    evaluateLines(row, col, player) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dr, dc] of directions) {
            const lineScore = this.evaluateLine(row, col, dr, dc, player);
            score += lineScore;
        }
        
        return score;
    }
    
    evaluateLine(row, col, dr, dc, player) {
        let count = 0;
        let openEnds = 0;
        let spaces = 0;
        
        // 正方向检查
        let r = row + dr;
        let c = col + dc;
        let consecutive = 0;
        
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && consecutive < 4) {
            if (this.board[r][c] === player) {
                count++;
                consecutive++;
            } else if (this.board[r][c] === 0) {
                spaces++;
                if (consecutive > 0) openEnds++;
                break;
            } else {
                break;
            }
            r += dr;
            c += dc;
        }
        
        // 反方向检查
        r = row - dr;
        c = col - dc;
        consecutive = 0;
        
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && consecutive < 4) {
            if (this.board[r][c] === player) {
                count++;
                consecutive++;
            } else if (this.board[r][c] === 0) {
                spaces++;
                if (consecutive > 0) openEnds++;
                break;
            } else {
                break;
            }
            r -= dr;
            c -= dc;
        }
        
        // 根据连子数和开放端计算分数
        if (count >= 4) return 1000;
        if (count === 3 && openEnds === 2) return 500;
        if (count === 3 && openEnds === 1) return 100;
        if (count === 2 && openEnds === 2) return 50;
        if (count === 2 && openEnds === 1) return 10;
        if (count === 1 && openEnds === 2) return 5;
        
        return count;
    }
    
    countNearbyPieces(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const r = row + i;
                const c = col + j;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                    this.board[r][c] !== 0) {
                    count++;
                }
            }
        }
        return count;
    }
    
    updateTurnDisplay() {
        const turnDisplay = document.getElementById('current-turn');
        if (this.gameOver) {
            turnDisplay.textContent = '游戏结束';
        } else {
            turnDisplay.textContent = this.currentPlayer === 1 ? '当前回合：黑方' : '当前回合：白方';
        }
    }
    
    showMessage(message) {
        const messageDiv = document.getElementById('game-message');
        messageDiv.textContent = message;
        messageDiv.classList.add('win-message');
    }
    
    restart() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        
        const messageDiv = document.getElementById('game-message');
        messageDiv.textContent = '';
        messageDiv.classList.remove('win-message');
        
        this.drawBoard();
        this.updateTurnDisplay();
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    new Gomoku();
});