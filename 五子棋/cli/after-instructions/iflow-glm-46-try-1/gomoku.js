document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const messageElement = document.getElementById('game-message');
    const currentPlayerElement = document.getElementById('current-player');
    const restartBtn = document.getElementById('restart-btn');
    
    // 遊戲常量
    const BOARD_SIZE = 15;
    const CELL_SIZE = 40;
    const BOARD_PADDING = 20;
    const STAR_POINTS = [
        [3, 3], [3, 11], [11, 3], [11, 11], // 四角星位
        [7, 7], // 中心星位
        [3, 7], [7, 3], [7, 11], [11, 7] // 邊中星位
    ];
    
    // 遊戲狀態
    let gameBoard = [];
    let currentPlayer = 'black'; // 'black' or 'white'
    let gameOver = false;
    let isAIThinking = false;
    
    // 初始化遊戲
    function initGame() {
        gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
        currentPlayer = 'black';
        gameOver = false;
        isAIThinking = false;
        messageElement.textContent = '';
        currentPlayerElement.textContent = '黑方';
        drawBoard();
    }
    
    // 繪製棋盤
    function drawBoard() {
        // 清空畫布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 設置棋盤背景色
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 繪製網格線
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            // 橫線
            ctx.beginPath();
            ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
            ctx.lineTo(BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE, BOARD_PADDING + i * CELL_SIZE);
            ctx.stroke();
            
            // 豎線
            ctx.beginPath();
            ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING);
            ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
            ctx.stroke();
        }
        
        // 繪製星位
        ctx.fillStyle = '#8B4513';
        for (const [row, col] of STAR_POINTS) {
            ctx.beginPath();
            ctx.arc(
                BOARD_PADDING + col * CELL_SIZE,
                BOARD_PADDING + row * CELL_SIZE,
                4,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // 繪製所有棋子
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (gameBoard[row][col]) {
                    drawPiece(row, col, gameBoard[row][col]);
                }
            }
        }
    }
    
    // 繪製棋子
    function drawPiece(row, col, color) {
        const x = BOARD_PADDING + col * CELL_SIZE;
        const y = BOARD_PADDING + row * CELL_SIZE;
        const radius = CELL_SIZE * 0.4;
        
        // 創建漸變效果
        const gradient = ctx.createRadialGradient(
            x - radius * 0.3,
            y - radius * 0.3,
            radius * 0.1,
            x,
            y,
            radius
        );
        
        if (color === 'black') {
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(1, '#000');
        } else {
            gradient.addColorStop(0, '#FFF');
            gradient.addColorStop(1, '#CCC');
        }
        
        // 繪製棋子
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加邊框
        ctx.strokeStyle = color === 'black' ? '#000' : '#888';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // 獲取點擊位置對應的棋盤坐標
    function getBoardPosition(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // 計算最接近的交叉點
        const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
        const row = Math.round((y - BOARD_PADDING) / CELL_SIZE);
        
        // 檢查是否在有效範圍內
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            // 檢查點擊位置是否足夠接近交叉點
            const centerX = BOARD_PADDING + col * CELL_SIZE;
            const centerY = BOARD_PADDING + row * CELL_SIZE;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (distance <= CELL_SIZE * 0.4) {
                return { row, col };
            }
        }
        
        return null;
    }
    
    // 檢查是否獲勝
    function checkWin(row, col, color) {
        const directions = [
            [[0, 1], [0, -1]],   // 橫向
            [[1, 0], [-1, 0]],   // 豎向
            [[1, 1], [-1, -1]],  // 主對角線
            [[1, -1], [-1, 1]]   // 副對角線
        ];
        
        for (const direction of directions) {
            let count = 1;
            
            // 檢查兩個方向
            for (const [dx, dy] of direction) {
                let r = row + dx;
                let c = col + dy;
                
                while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
                       gameBoard[r][c] === color) {
                    count++;
                    r += dx;
                    c += dy;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    // 檢查是否平局
    function checkDraw() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (!gameBoard[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // 處理玩家下棋
    function handlePlayerMove(row, col) {
        if (gameOver || isAIThinking || gameBoard[row][col]) {
            return false;
        }
        
        gameBoard[row][col] = currentPlayer;
        drawBoard();
        
        if (checkWin(row, col, currentPlayer)) {
            gameOver = true;
            messageElement.textContent = `${currentPlayer === 'black' ? '黑方' : '白方'}獲勝！`;
            return true;
        }
        
        if (checkDraw()) {
            gameOver = true;
            messageElement.textContent = '平局！';
            return true;
        }
        
        // 切換玩家
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        currentPlayerElement.textContent = currentPlayer === 'black' ? '黑方' : '白方';
        
        return true;
    }
    
    // AI決策
    function makeAIMove() {
        if (gameOver) return;
        
        isAIThinking = true;
        
        // 延遲0.5秒響應
        setTimeout(() => {
            const move = getBestMove();
            if (move) {
                handlePlayerMove(move.row, move.col);
            }
            isAIThinking = false;
        }, 500);
    }
    
    // 獲取最佳移動位置
    function getBestMove() {
        const moves = [];
        
        // 評估每個空位
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (!gameBoard[row][col]) {
                    const score = evaluatePosition(row, col);
                    moves.push({ row, col, score });
                }
            }
        }
        
        // 按分數排序
        moves.sort((a, b) => b.score - a.score);
        
        // 返回最高分的位置，如果有相同分數則隨機選擇
        if (moves.length > 0) {
            const maxScore = moves[0].score;
            const bestMoves = moves.filter(move => move.score === maxScore);
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        
        return null;
    }
    
    // 評估位置分數
    function evaluatePosition(row, col) {
        let score = 0;
        
        // 檢查是否能贏
        gameBoard[row][col] = 'white';
        if (checkWin(row, col, 'white')) {
            gameBoard[row][col] = null;
            return 10000;
        }
        gameBoard[row][col] = null;
        
        // 檢查是否需要阻止對手贏
        gameBoard[row][col] = 'black';
        if (checkWin(row, col, 'black')) {
            gameBoard[row][col] = null;
            return 9000;
        }
        gameBoard[row][col] = null;
        
        // 評估攻防分數
        score += evaluateLine(row, col, 'white') * 2; // 進攻權重更高
        score += evaluateLine(row, col, 'black'); // 防守
        
        // 中心區域加分
        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
        score += (14 - centerDistance) * 2;
        
        // 靠近已有棋子加分
        let neighborCount = 0;
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard[r][c]) {
                    neighborCount++;
                }
            }
        }
        score += neighborCount * 5;
        
        return score;
    }
    
    // 評估線上的分數
    function evaluateLine(row, col, color) {
        let score = 0;
        const directions = [
            [0, 1],   // 橫向
            [1, 0],   // 豎向
            [1, 1],   // 主對角線
            [1, -1]   // 副對角線
        ];
        
        gameBoard[row][col] = color;
        
        for (const [dx, dy] of directions) {
            let count = 1;
            let openEnds = 0;
            
            // 正向檢查
            let r = row + dx;
            let c = col + dy;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard[r][c] === color) {
                count++;
                r += dx;
                c += dy;
            }
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !gameBoard[r][c]) {
                openEnds++;
            }
            
            // 反向檢查
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameBoard[r][c] === color) {
                count++;
                r -= dx;
                c -= dy;
            }
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !gameBoard[r][c]) {
                openEnds++;
            }
            
            // 根據連子數和開口數計算分數
            if (count >= 5) {
                score += 10000;
            } else if (count === 4) {
                if (openEnds === 2) score += 5000;
                else if (openEnds === 1) score += 1000;
            } else if (count === 3) {
                if (openEnds === 2) score += 500;
                else if (openEnds === 1) score += 100;
            } else if (count === 2) {
                if (openEnds === 2) score += 50;
                else if (openEnds === 1) score += 10;
            }
        }
        
        gameBoard[row][col] = null;
        return score;
    }
    
    // 處理畫布點擊事件
    canvas.addEventListener('click', function(event) {
        if (gameOver || isAIThinking || currentPlayer !== 'black') {
            return;
        }
        
        const position = getBoardPosition(event.clientX, event.clientY);
        if (position) {
            if (handlePlayerMove(position.row, position.col)) {
                // 如果遊戲沒有結束，AI下棋
                if (!gameOver) {
                    makeAIMove();
                }
            }
        }
    });
    
    // 重新開始按鈕事件
    restartBtn.addEventListener('click', initGame);
    
    // 初始化遊戲
    initGame();
});