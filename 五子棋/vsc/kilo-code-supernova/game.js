// 五子棋遊戲邏輯
class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.restartBtn = document.getElementById('restart-btn');
        this.currentPlayerSpan = document.getElementById('current-player');
        this.gameStatusDiv = document.getElementById('game-status');

        // 遊戲設定
        this.BOARD_SIZE = 15;
        this.CELL_SIZE = this.canvas.width / (this.BOARD_SIZE + 1);
        this.PIECE_RADIUS = this.CELL_SIZE * 0.4;

        // 星位位置（標準五子棋星位）
        this.STAR_POINTS = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11],
            [3, 7], [7, 3], [7, 11], [11, 7]
        ];

        // 遊戲狀態
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1; // 1: 黑子（玩家）, 2: 白子（AI）
        this.gameOver = false;
        this.winner = null;

        this.init();
    }

    // 初始化遊戲
    init() {
        this.bindEvents();
        this.drawBoard();
        this.updateGameInfo();
    }

    // 創建空棋盤
    createEmptyBoard() {
        return Array(this.BOARD_SIZE).fill().map(() => Array(this.BOARD_SIZE).fill(0));
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
            const y = (i + 1) * this.CELL_SIZE;
            this.ctx.moveTo(this.CELL_SIZE, y);
            this.ctx.lineTo(this.canvas.width - this.CELL_SIZE, y);
            this.ctx.stroke();
        }

        // 繪製豎線
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            this.ctx.beginPath();
            const x = (i + 1) * this.CELL_SIZE;
            this.ctx.moveTo(x, this.CELL_SIZE);
            this.ctx.lineTo(x, this.canvas.height - this.CELL_SIZE);
            this.ctx.stroke();
        }

        // 繪製星位
        this.drawStarPoints();

        // 繪製棋子
        this.drawPieces();
    }

    // 繪製星位
    drawStarPoints() {
        this.ctx.fillStyle = '#8B4513';
        this.STAR_POINTS.forEach(([row, col]) => {
            const x = (col + 1) * this.CELL_SIZE;
            const y = (row + 1) * this.CELL_SIZE;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    // 繪製棋子
    drawPieces() {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col]);
                }
            }
        }
    }

    // 繪製單個棋子（帶漸層效果）
    drawPiece(row, col, player) {
        const x = (col + 1) * this.CELL_SIZE;
        const y = (row + 1) * this.CELL_SIZE;

        // 創建漸層
        const gradient = this.ctx.createRadialGradient(
            x - this.PIECE_RADIUS * 0.3, y - this.PIECE_RADIUS * 0.3, 0,
            x, y, this.PIECE_RADIUS
        );

        if (player === 1) {
            // 黑子漸層
            gradient.addColorStop(0, '#666666');
            gradient.addColorStop(0.7, '#333333');
            gradient.addColorStop(1, '#1a1a1a');
        } else {
            // 白子漸層
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#f0f0f0');
            gradient.addColorStop(1, '#d0d0d0');
        }

        // 繪製棋子主體
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.PIECE_RADIUS, 0, 2 * Math.PI);
        this.ctx.fill();

        // 添加邊框
        this.ctx.strokeStyle = player === 1 ? '#1a1a1a' : '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 添加高光效果
        if (player === 2) { // 白子的高光
            const highlightGradient = this.ctx.createRadialGradient(
                x - this.PIECE_RADIUS * 0.2, y - this.PIECE_RADIUS * 0.2, 0,
                x - this.PIECE_RADIUS * 0.2, y - this.PIECE_RADIUS * 0.2, this.PIECE_RADIUS * 0.3
            );
            highlightGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
            highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');

            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.PIECE_RADIUS * 0.8, 0, 2 * Math.PI);
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

        // 檢查點擊位置是否有效
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
        this.drawBoard();

        // 檢查勝利
        if (this.checkWin(row, col)) {
            this.endGame(`恭喜！${this.currentPlayer === 1 ? '黑方' : '白方'}獲勝！`);
            return;
        }

        // 檢查平局
        if (this.isBoardFull()) {
            this.endGame('遊戲平局！');
            return;
        }

        // 切換玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateGameInfo();

        // 如果是AI回合，自動下棋
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

        // 3. 評估所有可能移動並選擇最佳的
        return this.evaluateMoves();
    }

    // 尋找獲勝移動
    findWinningMove(player) {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = player;
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = 0; // 恢復棋盤
                        return { row, col };
                    }
                    this.board[row][col] = 0; // 恢復棋盤
                }
            }
        }
        return null;
    }

    // 評估移動並選擇最佳的
    evaluateMoves() {
        let bestMove = null;
        let bestScore = -Infinity;

        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) {
                    let score = this.evaluatePosition(row, col);

                    // 給中心位置和已有棋子附近的額外分數
                    score += this.getPositionBonus(row, col);

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col };
                    }
                }
            }
        }

        return bestMove;
    }

    // 評估位置分數
    evaluatePosition(row, col) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1] // 右、下、右下、左下
        ];

        directions.forEach(([dx, dy]) => {
            score += this.evaluateDirection(row, col, dx, dy, 2);
            score += this.evaluateDirection(row, col, -dx, -dy, 2);
        });

        return score;
    }

    // 評估單個方向
    evaluateDirection(row, col, dx, dy, player) {
        let score = 0;
        let count = 0;
        let empty = 0;

        for (let i = 1; i <= 4; i++) {
            const r = row + i * dy;
            const c = col + i * dx;

            if (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE) {
                if (this.board[r][c] === player) {
                    count++;
                } else if (this.board[r][c] === 0) {
                    empty++;
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        if (count === 3 && empty === 1) score += 100;
        else if (count === 2 && empty === 2) score += 10;
        else if (count === 1 && empty === 3) score += 1;

        return score;
    }

    // 獲取位置獎勵分數
    getPositionBonus(row, col) {
        let bonus = 0;
        const centerRow = 7, centerCol = 7;

        // 距離中心越近分數越高
        const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        bonus += (14 - distance) * 2;

        // 檢查周圍是否有棋子
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE) {
                    if (this.board[r][c] !== 0) bonus += 3;
                }
            }
        }

        return bonus;
    }

    // 檢查勝利
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1] // 右、下、右下、左下
        ];

        for (const [dx, dy] of directions) {
            let count = 1;

            // 正方向檢查
            for (let i = 1; i <= 4; i++) {
                const r = row + i * dy;
                const c = col + i * dx;
                if (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE
                    && this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }

            // 反方向檢查
            for (let i = 1; i <= 4; i++) {
                const r = row - i * dy;
                const c = col - i * dx;
                if (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE
                    && this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 5) return true;
        }

        return false;
    }

    // 檢查棋盤是否滿了
    isBoardFull() {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === 0) return false;
            }
        }
        return true;
    }

    // 結束遊戲
    endGame(message) {
        this.gameOver = true;
        this.winner = this.currentPlayer;
        this.gameStatusDiv.textContent = message;
    }

    // 更新遊戲資訊
    updateGameInfo() {
        this.currentPlayerSpan.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
        this.currentPlayerSpan.style.color = this.currentPlayer === 1 ? '#2C3E50' : '#2C3E50';
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

// 遊戲初始化
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});