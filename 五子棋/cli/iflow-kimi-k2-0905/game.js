class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.boardSize = 15;
        this.padding = 20;
        this.board = [];
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11], [7, 3], [7, 11], [3, 7], [11, 7]];
        
        this.initGame();
        this.bindEvents();
    }

    initGame() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.updateTurnIndicator();
        this.hideMessage();
        this.drawBoard();
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('restart-btn').addEventListener('click', () => this.initGame());
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getBoardPosition(mousePos) {
        const x = Math.round((mousePos.x - this.padding) / this.cellSize);
        const y = Math.round((mousePos.y - this.padding) / this.cellSize);
        
        if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
            return { x, y };
        }
        return null;
    }

    handleClick(e) {
        if (this.gameOver || this.currentPlayer !== 'black') return;

        const mousePos = this.getMousePos(e);
        const boardPos = this.getBoardPosition(mousePos);
        
        if (boardPos && this.board[boardPos.y][boardPos.x] === null) {
            this.makeMove(boardPos.x, boardPos.y, 'black');
            
            if (!this.gameOver) {
                this.currentPlayer = 'white';
                this.updateTurnIndicator();
                
                setTimeout(() => {
                    if (!this.gameOver) {
                        this.aiMove();
                    }
                }, 500);
            }
        }
    }

    makeMove(x, y, player) {
        this.board[y][x] = player;
        this.drawPiece(x, y, player);
        
        if (this.checkWin(x, y, player)) {
            this.gameOver = true;
            const winner = player === 'black' ? '黑方' : '白方';
            this.showMessage(`${winner}獲勝！`, 'win-message');
        }
    }

    aiMove() {
        const move = this.findBestMove();
        if (move) {
            this.makeMove(move.x, move.y, 'white');
            if (!this.gameOver) {
                this.currentPlayer = 'black';
                this.updateTurnIndicator();
            }
        }
    }

    findBestMove() {
        let bestMove = null;
        let bestScore = -Infinity;
        const possibleMoves = this.getPossibleMoves();
        
        for (const move of possibleMoves) {
            let score = 0;
            
            score += this.evaluatePosition(move.x, move.y, 'white') * 2;
            score += this.evaluatePosition(move.x, move.y, 'black');
            score += this.getPositionScore(move.x, move.y);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    getPossibleMoves() {
        const moves = [];
        const center = Math.floor(this.boardSize / 2);
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === null && this.hasNeighbor(x, y)) {
                    moves.push({ x, y });
                }
            }
        }
        
        if (moves.length === 0) {
            moves.push({ x: center, y: center });
        }
        
        return moves.sort((a, b) => {
            const distA = Math.abs(a.x - center) + Math.abs(a.y - center);
            const distB = Math.abs(b.x - center) + Math.abs(b.y - center);
            return distA - distB;
        });
    }

    hasNeighbor(x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[ny][nx] !== null) return true;
                }
            }
        }
        return false;
    }

    evaluatePosition(x, y, player) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dx, dy] of directions) {
            score += this.evaluateDirection(x, y, dx, dy, player);
        }
        
        return score;
    }

    evaluateDirection(x, y, dx, dy, player) {
        let count = 1;
        let openEnds = 0;
        
        for (let dir = -1; dir <= 1; dir += 2) {
            let nx = x + dx * dir;
            let ny = y + dy * dir;
            let tempCount = 0;
            
            while (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                if (this.board[ny][nx] === player) {
                    tempCount++;
                    nx += dx * dir;
                    ny += dy * dir;
                } else {
                    if (this.board[ny][nx] === null) openEnds++;
                    break;
                }
            }
            count += tempCount;
        }
        
        return this.getScore(count, openEnds);
    }

    getScore(count, openEnds) {
        if (count >= 5) return 100000;
        if (count === 4 && openEnds >= 2) return 10000;
        if (count === 4 && openEnds === 1) return 1000;
        if (count === 3 && openEnds >= 2) return 1000;
        if (count === 3 && openEnds === 1) return 100;
        if (count === 2 && openEnds >= 2) return 100;
        if (count === 2 && openEnds === 1) return 10;
        return 1;
    }

    getPositionScore(x, y) {
        const center = Math.floor(this.boardSize / 2);
        const distance = Math.abs(x - center) + Math.abs(y - center);
        return Math.max(0, 10 - distance);
    }

    checkWin(x, y, player) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            for (let dir = -1; dir <= 1; dir += 2) {
                let nx = x + dx * dir;
                let ny = y + dy * dir;
                
                while (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                    if (this.board[ny][nx] === player) {
                        count++;
                        nx += dx * dir;
                        ny += dy * dir;
                    } else {
                        break;
                    }
                }
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }

    drawBoard() {
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < this.boardSize; i++) {
            const pos = this.padding + i * this.cellSize;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, pos);
            this.ctx.lineTo(this.canvas.width - this.padding, pos);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos, this.padding);
            this.ctx.lineTo(pos, this.canvas.height - this.padding);
            this.ctx.stroke();
        }
        
        this.drawStarPoints();
        this.drawAllPieces();
    }

    drawStarPoints() {
        this.ctx.fillStyle = '#8B4513';
        
        for (const [x, y] of this.starPoints) {
            const posX = this.padding + x * this.cellSize;
            const posY = this.padding + y * this.cellSize;
            
            this.ctx.beginPath();
            this.ctx.arc(posX, posY, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    drawAllPieces() {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x]) {
                    this.drawPiece(x, y, this.board[y][x]);
                }
            }
        }
    }

    drawPiece(x, y, player) {
        const centerX = this.padding + x * this.cellSize;
        const centerY = this.padding + y * this.cellSize;
        const radius = this.cellSize * 0.4;
        
        const gradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX, centerY, radius
        );
        
        if (player === 'black') {
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(0.7, '#000000');
            gradient.addColorStop(1, '#000000');
        } else {
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.7, '#E0E0E0');
            gradient.addColorStop(1, '#C0C0C0');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = player === 'black' ? '#333333' : '#999999';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        indicator.textContent = this.currentPlayer === 'black' ? '黑方' : '白方';
        indicator.style.color = this.currentPlayer === 'black' ? '#000000' : '#666666';
    }

    showMessage(message, className = '') {
        const messageEl = document.getElementById('game-message');
        messageEl.textContent = message;
        messageEl.className = 'game-message show ' + className;
    }

    hideMessage() {
        const messageEl = document.getElementById('game-message');
        messageEl.textContent = '';
        messageEl.className = 'game-message';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});