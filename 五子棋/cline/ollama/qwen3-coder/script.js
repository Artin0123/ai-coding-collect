class Gomoku {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1 for black, 2 for white
        this.gameOver = false;
        this.chessboard = document.getElementById('chessboard');
        this.message = document.getElementById('message');
        this.currentPlayerSpan = document.getElementById('current-player');

        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
        this.updatePlayerDisplay();
    }

    createBoard() {
        // Create star points
        const starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
        ];

        starPoints.forEach(([row, col]) => {
            const starPoint = document.createElement('div');
            starPoint.className = 'star-point';
            starPoint.style.left = (col * 32 + 16) + 'px';
            starPoint.style.top = (row * 32 + 16) + 'px';
            this.chessboard.appendChild(starPoint);
        });
    }

    bindEvents() {
        // Click on chessboard
        this.chessboard.addEventListener('click', (e) => {
            if (this.gameOver || this.currentPlayer !== 1) return;

            const rect = this.chessboard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate grid position
            const col = Math.round((x - 16) / 32);
            const row = Math.round((y - 16) / 32);

            // Check if position is valid
            if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                this.placePiece(row, col);
            }
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
    }

    placePiece(row, col) {
        if (this.board[row][col] !== 0 || this.gameOver) return;

        // Place piece
        this.board[row][col] = this.currentPlayer;

        // Create visual piece
        const piece = document.createElement('div');
        piece.className = `piece ${this.currentPlayer === 1 ? 'black-piece' : 'white-piece'}`;
        piece.style.left = (col * 32 + 16) + 'px';
        piece.style.top = (row * 32 + 16) + 'px';
        this.chessboard.appendChild(piece);

        // Check win
        if (this.checkWin(row, col)) {
            const winner = this.currentPlayer === 1 ? '黑方' : '白方';
            this.message.textContent = `${winner}獲勝！`;
            this.gameOver = true;
            return;
        }

        // Check draw
        if (this.isBoardFull()) {
            this.message.textContent = '平局！';
            this.gameOver = true;
            return;
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updatePlayerDisplay();

        // AI move if it's white's turn
        if (this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => {
                this.aiMove();
            }, 300);
        }
    }

    aiMove() {
        if (this.gameOver) return;

        let bestMove = this.getBestMove();
        this.placePiece(bestMove.row, bestMove.col);
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMoves = [];

        // Evaluate all possible moves
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    // Try this move
                    this.board[row][col] = 2;
                    let score = this.evaluateBoard(2);
                    this.board[row][col] = 0;

                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [{ row, col }];
                    } else if (score === bestScore) {
                        bestMoves.push({ row, col });
                    }
                }
            }
        }

        // If no good moves found, choose center area
        if (bestMoves.length === 0) {
            for (let row = 5; row < 10; row++) {
                for (let col = 5; col < 10; col++) {
                    if (this.board[row][col] === 0) {
                        bestMoves.push({ row, col });
                    }
                }
            }
        }

        // Return random move from best moves
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    evaluateBoard(player) {
        let score = 0;
        const opponent = player === 1 ? 2 : 1;

        // Check all directions: horizontal, vertical, diagonal
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal \
            [1, -1]  // diagonal /
        ];

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    const piecePlayer = this.board[row][col];
                    const multiplier = piecePlayer === player ? 1 : -1;

                    // Check in all directions
                    for (let [dx, dy] of directions) {
                        let count = 1;
                        let blocked = 0;

                        // Check forward
                        for (let i = 1; i < 5; i++) {
                            const r = row + dx * i;
                            const c = col + dy * i;
                            if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                                blocked++;
                                break;
                            }
                            if (this.board[r][c] === piecePlayer) {
                                count++;
                            } else if (this.board[r][c] !== 0) {
                                blocked++;
                                break;
                            } else {
                                break;
                            }
                        }

                        // Check backward
                        for (let i = 1; i < 5; i++) {
                            const r = row - dx * i;
                            const c = col - dy * i;
                            if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                                blocked++;
                                break;
                            }
                            if (this.board[r][c] === piecePlayer) {
                                count++;
                            } else if (this.board[r][c] !== 0) {
                                blocked++;
                                break;
                            } else {
                                break;
                            }
                        }

                        // Score based on count and blocking
                        if (count >= 5) {
                            score += multiplier * 100000; // Win
                        } else if (count === 4) {
                            if (blocked === 0) score += multiplier * 10000; // Open four
                            else if (blocked === 1) score += multiplier * 1000; // Blocked four
                        } else if (count === 3) {
                            if (blocked === 0) score += multiplier * 1000; // Open three
                            else if (blocked === 1) score += multiplier * 100; // Blocked three
                        } else if (count === 2) {
                            if (blocked === 0) score += multiplier * 100; // Open two
                            else if (blocked === 1) score += multiplier * 10; // Blocked two
                        }
                    }
                }
            }
        }

        return score;
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        if (player === 0) return false;

        // Check all directions
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal \
            [1, -1]  // diagonal /
        ];

        for (let [dx, dy] of directions) {
            let count = 1;

            // Check forward
            for (let i = 1; i < 5; i++) {
                const r = row + dx * i;
                const c = col + dy * i;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize || this.board[r][c] !== player) {
                    break;
                }
                count++;
            }

            // Check backward
            for (let i = 1; i < 5; i++) {
                const r = row - dx * i;
                const c = col - dy * i;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize || this.board[r][c] !== player) {
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

    updatePlayerDisplay() {
        this.currentPlayerSpan.textContent = this.currentPlayer === 1 ? '黑方' : '白方';
    }

    restart() {
        // Clear board
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.message.textContent = '';

        // Clear visual pieces
        const pieces = this.chessboard.querySelectorAll('.piece');
        pieces.forEach(piece => piece.remove());

        // Clear star points
        const starPoints = this.chessboard.querySelectorAll('.star-point');
        starPoints.forEach(point => point.remove());

        // Recreate board
        this.createBoard();
        this.updatePlayerDisplay();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Gomoku();
});
