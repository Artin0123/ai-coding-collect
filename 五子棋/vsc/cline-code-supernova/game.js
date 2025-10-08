// 五子棋遊戲邏輯
class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.restartBtn = document.getElementById('restart-btn');
        this.currentPlayerSpan = document.getElementById('current-player');
        this.gameStatusDiv = document.getElementById('game-status');

        // 遊戲設定
        this.BOARD_SIZE = 15;
        this.CELL_SIZE = this.canvas.width / (this.BOARD_SIZE + 1);
        this.STONE_RADIUS = this.CELL_SIZE * 0.4;

        // 遊戲狀態
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1; // 1: 黑子（玩家）, 2: 白子（AI）
        this.gameOver = false;
        this.winner = null;

        // 星位位置
        this.starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];

        this.init();
    }

    // 初始化遊戲
    init() {
        this.drawBoard();
        this.bindEvents();
        this.updateCurrentPlayer();
    }

    // 創建空棋盤
    createEmptyBoard() {
        return Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(0));
    }

    // 繪製棋盤
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製棋盤線條
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;

        // 繪製橫線
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.CELL_SIZE, this.CELL_SIZE * (i + 1));
            this.ctx.lineTo(this.canvas.width - this.CELL_SIZE, this.CELL_SIZE * (i + 1));
            this.ctx.stroke();
        }

        // 繪製豎線
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.CELL_SIZE * (i + 1), this.CELL_SIZE);
            this.ctx.lineTo(this.CELL_SIZE * (i + 1), this.canvas.height - this.CELL_SIZE);
            this.ctx.stroke();
        }

        // 繪製星位
        this.ctx.fillStyle = '#8B4513';
        this.starPoints.forEach(([row, col]) => {
            this.ctx.beginPath();
            this.ctx.arc(
                this.CELL_SIZE * (col + 1),
                this.CELL_SIZE * (row + 1),
                4, 0, 2 * Math.PI
            );
            this.ctx.fill();
        });

        // 繪製棋子
        this.drawStones();
    }

    // 繪製棋子
    drawStones() {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawStone(row, col, this.board[row][col]);
                }
            }
        }
    }

    // 繪製單個棋子（包含漸層效果）
    drawStone(row, col, player) {
        const centerX = this.CELL_SIZE * (col + 1);
        const centerY = this.CELL_SIZE * (row + 1);

        // 創建漸層
        const gradient = this.ctx.createRadialGradient(
            centerX - this.STONE_RADIUS * 0.3,
            centerY - this.STONE_RADIUS * 0.3,
            0,
            centerX,
            centerY,
            this.STONE_RADIUS
        );

        if (player === 1) {
            // 黑子漸層
            gradient.addColorStop(0, '#666666');
            gradient.addColorStop(0.7, '#333333');
            gradient.addColorStop(1, '#111111');
        } else {
            // 白子漸層
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#E0E0E0');
            gradient.addColorStop(1, '#CCCCCC');
        }

        // 繪製棋子主體
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.STONE_RADIUS, 0, 2 * Math.PI);
        this.ctx.fill();

        // 添加邊框
        this.ctx.strokeStyle = player === 1 ? '#222222' : '#AAAAAA';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 添加高光效果
        if (player === 2) { // 白子的高光
            const highlightGradient = this.ctx.createRadialGradient(
                centerX - this.STONE_RADIUS * 0.2,
                centerY - this.STONE_RADIUS * 0.2,
                0,
                centerX - this.STONE_RADIUS * 0.2,
                centerY - this.STONE_RADIUS * 0.2,
                this.STONE_RADIUS * 0.3
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.STONE_RADIUS * 0.8, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    // 綁定事件
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }

    // 處理點擊事件
    handleClick(event) {
        if (this.gameOver || this.currentPlayer !== 1) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.round((x - this.CELL_SIZE) / this.CELL_SIZE) - 1;
        const row = Math.round((y - this.CELL_SIZE) / this.CELL_SIZE) - 1;

        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
        }
    }

    // 檢查是否為有效移動
    isValidMove(row, col) {
        return row >= 0 && row < this.BOARD_SIZE &&
            col >= 0 && col < this.BOARD_SIZE &&
            this.board[row][col] === 0;
    }

    // 下棋
    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawStone(row, col, this.currentPlayer);

        if (this.checkWin(row, col)) {
            this.endGame(`恭喜！${this.currentPlayer === 1 ? '黑方' : '白方'}獲勝！`);
            return;
        }

        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateCurrentPlayer();

        // 如果是AI的回合
        if (this.currentPlayer === 2) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    // AI下棋
    makeAIMove() {
        const move = this.getBestMove();
        if (move) {
            this.makeMove(move.row, move.col);
        }
    }

    // 獲取最佳移動
    getBestMove() {
        // 1. 檢查是否有獲勝機會
        let winningMove = this.findWinningMove(2);
        if (winningMove) return winningMove;

        // 2. 阻擋玩家的獲勝機會
        let blockingMove = this.findWinningMove(1);
        if (blockingMove) return blockingMove;

        // 3. 評估所有可能的移動
        let bestMove = null;
        let bestScore = -Infinity;

        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    const score = this.evaluateMove(row, col);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col };
                    }
                }
            }
        }

        return bestMove;
    }

    // 尋找獲勝移動
    findWinningMove(player) {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        return null;
    }

    // 評估移動分數
    evaluateMove(row, col) {
        let score = 0;

        // 中心位置獎勵
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;

        // 靠近現有棋子獎勵
        score += this.getNeighborScore(row, col) * 3;

        // 連續棋子獎勵
        this.board[row][col] = 2;
        score += this.getLineScore(row, col) * 5;
        this.board[row][col] = 0;

        return score;
    }

    // 獲取鄰近棋子分數
    getNeighborScore(row, col) {
        let score = 0;
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.BOARD_SIZE &&
                    newCol >= 0 && newCol < this.BOARD_SIZE &&
                    this.board[newRow][newCol] !== 0) {
                    score += 1;
                }
            }
        }
        return score;
    }

    // 獲取連線分數
    getLineScore(row, col) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        directions.forEach(([dx, dy]) => {
            let count = 1;
            // 正方向
            for (let i = 1; i < 5; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (newRow >= 0 && newRow < this.BOARD_SIZE &&
                    newCol >= 0 && newCol < this.BOARD_SIZE &&
                    this.board[newRow][newCol] === 2) {
                    count++;
                } else {
                    break;
                }
            }
            // 反方向
            for (let i = 1; i < 5; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (newRow >= 0 && newRow < this.BOARD_SIZE &&
                    newCol >= 0 && newCol < this.BOARD_SIZE &&
                    this.board[newRow][newCol] === 2) {
                    count++;
                } else {
                    break;
                }
            }
            score += count * count;
        });

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

            // 正方向檢查
            for (let i = 1; i < 5; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (newRow >= 0 && newRow < this.BOARD_SIZE &&
                    newCol >= 0 && newCol < this.BOARD_SIZE &&
                    this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            // 反方向檢查
            for (let i = 1; i < 5; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (newRow >= 0 && newRow < this.BOARD_SIZE &&
                    newCol >= 0 && newCol < this.BOARD_SIZE &&
                    this.board[newRow][newCol] === player) {
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

    // 更新當前玩家顯示
    updateCurrentPlayer() {
        this.currentPlayerSpan.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
        this.currentPlayerSpan.style.color = this.currentPlayer === 1 ? '#2C3E50' : '#2C3E50';
    }

    // 結束遊戲
    endGame(message) {
        this.gameOver = true;
        this.winner = this.currentPlayer;
        this.gameStatusDiv.textContent = message;
    }

    // 重新開始遊戲
    restartGame() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.gameStatusDiv.textContent = '';
        this.drawBoard();
        this.updateCurrentPlayer();
    }
}

// 當頁面載入完成後啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
