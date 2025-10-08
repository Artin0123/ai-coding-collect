const canvas = document.getElementById('gobang-board');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restart-button');
const currentTurnDisplay = document.getElementById('current-turn');

const BOARD_SIZE = 15;
const CELL_SIZE = 40; // 每個格子的寬度
const BOARD_PADDING = CELL_SIZE / 2; // 棋盤邊緣留白，讓棋子可以完整顯示
const BOARD_WIDTH = CELL_SIZE * (BOARD_SIZE - 1) + BOARD_PADDING * 2;
const BOARD_HEIGHT = CELL_SIZE * (BOARD_SIZE - 1) + BOARD_PADDING * 2;
const PIECE_RADIUS = CELL_SIZE * 0.8 / 2; // 棋子直徑為格子寬度的80%

canvas.width = BOARD_WIDTH;
canvas.height = BOARD_HEIGHT;

let board = []; // 0: 空, 1: 黑子 (玩家), 2: 白子 (AI)
let currentPlayer = 1; // 1: 黑方, 2: 白方
let gameOver = false;

// 星位座標 (中心點和四個角落)
const STAR_POINTS = [
    , , , ,
];

function initBoard() {
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    currentTurnDisplay.textContent = '黑方';
    drawBoard();
}

function drawBoard() {
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 繪製棋盤線條
    ctx.strokeStyle = '#8B4513'; // 深褐色
    ctx.lineWidth = 2;

    for (let i = 0; i < BOARD_SIZE; i++) {
        // 橫線
        ctx.beginPath();
        ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
        ctx.lineTo(BOARD_WIDTH - BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
        ctx.stroke();

        // 豎線
        ctx.beginPath();
        ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING);
        ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_HEIGHT - BOARD_PADDING);
        ctx.stroke();
    }

    // 繪製星位
    ctx.fillStyle = '#8B4513';
    STAR_POINTS.forEach(([row, col]) => {
        const x = BOARD_PADDING + col * CELL_SIZE;
        const y = BOARD_PADDING + row * CELL_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
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

function drawPiece(row, col, player) {
    const x = BOARD_PADDING + col * CELL_SIZE;
    const y = BOARD_PADDING + row * CELL_SIZE;

    ctx.beginPath();
    ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(x - PIECE_RADIUS / 3, y - PIECE_RADIUS / 3, 1, x, y, PIECE_RADIUS);

    if (player === 1) { // 黑子
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(1, '#000000');
    } else { // 白子
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#CCCCCC');
    }
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function getBoardCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    const x = clientX * scaleX;
    const y = clientY * scaleY;

    // 計算最近的交叉點
    const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
    const row = Math.round((y - BOARD_PADDING) / CELL_SIZE);

    // 邊界檢測
    if (col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE) {
        return { row, col };
    }
    return null;
}

function placePiece(row, col, player) {
    if (board[row][col] === 0) {
        board[row][col] = player;
        drawPiece(row, col, player);
        return true;
    }
    return false;
}

function checkWin(row, col, player) {
    const directions = [
        ,  // 水平
        ,  // 垂直
        ,  // 右下斜
        [1, -1]  // 左下斜
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

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    currentTurnDisplay.textContent = currentPlayer === 1 ? '黑方' : '白方';
}

function handlePlayerMove(event) {
    if (gameOver || currentPlayer !== 1) return;

    const coords = getBoardCoordinates(event);
    if (coords) {
        const { row, col } = coords;
        if (placePiece(row, col, currentPlayer)) {
            if (checkWin(row, col, currentPlayer)) {
                alert('黑方獲勝！');
                gameOver = true;
            } else {
                switchPlayer();
                if (!gameOver) {
                    setTimeout(aiMove, 500); // AI在0.5秒後響應
                }
            }
        }
    }
}

// AI 策略
function aiMove() {
    if (gameOver || currentPlayer !== 2) return;

    let bestMove = null;
    let maxScore = -Infinity;

    // 評估每個空位
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                let score = evaluatePosition(r, c, 2); // 評估AI自己的分數
                score += evaluatePosition(r, c, 1) * 0.8; // 評估阻擋玩家的分數 (權重較低)

                // 優先在中心區域和已有棋子附近下棋
                score += getProximityScore(r, c);
                score += getCenterScore(r, c);

                if (score > maxScore) {
                    maxScore = score;
                    bestMove = { row: r, col: c };
                } else if (score === maxScore && Math.random() > 0.5) { // 隨機選擇時要有合理的權重分配
                    bestMove = { row: r, col: c };
                }
            }
        }
    }

    if (bestMove) {
        if (placePiece(bestMove.row, bestMove.col, currentPlayer)) {
            if (checkWin(bestMove.row, bestMove.col, currentPlayer)) {
                alert('白方獲勝！');
                gameOver = true;
            } else {
                switchPlayer();
            }
        }
    } else {
        // 如果沒有最佳移動，隨機找一個空位
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
            if (placePiece(randomMove.row, randomMove.col, currentPlayer)) {
                if (checkWin(randomMove.row, randomMove.col, currentPlayer)) {
                    alert('白方獲勝！');
                    gameOver = true;
                } else {
                    switchPlayer();
                }
            }
        }
    }
}

// 評估位置分數
function evaluatePosition(row, col, player) {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;
    const directions = [
        ,  // 水平
        ,  // 垂直
        ,  // 右下斜
        [1, -1]  // 左下斜
    ];

    for (const [dr, dc] of directions) {
        let playerCount = 0;
        let opponentCount = 0;
        let emptyCount = 0;

        // 檢查五個位置
        for (let i = -4; i <= 4; i++) {
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

        // 簡單的評分邏輯 (可以更複雜)
        if (playerCount >= 4 && emptyCount >= 1) { // 活四
            score += 10000;
        } else if (playerCount >= 3 && emptyCount >= 2) { // 活三
            score += 1000;
        } else if (playerCount >= 2 && emptyCount >= 3) { // 活二
            score += 100;
        }

        if (opponentCount >= 4 && emptyCount >= 1) { // 阻擋對手的活四
            score += 9000;
        } else if (opponentCount >= 3 && emptyCount >= 2) { // 阻擋對手的活三
            score += 900;
        }
    }
    return score;
}

// 獲取靠近已有棋子的分數
function getProximityScore(row, col) {
    let score = 0;
    const proximityRange = 2; // 檢查周圍2格

    for (let r = Math.max(0, row - proximityRange); r <= Math.min(BOARD_SIZE - 1, row + proximityRange); r++) {
        for (let c = Math.max(0, col - proximityRange); c <= Math.min(BOARD_SIZE - 1, col + proximityRange); c++) {
            if (board[r][c] !== 0) {
                score += 10; // 靠近已有棋子加分
            }
        }
    }
    return score;
}

// 獲取中心區域分數
function getCenterScore(row, col) {
    const center = Math.floor(BOARD_SIZE / 2);
    const distance = Math.abs(row - center) + Math.abs(col - center);
    return (BOARD_SIZE * 2 - distance) * 5; // 離中心越近分數越高
}

function restartGame() {
    initBoard();
}

canvas.addEventListener('click', handlePlayerMove);
restartButton.addEventListener('click', restartGame);

initBoard();