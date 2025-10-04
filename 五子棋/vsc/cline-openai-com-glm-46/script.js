// 遊戲常量
const BOARD_SIZE = 15; // 15×15棋盤
const CELL_SIZE = 40; // 每個格子的大小
const BOARD_MARGIN = 20; // 棋盤邊距
const STONE_RADIUS = CELL_SIZE * 0.4; // 棋子半徑（格子寬度的80%的一半）
const STAR_POINTS = [ // 9個星位的位置
    { x: 3, y: 3 }, { x: 11, y: 3 }, { x: 7, y: 7 },
    { x: 3, y: 11 }, { x: 11, y: 11 }, { x: 3, y: 7 },
    { x: 11, y: 7 }, { x: 7, y: 3 }, { x: 7, y: 11 }
];

// 遊戲狀態
let gameBoard = []; // 棋盤狀態：0=空，1=黑子，2=白子
let currentPlayer = 1; // 當前玩家：1=黑子(玩家)，2=白子(AI)
let gameOver = false; // 遊戲是否結束
let canvas, ctx; // Canvas和上下文

// 初始化遊戲
function initGame() {
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');

    // 初始化棋盤
    gameBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1; // 黑子先行
    gameOver = false;

    // 更新UI
    updateCurrentPlayerDisplay();
    document.getElementById('game-message').textContent = '';

    // 繪製棋盤
    drawBoard();

    // 添加事件監聽器
    canvas.addEventListener('click', handleCanvasClick);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
}

// 繪製棋盤
function drawBoard() {
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 設置線條樣式
    ctx.strokeStyle = '#8B4513'; // 深褐色線條
    ctx.lineWidth = 2; // 線寬2px

    // 繪製網格線
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 橫線
        ctx.beginPath();
        ctx.moveTo(BOARD_MARGIN, BOARD_MARGIN + i * CELL_SIZE);
        ctx.lineTo(BOARD_MARGIN + (BOARD_SIZE - 1) * CELL_SIZE, BOARD_MARGIN + i * CELL_SIZE);
        ctx.stroke();

        // 豎線
        ctx.beginPath();
        ctx.moveTo(BOARD_MARGIN + i * CELL_SIZE, BOARD_MARGIN);
        ctx.lineTo(BOARD_MARGIN + i * CELL_SIZE, BOARD_MARGIN + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }

    // 繪製星位
    ctx.fillStyle = '#8B4513';
    STAR_POINTS.forEach(point => {
        ctx.beginPath();
        ctx.arc(
            BOARD_MARGIN + point.x * CELL_SIZE,
            BOARD_MARGIN + point.y * CELL_SIZE,
            4, // 星位半徑
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // 重新繪製所有棋子
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameBoard[row][col] !== 0) {
                drawStone(col, row, gameBoard[row][col]);
            }
        }
    }
}

// 繪製棋子
function drawStone(x, y, player) {
    const centerX = BOARD_MARGIN + x * CELL_SIZE;
    const centerY = BOARD_MARGIN + y * CELL_SIZE;

    ctx.beginPath();
    ctx.arc(centerX, centerY, STONE_RADIUS, 0, Math.PI * 2);

    if (player === 1) {
        // 黑子漸層
        const gradient = ctx.createRadialGradient(
            centerX - STONE_RADIUS * 0.3,
            centerY - STONE_RADIUS * 0.3,
            0,
            centerX,
            centerY,
            STONE_RADIUS
        );
        gradient.addColorStop(0, '#555555'); // 較亮的灰色
        gradient.addColorStop(1, '#000000'); // 黑色
        ctx.fillStyle = gradient;
    } else {
        // 白子漸層
        const gradient = ctx.createRadialGradient(
            centerX - STONE_RADIUS * 0.3,
            centerY - STONE_RADIUS * 0.3,
            0,
            centerX,
            centerY,
            STONE_RADIUS
        );
        gradient.addColorStop(0, '#FFFFFF'); // 白色
        gradient.addColorStop(1, '#CCCCCC'); // 較暗的灰色
        ctx.fillStyle = gradient;
    }

    ctx.fill();

    // 添加邊框
    ctx.strokeStyle = player === 1 ? '#000000' : '#888888';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 處理畫布點擊事件
function handleCanvasClick(event) {
    if (gameOver || currentPlayer !== 1) return; // 遊戲結束或不是玩家回合

    // 獲取點擊位置
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 轉換為棋盤坐標
    const boardX = Math.round((x - BOARD_MARGIN) / CELL_SIZE);
    const boardY = Math.round((y - BOARD_MARGIN) / CELL_SIZE);

    // 檢查是否在有效範圍內
    if (boardX < 0 || boardX >= BOARD_SIZE || boardY < 0 || boardY >= BOARD_SIZE) {
        return;
    }

    // 檢查位置是否為空
    if (gameBoard[boardY][boardX] !== 0) {
        return;
    }

    // 放置棋子
    placeStone(boardX, boardY);
}

// 放置棋子
function placeStone(x, y) {
    gameBoard[y][x] = currentPlayer;
    drawStone(x, y, currentPlayer);

    // 檢查是否獲勝
    if (checkWin(x, y, currentPlayer)) {
        gameOver = true;
        const winner = currentPlayer === 1 ? '黑方' : '白方';
        document.getElementById('game-message').textContent = `${winner}獲勝！`;
        return;
    }

    // 檢查是否平局
    if (isBoardFull()) {
        gameOver = true;
        document.getElementById('game-message').textContent = '平局！';
        return;
    }

    // 切換玩家
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateCurrentPlayerDisplay();

    // 如果是AI回合，延遲0.5秒後下棋
    if (currentPlayer === 2 && !gameOver) {
        setTimeout(aiMove, 500);
    }
}

// 檢查是否獲勝
function checkWin(x, y, player) {
    // 檢查四個方向：橫、豎、左斜、右斜
    const directions = [
        { dx: 1, dy: 0 },  // 橫向
        { dx: 0, dy: 1 },  // 豎向
        { dx: 1, dy: 1 },  // 右斜
        { dx: 1, dy: -1 }  // 左斜
    ];

    for (const dir of directions) {
        let count = 1; // 當前位置已有一個棋子

        // 正方向檢查
        for (let i = 1; i < 5; i++) {
            const nx = x + dir.dx * i;
            const ny = y + dir.dy * i;

            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
            if (gameBoard[ny][nx] !== player) break;

            count++;
        }

        // 反方向檢查
        for (let i = 1; i < 5; i++) {
            const nx = x - dir.dx * i;
            const ny = y - dir.dy * i;

            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
            if (gameBoard[ny][nx] !== player) break;

            count++;
        }

        // 如果連成五子或以上，返回true
        if (count >= 5) {
            return true;
        }
    }

    return false;
}

// 檢查棋盤是否已滿
function isBoardFull() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameBoard[row][col] === 0) {
                return false;
            }
        }
    }
    return true;
}

// AI移動
function aiMove() {
    if (gameOver) return;

    const move = getBestMove();
    if (move) {
        placeStone(move.x, move.y);
    }
}

// 獲取最佳移動位置
function getBestMove() {
    // 1. 檢查是否能直接獲勝
    const winMove = findWinningMove(2);
    if (winMove) return winMove;

    // 2. 檢查是否需要阻擋玩家獲勝
    const blockMove = findWinningMove(1);
    if (blockMove) return blockMove;

    // 3. 尋找最佳策略位置
    const strategicMoves = findStrategicMoves();
    if (strategicMoves.length > 0) {
        // 根據權重隨機選擇
        return weightedRandomChoice(strategicMoves);
    }

    // 4. 如果沒有找到好的位置，隨機選擇一個空位
    return getRandomEmptyPosition();
}

// 尋找獲勝移動
function findWinningMove(player) {
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (gameBoard[y][x] === 0) {
                // 模擬放置棋子
                gameBoard[y][x] = player;

                // 檢查是否獲勝
                if (checkWin(x, y, player)) {
                    // 恢復棋盤
                    gameBoard[y][x] = 0;
                    return { x, y };
                }

                // 恢復棋盤
                gameBoard[y][x] = 0;
            }
        }
    }
    return null;
}

// 尋找策略性移動
function findStrategicMoves() {
    const moves = [];

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (gameBoard[y][x] === 0) {
                // 計算每個位置的權重
                let weight = 0;

                // 中心區域優先
                const centerDistance = Math.abs(x - 7) + Math.abs(y - 7);
                weight += (14 - centerDistance) * 2;

                // 檢查周圍是否有棋子
                const hasNeighbor = hasAdjacentStone(x, y);
                if (hasNeighbor) {
                    weight += 20;
                }

                // 檢查是否能形成三子或四子連線
                const aiScore = evaluatePosition(x, y, 2);
                const playerScore = evaluatePosition(x, y, 1);

                // AI自己的潛在得分
                weight += aiScore * 3;

                // 阻擋玩家的潛在得分
                weight += playerScore * 2;

                if (weight > 0) {
                    moves.push({ x, y, weight });
                }
            }
        }
    }

    // 按權重排序
    moves.sort((a, b) => b.weight - a.weight);

    // 只返回前10個最佳選擇
    return moves.slice(0, 10);
}

// 檢查位置周圍是否有棋子
function hasAdjacentStone(x, y) {
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                if (gameBoard[ny][nx] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 評估位置的潛在得分
function evaluatePosition(x, y, player) {
    let score = 0;
    const directions = [
        { dx: 1, dy: 0 },  // 橫向
        { dx: 0, dy: 1 },  // 豎向
        { dx: 1, dy: 1 },  // 右斜
        { dx: 1, dy: -1 }  // 左斜
    ];

    // 模擬放置棋子
    gameBoard[y][x] = player;

    for (const dir of directions) {
        let count = 1; // 當前位置已有一個棋子
        let openEnds = 0; // 開放端數量

        // 正方向檢查
        for (let i = 1; i < 5; i++) {
            const nx = x + dir.dx * i;
            const ny = y + dir.dy * i;

            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
                break;
            }

            if (gameBoard[ny][nx] === player) {
                count++;
            } else if (gameBoard[ny][nx] === 0) {
                openEnds++;
                break;
            } else {
                break;
            }
        }

        // 反方向檢查
        for (let i = 1; i < 5; i++) {
            const nx = x - dir.dx * i;
            const ny = y - dir.dy * i;

            if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
                break;
            }

            if (gameBoard[ny][nx] === player) {
                count++;
            } else if (gameBoard[ny][nx] === 0) {
                openEnds++;
                break;
            } else {
                break;
            }
        }

        // 根據連子數量和開放端數量計算得分
        if (count >= 5) {
            score += 10000; // 五子連線
        } else if (count === 4) {
            if (openEnds === 2) score += 1000; // 活四
            else if (openEnds === 1) score += 500; // 眠四
        } else if (count === 3) {
            if (openEnds === 2) score += 200; // 活三
            else if (openEnds === 1) score += 50; // 眠三
        } else if (count === 2) {
            if (openEnds === 2) score += 20; // 活二
            else if (openEnds === 1) score += 5; // 眠二
        }
    }

    // 恢復棋盤
    gameBoard[y][x] = 0;

    return score;
}

// 根據權重隨機選擇
function weightedRandomChoice(moves) {
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    // 計算總權重
    const totalWeight = moves.reduce((sum, move) => sum + move.weight, 0);

    // 生成隨機數
    let random = Math.random() * totalWeight;

    // 根據權重選擇
    for (const move of moves) {
        random -= move.weight;
        if (random <= 0) {
            return move;
        }
    }

    // 如果由於浮點精度問題沒有選中，返回第一個
    return moves[0];
}

// 獲取隨機空位
function getRandomEmptyPosition() {
    const emptyPositions = [];

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (gameBoard[y][x] === 0) {
                emptyPositions.push({ x, y });
            }
        }
    }

    if (emptyPositions.length === 0) return null;

    // 優先選擇中心區域的空位
    const centerPositions = emptyPositions.filter(pos => {
        const centerDistance = Math.abs(pos.x - 7) + Math.abs(pos.y - 7);
        return centerDistance <= 5;
    });

    const positionsToChoose = centerPositions.length > 0 ? centerPositions : emptyPositions;
    const randomIndex = Math.floor(Math.random() * positionsToChoose.length);

    return positionsToChoose[randomIndex];
}

// 更新當前玩家顯示
function updateCurrentPlayerDisplay() {
    const playerText = currentPlayer === 1 ? '黑方' : '白方';
    document.getElementById('current-player').textContent = playerText;
}

// 重新開始遊戲
function restartGame() {
    initGame();
}

// 頁面加載完成後初始化遊戲
window.addEventListener('load', initGame);
