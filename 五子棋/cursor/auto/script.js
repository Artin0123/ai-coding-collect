class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.winner = null;
        
        this.initializeBoard();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        // 創建棋盤網格
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;
                
                // 添加星位
                if (this.isStarPoint(row, col)) {
                    const starPoint = document.createElement('div');
                    starPoint.className = 'star-point';
                    intersection.appendChild(starPoint);
                }
                
                boardElement.appendChild(intersection);
            }
        }
    }

    isStarPoint(row, col) {
        const starPoints = [
            [3, 3], [3, 7], [3, 11],
            [7, 3], [7, 7], [7, 11],
            [11, 3], [11, 7], [11, 11]
        ];
        return starPoints.some(([r, c]) => r === row && c === col);
    }

    bindEvents() {
        const boardElement = document.getElementById('game-board');
        const restartBtn = document.getElementById('restart-btn');
        
        boardElement.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 1) return;
            
            const intersection = e.target.closest('.intersection');
            if (!intersection) return;
            
            const row = parseInt(intersection.dataset.row);
            const col = parseInt(intersection.dataset.col);
            
            if (this.isValidMove(row, col)) {
                this.makeMove(row, col);
            }
        });
        
        restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
    }

    isValidMove(row, col) {
        return this.board[row][col] === 0;
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col) || this.gameOver) return false;
        
        // 放置棋子
        this.board[row][col] = this.currentPlayer;
        this.placeStone(row, col, this.currentPlayer);
        
        // 檢查勝利
        if (this.checkWin(row, col, this.currentPlayer)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.showWinner();
            return true;
        }
        
        // 檢查平局
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.showDraw();
            return true;
        }
        
        // 切換玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateDisplay();
        
        // AI回合
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => {
                this.aiMove();
            }, 500);
        }
        
        return true;
    }

    placeStone(row, col, player) {
        const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const stone = document.createElement('div');
        stone.className = `stone ${player === 1 ? 'black' : 'white'}`;
        intersection.appendChild(stone);
        intersection.classList.add('occupied');
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 對角線
            [1, -1]   // 反對角線
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            
            // 向一個方向檢查
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                   this.board[r][c] === player) {
                count++;
                r += dr;
                c += dc;
            }
            
            // 向相反方向檢查
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                   this.board[r][c] === player) {
                count++;
                r -= dr;
                c -= dc;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }

    isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== 0));
    }

    aiMove() {
        if (this.gameOver) return;
        
        const move = this.getBestMove();
        if (move) {
            this.makeMove(move.row, move.col);
        }
    }

    getBestMove() {
        // 首先檢查AI是否能直接獲勝
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 2;
                    if (this.checkWin(row, col, 2)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        
        // 檢查是否需要阻止玩家獲勝
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 1;
                    if (this.checkWin(row, col, 1)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        
        // 使用評分系統選擇最佳位置
        let bestMove = null;
        let bestScore = -Infinity;
        
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
        
        // 檢查四個方向的連線情況
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 對角線
            [1, -1]   // 反對角線
        ];
        
        for (const [dr, dc] of directions) {
            // 評估AI的進攻潛力
            this.board[row][col] = 2;
            const aiScore = this.evaluateDirection(row, col, dr, dc, 2);
            this.board[row][col] = 0;
            
            // 評估防守玩家
            this.board[row][col] = 1;
            const playerScore = this.evaluateDirection(row, col, dr, dc, 1);
            this.board[row][col] = 0;
            
            score += aiScore + playerScore * 0.8; // 防守權重稍低
        }
        
        // 中心位置加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 0.1;
        
        return score;
    }

    evaluateDirection(row, col, dr, dc, player) {
        let count = 1;
        let blocked = 0;
        
        // 向一個方向檢查
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
            if (this.board[r][c] === player) {
                count++;
                r += dr;
                c += dc;
            } else {
                if (this.board[r][c] !== 0) blocked++;
                break;
            }
        }
        
        // 向相反方向檢查
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
            if (this.board[r][c] === player) {
                count++;
                r -= dr;
                c -= dc;
            } else {
                if (this.board[r][c] !== 0) blocked++;
                break;
            }
        }
        
        // 根據連線數量和阻擋情況評分
        if (count >= 5) return 10000;
        if (count === 4 && blocked === 0) return 1000;
        if (count === 4 && blocked === 1) return 100;
        if (count === 3 && blocked === 0) return 100;
        if (count === 3 && blocked === 1) return 10;
        if (count === 2 && blocked === 0) return 10;
        if (count === 2 && blocked === 1) return 1;
        
        return 0;
    }

    showWinner() {
        const message = document.getElementById('game-message');
        const winnerText = this.winner === 1 ? '黑方' : '白方';
        message.textContent = `🎉 ${winnerText} 獲勝！`;
        message.classList.add('winner');
    }

    showDraw() {
        const message = document.getElementById('game-message');
        message.textContent = '平局！';
        message.classList.add('winner');
    }

    updateDisplay() {
        const currentTurn = document.getElementById('current-turn');
        const message = document.getElementById('game-message');
        
        if (this.gameOver) {
            currentTurn.textContent = '遊戲結束';
        } else {
            currentTurn.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
        }
        
        if (!this.gameOver) {
            message.textContent = '';
            message.classList.remove('winner');
        }
    }

    restartGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        
        this.initializeBoard();
        this.updateDisplay();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
