// 五子棋遊戲主邏輯
document.addEventListener('DOMContentLoaded', () => {
    // 游戲常量
    const BOARD_SIZE = 15;
    const CELL_SIZE = 40; // 每個格子的像素大小
    const PADDING = 20;   // 棋盤邊緣留白
    const STAR_POSITIONS = [
        { row: 3, col: 3 }, { row: 3, col: 11 },
        { row: 7, col: 7 }, { row: 11, col: 3 },
        { row: 11, col: 11 }
    ];

    // 游戲狀態
    let gameState = {
        board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0)), // 0:空, 1:黑, 2:白
        currentPlayer: 1, // 1:黑方(玩家), 2:白方(AI)
        gameOver: false,
        winner: null,
        lastMove: null
    };

    // DOM元素
    const canvas = document.getElementById('gobang-board');
    const ctx = canvas.getContext('2d');
    const currentTurnElement = document.getElementById('current-turn');
    const statusMessageElement = document.getElementById('status-message');
    const restartButton = document.getElementById('restart-button');

    // 初始化遊戲
    function initGame() {
        // 重置遊戲狀態
        gameState = {
            board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0)),
            currentPlayer: 1,
            gameOver: false,
            winner: null,
            lastMove: null
        };

        // 更新UI
        currentTurnElement.textContent = '黑方';
        statusMessageElement.textContent = '';
        drawBoard();
    }

    // 繪製棋盤
    function drawBoard() {
        // 清空canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 繪製背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 繪製棋盤線條
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        // 繪製橫線
        for (let i = 0; i < BOARD_SIZE; i++) {
            const y = PADDING + i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(PADDING, y);
            ctx.lineTo(canvas.width - PADDING, y);
            ctx.stroke();
        }

        // 繪製豎線
        for (let i = 0; i < BOARD_SIZE; i++) {
            const x = PADDING + i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, PADDING);
            ctx.lineTo(x, canvas.height - PADDING);
            ctx.stroke();
        }

        // 繪製星位
        ctx.fillStyle = '#000';
        STAR_POSITIONS.forEach(pos => {
            const x = PADDING + pos.col * CELL_SIZE;
            const y = PADDING + pos.row * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // 繪製所有棋子
        drawAllPieces();
    }

    // 繪製所有棋子
    function drawAllPieces() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = gameState.board[row][col];
                if (piece !== 0) {
                    drawPiece(row, col, piece);
                }
            }
        }

        // 如果有上一步棋，加上高亮效果
        if (gameState.lastMove) {
            highlightLastMove(gameState.lastMove.row, gameState.lastMove.col);
        }
    }

    // 繪製單個棋子
    function drawPiece(row, col, player) {
        const x = PADDING + col * CELL_SIZE;
        const y = PADDING + row * CELL_SIZE;
        const radius = CELL_SIZE * 0.4;

        // 創建漸層效果
        const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
        if (player === 1) { // 黑棋
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(0.7, '#000');
            gradient.addColorStop(1, '#333');
        } else { // 白棋
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.7, '#eee');
            gradient.addColorStop(1, '#ccc');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 加上高光效果
        ctx.beginPath();
        ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
        const highlightGradient = ctx.createRadialGradient(
            x - radius * 0.2, y - radius * 0.2, radius * 0.1,
            x - radius * 0.2, y - radius * 0.2, radius * 0.3
        );
        highlightGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
        highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGradient;
        ctx.fill();
    }

    // 高亮上一步棋
    function highlightLastMove(row, col) {
        const x = PADDING + col * CELL_SIZE;
        const y = PADDING + row * CELL_SIZE;
        const radius = CELL_SIZE * 0.45;

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 將畫布坐標轉換為棋盤坐標
    function getBoardPosition(x, y) {
        const col = Math.round((x - PADDING) / CELL_SIZE);
        const row = Math.round((y - PADDING) / CELL_SIZE);

        // 检查是否在棋盤範圍內
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            return { row, col };
        }
        return null;
    }

    // 下棋邏輯
    function makeMove(row, col) {
        // 检查遊戲是否結束或位置是否已有棋子
        if (gameState.gameOver || gameState.board[row][col] !== 0) {
            return false;
        }

        // 下棋
        gameState.board[row][col] = gameState.currentPlayer;
        gameState.lastMove = { row, col };

        // 检查是否勝利
        if (checkWin(row, col)) {
            gameState.gameOver = true;
            gameState.winner = gameState.currentPlayer;
            const winnerName = gameState.currentPlayer === 1 ? '黑方' : '白方';
            statusMessageElement.textContent = `${winnerName}獲勝!`;
            return true;
        }

        // 检查是否和棋（棋盤滿了）
        if (isBoardFull()) {
            gameState.gameOver = true;
            statusMessageElement.textContent = '和棋!';
            return true;
        }

        // 切換玩家
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        currentTurnElement.textContent = gameState.currentPlayer === 1 ? '黑方' : '白方';

        // 如果是AI回合，自動下棋
        if (gameState.currentPlayer === 2 && !gameState.gameOver) {
            setTimeout(() => {
                const aiMove = getAIMove();
                if (aiMove) {
                    makeMove(aiMove.row, aiMove.col);
                    drawBoard();
                }
            }, 500);
        }

        return true;
    }

    // 检查是否勝利
    function checkWin(row, col) {
        const directions = [
            { dr: 0, dc: 1 },  // 水平
            { dr: 1, dc: 0 },  // 垂直
            { dr: 1, dc: 1 },  // 對角（左上到右下）
            { dr: 1, dc: -1 }  // 對角（右上到左下）
        ];

        const currentPlayer = gameState.board[row][col];

        for (const dir of directions) {
            let count = 1; // 當前棋子

            // 向正方向搜索
            let r = row + dir.dr;
            let c = col + dir.dc;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
                gameState.board[r][c] === currentPlayer) {
                count++;
                r += dir.dr;
                c += dir.dc;
            }

            // 向反方向搜索
            r = row - dir.dr;
            c = col - dir.dc;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
                gameState.board[r][c] === currentPlayer) {
                count++;
                r -= dir.dr;
                c -= dir.dc;
            }

            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    // 检查棋盤是否已滿
    function isBoardFull() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (gameState.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // AI下棋邏輯
    function getAIMove() {
        // 如果遊戲已經結束，返回null
        if (gameState.gameOver) return null;

        // 尋找所有空位
        const emptyPositions = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (gameState.board[row][col] === 0) {
                    emptyPositions.push({ row, col });
                }
            }
        }

        // 如果沒有空位，返回null
        if (emptyPositions.length === 0) return null;

        // 簡單AI策略：評分所有可能的走法
        const scoredMoves = emptyPositions.map(pos => {
            return {
                ...pos,
                score: evaluateMove(pos.row, pos.col)
            };
        });

        // 按得分排序
        scoredMoves.sort((a, b) => b.score - a.score);

        // 選擇得分最高的走法（前50%的隨機選擇，增加多樣性）
        const topMoves = scoredMoves.slice(0, Math.max(1, Math.floor(scoredMoves.length * 0.5)));
        const randomIndex = Math.floor(Math.random() * topMoves.length);
        return topMoves[randomIndex];
    }

    // 評估走法的得分
    function evaluateMove(row, col) {
        let score = 0;
        const directions = [
            { dr: 0, dc: 1 },  // 水平
            { dr: 1, dc: 0 },  // 垂直
            { dr: 1, dc: 1 },  // 對角（左上到右下）
            { dr: 1, dc: -1 }  // 對角（右上到左下）
        ];

        // 暫時下棋
        gameState.board[row][col] = 2; // AI是白棋

        // 評估攻擊（AI自己的連線）
        for (const dir of directions) {
            score += evaluateLine(row, col, dir.dr, dir.dc, 2) * 10;
        }

        // 評估防守（阻止玩家的連線）
        gameState.board[row][col] = 1; // 假設玩家下這裡
        for (const dir of directions) {
            score += evaluateLine(row, col, dir.dr, dir.dc, 1) * 8;
        }

        // 恢復棋盤狀態
        gameState.board[row][col] = 0;

        // 中心位置加分
        const center = BOARD_SIZE / 2;
        const distanceToCenter = Math.sqrt(
            Math.pow(row - center, 2) + Math.pow(col - center, 2)
        );
        score += (BOARD_SIZE - distanceToCenter) * 0.1;

        return score;
    }

    // 評估某個方向的連線
    function evaluateLine(row, col, dr, dc, player) {
        let count = 1; // 當前位置
        let blockedLeft = false;
        let blockedRight = false;

        // 向左搜索
        let r = row - dr;
        let c = col - dc;
        let tempCount = 0;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
            gameState.board[r][c] === player) {
            tempCount++;
            r -= dr;
            c -= dc;
        }
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE ||
            gameState.board[r][c] !== 0) {
            blockedLeft = true;
        }
        count += tempCount;

        // 向右搜索
        r = row + dr;
        c = col + dc;
        tempCount = 0;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
            gameState.board[r][c] === player) {
            tempCount++;
            r += dr;
            c += dc;
        }
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE ||
            gameState.board[r][c] !== 0) {
            blockedRight = true;
        }
        count += tempCount;

        // 根據連線長度和是否被阻擋給予不同的得分
        if (count >= 5) return 10000; // 五連，必勝
        if (count === 4) {
            if (!blockedLeft && !blockedRight) return 1000; // 活四
            return 100; // 死四
        }
        if (count === 3) {
            if (!blockedLeft && !blockedRight) return 50; // 活三
            if ((!blockedLeft && blockedRight) || (blockedLeft && !blockedRight)) return 10; // 半活三
            return 1; // 死三
        }
        if (count === 2) {
            if (!blockedLeft && !blockedRight) return 5; // 活二
            return 1; // 死二
        }

        return 0;
    }

    // 重新開始遊戲
    function restartGame() {
        initGame();
    }

    // 初始化事件監聽
    function initEventListeners() {
        // 點擊棋盤下棋
        canvas.addEventListener('click', (e) => {
            if (gameState.gameOver || gameState.currentPlayer !== 1) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const pos = getBoardPosition(x, y);
            if (pos) {
                if (makeMove(pos.row, pos.col)) {
                    drawBoard();
                }
            }
        });

        // 重新開始按鈕
        restartButton.addEventListener('click', restartGame);
    }

    // 初始化遊戲
    initGame();
    initEventListeners();
});
