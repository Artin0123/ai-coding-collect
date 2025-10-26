class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black'; // 黑子先行
        this.gameOver = false;
        this.boardElement = document.getElementById('board');
        this.statusElement = document.getElementById('status');
        this.restartButton = document.getElementById('restart');
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateStatus();
    }

    initializeBoard() {
        this.boardElement.innerHTML = '';
        
        // 繪製棋盤線條
        for (let i = 0; i < this.boardSize; i++) {
            // 水平線
            const hLine = document.createElement('div');
            hLine.className = 'line horizontal-line';
            hLine.style.top = `${i * this.cellSize}px`;
            this.boardElement.appendChild(hLine);
            
            // 垂直線
            const vLine = document.createElement('div');
            vLine.className = 'line vertical-line';
            vLine.style.left = `${i * this.cellSize}px`;
            this.boardElement.appendChild(vLine);
        }
        
        // 繪製星位
        const starPoints = [3, 7, 11]; // 15x15棋盤的星位位置
        for (let i of starPoints) {
            for (let j of starPoints) {
                const star = document.createElement('div');
                star.className = 'star-point';
                star.style.left = `${i * this.cellSize}px`;
                star.style.top = `${j * this.cellSize}px`;
                this.boardElement.appendChild(star);
            }
        }
        
        // 創建交叉點
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.style.left = `${i * this.cellSize}px`;
                intersection.style.top = `${j * this.cellSize}px`;
                intersection.dataset.row = j;
                intersection.dataset.col = i;
                this.boardElement.appendChild(intersection);
            }
        }
    }

    setupEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 'black') return;
            
            const intersection = e.target.closest('.intersection');
            if (intersection) {
                const row = parseInt(intersection.dataset.row);
                const col = parseInt(intersection.dataset.col);
                this.makeMove(row, col);
            }
        });
        
        this.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
    }

    makeMove(row, col) {
        if (this.board[row][col] !== null || this.gameOver) {
            return false;
        }
        
        // 玩家下棋
        this.placePiece(row, col, this.currentPlayer);
        this.board[row][col] = this.currentPlayer;
        
        if (this.checkWin(row, col)) {
            this.showWinner(this.currentPlayer);
            return true;
        }
        
        // 切換到AI回合
        this.currentPlayer = 'white';
        this.updateStatus();
        
        // AI下棋
        setTimeout(() => {
            this.aiMove();
        }, 500);
        
        return true;
    }

    placePiece(row, col, player) {
        const intersections = document.querySelectorAll('.intersection');
        const intersection = Array.from(intersections).find(el => 
            parseInt(el.dataset.row) === row && parseInt(el.dataset.col) === col
        );
        
        if (intersection) {
            const piece = document.createElement('div');
            piece.className = `piece ${player}`;
            intersection.appendChild(piece);
        }
    }

    aiMove() {
        if (this.gameOver) return;
        
        const move = this.getBestMove();
        if (move) {
            this.placePiece(move.row, move.col, 'white');
            this.board[move.row][move.col] = 'white';
            
            if (this.checkWin(move.row, move.col)) {
                this.showWinner('white');
                return;
            }
            
            this.currentPlayer = 'black';
            this.updateStatus();
        }
    }

    getBestMove() {
        // 優先檢查是否能贏
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = 'white';
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = null;
                        return { row, col };
                    }
                    this.board[row][col] = null;
                }
            }
        }
        
        // 檢查是否需要防守（阻止玩家連五）
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = 'black';
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = null;
                        return { row, col };
                    }
                    this.board[row][col] = null;
                }
            }
        }
        
        // 評估每個位置的得分
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
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
        
        // 檢查四個方向的連線可能性
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直  
            [1, 1],   // 右下對角線
            [1, -1]   // 右上對角線
        ];
        
        for (const [dx, dy] of directions) {
            // AI連線評估
            score += this.evaluateDirection(row, col, dx, dy, 'white');
            // 防守評估
            score += this.evaluateDirection(row, col, dx, dy, 'black') * 0.8;
        }
        
        // 中心位置加分
        const center = Math.floor(this.boardSize / 2);
        const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
        score += (this.boardSize - distanceFromCenter) * 0.5;
        
        return score;
    }

    evaluateDirection(row, col, dx, dy, player) {
        let score = 0;
        let count = 0;
        let emptyEnds = 0;
        
        // 向前檢查
        for (let i = 1; i <= 4; i++) {
            const r = row + dx * i;
            const c = col + dy * i;
            if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === null) {
                emptyEnds++;
                break;
            } else {
                break;
            }
        }
        
        // 向後檢查
        for (let i = 1; i <= 4; i++) {
            const r = row - dx * i;
            const c = col - dy * i;
            if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === null) {
                emptyEnds++;
                break;
            } else {
                break;
            }
        }
        
        // 根據連線數量和空端點計算得分
        if (count >= 4) return 10000; // 連五
        if (count === 3 && emptyEnds === 2) return 5000; // 活四
        if (count === 3 && emptyEnds === 1) return 1000; // 衝四
        if (count === 2 && emptyEnds === 2) return 500;  // 活三
        if (count === 2 && emptyEnds === 1) return 100;  // 衝三
        if (count === 1 && emptyEnds === 2) return 50;   // 活二
        
        return score;
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        if (!player) return false;
        
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 右下對角線
            [1, -1]   // 右上對角線
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正向檢查
            for (let i = 1; i <= 4; i++) {
                const r = row + dx * i;
                const c = col + dy * i;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize || this.board[r][c] !== player) {
                    break;
                }
                count++;
            }
            
            // 反向檢查
            for (let i = 1; i <= 4; i++) {
                const r = row - dx * i;
                const c = col - dy * i;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize || this.board[r][c] !== player) {
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

    showWinner(player) {
        this.gameOver = true;
        const winner = player === 'black' ? '黑方' : '白方';
        
        const message = document.createElement('div');
        message.className = 'winner-message';
        message.textContent = `${winner} 獲勝！`;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    updateStatus() {
        const status = this.currentPlayer === 'black' ? '黑方回合' : '白方回合';
        this.statusElement.textContent = status;
    }

    restartGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        
        // 清除所有棋子
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => piece.remove());
        
        // 移除勝利訊息
        const winnerMessage = document.querySelector('.winner-message');
        if (winnerMessage) {
            winnerMessage.remove();
        }
        
        this.updateStatus();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});