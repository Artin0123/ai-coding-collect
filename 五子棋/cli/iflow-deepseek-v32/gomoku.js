class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black'; // 黑子先行
        this.gameOver = false;
        this.starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];
        
        this.init();
    }

    init() {
        this.createBoard();
        this.setupEventListeners();
        this.updateTurnIndicator();
    }

    createBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        // 清空棋盤陣列
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        
        // 創建棋盤格子和星位
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 添加星位
                if (this.isStarPoint(row, col)) {
                    const starPoint = document.createElement('div');
                    starPoint.className = 'star-point';
                    starPoint.style.left = '50%';
                    starPoint.style.top = '50%';
                    cell.appendChild(starPoint);
                }
                
                boardElement.appendChild(cell);
            }
        }
    }

    isStarPoint(row, col) {
        return this.starPoints.some(([r, c]) => r === row && c === col);
    }

    setupEventListeners() {
        const boardElement = document.getElementById('board');
        const restartBtn = document.getElementById('restart-btn');

        boardElement.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 'black') return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.isValidMove(row, col)) {
                this.makeMove(row, col, 'black');
                if (!this.gameOver) {
                    setTimeout(() => this.aiMove(), 500);
                }
            }
        });

        restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
    }

    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === null;
    }

    makeMove(row, col, player) {
        if (this.gameOver || !this.isValidMove(row, col)) return false;
        
        this.board[row][col] = player;
        this.renderPiece(row, col, player);
        
        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            this.showMessage(`${player === 'black' ? '黑子' : '白子'} 獲勝！`);
            return true;
        }
        
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.showMessage('平局！');
            return true;
        }
        
        this.currentPlayer = player === 'black' ? 'white' : 'black';
        this.updateTurnIndicator();
        return true;
    }

    renderPiece(row, col, player) {
        const boardElement = document.getElementById('board');
        const cellIndex = row * this.boardSize + col;
        const cell = boardElement.children[cellIndex];
        
        const piece = document.createElement('div');
        piece.className = `piece ${player}`;
        piece.style.left = '50%';
        piece.style.top = '50%';
        piece.style.transform = 'translate(-50%, -50%)';
        
        cell.appendChild(piece);
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 右下對角
            [1, -1]   // 右上對角
        ];

        for (const [dx, dy] of directions) {
            let count = 1;

            // 正向檢查
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (newRow < 0 || newRow >= this.boardSize || 
                    newCol < 0 || newCol >= this.boardSize || 
                    this.board[newRow][newCol] !== player) {
                    break;
                }
                count++;
            }

            // 反向檢查
            for (let i = 1; i <= 4; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (newRow < 0 || newRow >= this.boardSize || 
                    newCol < 0 || newCol >= this.boardSize || 
                    this.board[newRow][newCol] !== player) {
                    break;
                }
                count++;
            }

            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== null));
    }

    aiMove() {
        if (this.gameOver) return;

        const bestMove = this.findBestMove();
        if (bestMove) {
            this.makeMove(bestMove.row, bestMove.col, 'white');
        }
    }

    findBestMove() {
        // 簡單的AI策略：優先阻擋玩家連線，同時嘗試連線
        let bestScore = -Infinity;
        let bestMove = null;

        // 檢查所有可能的位置
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
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
        
        // 防守：檢查玩家可能的連線
        score += this.evaluateThreat(row, col, 'black') * 100;
        
        // 進攻：檢查AI自己的連線機會
        score += this.evaluateThreat(row, col, 'white') * 90;
        
        // 優先選擇中心位置
        const center = Math.floor(this.boardSize / 2);
        const distanceToCenter = Math.abs(row - center) + Math.abs(col - center);
        score += (this.boardSize - distanceToCenter) * 10;
        
        // 隨機因素避免可預測性
        score += Math.random() * 5;
        
        return score;
    }

    evaluateThreat(row, col, player) {
        // 臨時放置棋子進行評估
        this.board[row][col] = player;
        
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 右下對角
            [1, -1]   // 右上對角
        ];

        let maxThreat = 0;

        for (const [dx, dy] of directions) {
            let count = 1;
            let openEnds = 0;

            // 正向檢查
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (newRow < 0 || newRow >= this.boardSize || 
                    newCol < 0 || newCol >= this.boardSize) {
                    break;
                }
                if (this.board[newRow][newCol] === player) {
                    count++;
                } else if (this.board[newRow][newCol] === null) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            // 反向檢查
            for (let i = 1; i <= 4; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (newRow < 0 || newRow >= this.boardSize || 
                    newCol < 0 || newCol >= this.boardSize) {
                    break;
                }
                if (this.board[newRow][newCol] === player) {
                    count++;
                } else if (this.board[newRow][newCol] === null) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            // 根據連線數量和開放端計算威脅值
            if (count >= 5) {
                maxThreat = Math.max(maxThreat, 1000); // 直接勝利
            } else if (count === 4 && openEnds >= 1) {
                maxThreat = Math.max(maxThreat, 500); // 活四
            } else if (count === 4) {
                maxThreat = Math.max(maxThreat, 200); // 死四
            } else if (count === 3 && openEnds >= 1) {
                maxThreat = Math.max(maxThreat, 100); // 活三
            } else if (count === 3) {
                maxThreat = Math.max(maxThreat, 50); // 死三
            } else if (count === 2 && openEnds >= 1) {
                maxThreat = Math.max(maxThreat, 20); // 活二
            }
        }

        // 恢復棋盤狀態
        this.board[row][col] = null;
        
        return maxThreat;
    }

    updateTurnIndicator() {
        const turnText = document.getElementById('turn-text');
        turnText.textContent = `當前回合：${this.currentPlayer === 'black' ? '黑方' : '白方'}`;
    }

    showMessage(text) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = 'message win-message';
    }

    clearMessage() {
        const messageElement = document.getElementById('message');
        messageElement.textContent = '';
        messageElement.className = 'message';
    }

    restartGame() {
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.clearMessage();
        this.createBoard();
        this.updateTurnIndicator();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});