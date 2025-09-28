const canvas = document.getElementById('gomoku-board');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset-button');
const statusEl = document.getElementById('status');

const BOARD_SIZE = 15;
const CELL_SIZE = canvas.width / (BOARD_SIZE + 1);
const PIECE_RADIUS = CELL_SIZE / 2 * 0.85;

let board = [];
let currentPlayer; // 1 for player (black), 2 for AI (white)
let gameOver;

// 初始化遊戲
function initGame() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    drawBoard();
    updateStatus('輪到你了 (黑棋)');
}

// 繪製棋盤格線
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
        // 橫線
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE, CELL_SIZE * (i + 1));
        ctx.lineTo(CELL_SIZE * BOARD_SIZE, CELL_SIZE * (i + 1));
        ctx.stroke();

        // 縱線
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE * (i + 1), CELL_SIZE);
        ctx.lineTo(CELL_SIZE * (i + 1), CELL_SIZE * BOARD_SIZE);
        ctx.stroke();
    }
    
    // 繪製星位
    const starPoints = [3, 7, 11];
    starPoints.forEach(x => {
        starPoints.forEach(y => {
            drawStar(x, y);
        });
    });
}

function drawStar(x, y) {
    const cx = CELL_SIZE * (x + 1);
    const cy = CELL_SIZE * (y + 1);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fill();
}

// 繪製棋子
function drawPiece(x, y, player) {
    const cx = CELL_SIZE * (x + 1);
    const cy = CELL_SIZE * (y + 1);

    ctx.beginPath();
    ctx.arc(cx, cy, PIECE_RADIUS, 0, 2 * Math.PI);
    
    const gradient = ctx.createRadialGradient(cx - 5, cy - 5, 5, cx, cy, PIECE_RADIUS);
    if (player === 1) { // 黑棋
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#000');
    } else { // 白棋
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#ddd');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
}

// 更新狀態訊息
function updateStatus(message) {
    statusEl.textContent = message;
}

// 檢查是否勝利
function checkWin(x, y, player) {
    const directions = [
        [1, 0],  // 水平
        [0, 1],  // 垂直
        [1, 1],  // 右斜
        [1, -1]  // 左斜
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        // 檢查一個方向
        for (let i = 1; i < 5; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else {
                break;
            }
        }
        // 檢查反方向
        for (let i = 1; i < 5; i++) {
            const nx = x - i * dx;
            const ny = y - i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else {
                break;
            }
        }
        if (count >= 5) return true;
    }
    return false;
}

// 處理點擊事件
canvas.addEventListener('click', (e) => {
    if (gameOver || currentPlayer !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.round(x / CELL_SIZE) - 1;
    const gridY = Math.round(y / CELL_SIZE) - 1;

    if (gridX < 0 || gridX >= BOARD_SIZE || gridY < 0 || gridY >= BOARD_SIZE) return;

    if (board[gridY][gridX] === 0) {
        board[gridY][gridX] = 1;
        drawPiece(gridX, gridY, 1);

        if (checkWin(gridX, gridY, 1)) {
            gameOver = true;
            updateStatus('恭喜你，你贏了！');
            return;
        }

        currentPlayer = 2;
        updateStatus('電腦思考中...');
        setTimeout(computerMove, 500);
    }
});

// 電腦 AI 移動
function computerMove() {
    if (gameOver) return;

    const move = findBestMove();
    if (move) {
        board[move.y][move.x] = 2;
        drawPiece(move.x, move.y, 2);

        if (checkWin(move.x, move.y, 2)) {
            gameOver = true;
            updateStatus('很遺憾，電腦贏了。');
            return;
        }

        currentPlayer = 1;
        updateStatus('輪到你了 (黑棋)');
    }
}

// AI 尋找最佳落子點
function findBestMove() {
    let bestScore = -Infinity;
    let move = null;

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                // 評估電腦下的分數
                let aiScore = calculateScore(x, y, 2);
                // 評估玩家下的分數 (用於防守)
                let playerScore = calculateScore(x, y, 1);
                
                // 選擇分數最高的點
                const currentScore = Math.max(aiScore, playerScore);

                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    move = { x, y };
                }
            }
        }
    }
    return move;
}

// 為某個點評分
function calculateScore(x, y, player) {
    let score = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
        // 檢查每個方向的棋型
        let line = [];
        for (let i = -4; i <= 4; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                line.push(board[ny][nx]);
            } else {
                line.push(3); // 邊界
            }
        }
        
        const centerIndex = 4;
        line[centerIndex] = player;

        // 將棋盤狀態轉換為字串，方便用正則比對棋型
        const lineStr = line.map(p => p === player ? '1' : (p === 0 ? '0' : '2')).join('');

        // 評分規則 (數字越大越優先)
        if (/11111/.test(lineStr)) score += 100000; // 連五
        else if (/011110/.test(lineStr)) score += 10000; // 活四
        else if (/(211110|011112)/.test(lineStr)) score += 1000; // 衝四
        else if (/01110/.test(lineStr)) score += 1000; // 活三
        else if (/(21110|01112)/.test(lineStr)) score += 100; // 眠三
        else if (/001100/.test(lineStr)) score += 100; // 活二
        else if (/(20110|01102)/.test(lineStr)) score += 10; // 眠二
        else if (/00010/.test(lineStr)) score += 1; // 活一
    }

    return score;
}

// 重置遊戲
resetButton.addEventListener('click', initGame);

// 啟動遊戲
initGame();
