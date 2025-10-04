// 網格尺寸
const ROWS = 25;
const COLS = 25;

// 格子狀態
const CELL_TYPES = {
    EMPTY: 'empty',
    START: 'start',
    END: 'end',
    OBSTACLE: 'obstacle',
    OPEN: 'open',
    CLOSED: 'closed',
    PATH: 'path'
};

// 全局變量
let grid = [];
let startCell = { row: 2, col: 2 };
let endCell = { row: 22, col: 22 };
let isSettingStart = false;
let isSettingEnd = false;
let isDragging = false;
let isAnimating = false;
let animationSpeed = 10; // ms

// 統計資訊
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
const statusElement = document.getElementById('status');

// 初始化網格
function initializeGrid() {
    grid = [];
    gridElement.innerHTML = '';
    
    // 創建網格單元格
    for (let row = 0; row < ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // 設置預設起點和終點
            if (row === startCell.row && col === startCell.col) {
                cell.classList.add(CELL_TYPES.START);
                grid[row][col] = CELL_TYPES.START;
            } else if (row === endCell.row && col === endCell.col) {
                cell.classList.add(CELL_TYPES.END);
                grid[row][col] = CELL_TYPES.END;
            } else {
                grid[row][col] = CELL_TYPES.EMPTY;
            }
            
            // 添加事件監聽器
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseenter', handleMouseEnter);
            cell.addEventListener('mouseup', handleMouseUp);
            
            gridElement.appendChild(cell);
        }
    }
}

// 獲取單元格元素
function getCellElement(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

// 更新單元格樣式
function updateCellAppearance(row, col, type) {
    const cell = getCellElement(row, col);
    if (!cell) return;
    
    // 移除所有類型類
    Object.values(CELL_TYPES).forEach(type => {
        cell.classList.remove(type);
    });
    
    // 添加新類型類
    if (type !== CELL_TYPES.EMPTY) {
        cell.classList.add(type);
    }
    
    // 更新網格數據
    grid[row][col] = type;
}

// 處理鼠標按下事件
function handleMouseDown(event) {
    if (isAnimating) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // 設定起點
    if (isSettingStart) {
        if (grid[row][col] !== CELL_TYPES.END && grid[row][col] !== CELL_TYPES.OBSTACLE) {
            // 清除舊起點
            updateCellAppearance(startCell.row, startCell.col, CELL_TYPES.EMPTY);
            // 設置新起點
            updateCellAppearance(row, col, CELL_TYPES.START);
            startCell = { row, col };
            isSettingStart = false;
            setStartBtn.textContent = '設定起點';
        }
        return;
    }
    
    // 設定終點
    if (isSettingEnd) {
        if (grid[row][col] !== CELL_TYPES.START && grid[row][col] !== CELL_TYPES.OBSTACLE) {
            // 清除舊終點
            updateCellAppearance(endCell.row, endCell.col, CELL_TYPES.EMPTY);
            // 設置新終點
            updateCellAppearance(row, col, CELL_TYPES.END);
            endCell = { row, col };
            isSettingEnd = false;
            setEndBtn.textContent = '設定終點';
        }
        return;
    }
    
    // 拖曳創建障礙物
    isDragging = true;
    if (grid[row][col] !== CELL_TYPES.START && grid[row][col] !== CELL_TYPES.END) {
        // 切換障礙物狀態
        if (grid[row][col] === CELL_TYPES.OBSTACLE) {
            updateCellAppearance(row, col, CELL_TYPES.EMPTY);
        } else {
            updateCellAppearance(row, col, CELL_TYPES.OBSTACLE);
        }
    }
}

// 處理鼠標進入事件
function handleMouseEnter(event) {
    if (!isDragging || isAnimating) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // 只有在拖曳時且不是起點或終點時才創建障礙物
    if (grid[row][col] !== CELL_TYPES.START && grid[row][col] !== CELL_TYPES.END) {
        updateCellAppearance(row, col, CELL_TYPES.OBSTACLE);
    }
}

// 處理鼠標釋放事件
function handleMouseUp() {
    isDragging = false;
}

// 設定起點
function setStart() {
    if (isAnimating) return;
    
    isSettingStart = !isSettingStart;
    isSettingEnd = false;
    setEndBtn.textContent = '設定終點';
    setStartBtn.textContent = isSettingStart ? '取消設定' : '設定起點';
}

// 設定終點
function setEnd() {
    if (isAnimating) return;
    
    isSettingEnd = !isSettingEnd;
    isSettingStart = false;
    setStartBtn.textContent = '設定起點';
    setEndBtn.textContent = isSettingEnd ? '取消設定' : '設定終點';
}

// 清除路徑
function clearPath() {
    if (isAnimating) return;
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] === CELL_TYPES.OPEN || 
                grid[row][col] === CELL_TYPES.CLOSED || 
                grid[row][col] === CELL_TYPES.PATH) {
                updateCellAppearance(row, col, CELL_TYPES.EMPTY);
            }
        }
    }
    
    // 重置統計資訊
    visitedNodesCount = 0;
    pathLength = 0;
    executionTime = 0;
    updateStats();
    statusElement.textContent = '就緒';
}

// 完全重置
function reset() {
    if (isAnimating) return;
    
    // 重置起點和終點位置
    startCell = { row: 2, col: 2 };
    endCell = { row: 22, col: 22 };
    
    // 重新初始化網格
    initializeGrid();
    
    // 重置狀態
    isSettingStart = false;
    isSettingEnd = false;
    setStartBtn.textContent = '設定起點';
    setEndBtn.textContent = '設定終點';
    
    // 重置統計資訊
    visitedNodesCount = 0;
    pathLength = 0;
    executionTime = 0;
    updateStats();
    statusElement.textContent = '就緒';
}

// 更新統計資訊
function updateStats() {
    visitedNodesElement.textContent = visitedNodesCount;
    pathLengthElement.textContent = pathLength;
    executionTimeElement.textContent = executionTime;
}

// 獲取相鄰單元格
function getNeighbors(row, col) {
    const neighbors = [];
    const directions = [
        { dr: -1, dc: 0 },  // 上
        { dr: 1, dc: 0 },   // 下
        { dr: 0, dc: -1 },  // 左
        { dr: 0, dc: 1 }    // 右
    ];
    
    for (const dir of directions) {
        const newRow = row + dir.dr;
        const newCol = col + dir.dc;
        
        // 檢查邊界
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
            // 檢查是否為障礙物
            if (grid[newRow][newCol] !== CELL_TYPES.OBSTACLE) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
    }
    
    return neighbors;
}

// 計算曼哈頓距離
function manhattanDistance(cell1, cell2) {
    return Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col);
}

// A* 演算法
async function astar() {
    const start = { ...startCell };
    const end = { ...endCell };
    
    // 初始化 open set、closed set 和 gScore、fScore
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    const fScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    const cameFrom = {};
    
    // 初始化起點
    gScore[start.row][start.col] = 0;
    fScore[start.row][start.col] = manhattanDistance(start, end);
    openSet.enqueue(start, fScore[start.row][start.col]);
    
    let visitedCount = 0;
    
    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        
        // 檢查是否到達終點
        if (current.row === end.row && current.col === end.col) {
            visitedNodesCount = visitedCount;
            return reconstructPath(cameFrom, current);
        }
        
        // 添加到 closed set
        const currentKey = `${current.row},${current.col}`;
        closedSet.add(currentKey);
        
        // 視覺化：標記為已訪問
        if (grid[current.row][current.col] !== CELL_TYPES.START && 
            grid[current.row][current.col] !== CELL_TYPES.END) {
            updateCellAppearance(current.row, current.col, CELL_TYPES.CLOSED);
            visitedCount++;
        }
        
        // 動畫延遲
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
        
        // 檢查相鄰單元格
        const neighbors = getNeighbors(current.row, current.col);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            
            // 如果在 closed set 中，跳過
            if (closedSet.has(neighborKey)) continue;
            
            // 計算 tentative gScore
            const tentativeGScore = gScore[current.row][current.col] + 1;
            
            // 如果找到更好的路徑
            if (tentativeGScore < gScore[neighbor.row][neighbor.col]) {
                cameFrom[neighborKey] = current;
                gScore[neighbor.row][neighbor.col] = tentativeGScore;
                fScore[neighbor.row][neighbor.col] = tentativeGScore + manhattanDistance(neighbor, end);
                
                // 視覺化：標記為待訪問
                if (grid[neighbor.row][neighbor.col] !== CELL_TYPES.START && 
                    grid[neighbor.row][neighbor.col] !== CELL_TYPES.END) {
                    updateCellAppearance(neighbor.row, neighbor.col, CELL_TYPES.OPEN);
                }
                
                // 如果不在 open set 中，添加進去
                if (!openSet.has(neighbor)) {
                    openSet.enqueue(neighbor, fScore[neighbor.row][neighbor.col]);
                }
            }
        }
    }
    
    visitedNodesCount = visitedCount;
    return null; // 無法找到路徑
}

// Dijkstra 演算法
async function dijkstra() {
    const start = { ...startCell };
    const end = { ...endCell };
    
    // 初始化 open set、closed set 和 distances
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const distances = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    const cameFrom = {};
    
    // 初始化起點
    distances[start.row][start.col] = 0;
    openSet.enqueue(start, 0);
    
    let visitedCount = 0;
    
    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        
        // 檢查是否到達終點
        if (current.row === end.row && current.col === end.col) {
            visitedNodesCount = visitedCount;
            return reconstructPath(cameFrom, current);
        }
        
        // 添加到 closed set
        const currentKey = `${current.row},${current.col}`;
        closedSet.add(currentKey);
        
        // 視覺化：標記為已訪問
        if (grid[current.row][current.col] !== CELL_TYPES.START && 
            grid[current.row][current.col] !== CELL_TYPES.END) {
            updateCellAppearance(current.row, current.col, CELL_TYPES.CLOSED);
            visitedCount++;
        }
        
        // 動畫延遲
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
        
        // 檢查相鄰單元格
        const neighbors = getNeighbors(current.row, current.col);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            
            // 如果在 closed set 中，跳過
            if (closedSet.has(neighborKey)) continue;
            
            // 計算 tentative distance
            const tentativeDistance = distances[current.row][current.col] + 1;
            
            // 如果找到更好的路徑
            if (tentativeDistance < distances[neighbor.row][neighbor.col]) {
                cameFrom[neighborKey] = current;
                distances[neighbor.row][neighbor.col] = tentativeDistance;
                
                // 視覺化：標記為待訪問
                if (grid[neighbor.row][neighbor.col] !== CELL_TYPES.START && 
                    grid[neighbor.row][neighbor.col] !== CELL_TYPES.END) {
                    updateCellAppearance(neighbor.row, neighbor.col, CELL_TYPES.OPEN);
                }
                
                // 如果不在 open set 中，添加進去
                if (!openSet.has(neighbor)) {
                    openSet.enqueue(neighbor, distances[neighbor.row][neighbor.col]);
                }
            }
        }
    }
    
    visitedNodesCount = visitedCount;
    return null; // 無法找到路徑
}

// BFS 演算法
async function bfs() {
    const start = { ...startCell };
    const end = { ...endCell };
    
    // 初始化 queue、visited set 和 cameFrom
    const queue = [start];
    const visited = new Set();
    const cameFrom = {};
    
    // 標記起點為已訪問
    visited.add(`${start.row},${start.col}`);
    
    let visitedCount = 0;
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // 檢查是否到達終點
        if (current.row === end.row && current.col === end.col) {
            visitedNodesCount = visitedCount;
            return reconstructPath(cameFrom, current);
        }
        
        // 視覺化：標記為已訪問
        if (grid[current.row][current.col] !== CELL_TYPES.START && 
            grid[current.row][current.col] !== CELL_TYPES.END) {
            updateCellAppearance(current.row, current.col, CELL_TYPES.CLOSED);
            visitedCount++;
        }
        
        // 動畫延遲
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
        
        // 檢查相鄰單元格
        const neighbors = getNeighbors(current.row, current.col);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            
            // 如果未訪問過
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                cameFrom[neighborKey] = current;
                
                // 視覺化：標記為待訪問
                if (grid[neighbor.row][neighbor.col] !== CELL_TYPES.START && 
                    grid[neighbor.row][neighbor.col] !== CELL_TYPES.END) {
                    updateCellAppearance(neighbor.row, neighbor.col, CELL_TYPES.OPEN);
                }
                
                queue.push(neighbor);
            }
        }
    }
    
    visitedNodesCount = visitedCount;
    return null; // 無法找到路徑
}

// 重建路徑
function reconstructPath(cameFrom, current) {
    const path = [];
    let currentKey = `${current.row},${current.col}`;
    
    while (cameFrom[currentKey]) {
        path.push(current);
        current = cameFrom[currentKey];
        currentKey = `${current.row},${current.col}`;
    }
    
    // 反轉路徑（從起點到終點）
    return path.reverse();
}

// 視覺化路徑
async function visualizePath(path) {
    pathLength = path.length;
    
    // 延遲 slightly 比搜尋動畫長一些，這樣用戶可以清楚地看到路徑
    const pathAnimationSpeed = animationSpeed * 2;
    
    for (const cell of path) {
        if (grid[cell.row][cell.col] !== CELL_TYPES.START && 
            grid[cell.row][cell.col] !== CELL_TYPES.END) {
            updateCellAppearance(cell.row, cell.col, CELL_TYPES.PATH);
        }
        await new Promise(resolve => setTimeout(resolve, pathAnimationSpeed));
    }
}

// 開始尋路
async function startPathfinding() {
    if (isAnimating) return;
    
    // 檢查起點和終點是否存在
    if (!startCell || !endCell) {
        alert('請先設定起點和終點');
        return;
    }
    
    // 檢查起點和終點是否被障礙物覆蓋
    if (grid[startCell.row][startCell.col] === CELL_TYPES.OBSTACLE) {
        alert('起點被障礙物覆蓋，請重新設定起點');
        return;
    }
    
    if (grid[endCell.row][endCell.col] === CELL_TYPES.OBSTACLE) {
        alert('終點被障礙物覆蓋，請重新設定終點');
        return;
    }
    
    // 清除之前的路徑
    clearPath();
    
    // 禁用按鈕
    setStartBtn.disabled = true;
    setEndBtn.disabled = true;
    clearPathBtn.disabled = true;
    resetBtn.disabled = true;
    algorithmSelect.disabled = true;
    startBtn.disabled = true;
    
    isAnimating = true;
    statusElement.textContent = '搜尋中';
    updateStats();
    
    // 記錄開始時間
    const startTime = performance.now();
    
    // 根據選擇的演算法執行尋路
    let path = null;
    const selectedAlgorithm = algorithmSelect.value;
    
    try {
        switch (selectedAlgorithm) {
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
        
        // 記錄結束時間
        const endTime = performance.now();
        executionTime = Math.round(endTime - startTime);
        
        if (path) {
            // 視覺化路徑
            await visualizePath(path);
            statusElement.textContent = '找到路徑';
        } else {
            statusElement.textContent = '無路徑';
            // 使用更友善的方式顯示訊息
            setTimeout(() => {
                alert('無法找到路徑');
            }, 100);
        }
    } catch (error) {
        console.error('尋路過程中發生錯誤:', error);
        statusElement.textContent = '錯誤';
        alert('尋路過程中發生錯誤，請查看控制台獲取詳細資訊');
    } finally {
        // 啟用按鈕
        setStartBtn.disabled = false;
        setEndBtn.disabled = false;
        clearPathBtn.disabled = false;
        resetBtn.disabled = false;
        algorithmSelect.disabled = false;
        startBtn.disabled = false;
        
        isAnimating = false;
        updateStats();
    }
}

// 優先隊列實現
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;
        
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        
        if (!added) {
            this.items.push(queueElement);
        }
    }
    
    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift().element;
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    has(element) {
        return this.items.some(item => 
            item.element.row === element.row && item.element.col === element.col
        );
    }
}

// 初始化事件監聽器
function initEventListeners() {
    setStartBtn.addEventListener('click', setStart);
    setEndBtn.addEventListener('click', setEnd);
    clearPathBtn.addEventListener('click', clearPath);
    resetBtn.addEventListener('click', reset);
    startBtn.addEventListener('click', startPathfinding);
    
    // 防止拖拽時選中文本
    document.addEventListener('selectstart', (e) => {
        if (isDragging) e.preventDefault();
    });
}

// 頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    initEventListeners();
    
    // 初始化統計資訊
    updateStats();
});