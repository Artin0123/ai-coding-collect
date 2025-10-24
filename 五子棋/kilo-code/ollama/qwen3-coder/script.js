// 遊戲狀態
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

let board = [];
let currentPlayer = BLACK;
let gameover = false;

// 初始化棋盤
function initBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = EMPTY;
        }
    }
}

// 繪製棋盤
function drawChessboard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';

    // 設置棋盤大小
    chessboard.style.width = '600px';
    chessboard.style.height = '600px';
    chessboard.style.position = 'relative';

    // 繪製線條
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 水平線
        const horizontalLine = document.createElement('div');
        horizontalLine.style.position = 'absolute';
        horizontalLine.style.backgroundColor = '#8B4513';
        horizontalLine.style.width = '100%';
        horizontalLine.style.height = '2px';
        horizontalLine.style.top = `${(i * 40)}px`;
        horizontalLine.style.left = '0';
        chessboard.appendChild(horizontalLine);

        // 垂直線
        const verticalLine = document.createElement('div');
        verticalLine.style.position = 'absolute';
        verticalLine.style.backgroundColor = '#8B4513';
        verticalLine.style.width = '2px';
        verticalLine.style.height = '100%';
        verticalLine.style.left = `${(i * 40)}px`;
        verticalLine.style.top = '0';
        chessboard.appendChild(verticalLine);
    }

    // 繪製星位
    const starPositions = [
        [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
    ];

    starPositions.forEach(pos => {
        const star = document.createElement('div');
        star.style.position = 'absolute';
        star.style.width = '8px';
        star.style.height = '8px';
        star.style.backgroundColor = '#8B4513';
        star.style.borderRadius = '50%';
        star.style.left = `${pos[0] * 40 - 4}px`;
        star.style.top = `${pos[1] * 40 - 4}px`;
        chessboard.appendChild(star);
    });

    // 添加點擊事件
    chessboard.addEventListener('click', handleBoardClick);
}

// 處理棋盤點擊
function handleBoardClick(event) {
    if (gameover || currentPlayer !== BLACK) return;

    const chessboard = document.getElementById('chessboard');
    const rect = chessboard.getBoundingClientRect();

    // 計算點擊位置對應的棋盤坐標
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 轉換為棋盤坐標
    const col = Math.round(x / 40);
    const row = Math.round(y / 40);

    // 檢查坐標是否有效
    if (col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE) {
        // 檢查該位置是否為空
        if (board[row][col] === EMPTY) {
            // 放置黑子
            placePiece(row, col, BLACK);

            // 檢查是否獲勝
            if (checkWin(row, col, BLACK)) {
                endGame('黑方獲勝！');
                return;
            }

            // 切換到白方（AI）
            currentPlayer = WHITE;
            updatePlayerDisplay();

            // AI下棋
            setTimeout(() => {
                aiMove();
            }, 500);
        }
    }
}

// 放置棋子
function placePiece(row, col, color) {
    board[row][col] = color;

    const piece = document.createElement('div');
    piece.style.position = 'absolute';
    piece.style.width = '36px';
    piece.style.height = '36px';
    piece.style.borderRadius = '50%';
    piece.style.left = `${col * 40 - 18}px`;
    piece.style.top = `${row * 40 - 18}px`;

    if (color === BLACK) {
        // 黑子漸層效果
        piece.style.background = 'radial-gradient(circle at 30% 30%, #666, #000)';
        piece.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
    } else {
        // 白子漸層效果
        piece.style.background = 'radial-gradient(circle at 30% 30%, #fff, #ddd)';
        piece.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        piece.style.border = '1px solid #999';
    }

    piece.classList.add('piece');
    piece.setAttribute('data-row', row);
    piece.setAttribute('data-col', col);

    document.getElementById('chessboard').appendChild(piece);
}

// 檢查是否獲勝
function checkWin(row, col, color) {
    // 四個方向：水平、垂直、主對角線、副對角線
    const directions = [
        [0, 1],  // 水平
        [1, 0],  // 垂直
        [1, 1],  // 主對角線
        [1, -1]  // 副對角線
    ];

    for (let [dx, dy] of directions) {
        let count = 1; // 包含當前棋子

        // 正向檢查
        for (let i = 1; i < 5; i++) {
            const r = row + dx * i;
            const c = col + dy * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
                count++;
            } else {
                break;
            }
        }

        // 反向檢查
        for (let i = 1; i < 5; i++) {
            const r = row - dx * i;
            const c = col - dy * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === color) {
                count++;
            } else {
                break;
            }
        }

        // 五子連線獲勝
        if (count >= 5) {
            return true;
        }
    }

    return false;
}

// 更新玩家顯示
function updatePlayerDisplay() {
    const playerDisplay = document.getElementById('current-player');
    playerDisplay.textContent = currentPlayer === BLACK ? '黑方' : '白方';
}

// 結束遊戲
function endGame(message) {
    gameover = true;
    document.getElementById('message').textContent = message;
}

// 重新開始遊戲
function restartGame() {
    // 清空棋盤
    document.getElementById('chessboard').innerHTML = '';
    document.getElementById('message').textContent = '';

    // 重置遊戲狀態
    initBoard();
    currentPlayer = BLACK;
    gameover = false;

    // 重新繪製棋盤
    drawChessboard();
    updatePlayerDisplay();
}

// 初始化遊戲
function initGame() {
    initBoard();
    drawChessboard();
    updatePlayerDisplay();

    // 綁定重新開始按鈕事件
    document.getElementById('restart-btn').addEventListener('click', restartGame);
}

// 頁面加載完成後初始化遊戲
document.addEventListener('DOMContentLoaded', initGame);

// AI下棋
function aiMove() {
    if (gameover || currentPlayer !== WHITE) return;

    // 獲取所有空位
    let emptyPositions = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === EMPTY) {
                emptyPositions.push([i, j]);
            }
        }
    }

    if (emptyPositions.length === 0) return;

    // AI策略：評估每個位置的分數
    let bestPosition = emptyPositions[0];
    let bestScore = -Infinity;

    for (let [row, col] of emptyPositions) {
        const score = evaluatePosition(row, col);
        if (score > bestScore) {
            bestScore = score;
            bestPosition = [row, col];
        }
    }

    // 放置白子
    const [row, col] = bestPosition;
    placePiece(row, col, WHITE);

    // 檢查是否獲勝
    if (checkWin(row, col, WHITE)) {
        endGame('白方獲勝！');
        return;
    }

    // 切換回黑方
    currentPlayer = BLACK;
    updatePlayerDisplay();
}

// 評估位置分數
function evaluatePosition(row, col) {
    let score = 0;

    // 評估AI（白方）連線潛力
    score += evaluateLine(row, col, WHITE) * 1.2; // AI稍有優先權

    // 評估阻止玩家（黑方）連線
    score += evaluateLine(row, col, BLACK);

    // 距離中心越近分數越高
    const centerRow = Math.floor(BOARD_SIZE / 2);
    const centerCol = Math.floor(BOARD_SIZE / 2);
    const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
    score += (14 - distance) * 2;

    return score;
}

// 評估某個方向上的連線潛力
function evaluateLine(row, col, color) {
    let score = 0;

    // 四個方向：水平、垂直、主對角線、副對角線
    const directions = [
        [0, 1],  // 水平
        [1, 0],  // 垂直
        [1, 1],  // 主對角線
        [1, -1]  // 副對角線
    ];

    for (let [dx, dy] of directions) {
        let count = 1; // 包含當前位置
        let blocked = 0; // 被阻擋的邊數

        // 正向檢查
        for (let i = 1; i < 5; i++) {
            const r = row + dx * i;
            const c = col + dy * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === color) {
                    count++;
                } else if (board[r][c] !== EMPTY) {
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

        // 反向檢查
        for (let i = 1; i < 5; i++) {
            const r = row - dx * i;
            const c = col - dy * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === color) {
                    count++;
                } else if (board[r][c] !== EMPTY) {
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

        // 根據連子數和阻擋情況評分
        if (count >= 5) {
            score += 10000; // 已連成五子
        } else if (count === 4) {
            if (blocked === 0) {
                score += 1000; // 活四
            } else if (blocked === 1) {
                score += 100; // 眠四
            }
        } else if (count === 3) {
            if (blocked === 0) {
                score += 100; // 活三
            } else if (blocked === 1) {
                score += 10; // 眠三
            }
        } else if (count === 2) {
            if (blocked === 0) {
                score += 10; // 活二
            }
        }
    }

    return score;
}