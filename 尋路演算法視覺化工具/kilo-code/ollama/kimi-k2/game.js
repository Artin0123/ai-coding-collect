class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.starPoints = [3, 7, 11];

        this.initBoard();
        this.drawBoard();
        this.bindEvents();
    }

    initBoard() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    }

    drawBoard() {
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < this.boardSize; i++) {
            const pos = i * this.cellSize + this.cellSize;

            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize, pos);
            this.ctx.lineTo(this.canvas.width - this.cellSize, pos);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(pos, this.cellSize);
            this.ctx.lineTo(pos, this.canvas.height - this.cellSize);
            this.ctx.stroke();
        }

        this.drawStarPoints();
        this.drawPieces();
    }

    drawStarPoints() {
        this.ctx.fillStyle = '#8B4513';
        for (let i = 0; i < this.starPoints.length; i++) {
            for (let j = 0; j < this.starPoints.length; j++) {
                const x = this.starPoints[i] * this.cellSize + this.cellSize;
                const y = this.starPoints[j] * this.cellSize + this.cellSize;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    drawPieces() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col]) {
                    this.drawPiece(row, col, this.board[row][col]);
                }
            }
        }
    }

    drawPiece(row, col, color) {
        const x = col * this.cellSize + this.cellSize;
        const y = row * this.cellSize + this.cellSize;
        const radius = this.cellSize * 0.4;

        const gradient = this.ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );

        if (color === 'black') {
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(0.7, '#000000');
            gradient.addColorStop(1, '#222222');
        } else {
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#E0E0E0');
            gradient.addColorStop(1, '#CCCCCC');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();

        this.ctx.strokeStyle = color === 'black' ? '#333333' : '#BBBBBB';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }

    handleClick(e) {
        if (this.gameOver || this.currentPlayer !== 'black') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.round((x - this.cellSize) / this.cellSize);
        const row = Math.round((y - this.cellSize) / this.cellSize);

        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
        }
    }

    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize &&
            col >= 0 && col < this.boardSize &&
            !this.board[row][col];
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawBoard();

        if (this.checkWin(row, col)) {
            this.endGame(`${this.currentPlayer === 'black' ? '黑方' : '白方'}獲勝！`);
            return;
        }

        if (this.checkDraw()) {
            this.endGame('平局！');
            return;
        }

        this.switchPlayer();

        if (this.currentPlayer === 'white') {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        document.getElementById('turn-display').textContent =
            this.currentPlayer === 'black' ? '黑方' : '白方';
    }

    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];

        const color = this.board[row][col];

        for (let direction of directions) {
            let count = 1;

            for (let [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;

                while (r >= 0 && r < this.boardSize &&
                    c >= 0 && c < this.boardSize &&
                    this.board[r][c] === color) {
                    count++;
                    r += dr;
                    c += dc;
                }
            }

            if (count >= 5) return true;
        }

        return false;
    }

    checkDraw() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.board[row][col]) return false;
            }
        }
        return true;
    }

    aiMove() {
        if (this.gameOver) return;

        const move = this.findBestMove();
        if (move) {
            this.makeMove(move.row, move.col);
        }
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.board[row][col]) {
                    const score = this.evaluatePosition(row, col, 'white') * 2 +
                        this.evaluatePosition(row, col, 'black');

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row, col };
                    }
                }
            }
        }

        return bestMove;
    }

    evaluatePosition(row, col, color) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (let [dr, dc] of directions) {
            let count = 1;
            let blocked = 0;

            for (let sign of [1, -1]) {
                let r = row + dr * sign;
                let c = col + dc * sign;
                let consecutive = 0;

                while (r >= 0 && r < this.boardSize &&
                    c >= 0 && c < this.boardSize) {
                    if (this.board[r][c] === color) {
                        consecutive++;
                        r += dr * sign;
                        c += dc * sign;
                    } else {
                        if (this.board[r][c]) blocked++;
                        break;
                    }
                }

                count += consecutive;
            }

            if (count >= 5) score += 10000;
            else if (count === 4 && blocked === 0) score += 1000;
            else if (count === 4 && blocked === 1) score += 100;
            else if (count === 3 && blocked === 0) score += 50;
            else if (count === 3 && blocked === 1) score += 10;
            else if (count === 2 && blocked === 0) score += 5;
            else if (count === 2 && blocked === 1) score += 1;
        }

        return score;
    }

    endGame(message) {
        this.gameOver = true;
        const messageEl = document.getElementById('game-message');
        messageEl.textContent = message;
        messageEl.classList.add('show');
    }

    restart() {
        this.initBoard();
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.drawBoard();
        document.getElementById('turn-display').textContent = '黑方';
        document.getElementById('game-message').textContent = '';
        document.getElementById('game-message').classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});