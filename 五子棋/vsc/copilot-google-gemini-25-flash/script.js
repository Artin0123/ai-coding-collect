const canvas = document.getElementById('gobang-board');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restart-button');
const currentTurnDisplay = document.getElementById('current-turn');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / BOARD_SIZE;
const PIECE_RADIUS = CELL_SIZE * 0.4;

let board = [];
let currentPlayer = 1; // 1 for Black (player), 2 for White (AI)
let gameOver = false;

// 星位座標 (1-indexed)
const STAR_POINTS = [
    { row: 3, col: 3 }, { row: 3, col: 11 },
    { row: 11, col: 3 }, { row: 11, col: 11 },
    { row: 3, col: 7 }, { row: 7, col: 3 },
    { row: 7, col: 11 }, { row: 11, col: 7 },
    { row: 7, col: 7 }
];

function initBoard() {
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    currentTurnDisplay.textContent = '黑方';
    drawBoard();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製棋盤線條
    ctx.strokeStyle = '#8B4513'; // 深褐色
    ctx.lineWidth = 2;
    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2);
        ctx.lineTo(i * CELL_SIZE + CELL_SIZE / 2, canvas.height - CELL_SIZE / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
        ctx.lineTo(canvas.width - CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
        ctx.stroke();
    }

    // 繪製星位
    ctx.fillStyle = '#8B4513';
    STAR_POINTS.forEach(point => {
        const x = (point.col - 1) * CELL_SIZE + CELL_SIZE / 2;
        const y = (point.row - 1) * CELL_SIZE + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
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
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;

    ctx.beginPath();
    ctx.arc(x, y, PIECE_RADIUS, 0, 2 * Math.PI);

    const gradient = ctx.createRadialGradient(x - PIECE_RADIUS / 3, y - PIECE_RADIUS / 3, 0, x, y, PIECE_RADIUS);

    if (player === 1) { // 黑子
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(1, '#000000');
    } else { // 白子
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#CCCCCC');
    }
    ctx.fillStyle = gradient;
    ctx.fill();
}

function handleClick(event) {
    if (gameOver || currentPlayer !== 1) return; // 遊戲結束或不是玩家回合

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === 0) {
        board[row][col] = currentPlayer;
        drawBoard();
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

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    currentTurnDisplay.textContent = currentPlayer === 1 ? '黑方' : '白方';
}

function checkWin(row, col, player) {
    const directions = [
        [{ dr: 0, dc: 1 }, { dr: 0, dc: -1 }], // 水平
        [{ dr: 1, dc: 0 }, { dr: -1, dc: 0 }], // 垂直
        [{ dr: 1, dc: 1 }, { dr: -1, dc: -1 }], // 主對角線
        [{ dr: 1, dc: -1 }, { dr: -1, dc: 1 }]  // 副對角線
    ];

    for (const [dir1, dir2] of directions) {
        let count = 1;
        count += countLine(row, col, player, dir1.dr, dir1.dc);
        count += countLine(row, col, player, dir2.dr, dir2.dc);
        if (count >= 5) return true;
    }
    return false;
}

function countLine(row, col, player, dr, dc) {
    let count = 0;
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
    }
    return count;
}

// AI 邏輯
function aiMove() {
    if (gameOver) return;

    let bestScore = -Infinity;
    let bestMove = null;

    // 評估每個空位
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                // 嘗試下棋
                board[r][c] = currentPlayer;
                let score = evaluateBoard(currentPlayer); // 評估當前局面
                board[r][c] = 0; // 撤銷下棋

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: r, col: c };
                }
            }
        }
    }

    if (bestMove) {
        board[bestMove.row][bestMove.col] = currentPlayer;
        drawBoard();
        if (checkWin(bestMove.row, bestMove.col, currentPlayer)) {
            alert('白方獲勝！');
            gameOver = true;
        } else {
            switchPlayer();
        }
    } else {
        // 如果沒有最佳移動，隨機選擇一個空位 (理論上不應該發生，除非棋盤滿了)
        const emptyCells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === 0) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }
        if (emptyCells.length > 0) {
            const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[randomMove.row][randomMove.col] = currentPlayer;
            drawBoard();
            if (checkWin(randomMove.row, randomMove.col, currentPlayer)) {
                alert('白方獲勝！');
                gameOver = true;
            } else {
                switchPlayer();
            }
        }
    }
}

// 評估棋盤分數 (簡化版，僅考慮連子情況)
function evaluateBoard(player) {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === player) {
                score += evaluatePosition(r, c, player); // 評估自己的連子
            } else if (board[r][c] === opponent) {
                score -= evaluatePosition(r, c, opponent); // 評估對手的連子 (阻擋)
            }
        }
    }
    return score;
}

function evaluatePosition(row, col, player) {
    let positionScore = 0;
    const directions = [
        { dr: 0, dc: 1 }, // 水平
        { dr: 1, dc: 0 }, // 垂直
        { dr: 1, dc: 1 }, // 主對角線
        { dr: 1, dc: -1 }  // 副對角線
    ];

    for (const dir of directions) {
        let count = 0;
        let openEnds = 0;

        // 向一個方向檢查
        let r = row;
        let c = col;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            count++;
            r += dir.dr;
            c += dir.dc;
        }
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0) {
            openEnds++;
        }

        // 向另一個方向檢查
        r = row - dir.dr;
        c = col - dir.dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
            count++;
            r -= dir.dr;
            c -= dir.dc;
        }
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0) {
            openEnds++;
        }

        // 根據連子數量和開放端點給分
        if (count === 4 && openEnds >= 1) { // 活四或衝四
            positionScore += 100000; // 高分，優先完成或阻擋
        } else if (count === 3 && openEnds === 2) { // 活三
            positionScore += 10000;
        } else if (count === 3 && openEnds === 1) { // 衝三
            positionScore += 1000;
        } else if (count === 2 && openEnds === 2) { // 活二
            positionScore += 100;
        } else if (count === 1 && openEnds === 2) { // 活一
            positionScore += 10;
        }
    }

    // 優先在中心區域和已有棋子附近下棋 (簡化版)
    const centerDist = Math.abs(row - BOARD_SIZE / 2) + Math.abs(col - BOARD_SIZE / 2);
    positionScore -= centerDist; // 離中心越近分數越高

    return positionScore;
}


canvas.addEventListener('click', handleClick);
restartButton.addEventListener('click', initBoard);

initBoard();
