const board = document.getElementById('board');
const currentTurnDisplay = document.getElementById('current-turn');
const restartBtn = document.getElementById('restart-btn');

const BOARD_SIZE = 15;
const CELL_SIZE = 30;
const STONE_SIZE = CELL_SIZE * 0.8;

let currentPlayer = 'black';
let gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
let gameOver = false;

// 初始化棋盤
function initBoard() {
    board.innerHTML = '';
    gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    currentPlayer = 'black';
    gameOver = false;
    currentTurnDisplay.textContent = '黑方';

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }
}

// 處理點擊事件
function handleCellClick(e) {
    if (gameOver) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (gameBoard[row][col] !== null) return;

    placeStone(row, col, currentPlayer);
    gameBoard[row][col] = currentPlayer;

    if (checkWin(row, col, currentPlayer)) {
        gameOver = true;
        setTimeout(() => alert(`${currentPlayer === 'black' ? '黑方' : '白方'}獲勝！`), 100);
        return;
    }

    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    currentTurnDisplay.textContent = currentPlayer === 'black' ? '黑方' : '白方';

    if (currentPlayer === 'white') {
        setTimeout(aiMove, 500);
    }
}

// 放置棋子
function placeStone(row, col, player) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    const stone = document.createElement('div');
    stone.className = `stone ${player}`;
    stone.style.width = `${STONE_SIZE}px`;
    stone.style.height = `${STONE_SIZE}px`;
    cell.appendChild(stone);
}

// 檢查勝利條件
function checkWin(row, col, player) {
    const directions = [
        [0, 1],  // 水平
        [1, 0],  // 垂直
        [1, 1],  // 對角線
        [1, -1]  // 反對角線
    ];

    for (const [dx, dy] of directions) {
        let count = 1;

        // 正向檢查
        for (let i = 1; i < 5; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            if (
                newRow < 0 || newRow >= BOARD_SIZE ||
                newCol < 0 || newCol >= BOARD_SIZE ||
                gameBoard[newRow][newCol] !== player
            ) break;
            count++;
        }

        // 反向檢查
        for (let i = 1; i < 5; i++) {
            const newRow = row - i * dx;
            const newCol = col - i * dy;
            if (
                newRow < 0 || newRow >= BOARD_SIZE ||
                newCol < 0 || newCol >= BOARD_SIZE ||
                gameBoard[newRow][newCol] !== player
            ) break;
            count++;
        }

        if (count >= 5) return true;
    }

    return false;
}

// AI移動
function aiMove() {
    if (gameOver) return;

    // 簡單AI策略
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (gameBoard[i][j] !== null) continue;

            // 模擬下棋
            gameBoard[i][j] = 'white';
            let score = evaluateBoard(i, j);
            gameBoard[i][j] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMove = { row: i, col: j };
            }
        }
    }

    if (bestMove) {
        const { row, col } = bestMove;
        placeStone(row, col, 'white');
        gameBoard[row][col] = 'white';

        if (checkWin(row, col, 'white')) {
            gameOver = true;
            setTimeout(() => alert('白方獲勝！'), 100);
            return;
        }

        currentPlayer = 'black';
        currentTurnDisplay.textContent = '黑方';
    }
}

// 評估棋盤
function evaluateBoard(row, col) {
    let score = 0;

    // 優先中心區域
    const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
    score += (14 - centerDist) * 2;

    // 檢查四子連線
    score += countConsecutive(row, col, 'white', 4) * 1000;
    score += countConsecutive(row, col, 'black', 4) * 800;

    // 檢查三子連線
    score += countConsecutive(row, col, 'white', 3) * 100;
    score += countConsecutive(row, col, 'black', 3) * 80;

    // 檢查二子連線
    score += countConsecutive(row, col, 'white', 2) * 10;
    score += countConsecutive(row, col, 'black', 2) * 8;

    // 隨機因素
    score += Math.random() * 5;

    return score;
}

// 計算連續棋子
function countConsecutive(row, col, player, target) {
    const directions = [
        [0, 1],  // 水平
        [1, 0],  // 垂直
        [1, 1],  // 對角線
        [1, -1]  // 反對角線
    ];

    let total = 0;

    for (const [dx, dy] of directions) {
        let count = 1;

        // 正向檢查
        for (let i = 1; i < target; i++) {
            const newRow = row + i * dx;
            const newCol = col + i * dy;
            if (
                newRow < 0 || newRow >= BOARD_SIZE ||
                newCol < 0 || newCol >= BOARD_SIZE ||
                gameBoard[newRow][newCol] !== player
            ) break;
            count++;
        }

        // 反向檢查
        for (let i = 1; i < target; i++) {
            const newRow = row - i * dx;
            const newCol = col - i * dy;
            if (
                newRow < 0 || newRow >= BOARD_SIZE ||
                newCol < 0 || newCol >= BOARD_SIZE ||
                gameBoard[newRow][newCol] !== player
            ) break;
            count++;
        }

        if (count >= target) total++;
    }

    return total;
}

// 重新開始遊戲
restartBtn.addEventListener('click', initBoard);

// 初始化遊戲
initBoard();