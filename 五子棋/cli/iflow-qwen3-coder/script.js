const canvas = document.getElementById('chessboard');
const ctx = canvas.getContext('2d');
const currentPlayerSpan = document.getElementById('current-player');
const restartBtn = document.getElementById('restart-btn');

// 棋盘规格
const BOARD_SIZE = 15;
const CELL_SIZE = 30;
const STAR_POINTS = [
    {x: 3, y: 3}, {x: 3, y: 11}, 
    {x: 11, y: 3}, {x: 11, y: 11}, 
    {x: 7, y: 7}
];

// 游戏状态
let board = [];
let currentPlayer = 'black'; // black为玩家，white为AI
let gameover = false;

// 初始化棋盘
function initBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = null;
        }
    }
    currentPlayer = 'black';
    gameover = false;
    currentPlayerSpan.textContent = '黑方';
    drawBoard();
}

// 绘制棋盘
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制线条
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 垂直线
        ctx.beginPath();
        ctx.moveTo(15 + i * CELL_SIZE, 15);
        ctx.lineTo(15 + i * CELL_SIZE, 15 + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
        
        // 水平线
        ctx.beginPath();
        ctx.moveTo(15, 15 + i * CELL_SIZE);
        ctx.lineTo(15 + (BOARD_SIZE - 1) * CELL_SIZE, 15 + i * CELL_SIZE);
        ctx.stroke();
    }
    
    // 绘制星位
    ctx.fillStyle = '#8B4513';
    STAR_POINTS.forEach(point => {
        ctx.beginPath();
        ctx.arc(15 + point.x * CELL_SIZE, 15 + point.y * CELL_SIZE, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 绘制棋子
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j]) {
                drawChessPiece(i, j, board[i][j]);
            }
        }
    }
}

// 绘制棋子
function drawChessPiece(x, y, color) {
    const centerX = 15 + x * CELL_SIZE;
    const centerY = 15 + y * CELL_SIZE;
    const radius = CELL_SIZE / 2 - 2;
    
    // 创建渐变
    const gradient = ctx.createRadialGradient(
        centerX - radius/3, centerY - radius/3, radius/8,
        centerX, centerY, radius
    );
    
    if (color === 'black') {
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(1, '#666');
    } else {
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#ccc');
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.stroke();
}

// 检查是否获胜
function checkWin(x, y, color) {
    const directions = [
        [1, 0], [0, 1], [1, 1], [1, -1]
    ];
    
    for (let [dx, dy] of directions) {
        let count = 1;
        
        // 正方向
        for (let i = 1; i < 5; i++) {
            const nx = x + dx * i;
            const ny = y + dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === color) {
                count++;
            } else {
                break;
            }
        }
        
        // 反方向
        for (let i = 1; i < 5; i++) {
            const nx = x - dx * i;
            const ny = y - dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === color) {
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

// 玩家下棋
function playerMove(x, y) {
    if (gameover || currentPlayer !== 'black' || board[x][y]) return;
    
    board[x][y] = 'black';
    drawBoard();
    
    if (checkWin(x, y, 'black')) {
        setTimeout(() => {
            alert('黑方获胜！');
            gameover = true;
        }, 100);
        return;
    }
    
    currentPlayer = 'white';
    currentPlayerSpan.textContent = '白方';
    
    // AI下棋
    setTimeout(aiMove, 500);
}

// AI下棋
function aiMove() {
    if (gameover) return;
    
    // 简单的AI策略：随机选择一个空位
    let emptyPoints = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!board[i][j]) {
                emptyPoints.push({x: i, y: j});
            }
        }
    }
    
    if (emptyPoints.length === 0) return;
    
    // 简单策略：选择第一个空位
    const move = emptyPoints[0];
    board[move.x][move.y] = 'white';
    drawBoard();
    
    if (checkWin(move.x, move.y, 'white')) {
        setTimeout(() => {
            alert('白方获胜！');
            gameover = true;
        }, 100);
        return;
    }
    
    currentPlayer = 'black';
    currentPlayerSpan.textContent = '黑方';
}

// 处理点击事件
canvas.addEventListener('click', (e) => {
    if (gameover) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - 15) / CELL_SIZE);
    const y = Math.round((e.clientY - rect.top - 15) / CELL_SIZE);
    
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        playerMove(x, y);
    }
});

// 重新开始游戏
restartBtn.addEventListener('click', initBoard);

// 初始化游戏
initBoard();