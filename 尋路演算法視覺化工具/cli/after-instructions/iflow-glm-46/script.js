// 網格配置
const GRID_SIZE = 25;
const CELL_SIZE = 20;
const ANIMATION_SPEED = 5; // 毫秒

// 格子狀態
const CELL_STATES = {
    EMPTY: 'empty',
    START: 'start',
    END: 'end',
    WALL: 'wall',
    OPEN: 'open',
    CLOSED: 'closed',
    PATH: 'path'
};

// 全局變量
let grid = [];
let startNode = { row: 2, col: 2 };
let endNode = { row: 22, col: 22 };
let isMouseDown = false;
let isSettingStart = false;
let isSettingEnd = false;
let isAnimating = false;
let visitedNodes = [];
let pathNodes = [];

// DOM元素
const gridElement = document.getElementById('grid');
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const resetBtn = document.getElementById('resetBtn');
const startBtn = document.getElementById('startBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const visitedCountElement = document.getElementById('visitedCount');
const pathLengthElement = document.getElementById('pathLength');
const executionTimeElement = document.getElementById('executionTime');
const statusElement = document.getElementById('status');

// 初始化網格
function initGrid() {
    grid = [];
    gridElement.innerHTML = '';
    
    for (let row = 0; row < GRID_SIZE; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell empty';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('mousedown', handleCellMouseDown);
            cell.addEventListener('mouseenter', handleCellMouseEnter);
            cell.addEventListener('click', handleCellClick);
            gridElement.appendChild(cell);
            
            grid[row][col] = {
                row,
                col,
                state: CELL_STATES.EMPTY,
                element: cell
            };
        }
    }
    
    // 設置起點和終點
    setCellState(startNode.row, startNode.col, CELL_STATES.START);
    setCellState(endNode.row, endNode.col, CELL_STATES.END);
    
    // 添加全局滑鼠事件
    document.addEventListener('mouseup', handleMouseUp);
}

// 設置格子狀態
function setCellState(row, col, state) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
    
    const cell = grid[row][col];
    cell.state = state;
    cell.element.className = `cell ${state}`;
}

// 處理格子點擊
function handleCellClick(e) {
    if (isAnimating) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    if (isSettingStart) {
        // 不能將起點設置在終點上
        if (row === endNode.row && col === endNode.col) return;
        
        // 清除舊起點
        setCellState(startNode.row, startNode.col, CELL_STATES.EMPTY);
        
        // 設置新起點
        startNode = { row, col };
        setCellState(row, col, CELL_STATES.START);
        
        // 重置設置模式
        isSettingStart = false;
        document.body.classList.remove('setting-start');
        setStartBtn.textContent = '設定起點';
    } else if (isSettingEnd) {
        // 不能將終點設置在起點上
        if (row === startNode.row && col === startNode.col) return;
        
        // 清除舊終點
        setCellState(endNode.row, endNode.col, CELL_STATES.EMPTY);
        
        // 設置新終點
        endNode = { row, col };
        setCellState(row, col, CELL_STATES.END);
        
        // 重置設置模式
        isSettingEnd = false;
        document.body.classList.remove('setting-end');
        setEndBtn.textContent = '設定終點';
    }
}

// 處理滑鼠按下
function handleCellMouseDown(e) {
    if (isAnimating || isSettingStart || isSettingEnd) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const cell = grid[row][col];
    
    // 不能在起點或終點上創建障礙物
    if (cell.state === CELL_STATES.START || cell.state === CELL_STATES.END) return;
    
    isMouseDown = true;
    
    // 切換障礙物狀態
    if (cell.state === CELL_STATES.WALL) {
        setCellState(row, col, CELL_STATES.EMPTY);
    } else {
        setCellState(row, col, CELL_STATES.WALL);
    }
}

// 處理滑鼠進入格子
function handleCellMouseEnter(e) {
    if (!isMouseDown || isAnimating || isSettingStart || isSettingEnd) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const cell = grid[row][col];
    
    // 不能在起點或終點上創建障礙物
    if (cell.state === CELL_STATES.START || cell.state === CELL_STATES.END) return;
    
    // 設置為障礙物
    if (cell.state !== CELL_STATES.WALL) {
        setCellState(row, col, CELL_STATES.WALL);
    }
}

// 處理滑鼠釋放
function handleMouseUp() {
    isMouseDown = false;
}

// 清除路徑
function clearPath() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = grid[row][col];
            if (cell.state === CELL_STATES.OPEN || 
                cell.state === CELL_STATES.CLOSED || 
                cell.state === CELL_STATES.PATH) {
                setCellState(row, col, CELL_STATES.EMPTY);
            }
        }
    }
    
    // 重置統計
    updateStats(0, 0, 0, '就緒');
}

// 完全重置
function resetGrid() {
    // 清除所有格子
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = grid[row][col];
            if (cell.state !== CELL_STATES.START && cell.state !== CELL_STATES.END) {
                setCellState(row, col, CELL_STATES.EMPTY);
            }
        }
    }
    
    // 重置統計
    updateStats(0, 0, 0, '就緒');
}

// 更新統計信息
function updateStats(visitedCount, pathLength, executionTime, status) {
    visitedCountElement.textContent = visitedCount;
    pathLengthElement.textContent = pathLength;
    executionTimeElement.textContent = executionTime;
    statusElement.textContent = status;
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

// 獲取鄰居節點
function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;
    
    // 上
    if (row > 0) neighbors.push(grid[row - 1][col]);
    // 右
    if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);
    // 下
    if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
    // 左
    if (col > 0) neighbors.push(grid[row][col - 1]);
    
    return neighbors;
}

// 曼哈頓距離
function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// A*演算法
function astar() {
    const start = grid[startNode.row][startNode.col];
    const end = grid[endNode.row][endNode.col];
    
    const openSet = [start];
    const closedSet = [];
    const visited = [];
    const path = [];
    
    // 初始化所有節點
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            grid[row][col].g = Infinity;
            grid[row][col].h = 0;
            grid[row][col].f = Infinity;
            grid[row][col].parent = null;
        }
    }
    
    start.g = 0;
    start.h = manhattanDistance(start, end);
    start.f = start.h;
    
    while (openSet.length > 0) {
        // 找到f值最小的節點
        let current = openSet[0];
        let currentIndex = 0;
        
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < current.f) {
                current = openSet[i];
                currentIndex = i;
            }
        }
        
        // 如果找到終點
        if (current === end) {
            // 重建路徑
            let temp = current;
            while (temp.parent) {
                path.push(temp);
                temp = temp.parent;
            }
            return { visited, path };
        }
        
        // 從開放列表移除當前節點，加入封閉列表
        openSet.splice(currentIndex, 1);
        closedSet.push(current);
        visited.push(current);
        
        // 檢查所有鄰居
        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            // 跳過障礙物和已在封閉列表中的節點
            if (neighbor.state === CELL_STATES.WALL || closedSet.includes(neighbor)) {
                continue;
            }
            
            const tentativeG = current.g + 1;
            
            // 如果這條路徑更好，或者這是第一次訪問
            if (tentativeG < neighbor.g) {
                neighbor.parent = current;
                neighbor.g = tentativeG;
                neighbor.h = manhattanDistance(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                
                // 如果不在開放列表中，加入開放列表
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    // 沒有找到路徑
    return { visited, path: [] };
}

// Dijkstra演算法
function dijkstra() {
    const start = grid[startNode.row][startNode.col];
    const end = grid[endNode.row][endNode.col];
    
    const unvisited = [];
    const visited = [];
    const path = [];
    
    // 初始化所有節點
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            grid[row][col].distance = Infinity;
            grid[row][col].parent = null;
            unvisited.push(grid[row][col]);
        }
    }
    
    start.distance = 0;
    
    while (unvisited.length > 0) {
        // 找到距離最小的節點
        unvisited.sort((a, b) => a.distance - b.distance);
        const current = unvisited.shift();
        
        // 如果當前節點距離為無限大，說明剩餘節點不可達
        if (current.distance === Infinity) break;
        
        // 如果找到終點
        if (current === end) {
            // 重建路徑
            let temp = current;
            while (temp.parent) {
                path.push(temp);
                temp = temp.parent;
            }
            return { visited, path };
        }
        
        visited.push(current);
        
        // 檢查所有鄰居
        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            // 跳過障礙物和已訪問的節點
            if (neighbor.state === CELL_STATES.WALL || visited.includes(neighbor)) {
                continue;
            }
            
            const distance = current.distance + 1;
            
            // 如果這條路徑更好
            if (distance < neighbor.distance) {
                neighbor.distance = distance;
                neighbor.parent = current;
            }
        }
    }
    
    // 沒有找到路徑
    return { visited, path: [] };
}

// 動畫演算法執行過程
async function animateAlgorithm() {
    const algorithm = algorithmSelect.value;
    let result;
    
    if (algorithm === 'astar') {
        result = astar();
    } else {
        result = dijkstra();
    }
    
    visitedNodes = result.visited;
    pathNodes = result.path;
    
    const startTime = performance.now();
    
    // 動畫顯示訪問的節點
    for (let i = 0; i < visitedNodes.length; i++) {
        const node = visitedNodes[i];
        
        // 跳過起點和終點
        if (node.state === CELL_STATES.START || node.state === CELL_STATES.END) {
            continue;
        }
        
        setCellState(node.row, node.col, CELL_STATES.OPEN);
        
        // 將早期訪問的節點變為封閉列表
        if (i > 0) {
            const prevNode = visitedNodes[i - 1];
            if (prevNode.state === CELL_STATES.OPEN) {
                setCellState(prevNode.row, prevNode.col, CELL_STATES.CLOSED);
            }
        }
        
        updateStats(i + 1, 0, 0, '搜尋中');
        await sleep(ANIMATION_SPEED);
    }
    
    // 將最後一個節點變為封閉列表
    if (visitedNodes.length > 0) {
        const lastNode = visitedNodes[visitedNodes.length - 1];
        if (lastNode.state === CELL_STATES.OPEN) {
            setCellState(lastNode.row, lastNode.col, CELL_STATES.CLOSED);
        }
    }
    
    // 動畫顯示路徑
    if (pathNodes.length > 0) {
        updateStats(visitedNodes.length, pathNodes.length, 0, '找到路徑');
        
        for (let i = pathNodes.length - 1; i >= 0; i--) {
            const node = pathNodes[i];
            
            // 跳過起點和終點
            if (node.state === CELL_STATES.START || node.state === CELL_STATES.END) {
                continue;
            }
            
            setCellState(node.row, node.col, CELL_STATES.PATH);
            await sleep(ANIMATION_SPEED * 2); // 路徑動畫稍慢
        }
    } else {
        updateStats(visitedNodes.length, 0, 0, '無路徑');
        alert('無法找到路徑');
    }
    
    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);
    
    updateStats(visitedNodes.length, pathNodes.length, executionTime, 
                pathNodes.length > 0 ? '找到路徑' : '無路徑');
    
    isAnimating = false;
    setButtonsDisabled(false);
}

// 延遲函數
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 開始尋路
function startPathfinding() {
    if (isAnimating) return;
    
    clearPath();
    isAnimating = true;
    setButtonsDisabled(true);
    updateStats(0, 0, 0, '搜尋中');
    
    animateAlgorithm();
}

// 事件監聽器
setStartBtn.addEventListener('click', () => {
    if (isAnimating) return;
    
    isSettingStart = !isSettingStart;
    isSettingEnd = false;
    
    if (isSettingStart) {
        document.body.classList.add('setting-start');
        document.body.classList.remove('setting-end');
        setStartBtn.textContent = '取消設定';
        setEndBtn.textContent = '設定終點';
    } else {
        document.body.classList.remove('setting-start');
        setStartBtn.textContent = '設定起點';
    }
});

setEndBtn.addEventListener('click', () => {
    if (isAnimating) return;
    
    isSettingEnd = !isSettingEnd;
    isSettingStart = false;
    
    if (isSettingEnd) {
        document.body.classList.add('setting-end');
        document.body.classList.remove('setting-start');
        setEndBtn.textContent = '取消設定';
        setStartBtn.textContent = '設定起點';
    } else {
        document.body.classList.remove('setting-end');
        setEndBtn.textContent = '設定終點';
    }
});

clearPathBtn.addEventListener('click', () => {
    if (isAnimating) return;
    clearPath();
});

resetBtn.addEventListener('click', () => {
    if (isAnimating) return;
    resetGrid();
});

startBtn.addEventListener('click', startPathfinding);

// 防止在網格上拖曳選中文本
gridElement.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    initGrid();
    updateStats(0, 0, 0, '就緒');
});