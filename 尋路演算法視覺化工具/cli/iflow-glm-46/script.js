// 全局變數
const GRID_SIZE = 25;
const CELL_SIZE = 20;
const ANIMATION_SPEED = 10; // 毫秒

// 網格狀態常數
const CELL_TYPE = {
    EMPTY: 'empty',
    START: 'start',
    END: 'end',
    WALL: 'wall',
    OPEN: 'open',
    CLOSED: 'closed',
    PATH: 'path'
};

// 應用程式狀態
let grid = [];
let startPos = { x: 2, y: 2 };
let endPos = { x: 22, y: 22 };
let isMouseDown = false;
let isSettingStart = false;
let isSettingEnd = false;
let isAnimating = false;
let visitedNodesCount = 0;
let pathLength = 0;
let executionTime = 0;

// DOM 元素
const gridElement = document.getElementById('grid');
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const resetBtn = document.getElementById('resetBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const startBtn = document.getElementById('startBtn');
const visitedNodesElement = document.getElementById('visitedNodes');
const pathLengthElement = document.getElementById('pathLength');
const executionTimeElement = document.getElementById('executionTime');
const currentStatusElement = document.getElementById('currentStatus');

// 初始化網格
function initGrid() {
    grid = [];
    gridElement.innerHTML = '';
    
    for (let y = 0; y < GRID_SIZE; y++) {
        const row = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // 設置起點和終點
            if (x === startPos.x && y === startPos.y) {
                cell.classList.add('start');
                row.push(CELL_TYPE.START);
            } else if (x === endPos.x && y === endPos.y) {
                cell.classList.add('end');
                row.push(CELL_TYPE.END);
            } else {
                row.push(CELL_TYPE.EMPTY);
            }
            
            // 添加事件監聽器
            cell.addEventListener('mousedown', handleCellMouseDown);
            cell.addEventListener('mouseenter', handleCellMouseEnter);
            cell.addEventListener('click', handleCellClick);
            
            gridElement.appendChild(cell);
        }
        grid.push(row);
    }
    
    // 添加全局滑鼠事件
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
}

// 處理格子滑鼠按下事件
function handleCellMouseDown(e) {
    if (isAnimating) return;
    
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    
    if (isSettingStart) {
        setStartPoint(x, y);
        return;
    }
    
    if (isSettingEnd) {
        setEndPoint(x, y);
        return;
    }
    
    // 如果是起點或終點，不允許創建障礙物
    if ((x === startPos.x && y === startPos.y) || (x === endPos.x && y === endPos.y)) {
        return;
    }
    
    isMouseDown = true;
    toggleWall(x, y);
}

// 處理格子滑鼠進入事件
function handleCellMouseEnter(e) {
    if (!isMouseDown || isAnimating || isSettingStart || isSettingEnd) return;
    
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    
    // 如果是起點或終點，不允許創建障礙物
    if ((x === startPos.x && y === startPos.y) || (x === endPos.x && y === endPos.y)) {
        return;
    }
    
    setWall(x, y, true);
}

// 處理格子點擊事件
function handleCellClick(e) {
    if (isAnimating) return;
    
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    
    if (isSettingStart) {
        setStartPoint(x, y);
    } else if (isSettingEnd) {
        setEndPoint(x, y);
    }
}

// 處理全局滑鼠釋放事件
function handleMouseUp() {
    isMouseDown = false;
}

// 切換牆壁狀態
function toggleWall(x, y) {
    if (grid[y][x] === CELL_TYPE.WALL) {
        setWall(x, y, false);
    } else if (grid[y][x] === CELL_TYPE.EMPTY) {
        setWall(x, y, true);
    }
}

// 設置牆壁狀態
function setWall(x, y, isWall) {
    const cell = getCellElement(x, y);
    if (!cell) return;
    
    if (isWall) {
        cell.classList.add('wall');
        grid[y][x] = CELL_TYPE.WALL;
    } else {
        cell.classList.remove('wall');
        grid[y][x] = CELL_TYPE.EMPTY;
    }
}

// 設置起點
function setStartPoint(x, y) {
    // 不能在終點或牆壁上設置起點
    if ((x === endPos.x && y === endPos.y) || grid[y][x] === CELL_TYPE.WALL) {
        return;
    }
    
    // 清除舊起點
    const oldStartCell = getCellElement(startPos.x, startPos.y);
    oldStartCell.classList.remove('start');
    grid[startPos.y][startPos.x] = CELL_TYPE.EMPTY;
    
    // 設置新起點
    const newStartCell = getCellElement(x, y);
    newStartCell.classList.add('start');
    grid[y][x] = CELL_TYPE.START;
    startPos = { x, y };
    
    // 重置設置模式
    isSettingStart = false;
    setStartBtn.textContent = '設定起點';
    setStartBtn.style.backgroundColor = '#3498db';
}

// 設置終點
function setEndPoint(x, y) {
    // 不能在起點或牆壁上設置終點
    if ((x === startPos.x && y === startPos.y) || grid[y][x] === CELL_TYPE.WALL) {
        return;
    }
    
    // 清除舊終點
    const oldEndCell = getCellElement(endPos.x, endPos.y);
    oldEndCell.classList.remove('end');
    grid[endPos.y][endPos.x] = CELL_TYPE.EMPTY;
    
    // 設置新終點
    const newEndCell = getCellElement(x, y);
    newEndCell.classList.add('end');
    grid[y][x] = CELL_TYPE.END;
    endPos = { x, y };
    
    // 重置設置模式
    isSettingEnd = false;
    setEndBtn.textContent = '設定終點';
    setEndBtn.style.backgroundColor = '#3498db';
}

// 獲取格子元素
function getCellElement(x, y) {
    return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

// 清除路徑
function clearPath() {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === CELL_TYPE.OPEN || 
                grid[y][x] === CELL_TYPE.CLOSED || 
                grid[y][x] === CELL_TYPE.PATH) {
                
                const cell = getCellElement(x, y);
                cell.classList.remove('open', 'closed', 'path');
                
                // 保留起點和終點
                if (!(x === startPos.x && y === startPos.y) && 
                    !(x === endPos.x && y === endPos.y)) {
                    grid[y][x] = CELL_TYPE.EMPTY;
                }
            }
        }
    }
    
    // 重置統計資訊
    visitedNodesCount = 0;
    pathLength = 0;
    executionTime = 0;
    updateStats();
    updateStatus('就緒');
}

// 完全重置
function reset() {
    clearPath();
    
    // 清除所有牆壁
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === CELL_TYPE.WALL) {
                const cell = getCellElement(x, y);
                cell.classList.remove('wall');
                grid[y][x] = CELL_TYPE.EMPTY;
            }
        }
    }
    
    // 重置起點和終點
    startPos = { x: 2, y: 2 };
    endPos = { x: 22, y: 22 };
    
    const startCell = getCellElement(2, 2);
    startCell.classList.add('start');
    grid[2][2] = CELL_TYPE.START;
    
    const endCell = getCellElement(22, 22);
    endCell.classList.add('end');
    grid[22][22] = CELL_TYPE.END;
}

// 更新統計資訊
function updateStats() {
    visitedNodesElement.textContent = visitedNodesCount;
    pathLengthElement.textContent = pathLength;
    executionTimeElement.textContent = executionTime;
}

// 更新狀態
function updateStatus(status) {
    currentStatusElement.textContent = status;
}

// 設置按鈕禁用狀態
function setButtonsDisabled(disabled) {
    setStartBtn.disabled = disabled;
    setEndBtn.disabled = disabled;
    clearPathBtn.disabled = disabled;
    resetBtn.disabled = disabled;
    startBtn.disabled = disabled;
    algorithmSelect.disabled = disabled;
}

// A* 演算法
async function astar() {
    const openSet = [];
    const closedSet = [];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    
    const startKey = `${startPos.x},${startPos.y}`;
    const endKey = `${endPos.x},${endPos.y}`;
    
    openSet.push(startKey);
    gScore[startKey] = 0;
    fScore[startKey] = heuristic(startPos, endPos);
    
    while (openSet.length > 0) {
        // 找到 fScore 最小的節點
        let current = openSet.reduce((min, node) => 
            fScore[node] < fScore[min] ? node : min
        );
        
        // 到達終點
        if (current === endKey) {
            return reconstructPath(cameFrom, current);
        }
        
        // 從 openSet 移除 current
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.push(current);
        
        // 視覺化當前節點
        const [x, y] = current.split(',').map(Number);
        if (!(x === startPos.x && y === startPos.y) && 
            !(x === endPos.x && y === endPos.y)) {
            const cell = getCellElement(x, y);
            cell.classList.add('closed');
            grid[y][x] = CELL_TYPE.CLOSED;
            visitedNodesCount++;
            await sleep(ANIMATION_SPEED);
        }
        
        // 檢查鄰居
        const neighbors = getNeighbors(x, y);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            
            // 跳過已經訪問過的節點
            if (closedSet.includes(neighborKey)) continue;
            
            const tentativeGScore = gScore[current] + 1;
            
            if (!openSet.includes(neighborKey)) {
                openSet.push(neighborKey);
                
                // 視覺化開放節點
                if (!(neighbor.x === startPos.x && neighbor.y === startPos.y) && 
                    !(neighbor.x === endPos.x && neighbor.y === endPos.y)) {
                    const cell = getCellElement(neighbor.x, neighbor.y);
                    cell.classList.add('open');
                    grid[neighbor.y][neighbor.x] = CELL_TYPE.OPEN;
                    await sleep(ANIMATION_SPEED);
                }
            } else if (tentativeGScore >= gScore[neighborKey]) {
                continue;
            }
            
            cameFrom[neighborKey] = current;
            gScore[neighborKey] = tentativeGScore;
            fScore[neighborKey] = gScore[neighborKey] + heuristic(neighbor, endPos);
        }
    }
    
    return null; // 沒有找到路徑
}

// Dijkstra 演算法
async function dijkstra() {
    const unvisited = [];
    const distances = {};
    const previous = {};
    
    // 初始化所有節點
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const key = `${x},${y}`;
            distances[key] = Infinity;
            previous[key] = null;
            unvisited.push(key);
        }
    }
    
    const startKey = `${startPos.x},${startPos.y}`;
    const endKey = `${endPos.x},${endPos.y}`;
    
    distances[startKey] = 0;
    
    while (unvisited.length > 0) {
        // 找到距離最小的未訪問節點
        let current = unvisited.reduce((min, node) => 
            distances[node] < distances[min] ? node : min
        );
        
        // 如果當前節點距離是無限大，說明剩餘節點不可達
        if (distances[current] === Infinity) break;
        
        // 到達終點
        if (current === endKey) {
            return reconstructPath(previous, current);
        }
        
        // 從未訪問列表中移除當前節點
        unvisited.splice(unvisited.indexOf(current), 1);
        
        // 視覺化當前節點
        const [x, y] = current.split(',').map(Number);
        if (!(x === startPos.x && y === startPos.y) && 
            !(x === endPos.x && y === endPos.y)) {
            const cell = getCellElement(x, y);
            cell.classList.add('closed');
            grid[y][x] = CELL_TYPE.CLOSED;
            visitedNodesCount++;
            await sleep(ANIMATION_SPEED);
        }
        
        // 檢查鄰居
        const neighbors = getNeighbors(x, y);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            
            if (!unvisited.includes(neighborKey)) continue;
            
            const alt = distances[current] + 1;
            
            if (alt < distances[neighborKey]) {
                distances[neighborKey] = alt;
                previous[neighborKey] = current;
                
                // 視覺化開放節點
                if (!(neighbor.x === startPos.x && neighbor.y === startPos.y) && 
                    !(neighbor.x === endPos.x && neighbor.y === endPos.y)) {
                    const cell = getCellElement(neighbor.x, neighbor.y);
                    if (!cell.classList.contains('open')) {
                        cell.classList.add('open');
                        grid[neighbor.y][neighbor.x] = CELL_TYPE.OPEN;
                        await sleep(ANIMATION_SPEED);
                    }
                }
            }
        }
    }
    
    return null; // 沒有找到路徑
}

// BFS 演算法
async function bfs() {
    const queue = [];
    const visited = new Set();
    const parent = {};
    
    const startKey = `${startPos.x},${startPos.y}`;
    const endKey = `${endPos.x},${endPos.y}`;
    
    queue.push(startKey);
    visited.add(startKey);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // 到達終點
        if (current === endKey) {
            return reconstructPath(parent, current);
        }
        
        // 視覺化當前節點
        const [x, y] = current.split(',').map(Number);
        if (!(x === startPos.x && y === startPos.y) && 
            !(x === endPos.x && y === endPos.y)) {
            const cell = getCellElement(x, y);
            cell.classList.add('closed');
            grid[y][x] = CELL_TYPE.CLOSED;
            visitedNodesCount++;
            await sleep(ANIMATION_SPEED);
        }
        
        // 檢查鄰居
        const neighbors = getNeighbors(x, y);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                parent[neighborKey] = current;
                queue.push(neighborKey);
                
                // 視覺化開放節點
                if (!(neighbor.x === startPos.x && neighbor.y === startPos.y) && 
                    !(neighbor.x === endPos.x && neighbor.y === endPos.y)) {
                    const cell = getCellElement(neighbor.x, neighbor.y);
                    cell.classList.add('open');
                    grid[neighbor.y][neighbor.x] = CELL_TYPE.OPEN;
                    await sleep(ANIMATION_SPEED);
                }
            }
        }
    }
    
    return null; // 沒有找到路徑
}

// 獲取鄰居節點
function getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
        { dx: 0, dy: -1 }, // 上
        { dx: 1, dy: 0 },  // 右
        { dx: 0, dy: 1 },  // 下
        { dx: -1, dy: 0 }  // 左
    ];
    
    for (const { dx, dy } of directions) {
        const nx = x + dx;
        const ny = y + dy;
        
        // 檢查邊界
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            // 檢查是否是牆壁
            if (grid[ny][nx] !== CELL_TYPE.WALL) {
                neighbors.push({ x: nx, y: ny });
            }
        }
    }
    
    return neighbors;
}

// 啟發式函數（曼哈頓距離）
function heuristic(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

// 重建路徑
function reconstructPath(cameFrom, current) {
    const path = [current];
    
    while (cameFrom[current]) {
        current = cameFrom[current];
        path.unshift(current);
    }
    
    return path;
}

// 顯示路徑動畫
async function animatePath(path) {
    for (let i = 1; i < path.length - 1; i++) {
        const [x, y] = path[i].split(',').map(Number);
        const cell = getCellElement(x, y);
        cell.classList.remove('open', 'closed');
        cell.classList.add('path');
        grid[y][x] = CELL_TYPE.PATH;
        await sleep(ANIMATION_SPEED);
    }
    
    pathLength = path.length - 1;
    updateStats();
}

// 延遲函數
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 開始尋路
async function startPathfinding() {
    if (isAnimating) return;
    
    // 清除之前的路徑
    clearPath();
    
    isAnimating = true;
    setButtonsDisabled(true);
    updateStatus('搜尋中');
    
    const startTime = performance.now();
    
    let path = null;
    const algorithm = algorithmSelect.value;
    
    try {
        switch (algorithm) {
            case 'astar':
                path = await astar();
                break;
            case 'dijkstra':
                path = await dijkstra();
                break;
            case 'bfs':
                path = await bfs();
                break;
        }
        
        const endTime = performance.now();
        executionTime = Math.round(endTime - startTime);
        updateStats();
        
        if (path) {
            await animatePath(path);
            updateStatus('找到路徑');
        } else {
            updateStatus('無路徑');
            setTimeout(() => {
                alert('無法找到路徑');
            }, 500);
        }
    } catch (error) {
        console.error('尋路過程中發生錯誤:', error);
        updateStatus('錯誤');
    } finally {
        isAnimating = false;
        setButtonsDisabled(false);
    }
}

// 事件監聽器
setStartBtn.addEventListener('click', () => {
    if (isAnimating) return;
    
    isSettingStart = !isSettingStart;
    isSettingEnd = false;
    
    if (isSettingStart) {
        setStartBtn.textContent = '點擊網格設置起點';
        setStartBtn.style.backgroundColor = '#2ecc71';
        setEndBtn.textContent = '設定終點';
        setEndBtn.style.backgroundColor = '#3498db';
    } else {
        setStartBtn.textContent = '設定起點';
        setStartBtn.style.backgroundColor = '#3498db';
    }
});

setEndBtn.addEventListener('click', () => {
    if (isAnimating) return;
    
    isSettingEnd = !isSettingEnd;
    isSettingStart = false;
    
    if (isSettingEnd) {
        setEndBtn.textContent = '點擊網格設置終點';
        setEndBtn.style.backgroundColor = '#e74c3c';
        setStartBtn.textContent = '設定起點';
        setStartBtn.style.backgroundColor = '#3498db';
    } else {
        setEndBtn.textContent = '設定終點';
        setEndBtn.style.backgroundColor = '#3498db';
    }
});

clearPathBtn.addEventListener('click', () => {
    if (isAnimating) return;
    clearPath();
});

resetBtn.addEventListener('click', () => {
    if (isAnimating) return;
    reset();
});

startBtn.addEventListener('click', startPathfinding);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initGrid();
    updateStats();
    updateStatus('就緒');
});