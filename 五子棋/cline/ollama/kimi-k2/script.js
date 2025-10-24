// 遊戲常量
const BOARD_SIZE = 15;
const CELL_SIZE = 40;
const BOARD_PADDING = 20;
const LINE_WIDTH = 2;
const STAR_POINTS = [3, 7, 11]; // 星位位置

// 棋子類型
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// 遊戲狀態
let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let canvas, ctx;

// 初始化遊戲
function initGame() {
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');

    // 初始化棋盤數據
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));

    // 設置事件監聽
    canvas.addEventListener('click', handleClick);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // 繪製棋盤
    drawBoard();
    updateTurnDisplay();
}

// 繪製棋盤
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製棋盤背景
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製棋盤線條
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = LINE_WIDTH;

    // 繪製垂直線
    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING);
        ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }

    // 繪製水平線
    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
        ctx.lineTo(BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE, BOARD_PADDING + i * CELL_SIZE);
        ctx.stroke();
    }

    // 繪製星位
    ctx.fillStyle = '#8B4513';
    STAR_POINTS.forEach(row => {
        STAR_POINTS.forEach(col => {
            if ((row === 3 || row === 11) && (col === 3 || col === 11)) {
                drawStar(BOARD_PADDING + row * CELL_SIZE, BOARD_PADDING + col * CELL_SIZE);
            } else if (row === 7 && col === 7) {
                drawStar(BOARD_PADDING + row * CELL_SIZE, BOARD_PADDING + col * CELL_SIZE);
            }
        });
    });

    // 繪製所有棋子
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== EMPTY) {
                drawPiece(i, j, board[i][j]);
            }
        }
    }
}

// 繪製星位點
function drawStar(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
}

// 繪製棋子
function drawPiece(row, col, pieceType) {
    const x = BOARD_PADDING + row * CELL_SIZE;
    const y = BOARD_PADDING + col * CELL_SIZE;
    const radius = 15;

    // 創建漸層效果
    const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);

    if (pieceType === BLACK) {
        gradient.addColorStop(0, '#333333');
        gradient.addColorStop(0.7, '#000000');
        gradient.addColorStop(1, '#111111');
    } else {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.7, '#F0F0F0');
        gradient.addColorStop(1, '#D0D0D0');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // 添加邊框
    ctx.strokeStyle = pieceType === BLACK ? '#000000' : '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 處理點擊事件
function handleClick(event) {
    if (gameOver || currentPlayer !== BLACK) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 計算棋盤位置
    const row = Math.round((x - BOARD_PADDING) / CELL_SIZE);
    const col = Math.round((y - BOARD_PADDING) / CELL_SIZE);

    // 檢查是否在有效範圍內
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        if (board[row][col] === EMPTY) {
            makeMove(row, col, BLACK);

            // 檢查是否獲勝
            if (checkWin(row, col, BLACK)) {
                endGame('黑方獲勝！');
                return;
            }

            // 切換到AI回合
            currentPlayer = WHITE;
            updateTurnDisplay();

            // AI延遲下子
            setTimeout(() => {
                aiMove();
            }, 500);
        }
    }
}

// 下子
function makeMove(row, col, pieceType) {
    board[row][col] = pieceType;
    drawBoard();
}

// AI下子
function aiMove() {
    if (gameOver) return;

    // 首先檢查是否能夠立即獲勝
    const winMove = findWinningMove(WHITE);
    if (winMove) {
        makeMove(winMove.row, winMove.col, WHITE);
        endGame('白方（AI）獲勝！');
        return;
    }

    // 檢查是否需要阻擋玩家獲勝
    const blockMove = findWinningMove(BLACK);
    if (blockMove) {
        makeMove(blockMove.row, blockMove.col, WHITE);
    } else {
        // 使用評估函數找到最佳位置
        const move = getBestMove();
        if (move) {
            makeMove(move.row, move.col, WHITE);
        }
    }

    // 再次檢查是否獲勝
    const lastMove = findLastMove();
    if (lastMove && checkWin(lastMove.row, lastMove.col, WHITE)) {
        endGame('白方（AI）獲勝！');
        return;
    }

    // 切換回玩家
    currentPlayer = BLACK;
    updateTurnDisplay();
}

// 獲取最佳下子位置
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    // 評估每個空位置
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === EMPTY) {
                const score = evaluatePosition(i, j);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: i, col: j };
                }
            }
        }
    }

    return bestMove;
}

// 評估位置分數
function evaluatePosition(row, col) {
    let score = 0;

    // 評估攻擊分數（AI自己）
    score += evaluateLine(row, col, WHITE) * 2;

    // 評估防守分數（阻擋玩家）
    score += evaluateLine(row, col, BLACK);

    // 中心位置加分
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
        score += 10;
    }

    return score;
}

// 評估單一線的分數
function evaluateLine(row, col, pieceType) {
    let maxScore = 0;

    // 檢查四個方向
    const directions = [
        [1, 0],   // horizontal
        [0, 1],   // vertical
        [1, 1],   // diagonal \
        [1, -1]   // diagonal /
    ];

    for (const [dx, dy] of directions) {
        let count = 1; // 包含當前位置
        let blocked = 0;

        // 檢查正方向
        for (let i = 1; i < 5; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                if (board[newRow][newCol] === pieceType) {
                    count++;
                } else if (board[newRow][newCol] !== EMPTY) {
                    blocked++;
                    break;
                } else {
                    break;
                }
            } else {
                blocked++;
                break;
            }
        }

        // 檢查反方向
        for (let i = 1; i < 5; i++) {
            const newRow = row - i * dx;
            const newCol = col - i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                if (board[newRow][newCol] === pieceType) {
                    count++;
                } else if (board[newRow][newCol] !== EMPTY) {
                    blocked++;
                    break;
                } else {
                    break;
                }
            } else {
                blocked++;
                break;
            }
        }

        // 計算分數
        if (count >= 5) {
            maxScore = Math.max(maxScore, 10000); // 即將獲勝
        } else if (count === 4 && blocked === 0) {
            maxScore = Math.max(maxScore, 1000);  // 活四
        } else if (count === 4 && blocked === 1) {
            maxScore = Math.max(maxScore, 100);   // 死四
        } else if (count === 3 && blocked === 0) {
            maxScore = Math.max(maxScore, 50);    // 活三
        } else if (count === 3 && blocked === 1) {
            maxScore = Math.max(maxScore, 10);    // 死三
        } else if (count === 2 && blocked === 0) {
            maxScore = Math.max(maxScore, 5);     // 活二
        } else if (count === 2 && blocked === 1) {
            maxScore = Math.max(maxScore, 1);     // 死二
        }
    }

    return maxScore;
}

// 檢查獲勝
function checkWin(row, col, pieceType) {
    const directions = [
        [1, 0],   // horizontal
        [0, 1],   // vertical
        [1, 1],   // diagonal \
        [1, -1]   // diagonal /
    ];

    for (const [dx, dy] of directions) {
        let count = 1;

        // 檢查正方向
        for (let i = 1; i < 5; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE &&
                board[newRow][newCol] === pieceType) {
                count++;
            } else {
                break;
            }
        }

        // 檢查反方向
        for (let i = 1; i < 5; i++) {
            const newRow = row - i * dx;
            const newCol = col - i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE &&
                board[newRow][newCol] === pieceType) {
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

// 更新回合顯示
function updateTurnDisplay() {
    const turnDisplay = document.getElementById('turn-display');
    turnDisplay.textContent = currentPlayer === BLACK ? '黑方' : '白方';
    turnDisplay.style.color = currentPlayer === BLACK ? '#000000' : '#666666';
}

// 顯示遊戲訊息
function showMessage(text, type = 'show') {
    const messageDiv = document.getElementById('game-message');
    messageDiv.textContent = text;
    messageDiv.className = `game-message ${type}`;
}

// 結束遊戲
function endGame(message) {
    gameOver = true;
    showMessage(message, 'winner');
}

// 寻找获胜移动
function findWinningMove(pieceType) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === EMPTY) {
                // 临时放置棋子
                board[i][j] = pieceType;
                const wins = checkWin(i, j, pieceType);
                // 恢复原状
                board[i][j] = EMPTY;

                if (wins) {
                    return { row: i, col: j };
                }
            }
        }
    }
    return null;
}

// 找到最后一步移动
function findLastMove() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === WHITE) {
                return { row: i, col: j };
            }
        }
    }
    return null;
}

// 重新開始遊戲
function restartGame() {
    gameOver = false;
    currentPlayer = BLACK;

    // 清空棋盤
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));

    // 清除訊息
    showMessage('');

    // 重繪棋盤
    drawBoard();
    updateTurnDisplay();
}

// 頁面載入完成後初始化遊戲
window.addEventListener('DOMContentLoaded', initGame);
