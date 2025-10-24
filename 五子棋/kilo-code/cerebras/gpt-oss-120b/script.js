/* 五子棋 JavaScript 實作
   - 15x15 棋盤
   - 人類 (黑子) 先手，AI (白子) 後手
   - 簡易攻防 AI
   - 勝負判斷、回合顯示、重新開始
*/

const BOARD_SIZE = 15;          // 15 行 15 列
const CELL_SIZE = 40;           // 與 CSS 中的格子大小相同
const PLAYER_BLACK = 1;         // 人類
const PLAYER_WHITE = 2;         // AI
const STAR_POS = [              // 5 個星位 (0-index)
    [3, 3],
    [3, 11],
    [7, 7],
    [11, 3],
    [11, 11],
];

let board = [];                 // 2D 陣列，0=空，1=黑，2=白
let currentPlayer = PLAYER_BLACK;
let gameOver = false;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');

/* 初始化棋盤資料與 UI */
function init() {
    // 建立空的 2D 陣列
    board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    currentPlayer = PLAYER_BLACK;
    gameOver = false;
    statusEl.textContent = '輪到: 黑子 (玩家)';

    // 清空 board 元素
    boardEl.innerHTML = '';
    // 加入星位
    for (const [r, c] of STAR_POS) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${c * CELL_SIZE + CELL_SIZE / 2}px`;
        star.style.top = `${r * CELL_SIZE + CELL_SIZE / 2}px`;
        boardEl.appendChild(star);
    }

    // 監聽點擊
    boardEl.addEventListener('click', onBoardClick);
    // 重新開始按鈕
    restartBtn.addEventListener('click', restartGame);
}

/* 點擊棋盤處理 */
function onBoardClick(e) {
    if (gameOver) return;
    const rect = boardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 計算最近的交叉點座標 (0~14)
    const col = Math.round(x / CELL_SIZE);
    const row = Math.round(y / CELL_SIZE);

    // 超出範圍或已佔用則忽略
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;
    if (board[row][col] !== 0) return;

    placeStone(row, col, currentPlayer);
    board[row][col] = currentPlayer;

    if (checkWin(row, col, currentPlayer)) {
        gameOver = true;
        alert(`${currentPlayer === PLAYER_BLACK ? '黑子' : '白子'} 獲勝！`);
        return;
    }

    // 換手
    currentPlayer = currentPlayer === PLAYER_BLACK ? PLAYER_WHITE : PLAYER_BLACK;
    updateStatus();

    // 若換成 AI，稍作延遲後自動落子
    if (currentPlayer === PLAYER_WHITE && !gameOver) {
        setTimeout(aiMove, 300);
    }
}

/* 在指定座標放置棋子 */
function placeStone(row, col, player) {
    const stone = document.createElement('div');
    stone.className = `stone ${player === PLAYER_BLACK ? 'black' : 'white'}`;
    stone.style.left = `${col * CELL_SIZE + 2}px`;   // 2px 為 stone 的內邊距，使其居中於格線
    stone.style.top = `${row * CELL_SIZE + 2}px`;
    boardEl.appendChild(stone);
}

/* 更新回合顯示 */
function updateStatus() {
    if (gameOver) return;
    statusEl.textContent = `輪到: ${currentPlayer === PLAYER_BLACK ? '黑子 (玩家)' : '白子 (AI)'}`;
}

/* AI 落子策略 (簡易攻防) */
function aiMove() {
    if (gameOver) return;

    // 1. 嘗試取得勝利
    const winMove = findWinningMove(PLAYER_WHITE);
    if (winMove) {
        makeAIMove(winMove.row, winMove.col);
        return;
    }

    // 2. 阻止對手贏棋
    const blockMove = findWinningMove(PLAYER_BLACK);
    if (blockMove) {
        makeAIMove(blockMove.row, blockMove.col);
        return;
    }

    // 3. 隨機落子
    const empty = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) empty.push({ r, c });
        }
    }
    const choice = empty[Math.floor(Math.random() * empty.length)];
    makeAIMove(choice.r, choice.c);
}

/* 找出給定玩家的必勝落子 (若有) */
function findWinningMove(player) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) continue;
            board[r][c] = player;               // 模擬落子
            const win = checkWin(r, c, player);
            board[r][c] = 0;                     // 還原
            if (win) return { row: r, col: c };
        }
    }
    return null;
}

/* 執行 AI 真正的落子 */
function makeAIMove(row, col) {
    placeStone(row, col, PLAYER_WHITE);
    board[row][col] = PLAYER_WHITE;

    if (checkWin(row, col, PLAYER_WHITE)) {
        gameOver = true;
        alert('白子 (AI) 獲勝！');
        return;
    }

    // 換回玩家
    currentPlayer = PLAYER_BLACK;
    updateStatus();
}

/* 勝負判斷：檢查五子連線 */
function checkWin(row, col, player) {
    const dirs = [
        { dr: 0, dc: 1 },   // 水平
        { dr: 1, dc: 0 },   // 垂直
        { dr: 1, dc: 1 },   // 主對角線
        { dr: 1, dc: -1 },  // 副對角線
    ];

    for (const { dr, dc } of dirs) {
        let count = 1;
        // 正向
        let r = row + dr;
        let c = col + dc;
        while (inBounds(r, c) && board[r][c] === player) {
            count++;
            r += dr;
            c += dc;
        }
        // 反向
        r = row - dr;
        c = col - dc;
        while (inBounds(r, c) && board[r][c] === player) {
            count++;
            r -= dr;
            c -= dc;
        }
        if (count >= 5) return true;
    }
    return false;
}

/* 判斷座標是否在棋盤內 */
function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

/* 重新開始遊戲 */
function restartGame() {
    init();
}

/* 初始化 */
init();