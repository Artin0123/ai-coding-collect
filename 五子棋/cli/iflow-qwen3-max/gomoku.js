const BOARD_SIZE = 15;
const CELL_SIZE = 30;
const BOARD_WIDTH = (BOARD_SIZE - 1) * CELL_SIZE;
const BOARD_HEIGHT = (BOARD_SIZE - 1) * CELL_SIZE;

let board = []; 
let currentPlayer = 'black'; // 黑方先手
let gameActive = true;

const gameBoard = document.getElementById('game-board');
const currentPlayerDisplay = document.getElementById('current-player');
const restartBtn = document.getElementById('restart-btn');
const messageDisplay = document.getElementById('message');

// 初始化棋盤
function initBoard() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    gameBoard.innerHTML = '';
    gameBoard.style.width = `${BOARD_WIDTH + 20}px`; // 加上邊框空間
    gameBoard.style.height = `${BOARD_HEIGHT + 20}px`;
    
    // 繪製棋盤線條
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 水平線
        const hLine = document.createElement('div');
        hLine.className = 'board-line horizontal';
        hLine.style.top = `${i * CELL_SIZE + 10}px`;
        gameBoard.appendChild(hLine);
        
        // 垂直線
        const vLine = document.createElement('div');
        vLine.className = 'board-line vertical';
        vLine.style.left = `${i * CELL_SIZE + 10}px`;
        gameBoard.appendChild(vLine);
    }
    
    // 繪製星位 (5個星位：四個角落和中心)
    const starPoints = [
        [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
    ];
    
    starPoints.forEach(([row, col]) => {
        const star = document.createElement('div');
        star.className = 'star-point';
        star.style.left = `${col * CELL_SIZE + 10}px`;
        star.style.top = `${row * CELL_SIZE + 10}px`;
        gameBoard.appendChild(star);
    });
    
    // 添加點擊事件監聽器到整個棋盤
    gameBoard.addEventListener('click', handleBoardClick);
}

// 處理棋盤點擊
function handleBoardClick(event) {
    if (!gameActive || currentPlayer !== 'black') return;
    
    const rect = gameBoard.getBoundingClientRect();
    const x = event.clientX - rect.left - 10;
    const y = event.clientY - rect.top - 10;
    
    // 計算最接近的交叉點
    const col = Math.round(x / CELL_SIZE);
    const row = Math.round(y / CELL_SIZE);
    
    // 檢查是否在棋盤範圍內且該位置為空
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === null) {
        placePiece(row, col, 'black');
        
        // 檢查是否獲勝
        if (checkWin(row, col, 'black')) {
            endGame('黑方獲勝！');
            return;
        }
        
        // 切換到AI回合
        currentPlayer = 'white';
        updateCurrentPlayerDisplay();
        
        // AI下棋
        setTimeout(makeAIMove, 300);
    }
}

// 放置棋子
function placePiece(row, col, color) {
    board[row][col] = color;
    
    const piece = document.createElement('div');
    piece.className = `piece ${color}-piece`;
    piece.style.left = `${col * CELL_SIZE + 10}px`;
    piece.style.top = `${row * CELL_SIZE + 10}px`;
    gameBoard.appendChild(piece);
}

// 更新當前玩家顯示
function updateCurrentPlayerDisplay() {
    currentPlayerDisplay.textContent = `當前回合：${currentPlayer === 'black' ? '黑方' : '白方'}`;
}

// 檢查獲勝條件
function checkWin(row, col, color) {
    const directions = [
        [0, 1],   // 水平
        [1, 0],   // 垂直
        [1, 1],   // 對角線 \
        [1, -1]   // 對角線 /
    ];
    
    for (const [dx, dy] of directions) {
        let count = 1; // 包含當前位置
        
        // 正方向
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === color) {
                count++;
            } else {
                break;
            }
        }
        
        // 反方向
        for (let i = 1; i <= 4; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === color) {
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

// AI下棋
function makeAIMove() {
    if (!gameActive) return;
    
    const bestMove = findBestMove();
    if (bestMove) {
        const { row, col } = bestMove;
        placePiece(row, col, 'white');
        
        if (checkWin(row, col, 'white')) {
            endGame('白方獲勝！');
            return;
        }
        
        // 切換回玩家回合
        currentPlayer = 'black';
        updateCurrentPlayerDisplay();
    }
}

// 尋找最佳AI移動
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    
    // 首先檢查是否有立即獲勝的機會
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = 'white';
                if (checkWin(row, col, 'white')) {
                    board[row][col] = null;
                    return { row, col };
                }
                board[row][col] = null;
            }
        }
    }
    
    // 檢查是否需要防守（阻止玩家獲勝）
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = 'black';
                if (checkWin(row, col, 'black')) {
                    board[row][col] = null;
                    return { row, col };
                }
                board[row][col] = null;
            }
        }
    }
    
    // 評估所有可能的移動
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                const score = evaluateMove(row, col);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row, col };
                }
            }
        }
    }
    
    // 如果沒有找到好的移動，選擇第一個可用的位置
    if (!bestMove) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === null) {
                    return { row, col };
                }
            }
        }
    }
    
    return bestMove;
}

// 評估移動的分數
function evaluateMove(row, col) {
    let score = 0;
    
    // 優先考慮中心位置
    const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
    score += (14 - centerDist) * 2;
    
    // 評估連線潛力
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (const [dx, dy] of directions) {
        // 評估AI的連線
        score += evaluateDirection(row, col, dx, dy, 'white') * 10;
        // 評估玩家的連線（防守）
        score += evaluateDirection(row, col, dx, dy, 'black') * 8;
    }
    
    return score;
}

// 評估特定方向的連線
function evaluateDirection(row, col, dx, dy, color) {
    let count = 0;
    let blocked = 0;
    
    // 正方向
    for (let i = 1; i <= 4; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            if (board[newRow][newCol] === color) {
                count++;
            } else if (board[newRow][newCol] !== null) {
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
    
    // 反方向
    for (let i = 1; i <= 4; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            if (board[newRow][newCol] === color) {
                count++;
            } else if (board[newRow][newCol] !== null) {
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
    
    // 根據連線長度和阻塞情況評分
    if (blocked >= 2) return 0; // 兩端都被阻塞
    if (count >= 4) return 1000; // 四連
    if (count >= 3) return blocked === 0 ? 100 : 50; // 三連
    if (count >= 2) return blocked === 0 ? 10 : 5; // 二連
    if (count >= 1) return 1; // 單子
    
    return 0;
}

// 結束遊戲
function endGame(message) {
    gameActive = false;
    messageDisplay.textContent = message;
}

// 重新開始遊戲
function restartGame() {
    board = [];
    currentPlayer = 'black';
    gameActive = true;
    messageDisplay.textContent = '';
    initBoard();
    updateCurrentPlayerDisplay();
}

// 初始化遊戲
initBoard();
updateCurrentPlayerDisplay();
restartBtn.addEventListener('click', restartGame);