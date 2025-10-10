// 五子棋遊戲邏輯
class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.winningLine = [];

        this.init();
    }

    init() {
        this.createBoard();
        this.addStarPositions();
        this.bindEvents();
        this.updateCurrentPlayerDisplay();
    }

    createBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;

                // 計算位置
                const x = (col / (this.boardSize - 1)) * 100;
                const y = (row / (this.boardSize - 1)) * 100;

                intersection.addEventListener('click', (e) => this.handleClick(e, row, col));

                board.appendChild(intersection);
            }
        }
    }

    addStarPositions() {
        const starPositions = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];

        starPositions.forEach(([row, col]) => {
            const star = document.createElement('div');
            star.className = 'star';

            const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (intersection) {
                const rect = intersection.getBoundingClientRect();
                const boardRect = document.getElementById('board').getBoundingClientRect();

                star.style.left = `${((col / (this.boardSize - 1)) * 100)}%`;
                star.style.top = `${((row / (this.boardSize - 1)) * 100)}%`;
                star.style.transform = 'translate(-50%, -50%)';

                document.getElementById('board').appendChild(star);
            }
        });
    }

    handleClick(event, row, col) {
        if (this.gameOver || this.board[row][col] !== 0) {
            return;
        }

        this.placePiece(row, col, this.currentPlayer);

        if (this.checkWin(row, col, this.currentPlayer)) {
            this.endGame(`${this.currentPlayer === 1 ? '黑方' : '白方'}獲勝！`);
            return;
        }

        if (this.isBoardFull()) {
            this.endGame('平局！');
            return;
        }

        // 切換到AI回合
        this.currentPlayer = 2;
        this.updateCurrentPlayerDisplay();

        // AI移動
        setTimeout(() => {
            this.aiMove();
        }, 500);
    }

    placePiece(row, col, player) {
        this.board[row][col] = player;

        const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (intersection) {
            const piece = document.createElement('div');
            piece.className = `piece ${player === 1 ? 'black' : 'white'}`;
            intersection.appendChild(piece);
        }
    }

    aiMove() {
        if (this.gameOver) return;

        const move = this.getBestMove();
        if (move) {
            this.placePiece(move.row, move.col, this.currentPlayer);

            if (this.checkWin(move.row, move.col, this.currentPlayer)) {
                this.endGame(`${this.currentPlayer === 1 ? '黑方' : '白方'}獲勝！`);
                return;
            }

            if (this.isBoardFull()) {
                this.endGame('平局！');
                return;
            }

            // 切換回玩家回合
            this.currentPlayer = 1;
            this.updateCurrentPlayerDisplay();
        }
    }

    getBestMove() {
        // 評估所有可能的移動
        let bestMove = null;
        let bestScore = -Infinity;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    // 嘗試這個位置
                    this.board[row][col] = 2;
                    const score = this.evaluatePosition(row, col);
                    this.board[row][col] = 0; // 恢復

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

        // 評估四個方向的連線可能性
        score += this.evaluateDirection(row, col, 0, 1);   // 水平
        score += this.evaluateDirection(row, col, 1, 0);   // 垂直
        score += this.evaluateDirection(row, col, 1, 1);   // 對角線1
        score += this.evaluateDirection(row, col, 1, -1);  // 對角線2

        // 優先考慮中心位置
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;

        return score;
    }

    evaluateDirection(row, col, dRow, dCol) {
        let score = 0;
        let aiCount = 0;
        let playerCount = 0;
        let emptyCount = 0;

        // 正方向
        for (let i = 1; i <= 4; i++) {
            const r = row + i * dRow;
            const c = col + i * dCol;

            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                const cell = this.board[r][c];
                if (cell === 2) aiCount++;
                else if (cell === 1) playerCount++;
                else emptyCount++;
            } else {
                break;
            }
        }

        // 反方向
        for (let i = 1; i <= 4; i++) {
            const r = row - i * dRow;
            const c = col - i * dCol;

            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                const cell = this.board[r][c];
                if (cell === 2) aiCount++;
                else if (cell === 1) playerCount++;
                else emptyCount++;
            } else {
                break;
            }
        }

        // 評分策略
        if (aiCount === 4) return 10000; // AI獲勝
        if (playerCount === 4) return 5000; // 阻止玩家獲勝
        if (aiCount === 3 && emptyCount >= 1) return 1000; // AI三連
        if (playerCount === 3 && emptyCount >= 1) return 800; // 阻止玩家三連
        if (aiCount === 2 && emptyCount >= 2) return 100; // AI兩連
        if (playerCount === 2 && emptyCount >= 2) return 50; // 阻止玩家兩連

        return score;
    }

    checkWin(row, col, player) {
        // 檢查四個方向
        return this.checkDirection(row, col, player, 0, 1) || // 水平
            this.checkDirection(row, col, player, 1, 0) || // 垂直
            this.checkDirection(row, col, player, 1, 1) || // 對角線1
            this.checkDirection(row, col, player, 1, -1);  // 對角線2
    }

    checkDirection(row, col, player, dRow, dCol) {
        let count = 1; // 當前位置

        // 正方向
        for (let i = 1; i <= 4; i++) {
            const r = row + i * dRow;
            const c = col + i * dCol;

            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize &&
                this.board[r][c] === player) {
                count++;
            } else {
                break;
            }
        }

        // 反方向
        for (let i = 1; i <= 4; i++) {
            const r = row - i * dRow;
            const c = col - i * dCol;

            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize &&
                this.board[r][c] === player) {
                count++;
            } else {
                break;
            }
        }

        return count >= 5;
    }

    isBoardFull() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    endGame(message) {
        this.gameOver = true;

        const statusDiv = document.getElementById('game-status');
        statusDiv.textContent = message;
        statusDiv.className = message.includes('獲勝') ? 'game-status win' : 'game-status draw';
        statusDiv.style.display = 'block';
    }

    updateCurrentPlayerDisplay() {
        const playerDisplay = document.getElementById('current-player');
        playerDisplay.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
        playerDisplay.style.color = this.currentPlayer === 1 ? '#2C3E50' : '#7F8C8D';
    }

    restart() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winningLine = [];

        // 清空棋盤
        const intersections = document.querySelectorAll('.intersection');
        intersections.forEach(intersection => {
            intersection.innerHTML = '';
        });

        // 隱藏遊戲狀態
        const statusDiv = document.getElementById('game-status');
        statusDiv.style.display = 'none';

        this.updateCurrentPlayerDisplay();
    }

    bindEvents() {
        const restartBtn = document.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => this.restart());
    }
}

// 遊戲初始化
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
