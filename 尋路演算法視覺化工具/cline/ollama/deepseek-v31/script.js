// 全域變數
let grid = [];
let startCell = { row: 2, col: 2 };
let endCell = { row: 12, col: 12 };
let isSettingStart = false;
let isSettingEnd = false;
let isDragging = false;
let isAnimating = false;
let visitedCount = 0;
let pathLength = 0;
let executionTime = 0;

// 格子狀態類型
const CellType = {
    EMPTY: 'empty',
    START: 'start',
    END: 'end',
    WALL: 'wall',
    OPEN: 'open',
    CLOSED: 'closed',
    PATH: 'path'
};

// 初始化網格
function initializeGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    grid = [];

    for (let row = 0; row < 15; row++) {
        grid[row] = [];
        for (let col = 0; col < 15; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            // 設定預設起點和終點
            if (row === startCell.row && col === startCell.col) {
                cell.classList.add(CellType.START);
            } else if (row === endCell.row && col === endCell.col) {
                cell.classList.add(CellType.END);
            }

            // 事件監聽
            cell.addEventListener('mousedown', handleCellMouseDown);
            cell.addEventListener('mouseenter', handleCellMouseEnter);
            cell.addEventListener('mouseup', handleCellMouseUp);

            gridElement.appendChild(cell);
            grid[row][col] = CellType.EMPTY;
        }
    }

    // 更新網格數據
    grid[startCell.row][startCell.col] = CellType.START;
    grid[endCell.row][endCell.col] = CellType.END;

    updateStats();
    clearMessage();
}

// 處理格子鼠標按下事件
function handleCellMouseDown(event) {
    if (isAnimating) return;

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // 防止在起點或終點上創建障礙物
    if (isStartOrEndCell(row, col)) return;

    if (isSettingStart) {
        setStartCell(row, col);
        isSettingStart = false;
        updateButtonStates();
        return;
    }

    if (isSettingEnd) {
        setEndCell(row, col);
        isSettingEnd = false;
        updateButtonStates();
        return;
    }

    // 開始拖曳
    isDragging = true;
    toggleWall(row, col);
}

// 處理格子鼠標進入事件（拖曳時）
function handleCellMouseEnter(event) {
    if (!isDragging || isAnimating) return;

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // 防止在起點或終點上創建障礙物
    if (isStartOrEndCell(row, col)) return;

    toggleWall(row, col);
}

// 處理格子鼠標放開事件
function handleCellMouseUp() {
    isDragging = false;
}

// 切換障礙物狀態
function toggleWall(row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

    if (grid[row][col] === CellType.WALL) {
        cell.classList.remove(CellType.WALL);
        grid[row][col] = CellType.EMPTY;
    } else {
        cell.classList.add(CellType.WALL);
        grid[row][col] = CellType.WALL;
    }
}

// 檢查是否為起點或終點
function isStartOrEndCell(row, col) {
    return (row === startCell.row && col === startCell.col) ||
        (row === endCell.row && col === endCell.col);
}

// 設定起點
function setStartCell(row, col) {
    // 移除舊起點
    const oldStartCell = document.querySelector(`.cell.start`);
    if (oldStartCell) {
        oldStartCell.classList.remove(CellType.START);
        grid[startCell.row][startCell.col] = CellType.EMPTY;
    }

    // 設定新起點
    startCell = { row, col };
    const newStartCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    newStartCell.classList.add(CellType.START);
    grid[row][col] = CellType.START;
}

// 設定終點
function setEndCell(row, col) {
    // 移除舊終點
    const oldEndCell = document.querySelector(`.cell.end`);
    if (oldEndCell) {
        oldEndCell.classList.remove(CellType.END);
        grid[endCell.row][endCell.col] = CellType.EMPTY;
    }

    // 設定新終點
    endCell = { row, col };
    const newEndCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    newEndCell.classList.add(CellType.END);
    grid[row][col] = CellType.END;
}

// 清除路徑
function clearPath() {
    if (isAnimating) return;

    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (grid[row][col] === CellType.OPEN ||
            grid[row][col] === CellType.CLOSED ||
            grid[row][col] === CellType.PATH) {

            cell.classList.remove(CellType.OPEN, CellType.CLOSED, CellType.PATH);

            if (!isStartOrEndCell(row, col) && grid[row][col] !== CellType.WALL) {
                grid[row][col] = CellType.EMPTY;
            }
        }
    });

    visitedCount = 0;
    pathLength = 0;
    executionTime = 0;
    updateStats();
    clearMessage();
}

// 完全重置
function resetGrid() {
    if (isAnimating) return;

    startCell = { row: 2, col: 2 };
    endCell = { row: 12, col: 12 };
    initializeGrid();
    clearMessage();
}

// 更新按鈕狀態
function updateButtonStates() {
    const setStartBtn = document.getElementById('setStartBtn');
    const setEndBtn = document.getElementById('setEndBtn');
    const startBtn = document.getElementById('startBtn');

    setStartBtn.textContent = isSettingStart ? '取消設定' : '設定起點';
    setEndBtn.textContent = isSettingEnd ? '取消設定' : '設定終點';
    startBtn.disabled = isAnimating;
}

// 開始尋路
async function startPathfinding() {
    if (isAnimating) return;

    // 清除舊路徑
    clearPath();

    const algorithm = document.getElementById('algorithmSelect').value;
    setStatus('搜尋中');
    disableButtons(true);
    isAnimating = true;

    const startTime = performance.now();

    try {
        if (algorithm === 'astar') {
            await runAStar();
        } else {
            await runDijkstra();
        }

        executionTime = Math.round(performance.now() - startTime);
        updateStats();

        if (pathLength > 0) {
            setStatus('找到路徑');
            showMessage('成功找到路徑！', 'success');
        } else {
            setStatus('無路徑');
            showMessage('無法找到路徑', 'error');
        }
    } catch (error) {
        setStatus('錯誤');
        showMessage('尋路過程中發生錯誤', 'error');
    } finally {
        disableButtons(false);
        isAnimating = false;
    }
}

// A* 演算法
async function runAStar() {
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${startCell.row},${startCell.col}`;
    const endKey = `${endCell.row},${endCell.col}`;

    // 初始化起點
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startCell, endCell));
    openSet.enqueue(startCell, fScore.get(startKey));

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        const currentKey = `${current.row},${current.col}`;

        // 如果找到終點
        if (currentKey === endKey) {
            await reconstructPath(cameFrom, current);
            return;
        }

        closedSet.add(currentKey);
        grid[current.row][current.col] = CellType.CLOSED;
        updateCellVisual(current.row, current.col, CellType.CLOSED);
        visitedCount++;

        await delay(10);

        // 檢查鄰居
        const neighbors = getNeighbors(current.row, current.col);

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;

            if (closedSet.has(neighborKey)) continue;

            const tentativeGScore = gScore.get(currentKey) + 1;

            if (!openSet.contains(neighbor) || tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, endCell));

                if (!openSet.contains(neighbor)) {
                    openSet.enqueue(neighbor, fScore.get(neighborKey));
                    grid[neighbor.row][neighbor.col] = CellType.OPEN;
                    updateCellVisual(neighbor.row, neighbor.col, CellType.OPEN);
                }
            }
        }

        updateStats();
    }

    // 沒有找到路徑
    pathLength = 0;
}

// Dijkstra 演算法
async function runDijkstra() {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();

    // 初始化所有節點
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (grid[row][col] !== CellType.WALL) {
                const key = `${row},${col}`;
                distances.set(key, Infinity);
                unvisited.add(key);
            }
        }
    }

    const startKey = `${startCell.row},${startCell.col}`;
    const endKey = `${endCell.row},${endCell.col}`;
    distances.set(startKey, 0);

    while (unvisited.size > 0) {
        // 找到距離最小的未訪問節點
        let currentKey = null;
        let minDistance = Infinity;

        for (const key of unvisited) {
            if (distances.get(key) < minDistance) {
                minDistance = distances.get(key);
                currentKey = key;
            }
        }

        if (currentKey === null || minDistance === Infinity) break;

        const [currentRow, currentCol] = currentKey.split(',').map(Number);

        // 如果找到終點
        if (currentKey === endKey) {
            await reconstructPathDijkstra(previous, { row: currentRow, col: currentCol });
            return;
        }

        unvisited.delete(currentKey);
        grid[currentRow][currentCol] = CellType.CLOSED;
        updateCellVisual(currentRow, currentCol, CellType.CLOSED);
        visitedCount++;

        await delay(10);

        // 檢查鄰居
        const neighbors = getNeighbors(currentRow, currentCol);

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;

            if (!unvisited.has(neighborKey)) continue;

            const alt = distances.get(currentKey) + 1;

            if (alt < distances.get(neighborKey)) {
                distances.set(neighborKey, alt);
                previous.set(neighborKey, { row: currentRow, col: currentCol });

                grid[neighbor.row][neighbor.col] = CellType.OPEN;
                updateCellVisual(neighbor.row, neighbor.col, CellType.OPEN);
            }
        }

        updateStats();
    }

    // 沒有找到路徑
    pathLength = 0;
}

// 獲取鄰居節點
function getNeighbors(row, col) {
    const neighbors = [];
    const directions = [
        { row: -1, col: 0 },  // 上
        { row: 1, col: 0 },   // 下
        { row: 0, col: -1 },  // 左
        { row: 0, col: 1 }    // 右
    ];

    for (const dir of directions) {
        const newRow = row + dir.row;
        const newCol = col + dir.col;

        if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 &&
            grid[newRow][newCol] !== CellType.WALL) {
            neighbors.push({ row: newRow, col: newCol });
        }
    }

    return neighbors;
}

// 曼哈頓距離啟發式函數
function heuristic(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// 重建路徑 (A*)
async function reconstructPath(cameFrom, current) {
    const path = [];
    let currentKey = `${current.row},${current.col}`;

    while (cameFrom.has(currentKey)) {
        path.push(current);
        current = cameFrom.get(currentKey);
        currentKey = `${current.row},${current.col}`;
    }

    path.push(startCell);
    path.reverse();
    pathLength = path.length - 1;

    // 顯示路徑動畫
    for (const point of path) {
        if (!isStartOrEndCell(point.row, point.col)) {
            grid[point.row][point.col] = CellType.PATH;
            updateCellVisual(point.row, point.col, CellType.PATH);
            await delay(10);
        }
    }
}

// 重建路徑 (Dijkstra)
async function reconstructPathDijkstra(previous, current) {
    const path = [];
    let currentKey = `${current.row},${current.col}`;

    while (previous.has(currentKey)) {
        path.push(current);
        current = previous.get(currentKey);
        currentKey = `${current.row},${current.col}`;
    }

    path.push(startCell);
    path.reverse();
    pathLength = path.length - 1;

    // 顯示路徑動畫
    for (const point of path) {
        if (!isStartOrEndCell(point.row, point.col)) {
            grid[point.row][point.col] = CellType.PATH;
            updateCellVisual(point.row, point.col, CellType.PATH);
            await delay(10);
        }
    }
}

// 優先級佇列實現
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }

    contains(element) {
        return this.elements.some(item =>
            item.element.row === element.row && item.element.col === element.col);
    }
}

// 更新格子視覺效果
function updateCellVisual(row, col, type) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.classList.remove(CellType.OPEN, CellType.CLOSED, CellType.PATH);
        if (type !== CellType.EMPTY && !isStartOrEndCell(row, col)) {
            cell.classList.add(type);
        }
    }
}

// 延遲函數
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 禁用/啟用按鈕
function disableButtons(disabled) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.id !== 'startBtn' || disabled) {
            button.disabled = disabled;
        }
    });
}

// 更新統計資訊
function updateStats() {
    document.getElementById('visitedCount').textContent = visitedCount;
    document.getElementById('pathLength').textContent = pathLength;
    document.getElementById('executionTime').textContent = executionTime;
}

// 設定狀態
function setStatus(status) {
    document.getElementById('status').textContent = status;
}

// 顯示訊息
function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
}

// 清除訊息
function clearMessage() {
    const messageElement = document.getElementById('message');
    messageElement.textContent = '';
    messageElement.className = 'message';
}

// 事件監聽器設置
function setupEventListeners() {
    document.getElementById('setStartBtn').addEventListener('click', () => {
        if (isAnimating) return;
        isSettingStart = !isSettingStart;
        isSettingEnd = false;
        updateButtonStates();
    });

    document.getElementById('setEndBtn').addEventListener('click', () => {
        if (isAnimating) return;
        isSettingEnd = !isSettingEnd;
        isSettingStart = false;
        updateButtonStates();
    });

    document.getElementById('clearPathBtn').addEventListener('click', clearPath);
    document.getElementById('resetBtn').addEventListener('click', resetGrid);
    document.getElementById('startBtn').addEventListener('click', startPathfinding);

    // 防止拖曳時選擇文字
    document.addEventListener('selectstart', (e) => {
        if (isDragging) e.preventDefault();
    });

    // 防止拖曳時出現預設圖標
    document.addEventListener('dragstart', (e) => {
        if (isDragging) e.preventDefault();
    });

    // 全域鼠標放開事件（確保拖曳結束）
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// 初始化應用
function init() {
    initializeGrid();
    setupEventListeners();
    updateButtonStates();
}

// 當頁面加載完成時初始化
document.addEventListener('DOMContentLoaded', init);
