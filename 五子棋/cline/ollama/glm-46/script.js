class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = 40;
        this.boardPadding = 20;
        this.board = [];
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]]; // 五個星位

        this.init();
    }

    init() {
        // 初始化棋盤陣列
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.gameOver = false;
        this.currentPlayer = 1;

        // 設定畫布大小
        this.canvas.width = this.cellSize * (this.boardSize - 1) + this.boardPadding * 2;
        this.canvas.height = this.canvas.width;

        // 綁定事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.getElementById('restart-btn').addEventListener('click', this.restart.bind(this));

        // 初始繪製
        this.drawBoard();
        this.updateTurnIndicator();
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
            this.ctx.lineTo(this.canvas.width - this.boardPadding, this.boardPadding + i * this.cellSize);
            this.ctx.stroke();

            // 豎線
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardPadding + i * this.cellSize, this.boardPadding);
            this.ctx.lineTo(this.boardPadding + i * this.cellSize, this.canvas.height - this.boardPadding);
            this.ctx.stroke();
        }

        // 繪製星位
        this.ctx.fillStyle = '#8B4513';
        for (const [row, col] of this.starPoints) {
            const x = this.boardPadding + col * this.cellSize;
            const y = this.boardPadding + row * this.cellSize;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 重新繪製所有棋子
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
        const gradient = this.ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, radius * 0.1,
            x, y, radius
        );

        if (player === 1) {
            // 黑子漸層
            gradient.addColorStop(0, '#666666');
            gradient.addColorStop(0.5, '#333333');
            gradient.addColorStop(1, '#000000');
        } else {
            // 白子漸層
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, '#F0F0F0');
            gradient.addColorStop(1, '#CCCCCC');
        }

        // 繪製棋子
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
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

        // 檢查位置是否已佔用
        if (this.board[row][col] !== 0) return;

        // 下棋
        this.makeMove(row, col);
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawPiece(row, col, this.currentPlayer);

        // 檢查是否獲勝
        if (this.checkWin(row, col, this.currentPlayer)) {
            this.endGame(this.currentPlayer === 1 ? '恭喜你獲勝！' : 'AI獲勝了！');
            return;
        }

        // 檢查是否平局
        if (this.isBoardFull()) {
            this.endGame('平局！');
            return;
        }

        // 切換玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurnIndicator();

        // AI下棋
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => {
                this.aiMove();
            }, 500);
        }
    }

    aiMove() {
        if (this.gameOver) return;

        const bestMove = this.getBestMove();
        if (bestMove) {
            this.makeMove(bestMove.row, bestMove.col);
        }
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        // 首先檢查是否能直接獲勝
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

        // 評估每個可能的移動
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

        // 檢查四個方向
        const directions = [
            [[0, 1], [0, -1]],   // 橫向
            [[1, 0], [-1, 0]],   // 縱向
            [[1, 1], [-1, -1]],  // 主對角線
            [[1, -1], [-1, 1]]   // 副對角線
        ];

        for (const direction of directions) {
            score += this.evaluateDirection(row, col, direction, player);
            score += this.evaluateDirection(row, col, direction, opponent) * 0.8; // 防禦權重稍低
        }

        // 中心位置加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;

        // 靠近已有棋子的位置加分
        const neighbors = this.getNeighbors(row, col);
        score += neighbors.length * 5;

        return score;
    }

    evaluateDirection(row, col, direction, player) {
        let count = 0;
        let openEnds = 0;

        this.board[row][col] = player;

        for (const [dr, dc] of direction) {
            let r = row + dr;
            let c = col + dc;
            let consecutive = 0;

            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                if (this.board[r][c] === player) {
                    consecutive++;
                } else if (this.board[r][c] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
                r += dr;
                c += dc;
            }

            count += consecutive;
        }

        this.board[row][col] = 0;

        // 根據連子數量和開放端計算分數
        const totalConsecutive = count + 1; // 加上當前位置

        if (totalConsecutive >= 5) return 100000;
        if (totalConsecutive === 4 && openEnds === 2) return 10000;
        if (totalConsecutive === 4 && openEnds === 1) return 1000;
        if (totalConsecutive === 3 && openEnds === 2) return 500;
        if (totalConsecutive === 3 && openEnds === 1) return 100;
        if (totalConsecutive === 2 && openEnds === 2) return 50;
        if (totalConsecutive === 2 && openEnds === 1) return 10;

        return totalConsecutive;
    }

    getNeighbors(row, col) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] !== 0) {
                    neighbors.push({ row: r, col: c });
                }
            }
        }
        return neighbors;
    }

    checkWin(row, col, player) {
        const directions = [
            [[0, 1], [0, -1]],   // 橫向
            [[1, 0], [-1, 0]],   // 縱向
            [[1, 1], [-1, -1]],  // 主對角線
            [[1, -1], [-1, 1]]   // 副對角線
        ];

        for (const direction of directions) {
            let count = 1;

            for (const [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;

                while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                    count++;
                    r += dr;
                    c += dc;
                }
            }

            if (count >= 5) return true;
        }

        return false;
    }

    isBoardFull() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) return false;
            }
        }
        return true;
    }

    endGame(message) {
        this.gameOver = true;
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
        messageElement.classList.remove('hidden');

        // 根據結果設置不同顏色
        if (message.includes('恭喜你')) {
            messageElement.style.backgroundColor = '#4CAF50';
        } else if (message.includes('AI獲勝')) {
            messageElement.style.backgroundColor = '#f44336';
        } else {
            messageElement.style.backgroundColor = '#FF9800';
        }
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        indicator.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
        indicator.style.backgroundColor = this.currentPlayer === 1 ? '#333333' : '#FFFFFF';
        indicator.style.color = this.currentPlayer === 1 ? '#FFFFFF' : '#000000';
    }

    restart() {
        const messageElement = document.getElementById('game-message');
        messageElement.classList.add('hidden');
        this.init();
    }
}

// 頁面載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    const game = new GomokuGame();
});
