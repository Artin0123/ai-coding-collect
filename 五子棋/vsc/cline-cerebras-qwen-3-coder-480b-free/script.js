// 五子棋遊戲邏輯
class GobangGame {
    constructor() {
        this.boardSize = 15;
        this.cellSize = 30;
        this.board = [];
        this.currentPlayer = 'black'; // black or white
        this.gameOver = false;
        this.canvas = document.getElementById('gobang-board');
        this.ctx = this.canvas.getContext('2d');
        this.messageDiv = document.getElementById('message');
        this.playerTurnSpan = document.getElementById('player-turn');
        this.restartBtn = document.getElementById('restart-btn');

        // 初始化棋盤
        this.initBoard();

        // 綁定事件
        this.bindEvents();

        // 繪製棋盤
        this.drawBoard();
    }

    // 初始化棋盤
    initBoard() {
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = null; // null表示空位，'black'表示黑子，'white'表示白子
            }
        }
    }

    // 繪製棋盤
    drawBoard() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const size = this.boardSize;
        const cellSize = this.cellSize;

        // 清空畫布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 繪製棋盤背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 繪製網格線
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        // 計算棋盤邊距
        const margin = cellSize;

        // 繪製垂直線
        for (let i = 0; i < size; i++) {
            ctx.beginPath();
            ctx.moveTo(margin + i * cellSize, margin);
            ctx.lineTo(margin + i * cellSize, margin + (size - 1) * cellSize);
            ctx.stroke();
        }

        // 繪製水平線
        for (let i = 0; i < size; i++) {
            ctx.beginPath();
            ctx.moveTo(margin, margin + i * cellSize);
            ctx.lineTo(margin + (size - 1) * cellSize, margin + i * cellSize);
            ctx.stroke();
        }

        // 繪製星位
        const starPoints = [
            [3, 3], [3, 7], [3, 11],
            [7, 3], [7, 7], [7, 11],
            [11, 3], [11, 7], [11, 11]
        ];

        ctx.fillStyle = '#8B4513';
        starPoints.forEach(point => {
            const [x, y] = point;
            ctx.beginPath();
            ctx.arc(margin + x * cellSize, margin + y * cellSize, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // 繪製已有的棋子
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.board[i][j]) {
                    this.drawPiece(i, j, this.board[i][j]);
                }
            }
        }
    }

    // 繪製棋子
    drawPiece(x, y, color) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const margin = cellSize;
        const centerX = margin + x * cellSize;
        const centerY = margin + y * cellSize;
        const radius = cellSize * 0.4; // 直徑為格子寬度的80%

        // 繪製棋子
        const gradient = ctx.createRadialGradient(
            centerX - radius / 3, centerY - radius / 3, radius / 8,
            centerX, centerY, radius
        );

        if (color === 'black') {
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(1, '#000');
        } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#8B4513';
        ctx.stroke();
    }

    // 綁定事件
    bindEvents() {
        // 點擊棋盤事件
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 'black') return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 转换为棋盘坐标
            const boardX = Math.round((x - this.cellSize) / this.cellSize);
            const boardY = Math.round((y - this.cellSize) / this.cellSize);

            // 检查坐标是否有效
            if (boardX >= 0 && boardX < this.boardSize && boardY >= 0 && boardY < this.boardSize) {
                this.placePiece(boardX, boardY, 'black');
            }
        });

        // 重新開始按鈕事件
        this.restartBtn.addEventListener('click', () => {
            this.restart();
        });
    }

    // 放置棋子
    placePiece(x, y, color) {
        // 检查位置是否为空
        if (this.board[x][y] !== null) return false;

        // 放置棋子
        this.board[x][y] = color;

        // 重新繪製棋盤
        this.drawBoard();

        // 检查是否获胜
        if (this.checkWin(x, y, color)) {
            this.gameOver = true;
            this.messageDiv.textContent = color === 'black' ? '黑方獲勝！' : '白方獲勝！';
            return true;
        }

        // 切換玩家
        this.currentPlayer = color === 'black' ? 'white' : 'black';
        this.playerTurnSpan.textContent = this.currentPlayer === 'black' ? '黑方' : '白方';

        // 如果是AI回合，延遲0.5秒後下棋
        if (this.currentPlayer === 'white' && !this.gameOver) {
            setTimeout(() => {
                this.aiMove();
            }, 500);
        }

        return true;
    }

    // 檢查是否獲勝
    checkWin(x, y, color) {
        // 检查四个方向：水平、垂直、两个对角线
        const directions = [
            [1, 0],  // 水平
            [0, 1],  // 垂直
            [1, 1],  // 对角线 \
            [1, -1]  // 对角线 /
        ];

        for (let [dx, dy] of directions) {
            let count = 1; // 包含当前棋子

            // 向一个方向检查
            for (let i = 1; i <= 4; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && this.board[nx][ny] === color) {
                    count++;
                } else {
                    break;
                }
            }

            // 向相反方向检查
            for (let i = 1; i <= 4; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && this.board[nx][ny] === color) {
                    count++;
                } else {
                    break;
                }
            }

            // 如果连成五子，获胜
            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    // AI下棋
    aiMove() {
        if (this.gameOver) return;

        // 获取最佳位置
        const move = this.getBestMove();

        if (move) {
            this.placePiece(move.x, move.y, 'white');
        }
    }

    // 获取最佳下棋位置
    getBestMove() {
        // 1. 检查AI是否能获胜
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    this.board[i][j] = 'white';
                    if (this.checkWin(i, j, 'white')) {
                        this.board[i][j] = null;
                        return { x: i, y: j };
                    }
                    this.board[i][j] = null;
                }
            }
        }

        // 2. 检查是否需要阻挡玩家获胜
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    this.board[i][j] = 'black';
                    if (this.checkWin(i, j, 'black')) {
                        this.board[i][j] = null;
                        return { x: i, y: j };
                    }
                    this.board[i][j] = null;
                }
            }
        }

        // 3. 检查AI是否能形成四子连线
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    this.board[i][j] = 'white';
                    if (this.checkFourInARow(i, j, 'white')) {
                        this.board[i][j] = null;
                        return { x: i, y: j };
                    }
                    this.board[i][j] = null;
                }
            }
        }

        // 4. 检查是否需要阻挡玩家形成四子连线
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    this.board[i][j] = 'black';
                    if (this.checkFourInARow(i, j, 'black')) {
                        this.board[i][j] = null;
                        return { x: i, y: j };
                    }
                    this.board[i][j] = null;
                }
            }
        }

        // 5. 获取所有空位并按权重排序
        const emptyPositions = this.getEmptyPositions();
        if (emptyPositions.length > 0) {
            // 按权重排序
            emptyPositions.sort((a, b) => b.weight - a.weight);

            // 返回权重最高的位置
            return emptyPositions[0];
        }

        return null;
    }

    // 检查四子连线
    checkFourInARow(x, y, color) {
        const directions = [
            [1, 0],  // 水平
            [0, 1],  // 垂直
            [1, 1],  // 对角线 \
            [1, -1]  // 对角线 /
        ];

        for (let [dx, dy] of directions) {
            let count = 1; // 包含当前棋子

            // 向一个方向检查
            for (let i = 1; i <= 3; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && this.board[nx][ny] === color) {
                    count++;
                } else {
                    break;
                }
            }

            // 向相反方向检查
            for (let i = 1; i <= 3; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && this.board[nx][ny] === color) {
                    count++;
                } else {
                    break;
                }
            }

            // 如果形成四子连线
            if (count === 4) {
                return true;
            }
        }

        return false;
    }

    // 获取所有空位并计算权重
    getEmptyPositions() {
        const positions = [];

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    const weight = this.calculateWeight(i, j);
                    positions.push({ x: i, y: j, weight: weight });
                }
            }
        }

        return positions;
    }

    // 计算位置权重
    calculateWeight(x, y) {
        let weight = 0;

        // 1. 距离中心越近权重越高
        const centerX = Math.floor(this.boardSize / 2);
        const centerY = Math.floor(this.boardSize / 2);
        const distanceToCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
        weight += (14 - distanceToCenter) * 2; // 中心权重

        // 2. 周围有棋子的权重更高
        for (let i = Math.max(0, x - 2); i <= Math.min(this.boardSize - 1, x + 2); i++) {
            for (let j = Math.max(0, y - 2); j <= Math.min(this.boardSize - 1, y + 2); j++) {
                if (this.board[i][j] !== null) {
                    const distance = Math.abs(x - i) + Math.abs(y - j);
                    if (distance === 1) {
                        weight += 10; // 相邻位置
                    } else if (distance === 2) {
                        weight += 5;  // 间隔一个位置
                    }
                }
            }
        }

        return weight;
    }

    // 重新開始
    restart() {
        this.initBoard();
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.playerTurnSpan.textContent = '黑方';
        this.messageDiv.textContent = '';
        this.drawBoard();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    const game = new GobangGame();
});
