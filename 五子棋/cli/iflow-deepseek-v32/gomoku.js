class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('gomoku-board');
        this.ctx = this.canvas.getContext('2d');
        this.restartBtn = document.getElementById('restart-btn');
        this.currentTurnElement = document.getElementById('current-turn');
        this.messageElement = document.getElementById('message');
        
        this.boardSize = 15;
        this.cellSize = this.canvas.width / (this.boardSize + 1);
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1: 黑子, 2: 白子
        this.gameOver = false;
        this.starPoints = [3, 7, 11]; // 星位位置
        
        this.init();
    }
    
    init() {
        this.drawBoard();
        this.bindEvents();
        this.updateTurnDisplay();
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const size = this.boardSize;
        const cellSize = this.cellSize;
        const padding = cellSize;
        
        // 清除畫布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製棋盤線條
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        
        // 繪製橫線
        for (let i = 0; i < size; i++) {
            ctx.beginPath();
            ctx.moveTo(padding, padding + i * cellSize);
            ctx.lineTo(padding + (size - 1) * cellSize, padding + i * cellSize);
            ctx.stroke();
        }
        
        // 繪製豎線
        for (let i = 0; i < size; i++) {
            ctx.beginPath();
            ctx.moveTo(padding + i * cellSize, padding);
            ctx.lineTo(padding + i * cellSize, padding + (size - 1) * cellSize);
            ctx.stroke();
        }
        
        // 繪製星位
        ctx.fillStyle = '#8B4513';
        this.starPoints.forEach(x => {
            this.starPoints.forEach(y => {
                ctx.beginPath();
                ctx.arc(padding + x * cellSize, padding + y * cellSize, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        
        // 繪製棋子
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(col, row, this.board[row][col]);
                }
            }
        }
    }
    
    drawPiece(x, y, player) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const padding = cellSize;
        const centerX = padding + x * cellSize;
        const centerY = padding + y * cellSize;
        const radius = cellSize * 0.4; // 80% of half cell size
        
        ctx.save();
        
        if (player === 1) { // 黑子
            const gradient = ctx.createRadialGradient(
                centerX - radius * 0.3, centerY - radius * 0.3, 0,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, '#666666');
            gradient.addColorStop(0.7, '#000000');
            gradient.addColorStop(1, '#333333');
            
            ctx.fillStyle = gradient;
        } else { // 白子
            const gradient = ctx.createRadialGradient(
                centerX - radius * 0.3, centerY - radius * 0.3, 0,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#CCCCCC');
            gradient.addColorStop(1, '#999999');
            
            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
        }
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (player === 2) {
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.restartBtn.addEventListener('click', () => this.restart());
    }
    
    handleClick(e) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cellSize = this.cellSize;
        const padding = cellSize;
        
        // 計算點擊的棋盤位置
        const boardX = Math.round((x - padding) / cellSize);
        const boardY = Math.round((y - padding) / cellSize);
        
        // 檢查是否在棋盤範圍內
        if (boardX >= 0 && boardX < this.boardSize && boardY >= 0 && boardY < this.boardSize) {
            this.placePiece(boardX, boardY);
        }
    }
    
    placePiece(x, y) {
        if (this.board[y][x] !== 0) return false; // 位置已有棋子
        
        this.board[y][x] = this.currentPlayer;
        this.drawPiece(x, y, this.currentPlayer);
        
        if (this.checkWin(x, y)) {
            this.gameOver = true;
            const winner = this.currentPlayer === 1 ? '黑方' : '白方';
            this.showMessage(`${winner}獲勝！`);
            return true;
        }
        
        this.switchPlayer();
        
        // 如果是AI回合，延遲0.5秒後下棋
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => {
                this.aiMove();
            }, 500);
        }
        
        return true;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurnDisplay();
    }
    
    updateTurnDisplay() {
        const turnText = this.currentPlayer === 1 ? '黑方' : '白方';
        this.currentTurnElement.textContent = turnText;
    }
    
    showMessage(message, isWin = false) {
        this.messageElement.textContent = message;
        if (isWin) {
            this.messageElement.classList.add('win');
        } else {
            this.messageElement.classList.remove('win');
        }
    }
    
    checkWin(x, y) {
        const player = this.board[y][x];
        const directions = [
            [1, 0],  // 水平
            [0, 1],  // 垂直
            [1, 1],  // 右下斜線
            [1, -1]  // 右上斜線
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正向檢查
            for (let i = 1; i <= 4; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && 
                    this.board[ny][nx] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 反向檢查
            for (let i = 1; i <= 4; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && 
                    this.board[ny][nx] === player) {
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
    
    aiMove() {
        if (this.gameOver) return;
        
        const bestMove = this.findBestMove();
        if (bestMove) {
            this.placePiece(bestMove.x, bestMove.y);
        }
    }
    
    findBestMove() {
        const scores = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        
        // 計算每個位置的權重
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === 0) { // 空位置
                    scores[y][x] = this.evaluatePosition(x, y);
                } else {
                    scores[y][x] = -1; // 已有棋子
                }
            }
        }
        
        // 找出最高分的位置
        let maxScore = -1;
        let bestMoves = [];
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (scores[y][x] > maxScore) {
                    maxScore = scores[y][x];
                    bestMoves = [{x, y}];
                } else if (scores[y][x] === maxScore) {
                    bestMoves.push({x, y});
                }
            }
        }
        
        // 隨機選擇一個最佳位置
        if (bestMoves.length > 0) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        
        return null;
    }
    
    evaluatePosition(x, y) {
        let score = 0;
        
        // 基礎權重：中心區域和星位附近
        const centerX = Math.floor(this.boardSize / 2);
        const centerY = Math.floor(this.boardSize / 2);
        const distanceToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        score += Math.max(0, 10 - distanceToCenter);
        
        // 星位加成
        if (this.starPoints.includes(x) && this.starPoints.includes(y)) {
            score += 5;
        }
        
        // 檢查四個方向
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        
        for (const [dx, dy] of directions) {
            // 檢查玩家（黑子）的威脅
            const playerThreat = this.evaluateThreat(x, y, 1, dx, dy);
            // 檢查AI（白子）的機會
            const aiOpportunity = this.evaluateThreat(x, y, 2, dx, dy);
            
            score += playerThreat * 100; // 優先阻擋玩家
            score += aiOpportunity * 80;  // 其次進攻
        }
        
        // 鄰近棋子加成
        score += this.getNeighborBonus(x, y);
        
        return score;
    }
    
    evaluateThreat(x, y, player, dx, dy) {
        let threatLevel = 0;
        
        // 檢查兩個方向
        for (let direction = -1; direction <= 1; direction += 2) {
            let consecutive = 0;
            let openEnds = 0;
            
            // 檢查該方向的連續棋子
            for (let i = 1; i <= 4; i++) {
                const nx = x + dx * i * direction;
                const ny = y + dy * i * direction;
                
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[ny][nx] === player) {
                        consecutive++;
                    } else if (this.board[ny][nx] === 0) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            // 計算威脅等級
            if (consecutive === 4 && openEnds > 0) {
                threatLevel = Math.max(threatLevel, 100); // 四子連線
            } else if (consecutive === 3 && openEnds > 0) {
                threatLevel = Math.max(threatLevel, 50);  // 三子連線
            } else if (consecutive === 2 && openEnds > 0) {
                threatLevel = Math.max(threatLevel, 20);  // 二子連線
            }
        }
        
        return threatLevel;
    }
    
    getNeighborBonus(x, y) {
        let bonus = 0;
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                if (this.board[ny][nx] !== 0) {
                    bonus += 2; // 鄰近有棋子加成
                }
            }
        }
        
        return bonus;
    }
    
    restart() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.drawBoard();
        this.updateTurnDisplay();
        this.showMessage('');
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});