// 五子棋遊戲邏輯
const BOARD_SIZE = 15;
const CELL_SIZE = 40; // 棋盤格子大小
const PIECE_RADIUS = CELL_SIZE * 0.4; // 棋子半徑為格子寬度的80%的一半
const STAR_POSITIONS = [
    [3, 3], [3, 11], [11, 3], [11, 11], // 四個角落
    [7, 7], // 中心
    [3, 7], [7, 3], [7, 11], [11, 7] // 四個邊中間
];

class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('goban');
        this.ctx = this.canvas.getContext('2d');
        this.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
        this.currentPlayer = 1; // 1 = 黑子(玩家), 2 = 白子(AI)
        this.gameOver = false;
        this.currentTurnElement = document.getElementById('current-turn');
        this.winMessageElement = document.getElementById('win-message');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.init();
    }
    
    init() {
        this.drawBoard();
        this.updateTurnDisplay();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 畫棋盤背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 畫棋盤線條
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        
        // 畫橫線
        for (let i = 0; i < BOARD_SIZE; i++) {
            const y = i * CELL_SIZE + CELL_SIZE / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(CELL_SIZE / 2, y);
            this.ctx.lineTo((BOARD_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2, y);
            this.ctx.stroke();
        }
        
        // 畫豎線
        for (let i = 0; i < BOARD_SIZE; i++) {
            const x = i * CELL_SIZE + CELL_SIZE / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, CELL_SIZE / 2);
            this.ctx.lineTo(x, (BOARD_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2);
            this.ctx.stroke();
        }
        
        // 畫星位
        this.ctx.fillStyle = '#8B4513';
        for (const [row, col] of STAR_POSITIONS) {
            const x = col * CELL_SIZE + CELL_SIZE / 2;
            const y = row * CELL_SIZE + CELL_SIZE / 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 畫已有的棋子
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col]);
                }
            }
        }
    }
    
    drawPiece(row, col, player) {
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;
        
        if (player === 1) {
            // 黑子 - 漸層效果
            const gradient = this.ctx.createRadialGradient(
                x - PIECE_RADIUS * 0.3, 
                y - PIECE_RADIUS * 0.3, 
                0,
                x, 
                y, 
                PIECE_RADIUS
            );
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
            
            this.ctx.fillStyle = gradient;
        } else {
            // 白子 - 漸層效果
            const gradient = this.ctx.createRadialGradient(
                x - PIECE_RADIUS * 0.3, 
                y - PIECE_RADIUS * 0.3, 
                0,
                x, 
                y, 
                PIECE_RADIUS
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
            
            this.ctx.fillStyle = gradient;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 畫外框
        this.ctx.strokeStyle = player === 1 ? '#000' : '#999';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    handleClick(e) {
        if (this.gameOver || this.currentPlayer !== 1) {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 計算最接近的交叉點
        const col = Math.round((x - CELL_SIZE / 2) / CELL_SIZE);
        const row = Math.round((y - CELL_SIZE / 2) / CELL_SIZE);
        
        // 邊界檢查
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            return;
        }
        
        // 檢查位置是否已有棋子
        if (this.board[row][col] !== 0) {
            return;
        }
        
        // 下棋
        this.makeMove(row, col, 1);
        
        // 檢查勝利
        if (this.checkWin(row, col, 1)) {
            this.gameOver = true;
            this.winMessageElement.textContent = '黑方獲勝！';
            return;
        }
        
        // 切換到AI回合
        this.currentPlayer = 2;
        this.updateTurnDisplay();
        
        // AI自動下棋（0.5秒延遲）
        setTimeout(() => {
            if (!this.gameOver) {
                this.aiMove();
            }
        }, 500);
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.drawPiece(row, col, player);
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        const aiMove = this.getBestMove();
        if (aiMove) {
            const [row, col] = aiMove;
            this.makeMove(row, col, 2);
            
            if (this.checkWin(row, col, 2)) {
                this.gameOver = true;
                this.winMessageElement.textContent = '白方獲勝！';
            } else {
                this.currentPlayer = 1;
                this.updateTurnDisplay();
            }
        }
    }
    
    getBestMove() {
        // 1. 檢查是否有四子連線可以完成（進攻）
        let bestMove = this.findWinningMove(2);
        if (bestMove) return bestMove;
        
        // 2. 檢查是否需要阻擋玩家的四子連線（防守）
        bestMove = this.findWinningMove(1);
        if (bestMove) return bestMove;
        
        // 3. 檢查是否有三子連線可以形成活四
        bestMove = this.findThreateningMove(2);
        if (bestMove) return bestMove;
        
        // 4. 阻擋玩家的三子連線威脅
        bestMove = this.findThreateningMove(1);
        if (bestMove) return bestMove;
        
        // 5. 在已有棋子附近或中心區域選擇最佳位置
        return this.getStrategicMove();
    }
    
    findWinningMove(player) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    if (this.checkWin(row, col, player)) {
                        this.board[row][col] = 0;
                        return [row, col];
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        return null;
    }
    
    findThreateningMove(player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    // 檢查每個方向是否有三子連線
                    for (const [dx, dy] of directions) {
                        let count = 1; // 包含當前位置
                        let emptyEnds = 0;
                        
                        // 向正方向檢查
                        for (let i = 1; i <= 3; i++) {
                            const r = row + dx * i;
                            const c = col + dy * i;
                            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                                if (this.board[r][c] === player) {
                                    count++;
                                } else if (this.board[r][c] === 0) {
                                    emptyEnds++;
                                    break;
                                } else {
                                    break;
                                }
                            } else {
                                break;
                            }
                        }
                        
                        // 向反方向檢查
                        for (let i = 1; i <= 3; i++) {
                            const r = row - dx * i;
                            const c = col - dy * i;
                            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                                if (this.board[r][c] === player) {
                                    count++;
                                } else if (this.board[r][c] === 0) {
                                    emptyEnds++;
                                    break;
                                } else {
                                    break;
                                }
                            } else {
                                break;
                            }
                        }
                        
                        // 如果有三子連線且兩端至少有一端是空的
                        if (count >= 3 && emptyEnds > 0) {
                            return [row, col];
                        }
                    }
                }
            }
        }
        return null;
    }
    
    getStrategicMove() {
        const moveScores = [];
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    let score = 0;
                    
                    // 中心區域加分
                    const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
                    score += Math.max(0, 20 - centerDist);
                    
                    // 附近有棋子加分
                    for (let dr = -2; dr <= 2; dr++) {
                        for (let dc = -2; dc <= 2; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const r = row + dr;
                            const c = col + dc;
                            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                                if (this.board[r][c] !== 0) {
                                    score += 5;
                                }
                            }
                        }
                    }
                    
                    moveScores.push({ row, col, score });
                }
            }
        }
        
        if (moveScores.length === 0) return null;
        
        // 隨機選擇高分數的移動（增加一些隨機性）
        moveScores.sort((a, b) => b.score - a.score);
        const topMoves = moveScores.slice(0, Math.min(5, moveScores.length));
        
        // 使用加權隨機選擇
        const totalWeight = topMoves.reduce((sum, move) => sum + move.score, 0);
        let random = Math.random() * totalWeight;
        
        for (const move of topMoves) {
            random -= move.score;
            if (random <= 0) {
                return [move.row, move.col];
            }
        }
        
        return [topMoves[0].row, topMoves[0].col];
    }
    
    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 對角線 \
            [1, -1]   // 對角線 /
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1; // 包含當前位置
            
            // 向正方向檢查
            for (let i = 1; i < 5; i++) {
                const r = row + dx * i;
                const c = col + dy * i;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 向反方向檢查
            for (let i = 1; i < 5; i++) {
                const r = row - dx * i;
                const c = col - dy * i;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
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
    
    updateTurnDisplay() {
        this.currentTurnElement.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
        this.currentTurnElement.style.color = this.currentPlayer === 1 ? '#000' : '#fff';
        this.currentTurnElement.style.backgroundColor = this.currentPlayer === 1 ? 'transparent' : '#DEB887';
        this.currentTurnElement.style.padding = this.currentPlayer === 1 ? '0' : '2px 6px';
        this.currentTurnElement.style.borderRadius = this.currentPlayer === 1 ? '0' : '3px';
    }
    
    restartGame() {
        this.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winMessageElement.textContent = '';
        this.drawBoard();
        this.updateTurnDisplay();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});