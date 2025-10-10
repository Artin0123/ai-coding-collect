const GRID_SIZE = 15;
const CELL_SIZE = 30; // px
const ANIMATION_DELAY = 10; // ms

const gridContainer = document.getElementById('grid-container');
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const resetGridBtn = document.getElementById('resetGridBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const startSearchBtn = document.getElementById('startSearchBtn');

const visitedNodesSpan = document.getElementById('visitedNodes');
const pathLengthSpan = document.getElementById('pathLength');
const executionTimeSpan = document.getElementById('executionTime');
const currentStateSpan = document.getElementById('currentState');

let grid = [];
let startNode = { row: 2, col: 2 };
let endNode = { row: 12, col: 12 };
let isSettingStart = false;
let isSettingEnd = false;
let isDrawingObstacles = false;
let isAnimating = false;

// 網格初始化
function initializeGrid() {
    gridContainer.innerHTML = '';
    grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        const row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseup', handleMouseUp);
            cell.addEventListener('mouseenter', handleMouseEnter);
            gridContainer.appendChild(cell);
            row.push({
                row: r,
                col: c,
                isObstacle: false,
                isStart: false,
                isEnd: false,
                distance: Infinity,
                heuristic: 0,
                fCost: Infinity,
                parent: null,
                element: cell
            });
        }
        grid.push(row);
    }
    setStartEndNodes(startNode.row, startNode.col, endNode.row, endNode.col);
    updateState('就緒');
    updateStats(0, 0, 0);
}

// 設定起點和終點
function setStartEndNodes(startR, startC, endR, endC) {
    // 清除舊的起點和終點
    if (startNode.element) {
        startNode.element.classList.remove('start');
        grid[startNode.row][startNode.col].isStart = false;
    }
    if (endNode.element) {
        endNode.element.classList.remove('end');
        grid[endNode.row][endNode.col].isEnd = false;
    }

    // 設定新的起點
    startNode = grid[startR][startC];
    startNode.isStart = true;
    startNode.element.classList.add('start');

    // 設定新的終點
    endNode = grid[endR][endC];
    endNode.isEnd = true;
    endNode.element.classList.add('end');
}

// 處理滑鼠事件
function handleMouseDown(e) {
    if (isAnimating) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const cell = grid[row][col];

    if (isSettingStart) {
        if (cell.isObstacle) return;
        setStartEndNodes(row, col, endNode.row, endNode.col);
        isSettingStart = false;
        setStartBtn.classList.remove('active');
    } else if (isSettingEnd) {
        if (cell.isObstacle) return;
        setStartEndNodes(startNode.row, startNode.col, row, col);
        isSettingEnd = false;
        setEndBtn.classList.remove('active');
    } else {
        if (cell.isStart || cell.isEnd) return;
        isDrawingObstacles = true;
        toggleObstacle(cell);
    }
}

function handleMouseUp() {
    isDrawingObstacles = false;
}

function handleMouseEnter(e) {
    if (isAnimating) return;
    if (isDrawingObstacles) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const cell = grid[row][col];
        if (cell.isStart || cell.isEnd) return;
        toggleObstacle(cell);
    }
}

function toggleObstacle(cell) {
    cell.isObstacle = !cell.isObstacle;
    cell.element.classList.toggle('obstacle', cell.isObstacle);
}

// 控制面板按鈕事件
setStartBtn.addEventListener('click', () => {
    if (isAnimating) return;
    isSettingStart = !isSettingStart;
    isSettingEnd = false; // 確保只有一個設定模式啟用
    setStartBtn.classList.toggle('active', isSettingStart);
    setEndBtn.classList.remove('active');
    updateState(isSettingStart ? '設定起點中' : '就緒');
});

setEndBtn.addEventListener('click', () => {
    if (isAnimating) return;
    isSettingEnd = !isSettingEnd;
    isSettingStart = false; // 確保只有一個設定模式啟用
    setEndBtn.classList.toggle('active', isSettingEnd);
    setStartBtn.classList.remove('active');
    updateState(isSettingEnd ? '設定終點中' : '就緒');
});

clearPathBtn.addEventListener('click', () => {
    if (isAnimating) return;
    clearPathAndSearch();
    updateState('就緒');
    updateStats(0, 0, 0);
});

resetGridBtn.addEventListener('click', () => {
    if (isAnimating) return;
    initializeGrid();
    updateState('就緒');
    updateStats(0, 0, 0);
});

startSearchBtn.addEventListener('click', () => {
    if (isAnimating) return;
    clearPathAndSearch();
    const algorithm = algorithmSelect.value;
    startPathfinding(algorithm);
});

// 清除路徑和搜尋結果
function clearPathAndSearch() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = grid[r][c];
            cell.element.classList.remove('open', 'closed', 'path');
            cell.distance = Infinity;
            cell.heuristic = 0;
            cell.fCost = Infinity;
            cell.parent = null;
        }
    }
    // 確保起點和終點的樣式不被清除
    startNode.element.classList.add('start');
    endNode.element.classList.add('end');
}

// 更新統計資訊
function updateStats(visited, length, time) {
    visitedNodesSpan.textContent = visited;
    pathLengthSpan.textContent = length;
    executionTimeSpan.textContent = time;
}

// 更新當前狀態
function updateState(state) {
    currentStateSpan.textContent = state;
}

// 禁用/啟用控制按鈕
function toggleControls(disable) {
    setStartBtn.disabled = disable;
    setEndBtn.disabled = disable;
    clearPathBtn.disabled = disable;
    resetGridBtn.disabled = disable;
    algorithmSelect.disabled = disable;
    startSearchBtn.disabled = disable;
}

// 尋路演算法 (A* 和 Dijkstra)
async function startPathfinding(algorithm) {
    isAnimating = true;
    toggleControls(true);
    updateState('搜尋中');
    updateStats(0, 0, 0);

    const startTime = performance.now();
    let pathFound = false;
    let visitedCount = 0;
    let path = [];

    // 重置所有節點的狀態
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = grid[r][c];
            cell.distance = Infinity;
            cell.heuristic = 0;
            cell.fCost = Infinity;
            cell.parent = null;
            if (!cell.isStart && !cell.isEnd && !cell.isObstacle) {
                cell.element.classList.remove('open', 'closed', 'path');
            }
        }
    }

    if (algorithm === 'astar') {
        ({ pathFound, visitedCount, path } = await aStar());
    } else if (algorithm === 'dijkstra') {
        ({ pathFound, visitedCount, path } = await dijkstra());
    }

    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);

    if (pathFound) {
        await animatePath(path);
        updateState('找到路徑');
        updateStats(visitedCount, path.length, executionTime);
    } else {
        updateState('無法找到路徑');
        updateStats(visitedCount, 0, executionTime);
        alert('無法找到路徑');
    }

    isAnimating = false;
    toggleControls(false);
}

// A* 演算法實現
async function aStar() {
    const openList = [];
    const closedList = new Set();

    startNode.distance = 0;
    startNode.heuristic = manhattanDistance(startNode, endNode);
    startNode.fCost = startNode.distance + startNode.heuristic;
    openList.push(startNode);

    let visitedCount = 0;

    while (openList.length > 0) {
        // 找到 openList 中 fCost 最小的節點
        openList.sort((a, b) => a.fCost - b.fCost);
        const currentNode = openList.shift();

        if (currentNode === endNode) {
            return { pathFound: true, visitedCount, path: reconstructPath(currentNode) };
        }

        if (closedList.has(currentNode)) {
            continue;
        }

        closedList.add(currentNode);
        visitedCount++;

        if (currentNode !== startNode && currentNode !== endNode) {
            currentNode.element.classList.add('closed');
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
        }

        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (neighbor.isObstacle || closedList.has(neighbor)) {
                continue;
            }

            const newDistance = currentNode.distance + 1; // 假設每一步距離為 1

            if (newDistance < neighbor.distance) {
                neighbor.distance = newDistance;
                neighbor.heuristic = manhattanDistance(neighbor, endNode);
                neighbor.fCost = neighbor.distance + neighbor.heuristic;
                neighbor.parent = currentNode;

                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                    if (neighbor !== startNode && neighbor !== endNode) {
                        neighbor.element.classList.add('open');
                        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
                    }
                }
            }
        }
    }
    return { pathFound: false, visitedCount, path: [] };
}

// Dijkstra 演算法實現
async function dijkstra() {
    const openList = [];
    const closedList = new Set();

    startNode.distance = 0;
    openList.push(startNode);

    let visitedCount = 0;

    while (openList.length > 0) {
        // 找到 openList 中 distance 最小的節點
        openList.sort((a, b) => a.distance - b.distance);
        const currentNode = openList.shift();

        if (currentNode === endNode) {
            return { pathFound: true, visitedCount, path: reconstructPath(currentNode) };
        }

        if (closedList.has(currentNode)) {
            continue;
        }

        closedList.add(currentNode);
        visitedCount++;

        if (currentNode !== startNode && currentNode !== endNode) {
            currentNode.element.classList.add('closed');
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
        }

        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (neighbor.isObstacle || closedList.has(neighbor)) {
                continue;
            }

            const newDistance = currentNode.distance + 1; // 假設每一步距離為 1

            if (newDistance < neighbor.distance) {
                neighbor.distance = newDistance;
                neighbor.parent = currentNode;

                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                    if (neighbor !== startNode && neighbor !== endNode) {
                        neighbor.element.classList.add('open');
                        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
                    }
                }
            }
        }
    }
    return { pathFound: false, visitedCount, path: [] };
}

// 獲取鄰居節點
function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;

    const directions = [
        { dr: -1, dc: 0 }, // 上
        { dr: 1, dc: 0 },  // 下
        { dr: 0, dc: -1 }, // 左
        { dr: 0, dc: 1 }   // 右
    ];

    for (const dir of directions) {
        const newRow = row + dir.dr;
        const newCol = col + dir.dc;

        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            neighbors.push(grid[newRow][newCol]);
        }
    }
    return neighbors;
}

// 曼哈頓距離啟發式函數
function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// 重建路徑
function reconstructPath(node) {
    const path = [];
    let currentNode = node;
    while (currentNode.parent) {
        path.unshift(currentNode);
        currentNode = currentNode.parent;
    }
    return path;
}

// 動畫顯示路徑
async function animatePath(path) {
    for (let i = 0; i < path.length; i++) {
        const node = path[i];
        if (node !== startNode && node !== endNode) {
            node.element.classList.remove('open', 'closed');
            node.element.classList.add('path');
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
        }
    }
}

// 初始化
initializeGrid();
