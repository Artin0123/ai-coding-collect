const canvas = document.getElementById('gobangCanvas');
const ctx = canvas.getContext('2d');
const currentTurnSpan = document.getElementById('current-turn');
const restartButton = document.getElementById('restart-button');
const messageBox = document.getElementById('message-box');

const BOARD_SIZE = 15; // 棋盤大小 15x15
const CELL_SIZE = 40; // 每個格子的像素大小
const BOARD_PADDING = CELL_SIZE / 2; // 棋盤邊緣留白，讓棋子可以完整顯示在最外框線上

canvas.width = BOARD_SIZE * CELL_SIZE;
canvas.height = BOARD_SIZE * CELL_SIZE;

let board = []; // 儲存棋盤狀態，0: 空, 1: 黑子, 2: 白子
let isGameOver = false;
let currentPlayer = 1; // 1: 黑方 (玩家), 2: 白方 (AI)

// 初始化棋盤
function initBoard() {
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    isGameOver = false;
    currentPlayer = 1;
    currentTurnSpan.textContent = '黑方';
    messageBox.classList.add('hidden');
    drawBoard();
}

// 繪製棋盤
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#DEB887'; // 淺褐色
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#8B4513'; // 深褐色
    ctx.lineWidth = 2;

    // 繪製橫線和豎線
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 橫線
        ctx.beginPath();
        ctx.moveTo(BOARD_PADDING, i * CELL_SIZE + BOARD_PADDING);
        ctx.lineTo(canvas.width - BOARD_PADDING, i * CELL_SIZE + BOARD_PADDING);
        ctx.stroke();

        // 豎線
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE + BOARD_PADDING, BOARD_PADDING);
        ctx.lineTo(i * CELL_SIZE + BOARD_PADDING, canvas.height - BOARD_PADDING);
        ctx.stroke();
    }

    // 繪製星位 (標準五子棋星位)
    const starPoints = [
        [3, 3], [11, 3], [3, 11], [11, 11], // 四個角
        [7, 7] // 中心
    ];
    starPoints.forEach(([row, col]) => {
        drawStarPoint(row, col);
    });

    // 繪製棋子
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) {
                drawPiece(r, c, board[r][c]);
            }
        }
    }
}

// 繪製星位點
function drawStarPoint(row, col) {
    const x = col * CELL_SIZE + BOARD_PADDING;
    const y = row * CELL_SIZE + BOARD_PADDING;
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
}

// 繪製棋子
function drawPiece(row, col, player) {
    const x = col * CELL_SIZE + BOARD_PADDING;
    const y = row * CELL_SIZE + BOARD_PADDING;
    const radius = CELL_SIZE / 2 - 2; // 棋子半徑，略小於格子一半

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 2, x, y, radius);

    if (player === 1) { // 黑子
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(1, '#000000');
    } else { // 白子
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#CCCCCC');
    }
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 處理玩家點擊
function handleCanvasClick(event) {
    if (isGameOver || currentPlayer !== 1) return; // 遊戲結束或不是玩家回合

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 計算點擊位置最接近的交叉點
    const col = Math.round((mouseX - BOARD_PADDING) / CELL_SIZE);
    const row = Math.round((mouseY - BOARD_PADDING) / CELL_SIZE);

    // 檢查是否在棋盤範圍內
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        if (board[row][col] === 0) { // 只能下在空位
            board[row][col] = currentPlayer;
            drawBoard();
            if (checkWin(row, col, currentPlayer)) {
                endGame(currentPlayer);
            } else {
                switchPlayer();
                if (!isGameOver) {
                    setTimeout(aiMove, 500); // AI 延遲 0.5 秒下棋
                }
            }
        }
    }
}

// 切換玩家
function switchPlayer() {
    currentPlayer = 3 - currentPlayer; // 1 -> 2, 2 -> 1
    currentTurnSpan.textContent = currentPlayer === 1 ? '黑方' : '白方';
}

// 檢查勝利
function checkWin(row, col, player) {
    const directions = [
        [0, 1], // 橫向
        [1, 0], // 縱向
        [1, 1], // 右斜
        [1, -1] // 左斜
    ];

    for (const [dr, dc] of directions) {
        let count = 1;
        // 向一個方向檢查
        for (let i = 1; i < 5; i++) {
            const nr = row + i * dr;
            const nc = col + i * dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                count++;
            } else {
                break;
            }
        }
        // 向反方向檢查
        for (let i = 1; i < 5; i++) {
            const nr = row - i * dr;
            const nc = col - i * dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
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

// 遊戲結束
function endGame(winner) {
    isGameOver = true;
    messageBox.textContent = `${winner === 1 ? '黑方' : '白方'}獲勝！`;
    messageBox.classList.remove('hidden');
}

// AI 下棋邏輯
function aiMove() {
    if (isGameOver || currentPlayer !== 2) return;

    let bestScore = -Infinity;
    let bestMove = null;

    // 遍歷所有空位，評估最佳下棋位置
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                board[r][c] = 2; // 假設 AI 在此下棋
                let score = evaluateBoard(r, c, 2); // 評估當前位置的得分
                board[r][c] = 0; // 撤銷假設

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: r, col: c };
                }
            }
        }
    }

    if (bestMove) {
        board[bestMove.row][bestMove.col] = 2;
        drawBoard();
        if (checkWin(bestMove.row, bestMove.col, 2)) {
            endGame(2);
        } else {
            switchPlayer();
        }
    } else {
        // 如果沒有最佳移動，隨機找一個空位下棋 (理論上不會發生，除非棋盤滿了)
        let emptyCells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === 0) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }
        if (emptyCells.length > 0) {
            const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[randomMove.row][randomMove.col] = 2;
            drawBoard();
            if (checkWin(randomMove.row, randomMove.col, 2)) {
                endGame(2);
            } else {
                switchPlayer();
            }
        } else {
            // 和局
            messageBox.textContent = '和局！';
            messageBox.classList.remove('hidden');
            isGameOver = true;
        }
    }
}

// 評估棋盤得分 (簡化版，僅考慮連線情況)
function evaluateBoard(row, col, player) {
    let score = 0;
    const opponent = 3 - player;

    const directions = [
        [0, 1], // 橫向
        [1, 0], // 縱向
        [1, 1], // 右斜
        [1, -1] // 左斜
    ];

    for (const [dr, dc] of directions) {
        let playerCount = 0;
        let opponentCount = 0;
        let emptyCount = 0;

        // 檢查當前方向的五個位置
        for (let i = -4; i <= 4; i++) { // 檢查以 (row, col) 為中心，前後各4個位置
            const nr = row + i * dr;
            const nc = col + i * dc;

            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (board[nr][nc] === player) {
                    playerCount++;
                } else if (board[nr][nc] === opponent) {
                    opponentCount++;
                } else {
                    emptyCount++;
                }
            }
        }

        // 簡單的評分邏輯
        // 優先阻止對方連五
        if (opponentCount >= 4 && emptyCount >= 1) { // 對方有活四
            score += 100000;
        }
        if (playerCount >= 4 && emptyCount >= 1) { // 自己有活四
            score += 50000;
        }
        if (opponentCount >= 3 && emptyCount >= 2) { // 對方有活三
            score += 10000;
        }
        if (playerCount >= 3 && emptyCount >= 2) { // 自己有活三
            score += 5000;
        }
        if (opponentCount >= 2 && emptyCount >= 3) { // 對方有活二
            score += 1000;
        }
        if (playerCount >= 2 && emptyCount >= 3) { // 自己有活二
            score += 500;
        }
    }
    return score;
}

// 事件監聽
canvas.addEventListener('click', handleCanvasClick);
restartButton.addEventListener('click', initBoard);

// 初始遊戲
initBoard();
