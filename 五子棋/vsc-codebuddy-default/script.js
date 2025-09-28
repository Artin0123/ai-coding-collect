document.addEventListener('DOMContentLoaded', () => {
    // 游戏配置
    const config = {
        boardSize: 15, // 15x15的棋盘
        cellSize: 40,  // 每个格子的大小
        padding: 20,   // 棋盘边距
    };

    // 游戏状态
    const gameState = {
        board: Array(config.boardSize).fill().map(() => Array(config.boardSize).fill(0)),
        currentPlayer: 1, // 1代表黑子(玩家)，2代表白子(AI)
        gameOver: false,
        lastMove: null
    };

    // 获取DOM元素
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const statusElement = document.getElementById('status');
    const restartButton = document.getElementById('restart');

    // 调整画布大小
    const boardWidth = config.boardSize * config.cellSize + 2 * config.padding;
    const boardHeight = config.boardSize * config.cellSize + 2 * config.padding;
    canvas.width = boardWidth;
    canvas.height = boardHeight;

    // 初始化游戏
    initGame();

    // 初始化游戏函数
    function initGame() {
        // 重置游戏状态
        gameState.board = Array(config.boardSize).fill().map(() => Array(config.boardSize).fill(0));
        gameState.currentPlayer = 1;
        gameState.gameOver = false;
        gameState.lastMove = null;

        // 更新状态显示
        updateStatus();

        // 绘制棋盘
        drawBoard();

        // 添加事件监听器
        canvas.addEventListener('click', handleClick);
        restartButton.addEventListener('click', initGame);
    }

    // 绘制棋盘
    function drawBoard() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制棋盘背景
        ctx.fillStyle = '#e9c088';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制网格线
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        // 绘制横线
        for (let i = 0; i < config.boardSize; i++) {
            const y = config.padding + i * config.cellSize;
            ctx.beginPath();
            ctx.moveTo(config.padding, y);
            ctx.lineTo(boardWidth - config.padding, y);
            ctx.stroke();
        }

        // 绘制竖线
        for (let i = 0; i < config.boardSize; i++) {
            const x = config.padding + i * config.cellSize;
            ctx.beginPath();
            ctx.moveTo(x, config.padding);
            ctx.lineTo(x, boardHeight - config.padding);
            ctx.stroke();
        }

        // 绘制天元和星位
        const starPoints = [3, 7, 11];
        ctx.fillStyle = '#000';
        for (let i = 0; i < starPoints.length; i++) {
            for (let j = 0; j < starPoints.length; j++) {
                const x = config.padding + starPoints[i] * config.cellSize;
                const y = config.padding + starPoints[j] * config.cellSize;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 绘制棋子
        for (let i = 0; i < config.boardSize; i++) {
            for (let j = 0; j < config.boardSize; j++) {
                if (gameState.board[i][j] !== 0) {
                    drawPiece(i, j, gameState.board[i][j]);
                }
            }
        }

        // 标记最后一步
        if (gameState.lastMove) {
            const [row, col] = gameState.lastMove;
            const x = config.padding + col * config.cellSize;
            const y = config.padding + row * config.cellSize;
            
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, config.cellSize / 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // 绘制棋子
    function drawPiece(row, col, player) {
        const x = config.padding + col * config.cellSize;
        const y = config.padding + row * config.cellSize;
        const radius = config.cellSize / 2 - 2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // 创建渐变效果
        const gradient = ctx.createRadialGradient(
            x - radius / 3, y - radius / 3, radius / 10,
            x, y, radius
        );

        if (player === 1) { // 黑子
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else { // 白子
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
        }

        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加边缘
        ctx.strokeStyle = player === 1 ? '#000' : '#888';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 处理点击事件
    function handleClick(event) {
        if (gameState.gameOver || gameState.currentPlayer !== 1) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 计算点击的格子位置
        const col = Math.round((x - config.padding) / config.cellSize);
        const row = Math.round((y - config.padding) / config.cellSize);

        // 检查是否在有效范围内
        if (row >= 0 && row < config.boardSize && col >= 0 && col < config.boardSize) {
            // 检查该位置是否已有棋子
            if (gameState.board[row][col] === 0) {
                // 放置玩家的棋子
                placePiece(row, col);
            }
        }
    }

    // 放置棋子
    function placePiece(row, col) {
        // 更新棋盘状态
        gameState.board[row][col] = gameState.currentPlayer;
        gameState.lastMove = [row, col];

        // 重绘棋盘
        drawBoard();

        // 检查是否获胜
        if (checkWin(row, col)) {
            gameState.gameOver = true;
            updateStatus();
            return;
        }

        // 切换玩家
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updateStatus();

        // 如果是AI回合，让AI下棋
        if (gameState.currentPlayer === 2 && !gameState.gameOver) {
            setTimeout(() => {
                makeAIMove();
            }, 500);
        }
    }

    // AI下棋
    function makeAIMove() {
        const move = findBestMove();
        if (move) {
            placePiece(move.row, move.col);
        }
    }

    // AI寻找最佳落子位置
    function findBestMove() {
        // 评分矩阵，用于存储每个位置的评分
        const scoreMatrix = Array(config.boardSize).fill().map(() => Array(config.boardSize).fill(0));
        
        // 计算每个空位置的评分
        for (let i = 0; i < config.boardSize; i++) {
            for (let j = 0; j < config.boardSize; j++) {
                if (gameState.board[i][j] === 0) {
                    // 计算AI(白子)在此位置的评分
                    scoreMatrix[i][j] = evaluatePosition(i, j, 2);
                    
                    // 计算玩家(黑子)在此位置的评分，并加权考虑防守
                    const playerScore = evaluatePosition(i, j, 1);
                    if (playerScore > scoreMatrix[i][j]) {
                        scoreMatrix[i][j] = playerScore;
                    }
                }
            }
        }
        
        // 找出评分最高的位置
        let maxScore = -1;
        let bestMoves = [];
        
        for (let i = 0; i < config.boardSize; i++) {
            for (let j = 0; j < config.boardSize; j++) {
                if (gameState.board[i][j] === 0) {
                    if (scoreMatrix[i][j] > maxScore) {
                        maxScore = scoreMatrix[i][j];
                        bestMoves = [{row: i, col: j}];
                    } else if (scoreMatrix[i][j] === maxScore) {
                        bestMoves.push({row: i, col: j});
                    }
                }
            }
        }
        
        // 如果有多个最佳位置，随机选择一个
        if (bestMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * bestMoves.length);
            return bestMoves[randomIndex];
        }
        
        return null;
    }

    // 评估位置的分数
    function evaluatePosition(row, col, player) {
        // 方向：水平、垂直、左下到右上、左上到右下
        const directions = [
            [[0, -1], [0, 1]],  // 水平
            [[-1, 0], [1, 0]],  // 垂直
            [[-1, -1], [1, 1]], // 左上到右下
            [[-1, 1], [1, -1]]  // 左下到右上
        ];
        
        let maxScore = 0;
        
        // 检查每个方向
        for (const direction of directions) {
            let count = 1; // 当前位置算一个
            let blocked = 0; // 被对方棋子挡住的端点数
            
            // 检查两个方向
            for (const [dx, dy] of direction) {
                let x = row + dx;
                let y = col + dy;
                let tempCount = 0;
                
                // 计算连续的己方棋子
                while (x >= 0 && x < config.boardSize && y >= 0 && y < config.boardSize) {
                    if (gameState.board[x][y] === player) {
                        tempCount++;
                    } else if (gameState.board[x][y] === 0) {
                        break;
                    } else {
                        blocked++;
                        break;
                    }
                    x += dx;
                    y += dy;
                }
                
                count += tempCount;
            }
            
            // 根据连续棋子数和被挡住的端点数评分
            const score = getScoreForCount(count, blocked);
            if (score > maxScore) {
                maxScore = score;
            }
        }
        
        return maxScore;
    }

    // 根据连续棋子数和被挡住的端点数计算分数
    function getScoreForCount(count, blocked) {
        // 如果两端都被挡住，价值大幅降低
        if (blocked === 2 && count < 5) return 0;
        
        switch (count) {
            case 5: return 100000; // 五连，必胜
            case 4: return blocked === 0 ? 10000 : 1000; // 活四/冲四
            case 3: return blocked === 0 ? 1000 : 100;   // 活三/冲三
            case 2: return blocked === 0 ? 100 : 10;     // 活二/冲二
            case 1: return blocked === 0 ? 10 : 1;       // 单子
            default: return 0;
        }
    }

    // 检查是否获胜
    function checkWin(row, col) {
        const player = gameState.board[row][col];
        const directions = [
            [0, 1],  // 水平
            [1, 0],  // 垂直
            [1, 1],  // 左上到右下
            [1, -1]  // 左下到右上
        ];

        for (const [dx, dy] of directions) {
            let count = 1; // 当前位置算一个

            // 正向检查
            let x = row + dx;
            let y = col + dy;
            while (x >= 0 && x < config.boardSize && y >= 0 && y < config.boardSize && gameState.board[x][y] === player) {
                count++;
                x += dx;
                y += dy;
            }

            // 反向检查
            x = row - dx;
            y = col - dy;
            while (x >= 0 && x < config.boardSize && y >= 0 && y < config.boardSize && gameState.board[x][y] === player) {
                count++;
                x -= dx;
                y -= dy;
            }

            // 如果有5个或更多连续棋子，则获胜
            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    // 更新游戏状态显示
    function updateStatus() {
        if (gameState.gameOver) {
            const winner = gameState.currentPlayer === 1 ? '你赢了！' : 'AI赢了！';
            statusElement.textContent = `游戏结束: ${winner}`;
        } else {
            const currentPlayerText = gameState.currentPlayer === 1 ? '你的回合(黑子)' : 'AI思考中(白子)...';
            statusElement.textContent = `游戏状态: ${currentPlayerText}`;
        }
    }
});