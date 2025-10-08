// 網格設定
const GRID_SIZE = 25;
const CELL_SIZE = 20;
const ANIMATION_DELAY = 5;

// 格子類型
const CellType = {
    EMPTY: 'empty',
    START: 'start',
    END: 'end',
    OBSTACLE: 'obstacle',
    OPEN: 'open',
    CLOSED: 'closed',
    PATH: 'path'
};

// 網格狀態
let grid = [];
let startPos = { x: 2, y: 2 };
let endPos = { x: 22, y: 22 };
let isSettingStart = false;
let isSettingEnd = false;
let isDragging = false;
let isAnimating = false;
let algorithm = 'astar';

// DOM元素
let gridElement;
let errorMessageElement;
let statsElements = {};

// 初始化函數
function init() {
    gridElement = document.getElementById('grid');
    errorMessageElement = document.getElementById('errorMessage');

    // 初始化統計元素
    statsElements = {
        visitedCount: document.getElementById('visitedCount'),
        pathLength: document.getElementById('pathLength'),
        executionTime: document.getElementById('executionTime'),
        currentStatus: document.getElementById('currentStatus')
    };

    // 綁定事件監聽器
    bindEvents();

    // 初始化網格
    createGrid();

    // 更新統計資訊
    updateStats();
}

// 創建網格
function createGrid() {
    gridElement.innerHTML = '';

    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;

            // 設定初始狀態
            if (x === startPos.x && y === startPos.y) {
                cell.classList.add('start');
                grid[y][x] = CellType.START;
            } else if (x === endPos.x && y === endPos.y) {
                cell.classList.add('end');
                grid[y][x] = CellType.END;
            } else {
                grid[y][x] = CellType.EMPTY;
            }

            gridElement.appendChild(cell);
        }
    }
}

// 綁定事件監聽器
function bindEvents() {
    // 網格點擊事件
    gridElement.addEventListener('mousedown', handleGridMouseDown);
    gridElement.addEventListener('mousemove', handleGridMouseMove);
    gridElement.addEventListener('mouseup', handleGridMouseUp);
    gridElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // 控制按鈕事件
    document.getElementById('setStartBtn').addEventListener('click', () => {
        setMode('start');
    });

    document.getElementById('setEndBtn').addEventListener('click', () => {
        setMode('end');
    });

    document.getElementById('clearPathBtn').addEventListener('click', clearPath);
    document.getElementById('resetBtn').addEventListener('click', resetGrid);
    document.getElementById('startBtn').addEventListener('click', startPathfinding);

    // 演算法選擇事件
    document.getElementById('algorithmSelect').addEventListener('change', (e) => {
        algorithm = e.target.value;
    });
}

// 處理網格鼠標按下事件
function handleGridMouseDown(e) {
    if (isAnimating) return;

    const cell = e.target;
    if (!cell.classList.contains('cell')) return;

    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);

    if (isSettingStart) {
        setStartPosition(x, y);
        return;
    }

    if (isSettingEnd) {
        setEndPosition(x, y);
        return;
    }

    isDragging = true;
    toggleObstacle(x, y);
}

// 處理網格鼠標移動事件
function handleGridMouseMove(e) {
    if (isAnimating || !isDragging) return;

    const cell = e.target;
    if (!cell.classList.contains('cell')) return;

    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);

    toggleObstacle(x, y);
}

// 處理網格鼠標釋放事件
function handleGridMouseUp() {
    isDragging = false;
}

// 設定模式
function setMode(mode) {
    if (isAnimating) return;

    isSettingStart = mode === 'start';
    isSettingEnd = mode === 'end';

    // 更新按鈕狀態
    document.getElementById('setStartBtn').classList.toggle('active', isSettingStart);
    document.getElementById('setEndBtn').classList.toggle('active', isSettingEnd);
}

// 設定起點位置
function setStartPosition(x, y) {
    // 檢查是否為終點位置
    if (x === endPos.x && y === endPos.y) {
        showError('無法將起點設定在終點位置');
        return;
    }

    // 清除舊的起點
    clearCellType(CellType.START);

    // 設定新的起點
    startPos = { x, y };
    grid[y][x] = CellType.START;

    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
        cell.className = 'cell start';
    }

    isSettingStart = false;
    document.getElementById('setStartBtn').classList.remove('active');
}

// 設定終點位置
function setEndPosition(x, y) {
    // 檢查是否為起點位置
    if (x === startPos.x && y === startPos.y) {
        showError('無法將終點設定在起點位置');
        return;
    }

    // 清除舊的終點
    clearCellType(CellType.END);

    // 設定新的終點
    endPos = { x, y };
    grid[y][x] = CellType.END;

    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
        cell.className = 'cell end';
    }

    isSettingEnd = false;
    document.getElementById('setEndBtn').classList.remove('active');
}

// 切換障礙物狀態
function toggleObstacle(x, y) {
    // 檢查是否為起點或終點
    if ((x === startPos.x && y === startPos.y) || (x === endPos.x && y === endPos.y)) {
        return;
    }

    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return;

    if (grid[y][x] === CellType.OBSTACLE) {
        grid[y][x] = CellType.EMPTY;
        cell.className = 'cell';
    } else {
        grid[y][x] = CellType.OBSTACLE;
        cell.className = 'cell obstacle';
    }
}

// 清除特定類型的格子
function clearCellType(type) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === type) {
                grid[y][x] = CellType.EMPTY;
                const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (cell) {
                    cell.className = 'cell';
                }
            }
        }
    }
}

// 清除路徑
function clearPath() {
    if (isAnimating) return;

    // 清除搜尋過程和路徑，但保留障礙物、起點和終點
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === CellType.OPEN || grid[y][x] === CellType.CLOSED || grid[y][x] === CellType.PATH) {
                grid[y][x] = CellType.EMPTY;
                const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (cell && !cell.classList.contains('start') && !cell.classList.contains('end') && !cell.classList.contains('obstacle')) {
                    cell.className = 'cell';
                }
            }
        }
    }

    updateStats();
    hideError();
}

// 重置網格
function resetGrid() {
    if (isAnimating) return;

    startPos = { x: 2, y: 2 };
    endPos = { x: 22, y: 22 };
    isSettingStart = false;
    isSettingEnd = false;

    // 重置按鈕狀態
    document.getElementById('setStartBtn').classList.remove('active');
    document.getElementById('setEndBtn').classList.remove('active');

    createGrid();
    updateStats();
    hideError();
}

// 開始尋路
async function startPathfinding() {
    if (isAnimating) return;

    isAnimating = true;
    const startTime = Date.now();

    // 禁用所有按鈕
    setButtonsDisabled(true);

    // 更新狀態
    updateStats('搜尋中');

    try {
        let path;
        if (algorithm === 'astar') {
            path = await astar();
        } else {
            path = await dijkstra();
        }

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        if (path) {
            // 顯示路徑
            await showPath(path);
            updateStats('找到路徑', path.length - 1, executionTime);
        } else {
            updateStats('無路徑', 0, executionTime);
            showError('無法找到路徑');
        }
    } catch (error) {
        console.error('尋路過程中發生錯誤:', error);
        showError('尋路過程中發生錯誤');
    }

    // 重新啟用按鈕
    setButtonsDisabled(false);
    isAnimating = false;
}

// 設定按鈕禁用狀態
function setButtonsDisabled(disabled) {
    const buttons = ['setStartBtn', 'setEndBtn', 'clearPathBtn', 'resetBtn', 'startBtn'];
    buttons.forEach(id => {
        document.getElementById(id).disabled = disabled;
    });
}

// A* 演算法實現
async function astar() {
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    // 初始化起點
    const startKey = `${startPos.x},${startPos.y}`;
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startPos, endPos));
    openSet.enqueue(startPos, fScore.get(startKey));

    let visitedCount = 0;

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        const currentKey = `${current.x},${current.y}`;

        if (current.x === endPos.x && current.y === endPos.y) {
            const path = reconstructPath(cameFrom, current);
            statsElements.visitedCount.textContent = `${visitedCount} 個`;
            return path;
        }

        closedSet.add(currentKey);
        visitedCount++;

        // 更新統計資訊
        if (visitedCount % 10 === 0) {
            statsElements.visitedCount.textContent = `${visitedCount} 個`;
            await sleep(ANIMATION_DELAY);
        }

        // 檢查四個方向
        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const neighbor of neighbors) {
            if (isValidPosition(neighbor.x, neighbor.y) && grid[neighbor.y][neighbor.x] !== CellType.OBSTACLE) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborKey)) continue;

                const tentativeGScore = gScore.get(currentKey) + 1;

                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, endPos));

                    if (!openSet.contains(neighbor)) {
                        openSet.enqueue(neighbor, fScore.get(neighborKey));

                        // 視覺化開放列表
                        if (grid[neighbor.y][neighbor.x] !== CellType.START && grid[neighbor.y][neighbor.x] !== CellType.END) {
                            setCellType(neighbor.x, neighbor.y, CellType.OPEN);
                        }
                    }
                }
            }
        }

        // 視覺化封閉列表
        if (grid[current.y][current.x] !== CellType.START && grid[current.y][current.x] !== CellType.END) {
            setCellType(current.x, current.y, CellType.CLOSED);
        }

        await sleep(ANIMATION_DELAY);
    }

    statsElements.visitedCount.textContent = `${visitedCount} 個`;
    return null;
}

// Dijkstra 演算法實現
async function dijkstra() {
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const costSoFar = new Map();

    // 初始化起點
    const startKey = `${startPos.x},${startPos.y}`;
    costSoFar.set(startKey, 0);
    openSet.enqueue(startPos, 0);

    let visitedCount = 0;

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        const currentKey = `${current.x},${current.y}`;

        if (current.x === endPos.x && current.y === endPos.y) {
            const path = reconstructPath(cameFrom, current);
            statsElements.visitedCount.textContent = `${visitedCount} 個`;
            return path;
        }

        closedSet.add(currentKey);
        visitedCount++;

        // 更新統計資訊
        if (visitedCount % 10 === 0) {
            statsElements.visitedCount.textContent = `${visitedCount} 個`;
            await sleep(ANIMATION_DELAY);
        }

        // 檢查四個方向
        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const neighbor of neighbors) {
            if (isValidPosition(neighbor.x, neighbor.y) && grid[neighbor.y][neighbor.x] !== CellType.OBSTACLE) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const newCost = costSoFar.get(currentKey) + 1;

                if (!costSoFar.has(neighborKey) || newCost < costSoFar.get(neighborKey)) {
                    costSoFar.set(neighborKey, newCost);
                    cameFrom.set(neighborKey, current);

                    if (!closedSet.has(neighborKey)) {
                        openSet.enqueue(neighbor, newCost);

                        // 視覺化開放列表
                        if (grid[neighbor.y][neighbor.x] !== CellType.START && grid[neighbor.y][neighbor.x] !== CellType.END) {
                            setCellType(neighbor.x, neighbor.y, CellType.OPEN);
                        }
                    }
                }
            }
        }

        // 視覺化封閉列表
        if (grid[current.y][current.x] !== CellType.START && grid[current.y][current.x] !== CellType.END) {
            setCellType(current.x, current.y, CellType.CLOSED);
        }

        await sleep(ANIMATION_DELAY);
    }

    statsElements.visitedCount.textContent = `${visitedCount} 個`;
    return null;
}

// 顯示路徑
async function showPath(path) {
    for (let i = 1; i < path.length - 1; i++) {
        const point = path[i];
        setCellType(point.x, point.y, CellType.PATH);
        await sleep(ANIMATION_DELAY * 2);
    }
}

// 設定格子類型
function setCellType(x, y, type) {
    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
        cell.className = `cell ${type}`;
    }
    grid[y][x] = type;
}

// 檢查位置是否有效
function isValidPosition(x, y) {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

// 曼哈頓距離啟發式函數
function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// 重建路徑
function reconstructPath(cameFrom, current) {
    const path = [current];
    let currentKey = `${current.x},${current.y}`;

    while (cameFrom.has(currentKey)) {
        current = cameFrom.get(currentKey);
        path.unshift(current);
        currentKey = `${current.x},${current.y}`;
    }

    return path;
}

// 優先佇列實現
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item, priority) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.items.shift().item;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    contains(item) {
        return this.items.some(queueItem =>
            queueItem.item.x === item.x && queueItem.item.y === item.y
        );
    }
}

// 更新統計資訊
function updateStats(status = '就緒', pathLength = 0, executionTime = 0) {
    if (status) {
        statsElements.currentStatus.textContent = status;
    }

    if (pathLength >= 0) {
        statsElements.pathLength.textContent = `${pathLength} 步`;
    }

    if (executionTime > 0) {
        statsElements.executionTime.textContent = `${executionTime} ms`;
    }
}

// 顯示錯誤訊息
function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove('hidden');
}

// 隱藏錯誤訊息
function hideError() {
    errorMessageElement.classList.add('hidden');
}

// 睡眠函數
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 當頁面載入完成時初始化
document.addEventListener('DOMContentLoaded', init);
