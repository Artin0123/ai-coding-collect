class Gomoku {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.boardElement = document.getElementById('game-board');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.messageElement = document.getElementById('message');
        this.restartButton = document.getElementById('restart-btn');
        
        this.initGame();
        this.bindEvents();
    }
    
    initGame() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.createBoard();
        this.updateTurnIndicator();
        this.clearMessage();
    }
    
    createBoard() {
        this.boardElement.innerHTML = '';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 600 600');
        svg.classList.add('board-grid');
        
        this.drawBoardLines(svg);
        this.drawStarPoints(svg);
        this.boardElement.appendChild(svg);
        
        this.createIntersections();
    }
    
    drawBoardLines(svg) {
        const lineSpacing = 40;
        const offset = 20;
        
        for (let i = 0; i < this.boardSize; i++) {
            const y = offset + i * lineSpacing;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', offset);
            line.setAttribute('y1', y);
            line.setAttribute('x2', offset + (this.boardSize - 1) * lineSpacing);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#8B4513');
            line.setAttribute('stroke-width', '2');
            svg.appendChild(line);
        }
        
        for (let i = 0; i < this.boardSize; i++) {
            const x = offset + i * lineSpacing;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', offset);
            line.setAttribute('x2', x);
            line.setAttribute('y2', offset + (this.boardSize - 1) * lineSpacing);
            line.setAttribute('stroke', '#8B4513');
            line.setAttribute('stroke-width', '2');
            svg.appendChild(line);
        }
    }
    
    drawStarPoints(svg) {
        const starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];
        
        const lineSpacing = 40;
        const offset = 20;
        
        starPoints.forEach(([row, col]) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', offset + col * lineSpacing);
            circle.setAttribute('cy', offset + row * lineSpacing);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#8B4513');
            svg.appendChild(circle);
        });
    }
    
    createIntersections() {
        const lineSpacing = 40;
        const offset = 20;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;
                intersection.style.left = `${offset + col * lineSpacing}px`;
                intersection.style.top = `${offset + row * lineSpacing}px`;
                
                intersection.addEventListener('click', (e) => {
                    this.handleIntersectionClick(row, col);
                });
                
                this.boardElement.appendChild(intersection);
            }
        }
    }
    
    handleIntersectionClick(row, col) {
        if (this.gameOver || this.currentPlayer !== 'black' || this.board[row][col] !== null) {
            return;
        }
        
        this.placePiece(row, col, 'black');
        
        if (this.checkWin(row, col, 'black')) {
            this.endGame('黑方獲勝！');
            return;
        }
        
        if (this.isBoardFull()) {
            this.endGame('平局！');
            return;
        }
        
        this.switchPlayer();
        
        setTimeout(() => {
            this.makeAIMove();
        }, 500);
    }
    
    placePiece(row, col, color) {
        this.board[row][col] = color;
        
        const piece = document.createElement('div');
        piece.className = `piece ${color}-piece`;
        
        const lineSpacing = 40;
        const offset = 20;
        piece.style.left = `${offset + col * lineSpacing}px`;
        piece.style.top = `${offset + row * lineSpacing}px`;
        
        this.boardElement.appendChild(piece);
    }
    
    checkWin(row, col, color) {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        for (let direction of directions) {
            let count = 1;
            
            for (let [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                       this.board[r][c] === color) {
                    count++;
                    r += dr;
                    c += dc;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    isBoardFull() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    return false;
                }
            }
        }
        return true;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateTurnIndicator();
    }
    
    updateTurnIndicator() {
        this.turnIndicator.textContent = this.currentPlayer === 'black' ? '黑方' : '白方';
        this.turnIndicator.style.color = this.currentPlayer === 'black' ? '#000' : '#666';
    }
    
    makeAIMove() {
        if (this.gameOver) return;
        
        const move = this.findBestMove();
        if (move) {
            this.placePiece(move.row, move.col, 'white');
            
            if (this.checkWin(move.row, move.col, 'white')) {
                this.endGame('白方獲勝！');
                return;
            }
            
            if (this.isBoardFull()) {
                this.endGame('平局！');
                return;
            }
            
            this.switchPlayer();
        }
    }
    
    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    let score = this.evaluatePosition(row, col);
                    
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
        
        score += this.evaluateDirection(row, col, 'white') * 2;
        score += this.evaluateDirection(row, col, 'black');
        
        if (this.isNearExistingPieces(row, col)) {
            score += 10;
        }
        
        return score;
    }
    
    evaluateDirection(row, col, color) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        let maxScore = 0;
        
        for (let [dr, dc] of directions) {
            let score = 1;
            let count = 0;
            let blocked = 0;
            
            for (let i = 1; i < 5; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                    blocked++;
                    break;
                }
                
                if (this.board[r][c] === color) {
                    count++;
                } else if (this.board[r][c] !== null) {
                    blocked++;
                    break;
                } else {
                    break;
                }
            }
            
            for (let i = 1; i < 5; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                    blocked++;
                    break;
                }
                
                if (this.board[r][c] === color) {
                    count++;
                } else if (this.board[r][c] !== null) {
                    blocked++;
                    break;
                } else {
                    break;
                }
            }
            
            if (blocked < 2) {
                score = Math.pow(10, count);
                if (count >= 4) score *= 100;
                else if (count === 3) score *= 10;
                else if (count === 2) score *= 5;
            }
            
            maxScore = Math.max(maxScore, score);
        }
        
        return maxScore;
    }
    
    isNearExistingPieces(row, col) {
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                    if (this.board[r][c] !== null) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    endGame(message) {
        this.gameOver = true;
        this.showMessage(message);
    }
    
    showMessage(text) {
        this.messageElement.textContent = text;
        this.messageElement.classList.add('win-message');
    }
    
    clearMessage() {
        this.messageElement.textContent = '';
        this.messageElement.classList.remove('win-message');
    }
    
    bindEvents() {
        this.restartButton.addEventListener('click', () => {
            this.initGame();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Gomoku();
});