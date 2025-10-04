class Gomoku {
    constructor() {
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = [];
        this.currentPlayer = 1; // 1: 黑子(玩家), 2: 白子(AI)
        this.gameOver = false;
        this.boardElement = document.getElementById('game-board');
        this.currentPlayerElement = document.getElementById('current-player');
        this.restartBtn = document.getElementById('restart-btn');
        this.gameMessage = document.getElementById('game-message');
        
        this.init();
    }
    
    init() {
        this.setupBoard();
        this.drawBoard();
        this.setupEventListeners();
        this.updateCurrentPlayerDisplay();
    }
    
    setupBoard() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.gameOver = false;
        this.currentPlayer = 1;
        this.updateCurrentPlayerDisplay();
        this.hideGameMessage();
    }
    
    drawBoard() {
        const boardWidth = this.boardSize * this.cellSize;
        const boardHeight = this.boardSize * this.cellSize;
        
        this.boardElement.style.width = boardWidth + 'px';
        this.boardElement.style.height = boardHeight + 'px';
        this.boardElement.innerHTML = '';
        
        // 創建SVG網格線
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('board-grid');
        svg.setAttribute('width', boardWidth);
        svg.setAttribute('height', boardHeight);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        
        // 繪製橫線
        for (let i = 0; i < this.boardSize; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.classList.add('grid-lines');
            line.setAttribute('x1', this.cellSize / 2);
            line.setAttribute('y1', this.cellSize / 2 + i * this.cellSize);
            line.setAttribute('x2', boardWidth - this.cellSize / 2);
            line.setAttribute('y2', this.cellSize / 2 + i * this.cellSize);
            svg.appendChild(line);
        }
        
        // 繪製豎線
        for (let i = 0; i < this.boardSize; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.classList.add('grid-lines');
            line.setAttribute('x1', this.cellSize / 2 + i * this.cellSize);
            line.setAttribute('y1', this.cellSize / 2);
            line.setAttribute('x2', this.cellSize / 2 + i * this.cellSize);
            line.setAttribute('y2', boardHeight - this.cellSize / 2);
            svg.appendChild(line);
        }
        
        // 繪製星位
        const starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7],
            [3, 7], [7, 3], [7, 11], [11, 7]
        ];
        
        starPoints.forEach(([x, y]) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.classList.add('star-point');
            circle.setAttribute('cx', this.cellSize / 2 + x * this.cellSize);
            circle.setAttribute('cy', this.cellSize / 2 + y * this.cellSize);
            circle.setAttribute('r', 4);
            svg.appendChild(circle);
        });
        
        this.boardElement.appendChild(svg);
        
        // 創建交叉點點擊區域
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.createElement('div');
                intersection.classList.add('intersection');
                intersection.style.left = (this.cellSize / 2 + col * this.cellSize) + 'px';
                intersection.style.top = (this.cellSize / 2 + row * this.cellSize) + 'px';
                intersection.dataset.row = row;
                intersection.dataset.col = col;
                intersection.addEventListener('click', (e) => this.handleCellClick(e));
                this.boardElement.appendChild(intersection);
            }
        }
    }
    
    setupEventListeners() {
        this.restartBtn.addEventListener('click', () => this.restart());
    }
    
    handleCellClick(event) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (this.board[row][col] !== 0) return;
        
        this.placePiece(row, col, this.currentPlayer);
        
        if (this.checkWin(row, col, this.currentPlayer)) {
            this.endGame('黑方獲勝！');
            return;
        }
        
        if (this.checkDraw()) {
            this.endGame('平局！');
            return;
        }
        
        this.currentPlayer = 2;
        this.updateCurrentPlayerDisplay();
        
        // AI延遲響應
        setTimeout(() => {
            this.aiMove();
        }, 500);
    }
    
    placePiece(row, col, player) {
        this.board[row][col] = player;
        
        const piece = document.createElement('div');
        piece.classList.add('piece');
        piece.classList.add(player === 1 ? 'black-piece' : 'white-piece');
        piece.style.left = (this.cellSize / 2 + col * this.cellSize) + 'px';
        piece.style.top = (this.cellSize / 2 + row * this.cellSize) + 'px';
        this.boardElement.appendChild(piece);
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        const move = this.getBestMove();
        if (move) {
            this.placePiece(move.row, move.col, 2);
            
            if (this.checkWin(move.row, move.col, 2)) {
                this.endGame('白方獲勝！');
                return;
            }
            
            if (this.checkDraw()) {
                this.endGame('平局！');
                return;
            }
            
            this.currentPlayer = 1;
            this.updateCurrentPlayerDisplay();
        }
    }
    
    getBestMove() {
        // 檢查是否能獲勝
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
        
        // 檢查是否需要阻擋對手獲勝
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
        
        // 評估每個位置的權重
        const moves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    const score = this.evaluatePosition(row, col);
                    if (score > 0) {
                        moves.push({ row, col, score });
                    }
                }
            }
        }
        
        // 按權重排序，選擇最佳位置
        moves.sort((a, b) => b.score - a.score);
        
        if (moves.length > 0) {
            // 在前3個最佳位置中隨機選擇，增加變化性
            const topMoves = moves.slice(0, Math.min(3, moves.length));
            return topMoves[Math.floor(Math.random() * topMoves.length)];
        }
        
        return null;
    }
    
    evaluatePosition(row, col) {
        let score = 0;
        
        // 中心位置加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;
        
        // 檢查周圍是否有棋子
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] !== 0) {
                    score += 10;
                }
            }
        }
        
        // 評估在該位置下棋後的連線情況
        this.board[row][col] = 2;
        score += this.evaluateLines(row, col, 2) * 5;
        this.board[row][col] = 0;
        
        this.board[row][col] = 1;
        score += this.evaluateLines(row, col, 1) * 3;
        this.board[row][col] = 0;
        
        return score;
    }
    
    evaluateLines(row, col, player) {
        let totalScore = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            let openEnds = 0;
            
            // 正向檢查
            for (let i = 1; i < 5; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (!this.isValidPosition(newRow, newCol)) break;
                if (this.board[newRow][newCol] === player) {
                    count++;
                } else if (this.board[newRow][newCol] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }
            
            // 反向檢查
            for (let i = 1; i < 5; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (!this.isValidPosition(newRow, newCol)) break;
                if (this.board[newRow][newCol] === player) {
                    count++;
                } else if (this.board[newRow][newCol] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }
            
            // 根據連線數量和開口端計算分數
            if (count >= 5) totalScore += 1000;
            else if (count === 4) totalScore += openEnds === 2 ? 500 : 100;
            else if (count === 3) totalScore += openEnds === 2 ? 50 : 10;
            else if (count === 2) totalScore += openEnds === 2 ? 5 : 1;
        }
        
        return totalScore;
    }
    
    checkWin(row, col, player) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            
            // 正向檢查
            for (let i = 1; i < 5; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (!this.isValidPosition(newRow, newCol) || this.board[newRow][newCol] !== player) {
                    break;
                }
                count++;
            }
            
            // 反向檢查
            for (let i = 1; i < 5; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (!this.isValidPosition(newRow, newCol) || this.board[newRow][newCol] !== player) {
                    break;
                }
                count++;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    checkDraw() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
    
    updateCurrentPlayerDisplay() {
        this.currentPlayerElement.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
    }
    
    endGame(message) {
        this.gameOver = true;
        this.showGameMessage(message);
    }
    
    showGameMessage(message) {
        this.gameMessage.textContent = message;
        this.gameMessage.classList.remove('hidden');
    }
    
    hideGameMessage() {
        this.gameMessage.classList.add('hidden');
    }
    
    restart() {
        this.setupBoard();
        this.drawBoard();
    }
}

// 遊戲初始化
document.addEventListener('DOMContentLoaded', () => {
    new Gomoku();
});