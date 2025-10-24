class GobangGame {
    constructor() {
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = [];
        this.currentPlayer = 'black'; // black 先行
        this.gameOver = false;
        this.canvas = document.getElementById('gobang-board');
        this.ctx = this.canvas.getContext('2d');

        this.initializeBoard();
        this.drawBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        // 初始化15x15棋盤
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = new Array(this.boardSize).fill(null);
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
    }

    handleCanvasClick(e) {
        if (this.gameOver || this.currentPlayer !== 'black') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 轉換為棋盤坐標
        const boardX = Math.round((x - 20) / this.cellSize);
        const boardY = Math.round((y - 20) / this.cellSize);

        // 檢查坐標是否有效
        if (boardX >= 0 && boardX < this.boardSize && boardY >= 0 && boardY < this.boardSize) {
            if (this.board[boardY][boardX] === null) {
                this.placeStone(boardX, boardY, 'black');
                if (!this.gameOver) {
                    this.switchPlayer();
                    setTimeout(() => this.aiMove(), 500); // AI稍後下棋
                }
            }
        }
    }

    placeStone(x, y, color) {
        this.board[y][x] = color;
        this.drawStone(x, y, color);

        if (this.checkWin(x, y, color)) {
            this.gameOver = true;
            this.showWinner(color === 'black' ? '黑方' : '白方');
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        document.getElementById('current-player').textContent = this.currentPlayer === 'black' ? '黑方' : '白方';
    }

    drawBoard() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 清空畫布
        ctx.clearRect(0, 0, width, height);

        // 繪製棋盤背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, width, height);

        // 繪製網格線
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();

        // 繪製垂直線
        for (let i = 0; i < this.boardSize; i++) {
            const pos = 20 + i * this.cellSize;
            ctx.moveTo(pos, 20);
            ctx.lineTo(pos, 20 + 14 * this.cellSize);
        }

        // 繪製水平線
        for (let i = 0; i < this.boardSize; i++) {
            const pos = 20 + i * this.cellSize;
            ctx.moveTo(20, pos);
            ctx.lineTo(20 + 14 * this.cellSize, pos);
        }

        ctx.stroke();

        // 繪製星位
        this.drawStarPoints();
    }

    drawStarPoints() {
        const ctx = this.ctx;
        const starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
        ];

        ctx.fillStyle = '#8B4513';
        starPoints.forEach(([x, y]) => {
            const canvasX = 20 + x * this.cellSize;
            const canvasY = 20 + y * this.cellSize;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawStone(x, y, color) {
        const ctx = this.ctx;
        const canvasX = 20 + x * this.cellSize;
        const canvasY = 20 + y * this.cellSize;
        const radius = this.cellSize / 2 - 2;

        // 繪製漸層棋子
        const gradient = ctx.createRadialGradient(
            canvasX - 5, canvasY - 5, 2,
            canvasX, canvasY, radius
        );

        if (color === 'black') {
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(1, '#000');
        } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
        }

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 添加邊框
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    checkWin(x, y, color) {
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 右下對角
            [1, -1]   // 右上對角
        ];

        for (let [dx, dy] of directions) {
            let count = 1; // 包含當前棋子

            // 向一個方向檢查
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize &&
                    this.board[ny][nx] === color) {
                    count++;
                } else {
                    break;
                }
            }

            // 向相反方向檢查
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize &&
                    this.board[ny][nx] === color) {
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
        if (this.gameOver || this.currentPlayer !== 'white') return;

        // 獲取最佳移動位置
        const move = this.getBestMove();
        if (move) {
            this.placeStone(move.x, move.y, 'white');
            if (!this.gameOver) {
                this.switchPlayer();
            }
        }
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        // 遍歷所有可能的位置
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === null) {
                    // 評估這個位置的分數
                    const score = this.evaluatePosition(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { x, y };
                    }
                }
            }
        }

        return bestMove || this.getRandomEmptyPosition();
    }

    evaluatePosition(x, y) {
        let score = 0;

        // 檢查四個方向
        const directions = [
            [1, 0], [0, 1], [1, 1], [1, -1]
        ];

        // 評估AI（白子）的進攻和防守
        score += this.evaluateDirection(x, y, 'white', directions);
        score += this.evaluateDirection(x, y, 'black', directions) * 0.8; // 防守稍微低一點的權重

        return score;
    }

    evaluateDirection(x, y, color, directions) {
        let totalScore = 0;

        for (let [dx, dy] of directions) {
            let count = 1; // 包含當前位置
            let blocked = 0;

            // 向一個方向檢查
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[ny][nx] === color) {
                        count++;
                    } else if (this.board[ny][nx] !== null) {
                        blocked++;
                        break;
                    } else {
                        break;
                    }
                } else {
                    blocked++;
                    break;
                }
            }

            // 向相反方向檢查
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[ny][nx] === color) {
                        count++;
                    } else if (this.board[ny][nx] !== null) {
                        blocked++;
                        break;
                    } else {
                        break;
                    }
                } else {
                    blocked++;
                    break;
                }
            }

            // 根據連子數和阻塞情況評分
            if (count >= 5) {
                totalScore += 100000; // 贏
            } else if (count === 4) {
                if (blocked === 0) {
                    totalScore += 10000; // 活四
                } else if (blocked === 1) {
                    totalScore += 1000; // 死四
                }
            } else if (count === 3) {
                if (blocked === 0) {
                    totalScore += 1000; // 活三
                } else if (blocked === 1) {
                    totalScore += 100; // 死三
                }
            } else if (count === 2) {
                if (blocked === 0) {
                    totalScore += 100; // 活二
                } else if (blocked === 1) {
                    totalScore += 10; // 死二
                }
            } else if (count === 1) {
                if (blocked === 0) {
                    totalScore += 10; // 單子
                }
            }
        }

        return totalScore;
    }

    getRandomEmptyPosition() {
        const emptyPositions = [];
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === null) {
                    emptyPositions.push({ x, y });
                }
            }
        }

        if (emptyPositions.length > 0) {
            return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        }

        return null;
    }

    showWinner(winner) {
        document.getElementById('winner-text').textContent = `${winner}獲勝！`;
        document.getElementById('winner-message').classList.remove('hidden');
    }

    restartGame() {
        this.board = [];
        this.currentPlayer = 'black';
        this.gameOver = false;

        document.getElementById('current-player').textContent = '黑方';
        document.getElementById('winner-message').classList.add('hidden');

        this.initializeBoard();
        this.drawBoard();
    }
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GobangGame();
});
