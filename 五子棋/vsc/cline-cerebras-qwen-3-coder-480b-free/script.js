class GobangGame {
    constructor() {
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = [];
        this.currentPlayer = 'black'; // black or white
        this.gameOver = false;
        this.canvas = document.getElementById('gobang-board');
        this.ctx = this.canvas.getContext('2d');
        this.starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
        ];

        this.initializeBoard();
        this.drawBoard();
        this.setupEventListeners();
        this.updatePlayerTurn();
    }

    initializeBoard() {
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = null;
            }
        }
    }

    drawBoard() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const size = this.boardSize;
        const cellSize = this.cellSize;

        // 設置畫布大小
        canvas.width = size * cellSize;
        canvas.height = size * cellSize;

        // 繪製棋盤背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 繪製棋盤線條
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        // 繪製垂直線和水平線
        for (let i = 0; i < size; i++) {
            // 垂直線
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, (size - 1) * cellSize);
            ctx.stroke();

            // 水平線
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo((size - 1) * cellSize, i * cellSize);
            ctx.stroke();
        }

        // 繪製星位
        ctx.fillStyle = '#8B4513';
        for (let point of this.starPoints) {
            const [x, y] = point;
            ctx.beginPath();
            ctx.arc(x * cellSize, y * cellSize, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    drawStone(x, y, color) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;

        ctx.beginPath();
        ctx.arc(x * cellSize, y * cellSize, cellSize / 2 - 2, 0, 2 * Math.PI);

        // 漸層效果
        const gradient = ctx.createRadialGradient(
            x * cellSize - 5, y * cellSize - 5, 2,
            x * cellSize, y * cellSize, cellSize / 2
        );

        if (color === 'black') {
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(1, '#000');
        } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
        }

        ctx.fillStyle = gradient;
        ctx.fill();

        // 棋子邊框
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver) return;
            if (this.currentPlayer !== 'black') return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const boardX = Math.round(x / this.cellSize);
            const boardY = Math.round(y / this.cellSize);

            // 檢查座標是否在棋盤範圍內
            if (boardX >= 0 && boardX < this.boardSize && boardY >= 0 && boardY < this.boardSize) {
                this.makeMove(boardX, boardY);
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });
    }

    makeMove(x, y) {
        // 檢查該位置是否已有棋子
        if (this.board[x][y] !== null) {
            return;
        }

        // 放置棋子
        this.board[x][y] = this.currentPlayer;
        this.drawStone(x, y, this.currentPlayer);

        // 檢查是否獲勝
        if (this.checkWin(x, y)) {
            this.gameOver = true;
            this.showWinner(this.currentPlayer);
            return;
        }

        // 切換玩家
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updatePlayerTurn();

        // 如果是AI回合，延遲一下讓AI下棋
        if (this.currentPlayer === 'white' && !this.gameOver) {
            setTimeout(() => {
                this.makeAIMove();
            }, 300);
        }
    }

    makeAIMove() {
        if (this.gameOver) return;

        // 使用簡單的AI策略
        let bestMove = this.findBestMove();

        if (bestMove) {
            const [x, y] = bestMove;
            this.makeMove(x, y);
        }
    }

    findBestMove() {
        // 收集所有空位
        let emptyPositions = [];
        for (let x = 0; x < this.boardSize; x++) {
            for (let y = 0; y < this.boardSize; y++) {
                if (this.board[x][y] === null) {
                    emptyPositions.push([x, y]);
                }
            }
        }

        if (emptyPositions.length === 0) {
            return null;
        }

        // 評估每個空位的分數
        let bestScore = -1;
        let bestPosition = null;

        for (let pos of emptyPositions) {
            const [x, y] = pos;
            const score = this.evaluatePosition(x, y);

            if (score > bestScore) {
                bestScore = score;
                bestPosition = pos;
            }
        }

        return bestPosition;
    }

    evaluatePosition(x, y) {
        let score = 0;

        // 檢查AI（白子）在這個位置是否能獲勝
        this.board[x][y] = 'white';
        if (this.checkWin(x, y)) {
            score += 10000;
        }
        this.board[x][y] = null;

        // 檢查玩家（黑子）在這個位置是否能獲勝（防守）
        this.board[x][y] = 'black';
        if (this.checkWin(x, y)) {
            score += 5000;
        }
        this.board[x][y] = null;

        // 計算連線潛力
        score += this.countPotentialLines(x, y, 'white') * 100; // AI攻擊
        score += this.countPotentialLines(x, y, 'black') * 50;   // 玩家防守

        return score;
    }

    countPotentialLines(x, y, color) {
        let count = 0;
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 右下對角
            [1, -1]   // 右上對角
        ];

        for (let [dx, dy] of directions) {
            let lineCount = 1; // 包含當前位置

            // 向正方向檢查
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[nx][ny] === color) {
                        lineCount++;
                    } else if (this.board[nx][ny] !== null) {
                        break;
                    }
                } else {
                    break;
                }
            }

            // 向負方向檢查
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[nx][ny] === color) {
                        lineCount++;
                    } else if (this.board[nx][ny] !== null) {
                        break;
                    }
                } else {
                    break;
                }
            }

            if (lineCount >= 3) {
                count += lineCount;
            }
        }

        return count;
    }

    checkWin(x, y) {
        const color = this.board[x][y];
        if (!color) return false;

        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 右下對角
            [1, -1]   // 右上對角
        ];

        for (let [dx, dy] of directions) {
            let count = 1; // 包含當前棋子

            // 向正方向計算連線數量
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[nx][ny] === color) {
                        count++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            // 向負方向計算連線數量
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[nx][ny] === color) {
                        count++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            // 如果連線數量達到5個，則獲勝
            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    updatePlayerTurn() {
        const playerTurnElement = document.getElementById('player-turn');
        playerTurnElement.textContent = this.currentPlayer === 'black' ? '黑方' : '白方';
        playerTurnElement.style.color = this.currentPlayer === 'black' ? '#000' : '#888';
    }

    showWinner(color) {
        const winnerMessage = document.getElementById('winner-message');
        const winnerText = document.getElementById('winner-text');

        if (color === 'black') {
            winnerText.textContent = '恭喜！黑方獲勝！';
        } else {
            winnerText.textContent = '恭喜！白方（AI）獲勝！';
        }

        winnerMessage.classList.remove('hidden');
    }

    restartGame() {
        // 清空棋盤
        this.board = [];
        this.initializeBoard();
        this.currentPlayer = 'black';
        this.gameOver = false;

        // 重新繪製棋盤
        this.drawBoard();

        // 隱藏獲勝訊息
        document.getElementById('winner-message').classList.add('hidden');

        // 更新玩家回合顯示
        this.updatePlayerTurn();
    }
}

// 初始化遊戲
window.addEventListener('load', () => {
    new GobangGame();
});
