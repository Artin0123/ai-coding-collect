// 遊戲狀態常量
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// 遊戲狀態變量
let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let canvas, ctx;
let cellSize;

// 初始化遊戲
function initGame() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    currentPlayer = BLACK;
    gameOver = false;
    
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');
    
    // 根據畫布大小計算每個格子的尺寸
    cellSize = Math.min(canvas.width, canvas.height) / (BOARD_SIZE - 1);
    
    // 如果畫布不是正方形，調整大小
    if (canvas.width !== canvas.height) {
        const size = Math.min(canvas.width, canvas.height);
        canvas.width = size;
        canvas.height = size;
        cellSize = size / (BOARD_SIZE - 1);
    }
    
    drawBoard();
    updateCurrentPlayerDisplay();
    
    // 隱藏遊戲結束訊息
    document.getElementById('game-message').classList.add('hidden');
}

// 繪製棋盤
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製棋盤背景
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 繪製網格線
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 垂直線
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        
        // 水平線
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
    
    // 繪製星位 (天元和四角)
    const starPositions = [
        {row: 3, col: 3}, {row: 3, col: 11},
        {row: 11, col: 3}, {row: 11, col: 11},
        {row: 7, col: 7}  // 天元
    ];
    
    ctx.fillStyle = '#8B4513';
    for (const pos of starPositions) {
        ctx.beginPath();
        ctx.arc(pos.col * cellSize, pos.row * cellSize, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 繪製棋子
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== EMPTY) {
                drawPiece(col, row, board[row][col]);
            }
        }
    }
}

// 繪製棋子
function drawPiece(col, row, color) {
    ctx.beginPath();
    ctx.arc(col * cellSize, row * cellSize, cellSize/2 - 2, 0, Math.PI * 2);
    
    if (color === BLACK) {
        // 黑棋漸層效果
        const gradient = ctx.createRadialGradient(
            col * cellSize - cellSize/5, 
            row * cellSize - cellSize/5, 
            1,
            col * cellSize, 
            row * cellSize, 
            cellSize/2
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
    } else {
        // 白棋漸層效果
        const gradient = ctx.createRadialGradient(
            col * cellSize - cellSize/5, 
            row * cellSize - cellSize/5, 
            1,
            col * cellSize, 
            row * cellSize, 
            cellSize/2
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.8, '#dddddd');
        gradient.addColorStop(1, '#aaaaaa');
        ctx.fillStyle = gradient;
    }
    
    ctx.fill();
    
    // 添加邊框
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 檢查是否獲勝
function checkWin(row, col, player) {
    const directions = [
        [0, 1],   // 水平
        [1, 0],   // 垂直
        [1, 1],   // 對角線 \
        [1, -1]   // 對角線 /
    ];
    
    for (const [dx, dy] of directions) {
        let count = 1; // 包含當前棋子
        
        // 正向檢查
        for (let i = 1; i < 5; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && 
                newCol >= 0 && newCol < BOARD_SIZE && 
                board[newRow][newCol] === player) {
                count++;
            } else {
                break;
            }
        }
        
        // 反向檢查
        for (let i = 1; i < 5; i++) {
            const newRow = row - i * dx;
            const newCol = col - i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && 
                newCol >= 0 && newCol < BOARD_SIZE && 
                board[newRow][newCol] === player) {
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

// 更新當前玩家顯示
function updateCurrentPlayerDisplay() {
    const playerDisplay = document.getElementById('current-player');
    playerDisplay.textContent = currentPlayer === BLACK ? '黑方' : '白方 (AI)';
}

// 遊戲結束
function endGame(message) {
    gameOver = true;
    const messageElement = document.getElementById('game-message');
    messageElement.textContent = message;
    messageElement.classList.remove('hidden');
}

// 遊戲主邏輯 - 玩家下棋
function makeMove(col, row) {
    if (gameOver || board[row][col] !== EMPTY) {
        return false;
    }
    
    board[row][col] = currentPlayer;
    drawBoard();
    
    // 檢查是否獲勝
    if (checkWin(row, col, currentPlayer)) {
        endGame(currentPlayer === BLACK ? '恭喜！黑方獲勝！' : '恭喜！白方 (AI) 獲勝！');
        return true;
    }
    
    // 檢查是否平局
    let isBoardFull = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === EMPTY) {
                isBoardFull = false;
                break;
            }
        }
        if (!isBoardFull) break;
    }
    
    if (isBoardFull) {
        endGame('平局！');
        return true;
    }
    
    // 切換玩家
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    updateCurrentPlayerDisplay();
    
    // AI 回合
    if (currentPlayer === WHITE && !gameOver) {
        setTimeout(makeAIMove, 500); // 給 AI 一點思考時間
    }
    
    return true;
}

// AI 下棋邏輯
function makeAIMove() {
    if (gameOver) return;
    
    // 簡單 AI 策略：先防守再進攻
    let bestMove = null;
    let bestScore = -Infinity;
    
    // 遍歷所有可能的位置
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === EMPTY) {
                // 計算這個位置的分數
                const score = evaluatePosition(col, row, WHITE);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row, col };
                }
            }
        }
    }
    
    // 如果找不到好的位置，隨機選擇一個空位
    if (!bestMove) {
        const emptyCells = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === EMPTY) {
                    emptyCells.push({ row, col });
                }
            }
        }
        if (emptyCells.length > 0) {
            bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
    }
    
    if (bestMove) {
        makeMove(bestMove.col, bestMove.row);
    }
}

// 評估位置分數
function evaluatePosition(col, row, player) {
    // 我方是 WHITE (AI)，敵方是 BLACK
    const opponent = player === WHITE ? BLACK : WHITE;
    
    // 檢查在這個位置下棋後能否連成五子
    board[row][col] = player;
    const isWinningMove = checkWin(row, col, player);
    board[row][col] = EMPTY; // 恢復
    
    if (isWinningMove) {
        return 100000; // 極高分數，優先選擇能獲勝的位置
    }
    
    // 計算進攻分數 - AI 的潛在連線
    let attackScore = 0;
    board[row][col] = player;
    attackScore = calculateLineScore(row, col, player);
    board[row][col] = EMPTY;
    
    // 計算防守分數 - 阻止玩家的連線
    let defenseScore = 0;
    board[row][col] = opponent;
    defenseScore = calculateLineScore(row, col, opponent);
    board[row][col] = EMPTY;
    
    // 綜合評分：進攻分數 + 防守分數 * 0.9 (防守稍重要些)
    return attackScore + defenseScore * 0.9;
}

// 計算連線分數
function calculateLineScore(row, col, player) {
    const directions = [
        [0, 1],   // 水平
        [1, 0],   // 垂直
        [1, 1],   // 對角線 \
        [1, -1]   // 對角線 /
    ];
    
    let totalScore = 0;
    
    for (const [dx, dy] of directions) {
        let count = 1; // 包含當前棋子
        let openEnds = 0; // 開口數量
        
        // 正向檢查
        for (let i = 1; i < 5; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && 
                newCol >= 0 && newCol < BOARD_SIZE && 
                board[newRow][newCol] === player) {
                count++;
            } else if (newRow >= 0 && newRow < BOARD_SIZE && 
                       newCol >= 0 && newCol < BOARD_SIZE && 
                       board[newRow][newCol] === EMPTY) {
                openEnds++;
                break;
            } else {
                break;
            }
        }
        
        // 反向檢查
        for (let i = 1; i < 5; i++) {
            const newRow = row - i * dx;
            const newCol = col - i * dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && 
                newCol >= 0 && newCol < BOARD_SIZE && 
                board[newRow][newCol] === player) {
                count++;
            } else if (newRow >= 0 && newRow < BOARD_SIZE && 
                       newCol >= 0 && newCol < BOARD_SIZE && 
                       board[newRow][newCol] === EMPTY) {
                openEnds++;
                break;
            } else {
                break;
            }
        }
        
        // 根據連子數和開口數評分
        if (count >= 5) {
            totalScore += 10000; // 連五
        } else if (count === 4) {
            if (openEnds === 2) {
                totalScore += 5000; // 活四
            } else if (openEnds === 1) {
                totalScore += 1000; // 冒四
            }
        } else if (count === 3) {
            if (openEnds === 2) {
                totalScore += 1000; // 活三
            } else if (openEnds === 1) {
                totalScore += 100; // 冒三
            }
        } else if (count === 2) {
            if (openEnds === 2) {
                totalScore += 100; // 活二
            } else if (openEnds === 1) {
                totalScore += 10; // 冒二
            }
        } else if (count === 1) {
            totalScore += openEnds * 5; // 單子
        }
    }
    
    return totalScore;
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // 點擊棋盤下棋
    canvas.addEventListener('click', (e) => {
        if (gameOver || currentPlayer !== BLACK) {
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 計算最近的交叉點
        const col = Math.round(x / cellSize);
        const row = Math.round(y / cellSize);
        
        // 檢查是否在棋盤範圍內
        if (col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE) {
            makeMove(col, row);
        }
    });
    
    // 重新開始按鈕
    document.getElementById('restart-btn').addEventListener('click', initGame);
});