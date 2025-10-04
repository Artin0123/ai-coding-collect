// 全局變量
const GRID_SIZE = 25;
const CELL_SIZE = 20;
const ANIMATION_SPEED = 10; // 毫秒

// 格子狀態
const CELL_STATE = {
    EMPTY: 'empty',
    START: 'start',
    END: 'end',
    WALL: 'wall',
    OPEN: 'open',
    CLOSED: 'closed',
    PATH: 'path'
};

// 應用程序狀態
let grid = [];
let startPos = { row: 2, col: 2 };
let endPos = { row: 22, col: 22 };
let isRunning = false;
let isSettingStart = false;
let isSettingEnd = false;
let isMouseDown = false;
let visitedNodesCount = 0;
let pathLength = 0;
let executionTime = 0;

// DOM元素
const gridElement = document.getElementById('grid');
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const resetBtn = document.getElementById('resetBtn');
const startBtn = document.getElementById('startBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const visitedNodesElement = document.getElementById('visitedNodes');
const pathLengthElement = document.getElementById('pathLength');
const executionTimeElement = document.getElementById('executionTime');
const currentStatusElement = document.getElementById('currentStatus');

// 初始化網格
function initGrid() {
    grid = [];
    gridElement.innerHTML = '';

    for (let row = 0; row < GRID_SIZE; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            // 設置初始狀態
            if (row === startPos.row && col === startPos.col) {
                cell.classList.add('start');
                grid[row][col] = CELL_STATE.START;
            } else if (row === endPos.row && col === endPos.col) {
                cell.classList.add('end');
                grid[row][col] = CELL_STATE.END;
            } else {
                grid[row][col] = CELL_STATE.EMPTY;
            }

            // 添加事件監聽器
            cell.addEventListener('mousedown', handleCellMouseDown);
            cell.addEventListener('mouseenter', handleCellMouseEnter);
            cell.addEventListener('click', handleCellClick);

            gridElement.appendChild(cell);
        }
    }

    // 添加全局鼠標事件
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
}

// 處理格子鼠標按下事件
function handleCellMouseDown(e) {
    if (isRunning) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (isSettingStart) {
        setStartPoint(row, col);
        return;
    }

    if (isSettingEnd) {
        setEndPoint(row, col);
        return;
    }

    // 如果不是起點或終點，開始拖曳創建障礙物
    if (grid[row][col] !== CELL_STATE.START && grid[row][col] !== CELL_STATE.END) {
        isMouseDown = true;
        toggleWall(row, col);
    }
}

// 處理格子鼠標進入事件
function handleCellMouseEnter(e) {
    if (!isMouseDown || isRunning) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    // 如果不是起點或終點，設置為障礙物
    if (grid[row][col] !== CELL_STATE.START && grid[row][col] !== CELL_STATE.END) {
        setWall(row, col);
    }
}

// 處理格子點擊事件
function handleCellClick(e) {
    if (isRunning) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (isSettingStart) {
        setStartPoint(row, col);
    } else if (isSettingEnd) {
        setEndPoint(row, col);
    }
}

// 處理全局鼠標釋放事件
function handleMouseUp() {
    isMouseDown = false;
}

// 切換牆壁狀態
function toggleWall(row, col) {
    const cell = getCellElement(row, col);

    if (grid[row][col] === CELL_STATE.WALL) {
        grid[row][col] = CELL_STATE.EMPTY;
        cell.classList.remove('wall');
    } else if (grid[row][col] === CELL_STATE.EMPTY) {
        grid[row][col] = CELL_STATE.WALL;
        cell.classList.add('wall');
    }
}

// 設置牆壁
function setWall(row, col) {
    if (grid[row][col] !== CELL_STATE.WALL) {
        grid[row][col] = CELL_STATE.WALL;
        const cell = getCellElement(row, col);
        cell.classList.add('wall');
    }
}

// 設置起點
function setStartPoint(row, col) {
    // 清除舊起點
    const oldCell = getCellElement(startPos.row, startPos.col);
    oldCell.classList.remove('start');
    grid[startPos.row][startPos.col] = CELL_STATE.EMPTY;

    // 設置新起點
    startPos = { row, col };
    const newCell = getCellElement(row, col);
    newCell.classList.remove('wall', 'end', 'open', 'closed', 'path');
    newCell.classList.add('start');
    grid[row][col] = CELL_STATE.START;

    // 重置設置模式
    isSettingStart = false;
    setStartBtn.textContent = '設定起點';
    setStartBtn.style.backgroundColor = '#3498db';
}

// 設置終點
function setEndPoint(row, col) {
    // 清除舊終點
    const oldCell = getCellElement(endPos.row, endPos.col);
    oldCell.classList.remove('end');
    grid[endPos.row][endPos.col] = CELL_STATE.EMPTY;

    // 設置新終點
    endPos = { row, col };
    const newCell = getCellElement(row, col);
    newCell.classList.remove('wall', 'start', 'open', 'closed', 'path');
    newCell.classList.add('end');
    grid[row][col] = CELL_STATE.END;

    // 重置設置模式
    isSettingEnd = false;
    setEndBtn.textContent = '設定終點';
    setEndBtn.style.backgroundColor = '#3498db';
}

// 獲取格子元素
function getCellElement(row, col) {
    return gridElement.children[row * GRID_SIZE + col];
}

// 清除路徑
function clearPath() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === CELL_STATE.OPEN ||
                grid[row][col] === CELL_STATE.CLOSED ||
                grid[row][col] === CELL_STATE.PATH) {

                grid[row][col] = CELL_STATE.EMPTY;
                const cell = getCellElement(row, col);
                cell.classList.remove('open', 'closed', 'path');
            }
        }
    }

    updateStats(0, 0, 0, '就緒');
}

// 完全重置
function resetGrid() {
    startPos = { row: 2, col: 2 };
    endPos = { row: 22, col: 22 };
    isSettingStart = false;
    isSettingEnd = false;
    setStartBtn.textContent = '設定起點';
    setStartBtn.style.backgroundColor = '#3498db';
    setEndBtn.textContent = '設定終點';
    setEndBtn.style.backgroundColor = '#3498db';
    initGrid();
    updateStats(0, 0, 0, '就緒');
}

// 更新統計信息
function updateStats(visited, path, time, status) {
    visitedNodesCount = visited;
    pathLength = path;
    executionTime = time;

    visitedNodesElement.textContent = visited;
    pathLengthElement.textContent = path;
    executionTimeElement.textContent = time;
    currentStatusElement.textContent = status;
}

// 禁用/啟用按鈕
function setButtonsDisabled(disabled) {
    setStartBtn.disabled = disabled;
    setEndBtn.disabled = disabled;
    clearPathBtn.disabled = disabled;
    resetBtn.disabled = disabled;
    startBtn.disabled = disabled;
    algorithmSelect.disabled = disabled;
}

// A*演算法
async function astar() {
    const startTime = performance.now();
    const openSet = [];
    const closedSet = [];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    // 初始化起點
    const startKey = `${startPos.row},${startPos.col}`;
    openSet.push(startKey);
    gScore[startKey] = 0;
    fScore[startKey] = heuristic(startPos, endPos);

    while (openSet.length > 0) {
        // 找到fScore最小的節點
        let currentKey = openSet[0];
        let currentIndex = 0;

        for (let i = 1; i < openSet.length; i++) {
            if (fScore[openSet[i]] < fScore[currentKey]) {
                currentKey = openSet[i];
                currentIndex = i;
            }
        }

        // 檢查是否到達終點
        const [currentRow, currentCol] = currentKey.split(',').map(Number);
        if (currentRow === endPos.row && currentCol === endPos.col) {
            const endTime = performance.now();
            const path = reconstructPath(cameFrom, currentKey);
            await animatePath(path);
            updateStats(closedSet.length, path.length - 1, Math.round(endTime - startTime), '找到路徑');
            return true;
        }

        // 從開放集合中移除當前節點
        openSet.splice(currentIndex, 1);
        closedSet.push(currentKey);

        // 標記為封閉節點
        if (grid[currentRow][currentCol] !== CELL_STATE.START && grid[currentRow][currentCol] !== CELL_STATE.END) {
            grid[currentRow][currentCol] = CELL_STATE.CLOSED;
            getCellElement(currentRow, currentCol).classList.add('closed');
            await sleep(ANIMATION_SPEED);
        }

        // 檢查所有鄰居
        const neighbors = getNeighbors(currentRow, currentCol);

        for (const neighbor of neighbors) {
            const [neighborRow, neighborCol] = neighbor;
            const neighborKey = `${neighborRow},${neighborCol}`;

            // 跳過已經訪問過的節點和牆壁
            if (closedSet.includes(neighborKey) || grid[neighborRow][neighborCol] === CELL_STATE.WALL) {
                continue;
            }

            // 計算 tentative_gScore
            const tentativeGScore = gScore[currentKey] + 1;

            // 如果鄰居不在開放集合中，或者找到更短路徑
            if (!openSet.includes(neighborKey) || tentativeGScore < gScore[neighborKey]) {
                cameFrom[neighborKey] = currentKey;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = gScore[neighborKey] + heuristic({ row: neighborRow, col: neighborCol }, endPos);

                // 如果鄰居不在開放集合中，添加它
                if (!openSet.includes(neighborKey)) {
                    openSet.push(neighborKey);

                    // 標記為開放節點
                    if (grid[neighborRow][neighborCol] !== CELL_STATE.START && grid[neighborRow][neighborCol] !== CELL_STATE.END) {
                        grid[neighborRow][neighborCol] = CELL_STATE.OPEN;
                        getCellElement(neighborRow, neighborCol).classList.add('open');
                        await sleep(ANIMATION_SPEED);
                    }
                }
            }
        }
    }

    // 沒有找到路徑
    const endTime = performance.now();
    updateStats(closedSet.length, 0, Math.round(endTime - startTime), '無路徑');
    return false;
}

// Dijkstra演算法
async function dijkstra() {
    const startTime = performance.now();
    const unvisited = [];
    const distances = {};
    const previous = {};

    // 初始化所有節點
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const key = `${row},${col}`;
            distances[key] = Infinity;
            previous[key] = null;
            unvisited.push(key);
        }
    }

    // 設置起點距離為0
    const startKey = `${startPos.row},${startPos.col}`;
    distances[startKey] = 0;

    while (unvisited.length > 0) {
        // 找到距離最小的未訪問節點
        let currentKey = null;
        let minDistance = Infinity;

        for (const key of unvisited) {
            if (distances[key] < minDistance) {
                minDistance = distances[key];
                currentKey = key;
            }
        }

        // 如果沒有可達的節點，結束
        if (currentKey === null || minDistance === Infinity) {
            break;
        }

        // 從未訪問集合中移除當前節點
        const index = unvisited.indexOf(currentKey);
        unvisited.splice(index, 1);

        const [currentRow, currentCol] = currentKey.split(',').map(Number);

        // 檢查是否到達終點
        if (currentRow === endPos.row && currentCol === endPos.col) {
            const endTime = performance.now();
            const path = reconstructPath(previous, currentKey);
            await animatePath(path);
            updateStats(GRID_SIZE * GRID_SIZE - unvisited.length, path.length - 1, Math.round(endTime - startTime), '找到路徑');
            return true;
        }

        // 標記為封閉節點
        if (grid[currentRow][currentCol] !== CELL_STATE.START && grid[currentRow][currentCol] !== CELL_STATE.END) {
            grid[currentRow][currentCol] = CELL_STATE.CLOSED;
            getCellElement(currentRow, currentCol).classList.add('closed');
            await sleep(ANIMATION_SPEED);
        }

        // 檢查所有鄰居
        const neighbors = getNeighbors(currentRow, currentCol);

        for (const neighbor of neighbors) {
            const [neighborRow, neighborCol] = neighbor;
            const neighborKey = `${neighborRow},${neighborCol}`;

            // 跳過已經訪問過的節點和牆壁
            if (!unvisited.includes(neighborKey) || grid[neighborRow][neighborCol] === CELL_STATE.WALL) {
                continue;
            }

            // 計算新距離
            const alt = distances[currentKey] + 1;

            // 如果找到更短路徑
            if (alt < distances[neighborKey]) {
                distances[neighborKey] = alt;
                previous[neighborKey] = currentKey;

                // 標記為開放節點
                if (grid[neighborRow][neighborCol] !== CELL_STATE.START && grid[neighborRow][neighborCol] !== CELL_STATE.END) {
                    grid[neighborRow][neighborCol] = CELL_STATE.OPEN;
                    getCellElement(neighborRow, neighborCol).classList.add('open');
                    await sleep(ANIMATION_SPEED);
                }
            }
        }
    }

    // 沒有找到路徑
    const endTime = performance.now();
    updateStats(GRID_SIZE * GRID_SIZE - unvisited.length, 0, Math.round(endTime - startTime), '無路徑');
    return false;
}

// BFS演算法
async function bfs() {
    const startTime = performance.now();
    const queue = [];
    const visited = new Set();
    const parent = {};

    // 添加起點到隊列
    const startKey = `${startPos.row},${startPos.col}`;
    queue.push(startKey);
    visited.add(startKey);

    while (queue.length > 0) {
        // 從隊列中取出第一個節點
        const currentKey = queue.shift();
        const [currentRow, currentCol] = currentKey.split(',').map(Number);

        // 檢查是否到達終點
        if (currentRow === endPos.row && currentCol === endPos.col) {
            const endTime = performance.now();
            const path = reconstructPath(parent, currentKey);
            await animatePath(path);
            updateStats(visited.size, path.length - 1, Math.round(endTime - startTime), '找到路徑');
            return true;
        }

        // 標記為封閉節點
        if (grid[currentRow][currentCol] !== CELL_STATE.START && grid[currentRow][currentCol] !== CELL_STATE.END) {
            grid[currentRow][currentCol] = CELL_STATE.CLOSED;
            getCellElement(currentRow, currentCol).classList.add('closed');
            await sleep(ANIMATION_SPEED);
        }

        // 檢查所有鄰居
        const neighbors = getNeighbors(currentRow, currentCol);

        for (const neighbor of neighbors) {
            const [neighborRow, neighborCol] = neighbor;
            const neighborKey = `${neighborRow},${neighborCol}`;

            // 跳過已經訪問過的節點和牆壁
            if (visited.has(neighborKey) || grid[neighborRow][neighborCol] === CELL_STATE.WALL) {
                continue;
            }

            // 添加到隊列和訪問集合
            queue.push(neighborKey);
            visited.add(neighborKey);
            parent[neighborKey] = currentKey;

            // 標記為開放節點
            if (grid[neighborRow][neighborCol] !== CELL_STATE.START && grid[neighborRow][neighborCol] !== CELL_STATE.END) {
                grid[neighborRow][neighborCol] = CELL_STATE.OPEN;
                getCellElement(neighborRow, neighborCol).classList.add('open');
                await sleep(ANIMATION_SPEED);
            }
        }
    }

    // 沒有找到路徑
    const endTime = performance.now();
    updateStats(visited.size, 0, Math.round(endTime - startTime), '無路徑');
    return false;
}

// 獲取鄰居節點
function getNeighbors(row, col) {
    const neighbors = [];
    const directions = [
        [-1, 0],  // 上
        [0, 1],   // 右
        [1, 0],   // 下
        [0, -1]   // 左
    ];

    for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        // 檢查是否在網格範圍內
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            neighbors.push([newRow, newCol]);
        }
    }

    return neighbors;
}

// 曼哈頓距離啟發式函數
function heuristic(pos1, pos2) {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

// 重建路徑
function reconstructPath(cameFrom, currentKey) {
    const path = [currentKey];

    while (cameFrom[currentKey]) {
        currentKey = cameFrom[currentKey];
        path.unshift(currentKey);
    }

    return path;
}

// 動畫顯示路徑
async function animatePath(path) {
    for (let i = 1; i < path.length - 1; i++) {
        const [row, col] = path[i].split(',').map(Number);
        grid[row][col] = CELL_STATE.PATH;
        getCellElement(row, col).classList.remove('open', 'closed');
        getCellElement(row, col).classList.add('path');
        await sleep(ANIMATION_SPEED);
    }
}

// 延遲函數
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 開始尋路
async function startPathfinding() {
    if (isRunning) return;

    // 清除之前的路徑
    clearPath();

    // 禁用按鈕
    isRunning = true;
    setButtonsDisabled(true);
    updateStats(0, 0, 0, '搜尋中');

    // 根據選擇的演算法執行尋路
    const algorithm = algorithmSelect.value;
    let foundPath = false;

    try {
        switch (algorithm) {
            case 'astar':
                foundPath = await astar();
                break;
            case 'dijkstra':
                foundPath = await dijkstra();
                break;
            case 'bfs':
                foundPath = await bfs();
                break;
        }

        if (!foundPath) {
            // 顯示無法找到路徑的提示
            setTimeout(() => {
                alert('無法找到路徑');
            }, 500);
        }
    } catch (error) {
        console.error('尋路過程中發生錯誤:', error);
        updateStats(0, 0, 0, '錯誤');
    } finally {
        // 重新啟用按鈕
        isRunning = false;
        setButtonsDisabled(false);
    }
}

// 事件監聽器
setStartBtn.addEventListener('click', () => {
    if (isRunning) return;

    isSettingStart = !isSettingStart;
    isSettingEnd = false;

    if (isSettingStart) {
        setStartBtn.textContent = '點擊網格設定起點';
        setStartBtn.style.backgroundColor = '#2ecc71';
        setEndBtn.textContent = '設定終點';
        setEndBtn.style.backgroundColor = '#3498db';
    } else {
        setStartBtn.textContent = '設定起點';
        setStartBtn.style.backgroundColor = '#3498db';
    }
});

setEndBtn.addEventListener('click', () => {
    if (isRunning) return;

    isSettingEnd = !isSettingEnd;
    isSettingStart = false;

    if (isSettingEnd) {
        setEndBtn.textContent = '點擊網格設定終點';
        setEndBtn.style.backgroundColor = '#e74c3c';
        setStartBtn.textContent = '設定起點';
        setStartBtn.style.backgroundColor = '#3498db';
    } else {
        setEndBtn.textContent = '設定終點';
        setEndBtn.style.backgroundColor = '#3498db';
    }
});

clearPathBtn.addEventListener('click', () => {
    if (isRunning) return;
    clearPath();
});

resetBtn.addEventListener('click', () => {
    if (isRunning) return;
    resetGrid();
});

startBtn.addEventListener('click', startPathfinding);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initGrid();
});
