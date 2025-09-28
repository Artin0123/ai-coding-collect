// 五子棋遊戲邏輯
class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = this.createBoard();
        this.currentPlayer = 'black'; // 'black' 或 'white'
        this.gameOver = false;
        this.winner = null;
        this.aiPlayer = 'white'; // AI 為白棋
        this.humanPlayer = 'black'; // 人類為黑棋
        this.aiFirst = false; // AI是否先手
        
        this.init();
    }

    // 創建棋盤
    createBoard() {
        return Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    }

    // 初始化遊戲
    init() {
        this.renderBoard();
        this.bindEvents();
        this.updateStatus();
    }

    // 渲染棋盤
    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 添加棋子
                if (this.board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board[row][col]}`;
                    cell.appendChild(piece);
                }
                
                boardElement.appendChild(cell);
            }
        }
    }

    // 綁定事件
    bindEvents() {
        const boardElement = document.getElementById('board');
        
        boardElement.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const cell = e.target.closest('.cell');
            if (!cell || cell.querySelector('.piece')) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.makeMove(row, col);
        });

        // 新遊戲按鈕
        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });

        // AI先手
        document.getElementById('ai-first').addEventListener('click', () => {
            this.resetGame(true);
        });

        // 玩家先手
        document.getElementById('human-first').addEventListener('click', () => {
            this.resetGame(false);
        });

        // 再玩一次
        document.getElementById('play-again').addEventListener('click', () => {
            this.resetGame(this.aiFirst);
        });
    }

    // 下棋
    makeMove(row, col) {
        if (this.board[row][col] || this.gameOver) return;
        
        // 只有輪到人類玩家時才能下棋
        if (this.currentPlayer !== this.humanPlayer) return;
        
        this.board[row][col] = this.currentPlayer;
        this.renderBoard();
        
        if (this.checkWin(row, col)) {
            this.endGame(this.currentPlayer);
            return;
        }
        
        this.switchPlayer();
        this.updateStatus();
        
        // 如果輪到AI，自動下棋
        if (this.currentPlayer === this.aiPlayer && !this.gameOver) {
            setTimeout(() => {
                this.makeAIMove();
            }, 500);
        }
    }

    // AI下棋
    makeAIMove() {
        if (this.gameOver) return;
        
        const move = this.getBestMove();
        if (move) {
            this.board[move.row][move.col] = this.aiPlayer;
            this.renderBoard();
            
            if (this.checkWin(move.row, move.col)) {
                this.endGame(this.aiPlayer);
                return;
            }
            
            this.switchPlayer();
            this.updateStatus();
        }
    }

    // 獲取最佳移動
    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    const score = this.evaluateMove(row, col, this.aiPlayer);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col };
                    }
                }
            }
        }
        
        return bestMove;
    }

    // 評估移動分數
    evaluateMove(row, col, player) {
        let score = 0;
        
        // 基本位置分數（中心位置較高）
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;
        
        // 模擬下棋
        this.board[row][col] = player;
        
        // 檢查連續棋子模式
        score += this.evaluatePosition(row, col, player);
        
        // 還原棋盤
        this.board[row][col] = null;
        
        return score;
    }

    // 評估位置價值
    evaluatePosition(row, col, player) {
        let score = 0;
        const opponent = player === 'black' ? 'white' : 'black';
        
        // 檢查四個方向
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1] // 水平、垂直、對角線
        ];
        
        for (const [dx, dy] of directions) {
            score += this.evaluateDirection(row, col, dx, dy, player);
            score += this.evaluateDirection(row, col, dx, dy, opponent) * 0.8; // 阻擋對手
        }
        
        return score;
    }

    // 評估單個方向
    evaluateDirection(row, col, dx, dy, player) {
        let score = 0;
        let consecutive = 0;
        let blocked = 0;
        
        // 正向檢查
        for (let i = 1; i <= 4; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            
            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                if (this.board[r][c] === player) {
                    consecutive++;
                } else if (this.board[r][c] === null) {
                    break;
                } else {
                    blocked++;
                    break;
                }
            } else {
                blocked++;
                break;
            }
        }
        
        // 反向檢查
        for (let i = 1; i <= 4; i++) {
            const r = row - i * dx;
            const c = col - i * dy;
            
            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                if (this.board[r][c] === player) {
                    consecutive++;
                } else if (this.board[r][c] === null) {
                    break;
                } else {
                    blocked++;
                    break;
                }
            } else {
                blocked++;
                break;
            }
        }
        
        // 根據連續棋子數量給分
        if (consecutive >= 4) score += 10000; // 五連勝
        else if (consecutive === 3) score += 1000; // 四連
        else if (consecutive === 2) score += 100; // 三連
        else if (consecutive === 1) score += 10; // 兩連
        
        // 扣除被阻擋的分數
        if (blocked > 0) score *= 0.5;
        
        return score;
    }

    // 檢查勝利
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正向檢查
            for (let i = 1; i <= 4; i++) {
                const r = row + i * dx;
                const c = col + i * dy;
                
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                    this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 反向檢查
            for (let i = 1; i <= 4; i++) {
                const r = row - i * dx;
                const c = col - i * dy;
                
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

    // 切換玩家
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    }

    // 更新狀態顯示
    updateStatus() {
        const statusElement = document.querySelector('.status');
        const playerName = this.currentPlayer === this.humanPlayer ? '黑棋' : '白棋 (AI)';
        
        if (this.gameOver) {
            statusElement.textContent = `${this.winner === 'black' ? '黑棋' : '白棋'} 獲勝！`;
        } else {
            statusElement.textContent = `輪到${playerName}`;
        }
    }

    // 結束遊戲
    endGame(winner) {
        this.gameOver = true;
        this.winner = winner;
        
        const resultElement = document.getElementById('game-result');
        const resultText = document.querySelector('.result-text');
        
        resultText.textContent = `${winner === 'black' ? '黑棋' : '白棋'} 獲勝！`;
        resultElement.style.display = 'flex';
    }

    // 重置遊戲
    resetGame(aiFirst = false) {
        this.board = this.createBoard();
        this.currentPlayer = aiFirst ? this.aiPlayer : this.humanPlayer;
        this.gameOver = false;
        this.winner = null;
        this.aiFirst = aiFirst;
        
        this.renderBoard();
        this.updateStatus();
        
        const resultElement = document.getElementById('game-result');
        resultElement.style.display = 'none';
        
        // 如果AI先手且輪到AI，自動下棋
        if (aiFirst && this.currentPlayer === this.aiPlayer) {
            setTimeout(() => {
                this.makeAIMove();
            }, 500);
        }
    }
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
