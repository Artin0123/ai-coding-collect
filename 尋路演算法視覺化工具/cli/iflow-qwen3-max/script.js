// 網格配置
const ROWS = 15;
const COLS = 15;
const CELL_SIZE = 30;

// 狀態常量
const EMPTY = 0;
const START = 1;
const END = 2;
const OBSTACLE = 3;
const OPEN = 4;
const CLOSED = 5;
const PATH = 6;

// 全局變量
let grid = [];
let startPos = { row: 2, col: 2 };
let endPos = { row: 12, col: 12 };
let isSettingStart = false;
let isSettingEnd = false;
let isDragging = false;
let isRunning = false;
let animationQueue = [];
let animationTimeout = null;

// DOM 元素
const gridElement = document.getElementById('grid');
const setStartBtn = document.getElementById('setStart');
const setEndBtn = document.getElementById('setEnd');
const clearPathBtn = document.getElementById('clearPath');
const resetBtn = document.getElementById('reset');
const algorithmSelect = document.getElementById('algorithm');
const startBtn = document.getElementById('start');
const visitedCountElement = document.getElementById('visitedCount');
const pathLengthElement = document.getElementById('pathLength');
const executionTimeElement = document.getElementById('executionTime');
const statusElement = document.getElementById('status');
const noPathMessage = document.getElementById('noPathMessage');

// 初始化網格
function initializeGrid() {
    grid = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
    grid[startPos.row][startPos.col] = START;
    grid[endPos.row][endPos.col] = END;
    renderGrid();
}

// 渲染網格
function renderGrid() {
    gridElement.innerHTML = '';
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // 設置單元格類型
            switch (grid[row][col]) {
                case START:
                    cell.classList.add('start');
                    break;
                case END:
                    cell.classList.add('end');
                    break;
                case OBSTACLE:
                    cell.classList.add('obstacle');
                    break;
                case OPEN:
                    cell.classList.add('open');
                    break;
                case CLOSED:
                    cell.classList.add('closed');
                    break;
                case PATH:
                    cell.classList.add('path');
                    break;
            }
            
            // 添加事件監聽器
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseenter', handleMouseEnter);
            cell.addEventListener('click', handleCellClick);
            
            gridElement.appendChild(cell);
        }
    }
}

// 處理鼠標按下事件
function handleMouseDown(event) {
    if (isRunning) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    if (isSettingStart) {
        setStart(row, col);
        return;
    }
    
    if (isSettingEnd) {
        setEnd(row, col);
        return;
    }
    
    // 檢查是否點擊在起點或終點上
    if ((row === startPos.row && col === startPos.col) || 
        (row === endPos.row && col === endPos.col)) {
        return;
    }
    
    // 切換障礙物
    if (grid[row][col] === OBSTACLE) {
        grid[row][col] = EMPTY;
    } else {
        grid[row][col] = OBSTACLE;
    }
    
    renderGrid();
    isDragging = true;
}

// 處理鼠標進入事件（用於拖曳）
function handleMouseEnter(event) {
    if (!isDragging || isRunning) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // 檢查是否是起點或終點
    if ((row === startPos.row && col === startPos.col) || 
        (row === endPos.row && col === endPos.col)) {
        return;
    }
    
    grid[row][col] = OBSTACLE;
    renderGrid();
}

// 處理單元格點擊事件
function handleCellClick(event) {
    if (isRunning) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    if (isSettingStart) {
        setStart(row, col);
        return;
    }
    
    if (isSettingEnd) {
        setEnd(row, col);
        return;
    }
    
    // 如果沒有拖曳，切換障礙物狀態
    if (!isDragging) {
        if ((row === startPos.row && col === startPos.col) || 
            (row === endPos.row && col === endPos.col)) {
            return;
        }
        
        if (grid[row][col] === OBSTACLE) {
            grid[row][col] = EMPTY;
        } else {
            grid[row][col] = OBSTACLE;
        }
        renderGrid();
    }
}

// 設置起點
function setStart(row, col) {
    if (grid[row][col] === OBSTACLE) return;
    
    // 清除舊的起點
    grid[startPos.row][startPos.col] = EMPTY;
    
    // 設置新的起點
    startPos = { row, col };
    grid[row][col] = START;
    
    isSettingStart = false;
    updateButtonStates();
    renderGrid();
}

// 設置終點
function setEnd(row, col) {
    if (grid[row][col] === OBSTACLE) return;
    
    // 清除舊的終點
    grid[endPos.row][endPos.col] = EMPTY;
    
    // 設置新的終點
    endPos = { row, col };
    grid[row][col] = END;
    
    isSettingEnd = false;
    updateButtonStates();
    renderGrid();
}

// 更新按鈕狀態
function updateButtonStates() {
    setStartBtn.disabled = isRunning;
    setEndBtn.disabled = isRunning;
    clearPathBtn.disabled = isRunning;
    resetBtn.disabled = isRunning;
    algorithmSelect.disabled = isRunning;
    startBtn.disabled = isRunning;
    
    if (isSettingStart) {
        setStartBtn.style.backgroundColor = '#27ae60';
        setEndBtn.style.backgroundColor = '#3498db';
    } else if (isSettingEnd) {
        setEndBtn.style.backgroundColor = '#e74c3c';
        setStartBtn.style.backgroundColor = '#3498db';
    } else {
        setStartBtn.style.backgroundColor = '#3498db';
        setEndBtn.style.backgroundColor = '#3498db';
    }
}

// 清除路徑
function clearPath() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] !== START && 
                grid[row][col] !== END && 
                grid[row][col] !== OBSTACLE) {
                grid[row][col] = EMPTY;
            }
        }
    }
    renderGrid();
    resetStats();
    noPathMessage.style.display = 'none';
}

// 完全重置
function reset() {
    startPos = { row: 2, col: 2 };
    endPos = { row: 12, col: 12 };
    initializeGrid();
    resetStats();
    noPathMessage.style.display = 'none';
}

// 重置統計資訊
function resetStats() {
    visitedCountElement.textContent = '0';
    pathLengthElement.textContent = '0';
    executionTimeElement.textContent = '0';
    statusElement.textContent = '就緒';
}

// 計算曼哈頓距離
function manhattanDistance(pos1, pos2) {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

// A* 演算法
function astar() {
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    
    // 初始化
    const startKey = `${startPos.row},${startPos.col}`;
    gScore[startKey] = 0;
    fScore[startKey] = manhattanDistance(startPos, endPos);
    openSet.push(startPos);
    
    const startTime = performance.now();
    let visitedCount = 0;
    
    while (openSet.length > 0) {
        // 找到 fScore 最小的節點
        let currentIdx = 0;
        let currentMin = fScore[`${openSet[0].row},${openSet[0].col}`];
        
        for (let i = 1; i < openSet.length; i++) {
            const key = `${openSet[i].row},${openSet[i].col}`;
            if (fScore[key] < currentMin) {
                currentMin = fScore[key];
                currentIdx = i;
            }
        }
        
        const current = openSet.splice(currentIdx, 1)[0];
        const currentKey = `${current.row},${current.col}`;
        closedSet.add(currentKey);
        visitedCount++;
        
        // 如果到達終點
        if (current.row === endPos.row && current.col === endPos.col) {
            const path = reconstructPath(cameFrom, current);
            const endTime = performance.now();
            return {
                success: true,
                path: path,
                visitedCount: visitedCount,
                executionTime: endTime - startTime
            };
        }
        
        // 探索鄰居
        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            
            if (closedSet.has(neighborKey)) continue;
            
            const tentativeGScore = gScore[currentKey] + 1;
            
            if (!gScore[neighborKey] || tentativeGScore < gScore[neighborKey]) {
                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = gScore[neighborKey] + manhattanDistance(neighbor, endPos);
                
                if (!openSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    const endTime = performance.now();
    return {
        success: false,
        visitedCount: visitedCount,
        executionTime: endTime - startTime
    };
}

// Dijkstra 演算法
function dijkstra() {
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = {};
    const distance = {};
    
    // 初始化
    const startKey = `${startPos.row},${startPos.col}`;
    distance[startKey] = 0;
    openSet.push(startPos);
    
    const startTime = performance.now();
    let visitedCount = 0;
    
    while (openSet.length > 0) {
        // 找到距離最小的節點
        let currentIdx = 0;
        let currentMin = distance[`${openSet[0].row},${openSet[0].col}`];
        
        for (let i = 1; i < openSet.length; i++) {
            const key = `${openSet[i].row},${openSet[i].col}`;
            if (distance[key] < currentMin) {
                currentMin = distance[key];
                currentIdx = i;
            }
        }
        
        const current = openSet.splice(currentIdx, 1)[0];
        const currentKey = `${current.row},${current.col}`;
        closedSet.add(currentKey);
        visitedCount++;
        
        // 如果到達終點
        if (current.row === endPos.row && current.col === endPos.col) {
            const path = reconstructPath(cameFrom, current);
            const endTime = performance.now();
            return {
                success: true,
                path: path,
                visitedCount: visitedCount,
                executionTime: endTime - startTime
            };
        }
        
        // 探索鄰居
        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            
            if (closedSet.has(neighborKey)) continue;
            
            const tentativeDistance = distance[currentKey] + 1;
            
            if (!distance[neighborKey] || tentativeDistance < distance[neighborKey]) {
                cameFrom[neighborKey] = current;
                distance[neighborKey] = tentativeDistance;
                
                if (!openSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    const endTime = performance.now();
    return {
        success: false,
        visitedCount: visitedCount,
        executionTime: endTime - startTime
    };
}

// 重建路徑
function reconstructPath(cameFrom, current) {
    const path = [current];
    let currentKey = `${current.row},${current.col}`;
    
    while (cameFrom[currentKey]) {
        current = cameFrom[currentKey];
        path.unshift(current);
        currentKey = `${current.row},${current.col}`;
    }
    
    return path;
}

// 獲取鄰居節點
function getNeighbors(node) {
    const neighbors = [];
    const directions = [
        { row: -1, col: 0 }, // 上
        { row: 1, col: 0 },  // 下
        { row: 0, col: -1 }, // 左
        { row: 0, col: 1 }   // 右
    ];
    
    for (const dir of directions) {
        const newRow = node.row + dir.row;
        const newCol = node.col + dir.col;
        
        // 檢查邊界
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
            // 檢查是否不是障礙物
            if (grid[newRow][newCol] !== OBSTACLE) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
    }
    
    return neighbors;
}

// 執行動畫
function runAnimation(animationSteps, finalPath, visitedCount, executionTime) {
    let stepIndex = 0;
    const totalSteps = animationSteps.length;
    
    statusElement.textContent = '搜尋中';
    
    function animateStep() {
        if (stepIndex < totalSteps) {
            const step = animationSteps[stepIndex];
            const { type, position } = step;
            
            if (type === 'open') {
                if (grid[position.row][position.col] !== START && 
                    grid[position.row][position.col] !== END) {
                    grid[position.row][position.col] = OPEN;
                }
            } else if (type === 'closed') {
                if (grid[position.row][position.col] !== START && 
                    grid[position.row][position.col] !== END) {
                    grid[position.row][position.col] = CLOSED;
                }
            }
            
            renderGrid();
            visitedCountElement.textContent = Math.min(stepIndex + 1, visitedCount);
            stepIndex++;
            animationTimeout = setTimeout(animateStep, 10);
        } else {
            // 顯示最終路徑
            if (finalPath && finalPath.length > 0) {
                // 移除起點和終點從路徑中（它們已經有顏色）
                for (let i = 1; i < finalPath.length - 1; i++) {
                    const pos = finalPath[i];
                    grid[pos.row][pos.col] = PATH;
                }
                renderGrid();
                pathLengthElement.textContent = finalPath.length - 1;
                statusElement.textContent = '找到路徑';
            } else {
                noPathMessage.style.display = 'block';
                statusElement.textContent = '無路徑';
            }
            
            executionTimeElement.textContent = executionTime.toFixed(2);
            isRunning = false;
            updateButtonStates();
        }
    }
    
    animateStep();
}

// 開始尋路
function startPathfinding() {
    if (isRunning) return;
    
    isRunning = true;
    updateButtonStates();
    clearPath();
    noPathMessage.style.display = 'none';
    
    const algorithm = algorithmSelect.value;
    let result;
    
    if (algorithm === 'astar') {
        result = astar();
    } else {
        result = dijkstra();
    }
    
    // 生成動畫步驟
    const animationSteps = [];
    const closedSet = new Set();
    const openSet = new Set();
    
    // 重新運行演算法來收集動畫步驟
    if (algorithm === 'astar') {
        const openSetArr = [];
        const closedSetSet = new Set();
        const cameFrom = {};
        const gScore = {};
        const fScore = {};
        
        const startKey = `${startPos.row},${startPos.col}`;
        gScore[startKey] = 0;
        fScore[startKey] = manhattanDistance(startPos, endPos);
        openSetArr.push(startPos);
        openSet.add(startKey);
        animationSteps.push({ type: 'open', position: startPos });
        
        while (openSetArr.length > 0 && !(result.success && closedSetSet.has(`${endPos.row},${endPos.col}`))) {
            let currentIdx = 0;
            let currentMin = fScore[`${openSetArr[0].row},${openSetArr[0].col}`];
            
            for (let i = 1; i < openSetArr.length; i++) {
                const key = `${openSetArr[i].row},${openSetArr[i].col}`;
                if (fScore[key] < currentMin) {
                    currentMin = fScore[key];
                    currentIdx = i;
                }
            }
            
            const current = openSetArr.splice(currentIdx, 1)[0];
            const currentKey = `${current.row},${current.col}`;
            closedSetSet.add(currentKey);
            closedSet.add(currentKey);
            animationSteps.push({ type: 'closed', position: current });
            
            if (current.row === endPos.row && current.col === endPos.col) {
                break;
            }
            
            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                
                if (closedSetSet.has(neighborKey)) continue;
                
                const tentativeGScore = gScore[currentKey] + 1;
                
                if (!gScore[neighborKey] || tentativeGScore < gScore[neighborKey]) {
                    cameFrom[neighborKey] = current;
                    gScore[neighborKey] = tentativeGScore;
                    fScore[neighborKey] = gScore[neighborKey] + manhattanDistance(neighbor, endPos);
                    
                    if (!openSetArr.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                        openSetArr.push(neighbor);
                        openSet.add(neighborKey);
                        animationSteps.push({ type: 'open', position: neighbor });
                    }
                }
            }
        }
    } else {
        const openSetArr = [];
        const closedSetSet = new Set();
        const cameFrom = {};
        const distance = {};
        
        const startKey = `${startPos.row},${startPos.col}`;
        distance[startKey] = 0;
        openSetArr.push(startPos);
        openSet.add(startKey);
        animationSteps.push({ type: 'open', position: startPos });
        
        while (openSetArr.length > 0 && !(result.success && closedSetSet.has(`${endPos.row},${endPos.col}`))) {
            let currentIdx = 0;
            let currentMin = distance[`${openSetArr[0].row},${openSetArr[0].col}`];
            
            for (let i = 1; i < openSetArr.length; i++) {
                const key = `${openSetArr[i].row},${openSetArr[i].col}`;
                if (distance[key] < currentMin) {
                    currentMin = distance[key];
                    currentIdx = i;
                }
            }
            
            const current = openSetArr.splice(currentIdx, 1)[0];
            const currentKey = `${current.row},${current.col}`;
            closedSetSet.add(currentKey);
            closedSet.add(currentKey);
            animationSteps.push({ type: 'closed', position: current });
            
            if (current.row === endPos.row && current.col === endPos.col) {
                break;
            }
            
            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                
                if (closedSetSet.has(neighborKey)) continue;
                
                const tentativeDistance = distance[currentKey] + 1;
                
                if (!distance[neighborKey] || tentativeDistance < distance[neighborKey]) {
                    cameFrom[neighborKey] = current;
                    distance[neighborKey] = tentativeDistance;
                    
                    if (!openSetArr.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                        openSetArr.push(neighbor);
                        openSet.add(neighborKey);
                        animationSteps.push({ type: 'open', position: neighbor });
                    }
                }
            }
        }
    }
    
    // 開始動畫
    runAnimation(animationSteps, result.success ? result.path : null, result.visitedCount, result.executionTime);
}

// 事件監聽器
setStartBtn.addEventListener('click', () => {
    if (isRunning) return;
    isSettingStart = true;
    isSettingEnd = false;
    updateButtonStates();
});

setEndBtn.addEventListener('click', () => {
    if (isRunning) return;
    isSettingEnd = true;
    isSettingStart = false;
    updateButtonStates();
});

clearPathBtn.addEventListener('click', clearPath);
resetBtn.addEventListener('click', reset);
startBtn.addEventListener('click', startPathfinding);

// 鼠標抬起事件
document.addEventListener('mouseup', () => {
    isDragging = false;
});

// 初始化
initializeGrid();
updateButtonStates();

// 防止右鍵菜單干擾
document.addEventListener('contextmenu', (e) => e.preventDefault());