// 五子棋遊戲
class GoBangGame {
    constructor() {
        this.canvas = document.getElementById('gosper-board');
        this.ctx = this.canvas.getContext('2d');
        this.resetBtn = document.getElementById('reset-btn');
        this.turnIndicator = document.querySelector('.turn-indicator');
        this.messageDiv = document.getElementById('message');

        // 遊戲常數
        this.BOARD_SIZE = 15; // 15x15棋盤
        this.CELL_SIZE = this.canvas.width / (this.BOARD_SIZE + 1); // 為了讓棋子不會超出邊界
        this.PIECE_RADIUS = this.CELL_SIZE * 0.4; // 棋子直徑80%的半徑

        // 遊戲狀態
        this.board = Array(this.BOARD_SIZE).fill().map(() => Array(this.BOARD_SIZE).fill(null));
        this.currentPlayer = 'black'; // 黑子先行
        this.gameOver = false;

        this.init();
    }

    init() {
        this.drawBoard();
        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.resetBtn.addEventListener('click', this.resetGame.bind(this));
    }

    handleCanvasClick(event) {
        if (this.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 將點擊位置轉換為棋盤坐標（0-14）
        let boardX = Math.round((x - this.CELL_SIZE) / this.CELL_SIZE);
        let boardY = Math.round((y - this.CELL_SIZE) / this.CELL_SIZE);

        // 確保坐標在有效範圍內
        boardX = Math.max(0, Math.min(this.BOARD_SIZE - 1, boardX));
        boardY = Math.max(0, Math.min(this.BOARD_SIZE - 1, boardY));

        if (this.board[boardX][boardY] === null) {
            this.placePiece(boardX, boardY, this.currentPlayer);
            this.drawBoard();

            if (this.checkWin(boardX, boardY, this.currentPlayer)) {
                this.endGame(this.currentPlayer);
                return;
            }

            this.switchPlayer();
            this.updateTurnIndicator();

            // AI行動
            setTimeout(() => {
                if (!this.gameOver) {
                    this.aiMove();
                }
            }, 500);
        }
    }

    placePiece(x, y, player) {
        this.board[x][y] = player;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    }

    updateTurnIndicator() {
        this.turnIndicator.textContent = `當前回合：${this.currentPlayer === 'black' ? '黑方' : '白方'}`;
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製棋盤背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製作戰線
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;

        // 垂直線
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            const x = this.CELL_SIZE * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.CELL_SIZE);
            this.ctx.lineTo(x, this.canvas.height - this.CELL_SIZE);
            this.ctx.stroke();
        }

        // 水平線
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            const y = this.CELL_SIZE * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(this.CELL_SIZE, y);
            this.ctx.lineTo(this.canvas.width - this.CELL_SIZE, y);
            this.ctx.stroke();
        }

        // 繪製星位（9個星位）
        const starPositions = [
            [3, 3], [7, 3], [11, 3],
            [3, 7], [7, 7], [11, 7],
            [3, 11], [7, 11], [11, 11]
        ];

        this.ctx.fillStyle = '#8B4513';
        starPositions.forEach(([x, y]) => {
            const posX = this.CELL_SIZE * (x + 1);
            const posY = this.CELL_SIZE * (y + 1);
            this.ctx.beginPath();
            this.ctx.arc(posX, posY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 繪製棋子
        for (let x = 0; x < this.BOARD_SIZE; x++) {
            for (let y = 0; y < this.BOARD_SIZE; y++) {
                if (this.board[x][y]) {
                    this.drawPiece(x, y, this.board[x][y]);
                }
            }
        }
    }

    drawPiece(x, y, player) {
        const centerX = this.CELL_SIZE * (x + 1);
        const centerY = this.CELL_SIZE * (y + 1);

        // 創建圓形漸變
        const gradient = this.ctx.createRadialGradient(
            centerX - this.PIECE_RADIUS * 0.3, centerY - this.PIECE_RADIUS * 0.3, 0,
            centerX, centerY, this.PIECE_RADIUS
        );

        if (player === 'black') {
            gradient.addColorStop(0, '#4A4A4A'); // 亮黑色
            gradient.addColorStop(1, '#000000'); // 深黑色
        } else {
            gradient.addColorStop(0, '#FFFFFF'); // 亮白色
            gradient.addColorStop(1, '#CCCCCC'); // 淺灰白色
        }

        // 繪製棋子
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.PIECE_RADIUS, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    checkWin(x, y, player) {
        // 檢查橫向、豎向、斜向前後四個方向
        const directions = [
            [0, 1],  // 橫向
            [1, 0],  // 豎向
            [1, 1],  // 斜向 \
            [1, -1]  // 斜向 /
        ];

        for (const [dx, dy] of directions) {
            let count = 1; // 包含當前棋子

            // 正向檢查
            let i = 1;
            while (this.isValidPosition(x + i * dx, y + i * dy) &&
                this.board[x + i * dx][y + i * dy] === player) {
                count++;
                i++;
                if (count >= 5) return true;
            }

            // 反向檢查
            i = 1;
            while (this.isValidPosition(x - i * dx, y - i * dy) &&
                this.board[x - i * dx][y - i * dy] === player) {
                count++;
                i++;
                if (count >= 5) return true;
            }
        }

        return false;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.BOARD_SIZE && y >= 0 && y < this.BOARD_SIZE;
    }

    endGame(winner) {
        this.gameOver = true;
        const winnerText = winner === 'black' ? '黑方' : '白方';
        this.messageDiv.textContent = `${winnerText}獲勝！遊戲結束。`;
    }

    aiMove() {
        if (this.gameOver) return;

        const bestMove = this.getBestMove();
        if (bestMove) {
            const [x, y] = bestMove;
            this.placePiece(x, y, 'white');
            this.drawBoard();

            if (this.checkWin(x, y, 'white')) {
                this.endGame('white');
                return;
            }

            this.switchPlayer();
            this.updateTurnIndicator();
        }
    }

    getBestMove() {
        const aiPlayer = 'white';
        const humanPlayer = 'black';

        // 1. 檢查是否能獲勝
        let move = this.findFourInRow(aiPlayer, true);
        if (move) return move;

        // 2. 檢查是否需要阻擋對手獲勝
        move = this.findFourInRow(humanPlayer, true);
        if (move) return move;

        // 3. 檢查是否能形成三子連線準備獲勝
        move = this.findFourInRow(aiPlayer, false);
        if (move) return move;

        // 4. 檢查是否需要阻擋對手的四子
        move = this.findFourInRow(humanPlayer, false);
        if (move) return move;

        // 5. 在已有棋子附近或中心區域下棋
        return this.getStrategicMove();
    }

    findFourInRow(player, isWinning) {
        // 檢查是否能形成四子連線（isWinning = true）或三子連線（isWinning = false）
        const targetLength = isWinning ? 4 : 3;

        for (let x = 0; x < this.BOARD_SIZE; x++) {
            for (let y = 0; y < this.BOARD_SIZE; y++) {
                if (this.board[x][y] !== null) continue;

                // 在這個位置放置棋子並檢查是否形成目標長度的連線
                if (this.wouldFormLine(x, y, player, targetLength)) {
                    return [x, y];
                }
            }
        }

        return null;
    }

    wouldFormLine(x, y, player, targetLength) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (const [dx, dy] of directions) {
            let count = 0;

            // 計算在這個方向上的連續棋子數
            let i = -4;
            while (i <= 4 && count < targetLength) {
                const nx = x + i * dx;
                const ny = y + i * dy;

                if (this.isValidPosition(nx, ny)) {
                    if (nx === x && ny === y) {
                        count++; // 包含當前位置
                    } else if (this.board[nx][ny] === player) {
                        count++;
                    } else {
                        count = 0;
                    }
                } else {
                    count = 0;
                }

                if (count >= targetLength) {
                    return true;
                }
                i++;
            }
        }

        return false;
    }

    getStrategicMove() {
        const moves = [];

        // 優先考慮中心區域和已有棋子附近
        const centerX = Math.floor(this.BOARD_SIZE / 2);
        const centerY = Math.floor(this.BOARD_SIZE / 2);

        for (let x = 0; x < this.BOARD_SIZE; x++) {
            for (let y = 0; y < this.BOARD_SIZE; y++) {
                if (this.board[x][y] !== null) continue;

                // 計算距離中心點的距離和附近棋子的權重
                let score = 0;

                // 距離中心的分數（越近越高分）
                const distance = Math.abs(x - centerX) + Math.abs(y - centerY);
                score += (this.BOARD_SIZE - distance) * 10;

                // 檢查附近是否有棋子
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (this.isValidPosition(nx, ny) && this.board[nx][ny] !== null) {
                            score += 20;
                        }
                    }
                }

                moves.push({ x, y, score });
            }
        }

        // 按分數排序並隨機選擇前幾個中的一個
        moves.sort((a, b) => b.score - a.score);
        const topMoves = moves.slice(0, Math.min(10, moves.length));
        const randomIndex = Math.floor(Math.random() * topMoves.length);
        return [topMoves[randomIndex].x, topMoves[randomIndex].y];
    }

    resetGame() {
        this.board = Array(this.BOARD_SIZE).fill().map(() => Array(this.BOARD_SIZE).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.messageDiv.textContent = '';
        this.updateTurnIndicator();
        this.drawBoard();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GoBangGame();
});
