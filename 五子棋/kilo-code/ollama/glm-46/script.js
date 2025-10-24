class Gomoku {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = 40;
        this.boardPadding = 20;
        this.board = [];
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
        ];

        this.init();
    }

    init() {
        // 初始化棋盤數組
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));

        // 設置畫布大小
        const canvasSize = this.cellSize * (this.boardSize - 1) + this.boardPadding * 2;
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;

        // 綁定事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.getElementById('restart-btn').addEventListener('click', this.restart.bind(this));

        // 繪製初始棋盤
        this.drawBoard();
        this.updateTurnDisplay();
    }

    drawBoard() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製棋盤背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製網格線
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < this.boardSize; i++) {
            // 橫線
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardPadding, this.boardPadding + i * this.cellSize);
            this.ctx.lineTo(this.boardPadding + (this.boardSize - 1) * this.cellSize, this.boardPadding + i * this.cellSize);
            this.ctx.stroke();

            // 豎線
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardPadding + i * this.cellSize, this.boardPadding);
            this.ctx.lineTo(this.boardPadding + i * this.cellSize, this.boardPadding + (this.boardSize - 1) * this.cellSize);
            this.ctx.stroke();
        }

        // 繪製星位
        this.ctx.fillStyle = '#8B4513';
        this.starPoints.forEach(([row, col]) => {
            const x = this.boardPadding + col * this.cellSize;
            const y = this.boardPadding + row * this.cellSize;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 重新繪製所有棋子
        this.redrawPieces();
    }

    redrawPieces() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col]);
                }
            }
        }
    }

    drawPiece(row, col, player) {
        const x = this.boardPadding + col * this.cellSize;
        const y = this.boardPadding + row * this.cellSize;
        const radius = this.cellSize * 0.4;

        // 創建漸層效果
        const gradient = this.ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);

        if (player === 1) {
            // 黑子漸層
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(0.7, '#000000');
            gradient.addColorStop(1, '#000000');
        } else {
            // 白子漸層
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#F0F0F0');
            gradient.addColorStop(1, '#CCCCCC');
        }

        // 繪製棋子
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 添加邊框
        this.ctx.strokeStyle = player === 1 ? '#000000' : '#888888';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    handleClick(event) {
        if (this.gameOver || this.currentPlayer !== 1) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 計算最近的交叉點
        const col = Math.round((x - this.boardPadding) / this.cellSize);
        const row = Math.round((y - this.boardPadding) / this.cellSize);

        // 檢查是否在有效範圍內
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) return;

        // 檢查位置是否已有棋子
        if (this.board[row][col] !== 0) return;

        // 放置棋子
        this.placePiece(row, col);
    }

    placePiece(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawPiece(row, col, this.currentPlayer);

        // 檢查是否獲勝
        if (this.checkWin(row, col)) {
            this.endGame(this.currentPlayer);
            return;
        }

        // 檢查是否平局
        if (this.checkDraw()) {
            this.endGame(0);
            return;
        }

        // 切換玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurnDisplay();

        // AI下棋
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    aiMove() {
        if (this.gameOver) return;

        const move = this.getBestMove();
        if (move) {
            this.placePiece(move.row, move.col);
        }
    }

    getBestMove() {
        // 評估所有可能的位置
        let bestScore = -Infinity;
        let bestMove = null;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    const score = this.evaluatePosition(row, col, 2);

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col };
                    }
                }
            }
        }

        return bestMove;
    }

    evaluatePosition(row, col, player) {
        let score = 0;
        const opponent = player === 1 ? 2 : 1;

        // 檢查是否能直接獲勝
        this.board[row][col] = player;
        if (this.checkWin(row, col)) {
            this.board[row][col] = 0;
            return 10000;
        }
        this.board[row][col] = 0;

        // 檢查是否需要阻止對手獲勝
        this.board[row][col] = opponent;
        if (this.checkWin(row, col)) {
            this.board[row][col] = 0;
            return 9000;
        }
        this.board[row][col] = 0;

        // 評估攻擊和防守潛力
        this.board[row][col] = player;
        score += this.evaluateLines(row, col, player) * 10;
        this.board[row][col] = 0;

        this.board[row][col] = opponent;
        score += this.evaluateLines(row, col, opponent) * 8;
        this.board[row][col] = 0;

        // 中心位置加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;

        return score;
    }

    evaluateLines(row, col, player) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (const [dx, dy] of directions) {
            const lineScore = this.evaluateLine(row, col, dx, dy, player);
            score += lineScore;
        }

        return score;
    }

    evaluateLine(row, col, dx, dy, player) {
        let count = 1;
        let openEnds = 0;

        // 正方向檢查
        let r = row + dx;
        let c = col + dy;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
            count++;
            r += dx;
            c += dy;
        }
        if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === 0) {
            openEnds++;
        }

        // 負方向檢查
        r = row - dx;
        c = col - dy;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
            count++;
            r -= dx;
            c -= dy;
        }
        if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === 0) {
            openEnds++;
        }

        // 根據連子數量和開口數量評分
        if (count >= 5) return 1000;
        if (count === 4 && openEnds === 2) return 500;
        if (count === 4 && openEnds === 1) return 100;
        if (count === 3 && openEnds === 2) return 50;
        if (count === 3 && openEnds === 1) return 10;
        if (count === 2 && openEnds === 2) return 5;
        if (count === 2 && openEnds === 1) return 2;

        return 1;
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (const [dx, dy] of directions) {
            let count = 1;

            // 正方向檢查
            let r = row + dx;
            let c = col + dy;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                count++;
                r += dx;
                c += dy;
            }

            // 負方向檢查
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                count++;
                r -= dx;
                c -= dy;
            }

            if (count >= 5) return true;
        }

        return false;
    }

    checkDraw() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) return false;
            }
        }
        return true;
    }

    updateTurnDisplay() {
        const playerText = this.currentPlayer === 1 ? '黑方' : '白方';
        document.getElementById('current-player').textContent = playerText;
    }

    endGame(winner) {
        this.gameOver = true;
        const messageEl = document.getElementById('game-message');

        if (winner === 0) {
            messageEl.textContent = '平局！';
        } else {
            const winnerText = winner === 1 ? '黑方（玩家）' : '白方（AI）';
            messageEl.textContent = `${winnerText} 獲勝！`;
        }

        messageEl.classList.remove('hidden');
        messageEl.classList.add('show');
    }

    restart() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;

        const messageEl = document.getElementById('game-message');
        messageEl.classList.add('hidden');
        messageEl.classList.remove('show');

        this.drawBoard();
        this.updateTurnDisplay();
    }
}

// 遊戲初始化
document.addEventListener('DOMContentLoaded', () => {
    new Gomoku();
});