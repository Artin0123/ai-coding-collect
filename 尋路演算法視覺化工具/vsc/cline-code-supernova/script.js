// 尋路演算法視覺化工具 - JavaScript 實現

class PathfindingVisualizer {
    constructor() {
        this.gridSize = 25;
        this.cellSize = 20;
        this.grid = [];
        this.start = { x: 2, y: 2 };
        this.end = { x: 22, y: 22 };
        this.isDragging = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isAnimating = false;
        this.animationSpeed = 10;

        this.initializeGrid();
        this.setupEventListeners();
        this.updateDisplay();
    }

    // 初始化網格
    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = {
                    x,
                    y,
                    type: 'empty', // empty, start, end, obstacle, open, closed, path
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null
                };
            }
        }

        // 設定預設起點和終點
        this.grid[this.start.y][this.start.x].type = 'start';
        this.grid[this.end.y][this.end.x].type = 'end';
    }

    // 設定事件監聽器
    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        const clearPathBtn = document.getElementById('clearPathBtn');
        const resetBtn = document.getElementById('resetBtn');
        const startBtn = document.getElementById('startBtn');

        // 網格點擊事件
        gridElement.addEventListener('click', (e) => this.handleGridClick(e));
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        gridElement.addEventListener('mouseleave', () => this.handleMouseUp());

        // 按鈕事件
        setStartBtn.addEventListener('click', () => this.setMode('start'));
        setEndBtn.addEventListener('click', () => this.setMode('end'));
        clearPathBtn.addEventListener('click', () => this.clearPath());
        resetBtn.addEventListener('click', () => this.reset());
        startBtn.addEventListener('click', () => this.startPathfinding());
    }

    // 處理網格點擊
    handleGridClick(e) {
        if (this.isAnimating) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        if (this.isSettingStart) {
            this.setStart(x, y);
            this.isSettingStart = false;
            this.updateButtonStates();
        } else if (this.isSettingEnd) {
            this.setEnd(x, y);
            this.isSettingEnd = false;
            this.updateButtonStates();
        } else if (!this.isDragging) {
            this.toggleObstacle(x, y);
        }
    }

    // 處理鼠標按下
    handleMouseDown(e) {
        if (this.isAnimating || this.isSettingStart || this.isSettingEnd) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        // 檢查是否點擊在起點或終點上
        if (this.grid[y][x].type === 'start' || this.grid[y][x].type === 'end') {
            return;
        }

        this.isDragging = true;
        this.toggleObstacle(x, y);
    }

    // 處理鼠標移動
    handleMouseMove(e) {
        if (!this.isDragging || this.isAnimating || this.isSettingStart || this.isSettingEnd) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        // 檢查是否在起點或終點上，且只有在格子為空時才設置障礙物
        if (this.grid[y][x].type !== 'start' && this.grid[y][x].type !== 'end' && this.grid[y][x].type !== 'obstacle') {
            this.grid[y][x].type = 'obstacle';
            this.updateCellDisplay(x, y);
        }
    }

    // 處理鼠標釋放
    handleMouseUp() {
        this.isDragging = false;
    }

    // 設定模式
    setMode(mode) {
        if (this.isAnimating) return;

        this.isSettingStart = mode === 'start';
        this.isSettingEnd = mode === 'end';

        this.updateButtonStates();

        if (this.isSettingStart || this.isSettingEnd) {
            document.body.style.cursor = 'crosshair';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    // 設定起點
    setStart(x, y) {
        // 清除舊的起點
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j].type === 'start') {
                    this.grid[i][j].type = 'empty';
                    this.updateCellDisplay(j, i);
                }
            }
        }

        // 設定新起點
        this.start = { x, y };
        this.grid[y][x].type = 'start';
        this.updateCellDisplay(x, y);
    }

    // 設定終點
    setEnd(x, y) {
        // 清除舊的終點
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j].type === 'end') {
                    this.grid[i][j].type = 'empty';
                    this.updateCellDisplay(j, i);
                }
            }
        }

        // 設定新終點
        this.end = { x, y };
        this.grid[y][x].type = 'end';
        this.updateCellDisplay(x, y);
    }

    // 切換障礙物
    toggleObstacle(x, y) {
        if (this.grid[y][x].type === 'start' || this.grid[y][x].type === 'end') {
            return;
        }

        this.grid[y][x].type = this.grid[y][x].type === 'obstacle' ? 'empty' : 'obstacle';
        this.updateCellDisplay(x, y);
    }

    // 更新格子顯示
    updateCellDisplay(x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.className = `cell ${this.grid[y][x].type}`;
        }
    }

    // 更新按鈕狀態
    updateButtonStates() {
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        const startBtn = document.getElementById('startBtn');

        setStartBtn.classList.toggle('active', this.isSettingStart);
        setEndBtn.classList.toggle('active', this.isSettingEnd);
        startBtn.disabled = this.isSettingStart || this.isSettingEnd;
    }

    // 清除路徑
    clearPath() {
        if (this.isAnimating) return;

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x].type === 'open' || this.grid[y][x].type === 'closed' || this.grid[y][x].type === 'path') {
                    this.grid[y][x].type = 'empty';
                    this.updateCellDisplay(x, y);
                }
            }
        }

        this.updateStats(0, 0, 0, '就緒');
    }

    // 重置網格
    reset() {
        if (this.isAnimating) return;

        this.initializeGrid();
        this.updateDisplay();
        this.updateStats(0, 0, 0, '就緒');
        this.hideError();
    }

    // 更新顯示
    updateDisplay() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = `cell ${this.grid[y][x].type}`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                gridElement.appendChild(cell);
            }
        }
    }

    // 更新統計資訊
    updateStats(visitedCount, pathLength, executionTime, status) {
        document.getElementById('visitedCount').textContent = `${visitedCount} 個`;
        document.getElementById('pathLength').textContent = `${pathLength} 步`;
        document.getElementById('executionTime').textContent = `${executionTime} ms`;
        document.getElementById('currentStatus').textContent = status;
    }

    // 顯示錯誤訊息
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    // 隱藏錯誤訊息
    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    // 開始尋路
    async startPathfinding() {
        if (this.isAnimating) return;

        const algorithm = document.getElementById('algorithmSelect').value;
        this.isAnimating = true;
        this.updateButtonStates();
        this.hideError();

        const startTime = performance.now();

        try {
            let path = [];
            let visitedCount = 0;

            switch (algorithm) {
                case 'astar':
                    const astarResult = this.aStar();
                    path = astarResult.path;
                    visitedCount = astarResult.visitedCount;
                    break;
                case 'dijkstra':
                    const dijkstraResult = this.dijkstra();
                    path = dijkstraResult.path;
                    visitedCount = dijkstraResult.visitedCount;
                    break;
                case 'bfs':
                    const bfsResult = this.bfs();
                    path = bfsResult.path;
                    visitedCount = bfsResult.visitedCount;
                    break;
            }

            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime);

            if (path.length === 0) {
                this.updateStats(visitedCount, 0, executionTime, '無路徑');
                this.showError('無法找到路徑');
            } else {
                await this.animatePath(path, visitedCount, executionTime);
            }
        } catch (error) {
            console.error('尋路過程中發生錯誤:', error);
            this.showError('尋路過程中發生錯誤');
        } finally {
            this.isAnimating = false;
            this.updateButtonStates();
        }
    }

    // A* 演算法
    aStar() {
        const openSet = [];
        const closedSet = new Set();
        let visitedCount = 0;

        // 將起點加入開放列表
        const startNode = this.grid[this.start.y][this.start.x];
        startNode.g = 0;
        startNode.h = this.manhattanDistance(this.start, this.end);
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);

        while (openSet.length > 0) {
            // 找到 f 值最小的節點
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();

            if (current.x === this.end.x && current.y === this.end.y) {
                return {
                    path: this.reconstructPath(current),
                    visitedCount: visitedCount
                };
            }

            closedSet.add(`${current.x},${current.y}`);

            // 檢查相鄰節點
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborKey) || neighbor.type === 'obstacle') {
                    continue;
                }

                const tentativeG = current.g + 1;

                if (!openSet.includes(neighbor) || tentativeG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tentativeG;
                    neighbor.h = this.manhattanDistance({ x: neighbor.x, y: neighbor.y }, this.end);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        visitedCount++;
                    }
                }
            }
        }

        return { path: [], visitedCount: visitedCount };
    }

    // Dijkstra 演算法
    dijkstra() {
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        let visitedCount = 0;

        // 初始化距離
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const key = `${x},${y}`;
                distances[key] = Infinity;
                previous[key] = null;
                unvisited.add(key);
            }
        }

        distances[`${this.start.x},${this.start.y}`] = 0;

        while (unvisited.size > 0) {
            // 找到距離最小的未訪問節點
            let minDistance = Infinity;
            let currentKey = null;

            for (const key of unvisited) {
                const [x, y] = key.split(',').map(Number);
                if (distances[key] < minDistance) {
                    minDistance = distances[key];
                    currentKey = key;
                }
            }

            if (currentKey === null || minDistance === Infinity) {
                break;
            }

            const [currentX, currentY] = currentKey.split(',').map(Number);

            if (currentX === this.end.x && currentY === this.end.y) {
                const path = this.reconstructPathDijkstra(previous, currentKey);
                return { path, visitedCount };
            }

            unvisited.delete(currentKey);
            visitedCount++;

            // 檢查相鄰節點
            const neighbors = this.getNeighbors(currentX, currentY);
            for (const neighbor of neighbors) {
                if (neighbor.type === 'obstacle') continue;

                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (!unvisited.has(neighborKey)) continue;

                const distance = distances[currentKey] + 1;

                if (distance < distances[neighborKey]) {
                    distances[neighborKey] = distance;
                    previous[neighborKey] = currentKey;
                }
            }
        }

        return { path: [], visitedCount };
    }

    // BFS 演算法
    bfs() {
        const queue = [];
        const visited = new Set();
        const parent = {};
        let visitedCount = 0;

        const startKey = `${this.start.x},${this.start.y}`;
        queue.push(startKey);
        visited.add(startKey);

        while (queue.length > 0) {
            const currentKey = queue.shift();
            const [currentX, currentY] = currentKey.split(',').map(Number);

            if (currentX === this.end.x && currentY === this.end.y) {
                const path = this.reconstructPathBFS(parent, currentKey);
                return { path, visitedCount };
            }

            visitedCount++;

            // 檢查相鄰節點
            const neighbors = this.getNeighbors(currentX, currentY);
            for (const neighbor of neighbors) {
                if (neighbor.type === 'obstacle') continue;

                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (visited.has(neighborKey)) continue;

                queue.push(neighborKey);
                visited.add(neighborKey);
                parent[neighborKey] = currentKey;
            }
        }

        return { path: [], visitedCount };
    }

    // 獲取相鄰節點
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // 上
            { x: 1, y: 0 },  // 右
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }  // 左
        ];

        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;

            if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
                neighbors.push(this.grid[newY][newX]);
            }
        }

        return neighbors;
    }

    // 曼哈頓距離
    manhattanDistance(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    // 重建路徑（A*）
    reconstructPath(endNode) {
        const path = [];
        let current = endNode;

        while (current !== null) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }

        return path;
    }

    // 重建路徑（Dijkstra）
    reconstructPathDijkstra(previous, endKey) {
        const path = [];
        let current = endKey;

        while (current !== null) {
            const [x, y] = current.split(',').map(Number);
            path.unshift({ x, y });
            current = previous[current];
        }

        return path;
    }

    // 重建路徑（BFS）
    reconstructPathBFS(parent, endKey) {
        const path = [];
        let current = endKey;

        while (current !== undefined) {
            const [x, y] = current.split(',').map(Number);
            path.unshift({ x, y });
            current = parent[current];
        }

        return path;
    }

    // 動畫顯示路徑
    async animatePath(path, visitedCount, executionTime) {
        // 先顯示搜尋過程
        for (let i = 1; i < path.length - 1; i++) {
            const node = path[i];
            if (this.grid[node.y][node.x].type !== 'start' && this.grid[node.y][node.x].type !== 'end') {
                this.grid[node.y][node.x].type = 'path';
                this.updateCellDisplay(node.x, node.y);
            }
            await this.sleep(this.animationSpeed);
        }

        // 更新統計資訊
        this.updateStats(visitedCount, path.length - 1, executionTime, '找到路徑');
    }

    // 睡眠函數
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 當頁面載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});
