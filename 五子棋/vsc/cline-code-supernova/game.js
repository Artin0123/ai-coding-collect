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
        this.PIECE_RADIUS = this.CELL_SIZE * 0.4;

        // 遊戲狀態
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.winner = null;

        // 星位位置
        this.starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11],
            [3, 7], [7, 3], [7, 11], [11, 7]
        ];

        this.init();
    }

    // 初始化遊戲
    init() {
        this.drawBoard();
        this.bindEvents();
        this.updateGameInfo();
    }

    // 創建空棋盤
    createEmptyBoard() {
        return Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(0));
    }

    // 繪製棋盤
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製棋盤背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
        this.drawAllPieces();
    }

    // 繪製所有棋子
    drawAllPieces() {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col]);
                }
            }
        }
    }

    // 繪製單個棋子（包含漸層效果）
    drawPiece(row, col, player) {
        const centerX = this.CELL_SIZE * (col + 1);
        const centerY = this.CELL_SIZE * (row + 1);

        // 創建漸層
        const gradient = this.ctx.createRadialGradient(
            centerX - this.PIECE_RADIUS * 0.3,
            centerY - this.PIECE_RADIUS * 0.3,
            0,
            centerX,
            centerY,
            this.PIECE_RADIUS
        );

        if (player === 1) {
            // 黑子漸層
            gradient.addColorStop(0, '#8B8B8B');
            gradient.addColorStop(0.7, '#2C2C2C');
            gradient.addColorStop(1, '#000000');
        } else {
            // 白子漸層
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#E0E0E0');
            gradient.addColorStop(1, '#CCCCCC');
        }

        // 繪製棋子主體
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.PIECE_RADIUS, 0, 2 * Math.PI);
        this.ctx.fill();

        // 添加高光效果
        if (player === 1) {
            // 黑子高光
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.arc(
                centerX - this.PIECE_RADIUS * 0.2,
                centerY - this.PIECE_RADIUS * 0.2,
                this.PIECE_RADIUS * 0.3, 0, 2 * Math.PI
            );
            this.ctx.fill();
        } else {
            // 白子高光
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(
                centerX - this.PIECE_RADIUS * 0.3,
                centerY - this.PIECE_RADIUS * 0.3,
                this.PIECE_RADIUS * 0.4, 0, 2 * Math.PI
            );
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

    // 檢查移動是否有效
    isValidMove(row, col) {
        return row >= 0 && row < this.BOARD_SIZE &&
            col >= 0 && col < this.BOARD_SIZE &&
            this.board[row][col] === 0;
    }

    // 下棋
    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawPiece(row, col, this.currentPlayer);

        if (this.checkWin(row, col)) {
            this.endGame(`恭喜！${this.currentPlayer === 1 ? '黑方' : '白方'}獲勝！`);
        } else {
            this.switchPlayer();
            if (this.currentPlayer === 2) {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    // 檢查勝利條件
    checkWin(row, col) {
        const directions = [
            [0, 1],   // 橫向
            [1, 0],   // 縱向
            [1, 1],   // 斜向（右下）
            [1, -1]   // 斜向（左下）
        ];

        for (const [dRow, dCol] of directions) {
            if (this.countConsecutive(row, col, dRow, dCol) >= 5) {
                return true;
            }
        }
        return false;
    }

    // 計算連續棋子數量
    countConsecutive(row, col, dRow, dCol) {
        let count = 1;
        const player = this.board[row][col];

        // 正方向
        let r = row + dRow;
        let c = col + dCol;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE &&
            this.board[r][c] === player) {
            count++;
            r += dRow;
            c += dCol;
        }

        // 反方向
        r = row - dRow;
        c = col - dCol;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE &&
            this.board[r][c] === player) {
            count++;
            r -= dRow;
            c -= dCol;
        }

        return count;
    }

    // 切換玩家
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateGameInfo();
    }

    // 更新遊戲資訊
    updateGameInfo() {
        this.currentPlayerSpan.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
        this.currentPlayerSpan.style.color = this.currentPlayer === 1 ? '#2C3E50' : '#2C3E50';
    }

    // AI移動
    makeAIMove() {
        if (this.gameOver) return;

        const move = this.getBestMove();
        if (move) {
            this.makeMove(move.row, move.col);
        }
    }

    // 獲取最佳移動
    getBestMove() {
        // 1. 檢查是否可以獲勝
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 2;
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }

        // 2. 阻擋玩家獲勝
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 1;
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }

        // 3. 評估所有可能移動並選擇最佳位置
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

    // 評估移動分數
    evaluateMove(row, col) {
        let score = 0;

        // 中心位置加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;

        // 靠近已有棋子加分
        for (let r = Math.max(0, row - 2); r <= Math.min(this.BOARD_SIZE - 1, row + 2); r++) {
            for (let c = Math.max(0, col - 2); c <= Math.min(this.BOARD_SIZE - 1, col + 2); c++) {
                if (this.board[r][c] !== 0) {
                    const distance = Math.abs(row - r) + Math.abs(col - c);
                    score += (3 - distance) * 5;
                }
            }
        }

        // 星位加分
        if (this.starPoints.some(([sr, sc]) => sr === row && sc === col)) {
            score += 10;
        }

        // 隨機因素
        score += Math.random() * 20;

        return score;
    }

    // 結束遊戲
    endGame(message) {
        this.gameOver = true;
        this.winner = this.currentPlayer;
        this.gameStatusDiv.textContent = message;
        this.gameStatusDiv.style.color = '#E74C3C';
    }

    // 重新開始遊戲
    restartGame() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.gameStatusDiv.textContent = '';
        this.drawBoard();
        this.updateGameInfo();
    }
}

// 當頁面載入完成後啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
