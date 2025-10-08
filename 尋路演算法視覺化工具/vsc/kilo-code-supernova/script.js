// 網格系統和格子狀態管理
class Grid {
    constructor() {
        this.rows = 25;
        this.cols = 25;
        this.grid = [];
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 22, col: 22 };
        this.isDragging = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isAnimating = false;

        this.init();
    }

    init() {
        this.createGrid();
        this.bindEvents();
        this.resetGrid();
    }

    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // 添加坐標屬性以便於演算法使用
                cell.row = row;
                cell.col = col;
                cell.isObstacle = false;
                cell.isStart = false;
                cell.isEnd = false;
                cell.isPath = false;
                cell.isOpen = false;
                cell.isClosed = false;

                this.grid[row][col] = cell;
                gridElement.appendChild(cell);
            }
        }
    }

    resetGrid() {
        // 重置所有格子狀態
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                this.clearCellState(cell);
                cell.isObstacle = false;
            }
        }

        // 設定預設起點和終點
        this.setStart(this.startPos.row, this.startPos.col);
        this.setEnd(this.endPos.row, this.endPos.col);

        this.updateStats();
    }

    clearCellState(cell) {
        cell.className = 'cell';
        cell.isStart = false;
        cell.isEnd = false;
        cell.isObstacle = false;
        cell.isPath = false;
        cell.isOpen = false;
        cell.isClosed = false;
    }

    setStart(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            // 清除舊的起點
            if (this.startPos) {
                const oldStart = this.grid[this.startPos.row][this.startPos.col];
                this.clearCellState(oldStart);
            }

            // 設定新的起點
            const cell = this.grid[row][col];
            this.clearCellState(cell);
            cell.classList.add('start');
            cell.isStart = true;
            this.startPos = { row, col };
        }
    }

    setEnd(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            // 清除舊的終點
            if (this.endPos) {
                const oldEnd = this.grid[this.endPos.row][this.endPos.col];
                this.clearCellState(oldEnd);
            }

            // 設定新的終點
            const cell = this.grid[row][col];
            this.clearCellState(cell);
            cell.classList.add('end');
            cell.isEnd = true;
            this.endPos = { row, col };
        }
    }

    toggleObstacle(row, col) {
        const cell = this.grid[row][col];
        if (!cell.isStart && !cell.isEnd && !this.isAnimating) {
            if (cell.isObstacle) {
                this.clearCellState(cell);
                cell.isObstacle = false;
            } else {
                this.clearCellState(cell);
                cell.classList.add('obstacle');
                cell.isObstacle = true;
            }
        }
    }

    setCellState(cell, state) {
        this.clearCellState(cell);

        switch (state) {
            case 'start':
                cell.classList.add('start');
                cell.isStart = true;
                break;
            case 'end':
                cell.classList.add('end');
                cell.isEnd = true;
                break;
            case 'obstacle':
                cell.classList.add('obstacle');
                cell.isObstacle = true;
                break;
            case 'open':
                cell.classList.add('open');
                cell.isOpen = true;
                break;
            case 'closed':
                cell.classList.add('closed');
                cell.isClosed = true;
                break;
            case 'path':
                cell.classList.add('path');
                cell.isPath = true;
                break;
        }
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];

        directions.forEach(dir => {
            const newRow = row + dir.row;
            const newCol = col + dir.col;

            if (newRow >= 0 && newRow < this.rows &&
                newCol >= 0 && newCol < this.cols &&
                !this.grid[newRow][newCol].isObstacle) {
                neighbors.push({
                    cell: this.grid[newRow][newCol],
                    row: newRow,
                    col: newCol
                });
            }
        });

        return neighbors;
    }

    updateStats(visitedCount = 0, pathLength = 0, executionTime = 0, status = '就緒') {
        document.getElementById('visitedCount').textContent = `${visitedCount} 個`;
        document.getElementById('pathLength').textContent = `${pathLength} 步`;
        document.getElementById('executionTime').textContent = `${executionTime} ms`;
        document.getElementById('currentStatus').textContent = status;
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        setTimeout(() => {
            document.getElementById('errorMessage').textContent = '';
        }, 3000);
    }

    bindEvents() {
        const gridElement = document.getElementById('grid');

        // 鼠標按下事件
        gridElement.addEventListener('mousedown', (e) => {
            const cell = e.target;
            if (cell.classList.contains('cell')) {
                this.isDragging = true;

                if (this.isSettingStart) {
                    this.setStart(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
                    this.isSettingStart = false;
                    document.getElementById('setStartBtn').classList.remove('active');
                } else if (this.isSettingEnd) {
                    this.setEnd(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
                    this.isSettingEnd = false;
                    document.getElementById('setEndBtn').classList.remove('active');
                } else {
                    this.toggleObstacle(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
                }
            }
        });

        // 鼠標移動事件（拖曳）
        gridElement.addEventListener('mousemove', (e) => {
            if (this.isDragging && !this.isSettingStart && !this.isSettingEnd) {
                const cell = e.target;
                if (cell.classList.contains('cell')) {
                    this.toggleObstacle(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
                }
            }
        });

        // 鼠標鬆開事件
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // 點擊事件（單獨點擊）
        gridElement.addEventListener('click', (e) => {
            const cell = e.target;
            if (cell.classList.contains('cell') && !this.isDragging) {
                if (this.isSettingStart) {
                    this.setStart(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
                    this.isSettingStart = false;
                    document.getElementById('setStartBtn').classList.remove('active');
                } else if (this.isSettingEnd) {
                    this.setEnd(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
                    this.isSettingEnd = false;
                    document.getElementById('setEndBtn').classList.remove('active');
                } else if (!this.isAnimating) {
                    this.toggleObstacle(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
                }
            }
        });
    }
}

// 優先佇列類別（用於演算法）
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
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }
}

// 演算法管理器
class AlgorithmManager {
    constructor(grid) {
        this.grid = grid;
        this.animationSpeed = 5; // 5ms per step
    }

    // 計算曼哈頓距離
    manhattanDistance(row1, col1, row2, col2) {
        return Math.abs(row1 - row2) + Math.abs(col1 - col2);
    }

    // 重建路徑
    reconstructPath(cameFrom, current) {
        const path = [];
        while (cameFrom.has(`${current.row},${current.col}`)) {
            path.unshift(current);
            const prevKey = cameFrom.get(`${current.row},${current.col}`);
            const [prevRow, prevCol] = prevKey.split(',').map(Number);
            current = { row: prevRow, col: prevCol };
        }
        return path;
    }

    // 清除搜尋結果
    clearSearch() {
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const cell = this.grid.grid[row][col];
                if (cell.isOpen || cell.isClosed) {
                    this.grid.clearCellState(cell);
                }
            }
        }
    }

    // A* 演算法
    async aStar() {
        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        this.closedSet = closedSet;

        const startKey = `${this.grid.startPos.row},${this.grid.startPos.col}`;
        const endKey = `${this.grid.endPos.row},${this.grid.endPos.col}`;

        // 初始化起點
        gScore.set(startKey, 0);
        fScore.set(startKey, this.manhattanDistance(
            this.grid.startPos.row, this.grid.startPos.col,
            this.grid.endPos.row, this.grid.endPos.col
        ));

        openSet.enqueue(this.grid.startPos, fScore.get(startKey));

        while (!openSet.isEmpty()) {
            const current = openSet.dequeue().element;
            const currentKey = `${current.row},${current.col}`;

            if (currentKey === endKey) {
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            // 標記為封閉集合（動畫效果）
            if (!this.grid.grid[current.row][current.col].isStart &&
                !this.grid.grid[current.row][current.col].isEnd) {
                this.grid.setCellState(this.grid.grid[current.row][current.col], 'closed');
                await this.sleep(this.animationSpeed);
            }

            const neighbors = this.grid.getNeighbors(current.row, current.col);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;

                if (closedSet.has(neighborKey)) {
                    continue;
                }

                const tentativeGScore = gScore.get(currentKey) + 1;

                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, currentKey);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.manhattanDistance(
                        neighbor.row, neighbor.col,
                        this.grid.endPos.row, this.grid.endPos.col
                    ));

                    if (!openSet.items.some(item => item.element.row === neighbor.row && item.element.col === neighbor.col)) {
                        openSet.enqueue(neighbor, fScore.get(neighborKey));

                        // 標記為開放集合（動畫效果）
                        if (!this.grid.grid[neighbor.row][neighbor.col].isStart &&
                            !this.grid.grid[neighbor.row][neighbor.col].isEnd) {
                            this.grid.setCellState(this.grid.grid[neighbor.row][neighbor.col], 'open');
                            await this.sleep(this.animationSpeed);
                        }
                    }
                }
            }
        }

        return null; // 沒有找到路徑
    }

    // Dijkstra 演算法
    async dijkstra() {
        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const cameFrom = new Map();
        const dist = new Map();

        this.closedSet = closedSet;

        const startKey = `${this.grid.startPos.row},${this.grid.startPos.col}`;
        const endKey = `${this.grid.endPos.row},${this.grid.endPos.col}`;

        // 初始化起點
        dist.set(startKey, 0);
        openSet.enqueue(this.grid.startPos, 0);

        while (!openSet.isEmpty()) {
            const current = openSet.dequeue().element;
            const currentKey = `${current.row},${current.col}`;

            if (currentKey === endKey) {
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            // 標記為封閉集合（動畫效果）
            if (!this.grid.grid[current.row][current.col].isStart &&
                !this.grid.grid[current.row][current.col].isEnd) {
                this.grid.setCellState(this.grid.grid[current.row][current.col], 'closed');
                await this.sleep(this.animationSpeed);
            }

            const neighbors = this.grid.getNeighbors(current.row, current.col);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;

                if (closedSet.has(neighborKey)) {
                    continue;
                }

                const alt = (dist.get(currentKey) || 0) + 1;

                if (!dist.has(neighborKey) || alt < dist.get(neighborKey)) {
                    dist.set(neighborKey, alt);
                    cameFrom.set(neighborKey, currentKey);

                    if (!openSet.items.some(item => item.element.row === neighbor.row && item.element.col === neighbor.col)) {
                        openSet.enqueue(neighbor, alt);

                        // 標記為開放集合（動畫效果）
                        if (!this.grid.grid[neighbor.row][neighbor.col].isStart &&
                            !this.grid.grid[neighbor.row][neighbor.col].isEnd) {
                            this.grid.setCellState(this.grid.grid[neighbor.row][neighbor.col], 'open');
                            await this.sleep(this.animationSpeed);
                        }
                    }
                }
            }
        }

        return null; // 沒有找到路徑
    }

    // 顯示最終路徑
    async showPath(path) {
        for (let i = 1; i < path.length - 1; i++) { // 排除起點和終點
            const cell = this.grid.grid[path[i].row][path[i].col];
            if (!cell.isStart && !cell.isEnd) {
                this.grid.setCellState(cell, 'path');
                await this.sleep(this.animationSpeed * 2); // 路徑顯示稍微慢一點
            }
        }
    }

    // 延遲函數
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 全域變數
let grid;
let algorithmManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    grid = new Grid();
    algorithmManager = new AlgorithmManager(grid);

    // 綁定控制面板事件
    bindControlEvents();
});

// 綁定控制面板事件
function bindControlEvents() {
    // 設定起點按鈕
    document.getElementById('setStartBtn').addEventListener('click', () => {
        if (!grid.isAnimating) {
            grid.isSettingStart = !grid.isSettingStart;
            grid.isSettingEnd = false;
            document.getElementById('setEndBtn').classList.remove('active');

            const btn = document.getElementById('setStartBtn');
            if (grid.isSettingStart) {
                btn.classList.add('active');
                grid.updateStats(0, 0, 0, '設定起點中');
            } else {
                btn.classList.remove('active');
                grid.updateStats();
            }
        }
    });

    // 設定終點按鈕
    document.getElementById('setEndBtn').addEventListener('click', () => {
        if (!grid.isAnimating) {
            grid.isSettingEnd = !grid.isSettingEnd;
            grid.isSettingStart = false;
            document.getElementById('setStartBtn').classList.remove('active');

            const btn = document.getElementById('setEndBtn');
            if (grid.isSettingEnd) {
                btn.classList.add('active');
                grid.updateStats(0, 0, 0, '設定終點中');
            } else {
                btn.classList.remove('active');
                grid.updateStats();
            }
        }
    });

    // 清除路徑按鈕
    document.getElementById('clearPathBtn').addEventListener('click', () => {
        if (!grid.isAnimating) {
            algorithmManager.clearSearch();
            grid.updateStats(0, 0, 0, '就緒');
        }
    });

    // 完全重置按鈕
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (!grid.isAnimating) {
            grid.resetGrid();
        }
    });

    // 開始尋路按鈕
    document.getElementById('startBtn').addEventListener('click', () => {
        if (!grid.isAnimating) {
            const algorithm = document.getElementById('algorithmSelect').value;
            startPathfinding(algorithm);
        }
    });
}

// 開始尋路
async function startPathfinding(algorithm) {
    grid.isAnimating = true;
    algorithmManager.clearSearch();

    // 禁用所有控制按鈕
    toggleControls(true);

    const startTime = performance.now();

    try {
        let path;
        if (algorithm === 'astar') {
            path = await algorithmManager.aStar();
        } else {
            path = await algorithmManager.dijkstra();
        }

        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);

        if (path && path.length > 0) {
            // 顯示最終路徑
            await algorithmManager.showPath(path);
            grid.updateStats(algorithmManager.closedSet.size, path.length - 1, executionTime, '找到路徑');
        } else {
            grid.updateStats(algorithmManager.closedSet.size, 0, executionTime, '無路徑');
            grid.showError('無法找到路徑');
        }
    } catch (error) {
        console.error('尋路過程中發生錯誤:', error);
        grid.showError('尋路過程中發生錯誤');
    }

    // 重新啟用控制按鈕
    toggleControls(false);
    grid.isAnimating = false;
}

// 切換控制項狀態
function toggleControls(disabled) {
    const buttons = document.querySelectorAll('.control-btn, .algorithm-select');
    buttons.forEach(button => {
        button.disabled = disabled;
    });
}