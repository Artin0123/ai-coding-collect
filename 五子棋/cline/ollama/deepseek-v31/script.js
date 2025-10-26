class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black'; // 黑子先行
        this.gameOver = false;
        this.starPositions = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];

        this.initializeBoard();
        this.setupEventListeners();
        this.updateTurnIndicator();
    }

    initializeBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;

                // 標記星位
                if (this.isStarPosition(row, col)) {
                    intersection.classList.add('star');
                }

                intersection.addEventListener('click', () => this.handleMove(row, col));
                boardElement.appendChild(intersection);
            }
        }
    }

    isStarPosition(row, col) {
        return this.starPositions.some(pos => pos[0] === row && pos[1] === col);
    }

    setupEventListeners() {
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    }

    handleMove(row, col) {
        if (this.gameOver || this.board[row][col] !== null || this.currentPlayer !== 'black') {
            return;
        }

        this.placePiece(row, col, 'black');

        if (this.checkWin(row, col, 'black')) {
            this.endGame('black');
            return;
        }

        this.currentPlayer = 'white';
        this.updateTurnIndicator();

        // AI 響應
        setTimeout(() => this.aiMove(), 500);
    }

    placePiece(row, col, player) {
        this.board[row][col] = player;

        const intersection = document.querySelector(`.intersection[data-row="${row}"][data-col="${col}"]`);
        const piece = document.createElement('div');
        piece.className = `piece ${player}`;
        intersection.appendChild(piece);
    }

    aiMove() {
        if (this.gameOver) return;

        const move = this.findBestMove();
        if (move) {
            this.placePiece(move.row, move.col, 'white');

            if (this.checkWin(move.row, move.col, 'white')) {
                this.endGame('white');
                return;
            }

            this.currentPlayer = 'black';
            this.updateTurnIndicator();
        }
    }

    findBestMove() {
        // 優先檢查能否獲勝
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    if (this.wouldWin(row, col, 'white')) {
                        return { row, col };
                    }
                }
            }
        }

        // 防守：阻止玩家獲勝
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    if (this.wouldWin(row, col, 'black')) {
                        return { row, col };
                    }
                }
            }
        }

        // 尋找最佳進攻位置
        let bestScore = -Infinity;
        let bestMove = null;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    const score = this.evaluatePosition(row, col, 'white');
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col };
                    }
                }
            }
        }

        // 如果沒有好的進攻位置，隨機選擇一個空位
        if (!bestMove) {
            const emptyCells = [];
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    if (this.board[row][col] === null) {
                        emptyCells.push({ row, col });
                    }
                }
            }
            if (emptyCells.length > 0) {
                bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        }

        return bestMove;
    }

    wouldWin(row, col, player) {
        this.board[row][col] = player;
        const wouldWin = this.checkWin(row, col, player);
        this.board[row][col] = null;
        return wouldWin;
    }

    evaluatePosition(row, col, player) {
        let score = 0;

        // 檢查八個方向
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1], // 水平、垂直、對角線
            [0, -1], [-1, 0], [-1, -1], [-1, 1]
        ];

        for (const [dx, dy] of directions) {
            score += this.evaluateDirection(row, col, dx, dy, player);
        }

        return score;
    }

    evaluateDirection(row, col, dx, dy, player) {
        let score = 0;
        let consecutive = 0;
        let openEnds = 0;

        // 向前檢查
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;

            if (this.isValidPosition(newRow, newCol)) {
                if (this.board[newRow][newCol] === player) {
                    consecutive++;
                } else if (this.board[newRow][newCol] === null) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        // 向後檢查
        for (let i = 1; i <= 4; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;

            if (this.isValidPosition(newRow, newCol)) {
                if (this.board[newRow][newCol] === player) {
                    consecutive++;
                } else if (this.board[newRow][newCol] === null) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        // 評分邏輯
        if (consecutive >= 4) return 10000; // 連四
        if (consecutive === 3) {
            if (openEnds === 2) return 5000; // 活三
            if (openEnds === 1) return 1000; // 死三
        }
        if (consecutive === 2) {
            if (openEnds === 2) return 500; // 活二
            if (openEnds === 1) return 100; // 死二
        }
        if (consecutive === 1 && openEnds === 2) return 50; // 活一

        return score;
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],  // 水平
            [1, 0],  // 垂直
            [1, 1],  // 對角線（右下）
            [1, -1]  // 對角線（左下）
        ];

        for (const [dx, dy] of directions) {
            let count = 1; // 當前位置已經有一個棋子

            // 正向檢查
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;

                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            // 反向檢查
            for (let i = 1; i <= 4; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;

                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === player) {
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

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        indicator.textContent = `當前回合：${this.currentPlayer === 'black' ? '黑方' : '白方'}`;
    }

    endGame(winner) {
        this.gameOver = true;
        const message = document.getElementById('message');
        message.textContent = winner === 'black' ? '恭喜！黑方獲勝！' : 'AI（白方）獲勝！';
        message.classList.add('win');
    }

    restartGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;

        const message = document.getElementById('message');
        message.textContent = '';
        message.classList.remove('win');

        this.initializeBoard();
        this.updateTurnIndicator();
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
