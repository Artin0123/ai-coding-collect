// 尋路演算法視覺化工具 JavaScript 實現

class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.cellSize = 30;
        this.grid = [];
        this.start = { x: 2, y: 2 };
        this.end = { x: 12, y: 12 };
        this.isDragging = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isAnimating = false;
        this.animationSpeed = 10; // ms

        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.currentStatus = '就緒';

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
                    distance: Infinity,
                    heuristic: 0,
                    totalCost: Infinity,
                    parent: null,
                    visited: false
                };
            }
        }

        // 設定預設起點和終點
        this.grid[this.start.y][this.start.x].type = 'start';
        this.grid[this.end.y][this.end.x].type = 'end';
    }

    // 創建網格DOM元素
    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = `cell ${this.grid[y][x].type}`;
                cell.dataset.x = x;
                cell.dataset.y = y;

                // 添加鼠標事件監聽器
                cell.addEventListener('mousedown', (e) => this.handleMouseDown(e, x, y));
                cell.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, x, y));
                cell.addEventListener('mouseup', () => this.handleMouseUp());
                cell.addEventListener('click', () => this.handleCellClick(x, y));

                gridElement.appendChild(cell);
            }
        }
    }

    // 鼠標事件處理
    handleMouseDown(e, x, y) {
        if (this.isAnimating) return;

        const cell = this.grid[y][x];
        if (cell.type === 'start' || cell.type === 'end') return;

        this.isDragging = true;

        if (cell.type === 'obstacle') {
            cell.type = 'empty';
        } else {
            cell.type = 'obstacle';
        }

        this.updateCellDisplay(x, y);
        e.preventDefault();
    }

    handleMouseEnter(e, x, y) {
        if (this.isAnimating || !this.isDragging) return;

        const cell = this.grid[y][x];
        if (cell.type === 'start' || cell.type === 'end') return;

        if (cell.type !== 'obstacle') {
            cell.type = 'obstacle';
            this.updateCellDisplay(x, y);
        }
        e.preventDefault();
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    handleCellClick(x, y) {
        if (this.isAnimating) return;

        const cell = this.grid[y][x];

        if (this.isSettingStart) {
            // 清除舊的起點
            this.grid[this.start.y][this.start.x].type = 'empty';
            this.updateCellDisplay(this.start.x, this.start.y);

            // 設定新的起點
            this.start = { x, y };
            cell.type = 'start';
            this.updateCellDisplay(x, y);
            this.isSettingStart = false;
            this.updateButtonStates();

        } else if (this.isSettingEnd) {
            // 清除舊的終點
            this.grid[this.end.y][this.end.x].type = 'empty';
            this.updateCellDisplay(this.end.x, this.end.y);

            // 設定新的終點
            this.end = { x, y };
            cell.type = 'end';
            this.updateCellDisplay(x, y);
            this.isSettingEnd = false;
            this.updateButtonStates();

        } else if (cell.type !== 'start' && cell.type !== 'end') {
            // 切換障礙物狀態
            if (cell.type === 'obstacle') {
                cell.type = 'empty';
            } else {
                cell.type = 'obstacle';
            }
            this.updateCellDisplay(x, y);
        }
    }

    // 更新單元格顯示
    updateCellDisplay(x, y) {
        const cellElement = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cellElement) {
            cellElement.className = `cell ${this.grid[y][x].type}`;
        }
    }

    // 設定事件監聽器
    setupEventListeners() {
        // 控制面板按鈕
        document.getElementById('setStartBtn').addEventListener('click', () => {
            this.isSettingStart = true;
            this.isSettingEnd = false;
            this.updateButtonStates();
        });

        document.getElementById('setEndBtn').addEventListener('click', () => {
            this.isSettingEnd = true;
            this.isSettingStart = false;
            this.updateButtonStates();
        });

        document.getElementById('clearPathBtn').addEventListener('click', () => {
            this.clearPath();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.startPathfinding();
        });

        // 防止鼠標拖拽選擇文字
        document.addEventListener('selectstart', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
            }
        });
    }

    // 更新按鈕狀態
    updateButtonStates() {
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        const startBtn = document.getElementById('startBtn');

        setStartBtn.disabled = this.isSettingStart || this.isAnimating;
        setEndBtn.disabled = this.isSettingEnd || this.isAnimating;
        startBtn.disabled = this.isAnimating;

        if (this.isSettingStart) {
            setStartBtn.style.backgroundColor = '#e74c3c';
        } else {
            setStartBtn.style.backgroundColor = '';
        }

        if (this.isSettingEnd) {
            setEndBtn.style.backgroundColor = '#e74c3c';
        } else {
            setEndBtn.style.backgroundColor = '';
        }
    }

    // 清除路徑
    clearPath() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                if (cell.type === 'open' || cell.type === 'closed' || cell.type === 'path') {
                    cell.type = 'empty';
                    cell.distance = Infinity;
                    cell.heuristic = 0;
                    cell.totalCost = Infinity;
                    cell.parent = null;
                    cell.visited = false;
                    this.updateCellDisplay(x, y);
                }
            }
        }
        this.updateStats();
    }

    // 完全重置
    reset() {
        this.initializeGrid();
        this.createGrid();
        this.updateStats();
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.updateButtonStates();
        this.hideErrorMessage();
    }

    // 開始尋路
    async startPathfinding() {
        if (this.isAnimating) return;

        const algorithm = document.getElementById('algorithmSelect').value;
        this.clearPath();
        this.isAnimating = true;
        this.updateButtonStates();
        this.updateStats('搜尋中');

        const startTime = performance.now();

        try {
            let path = [];
            if (algorithm === 'astar') {
                path = await this.aStar();
            } else {
                path = await this.dijkstra();
            }

            const endTime = performance.now();
            this.executionTime = Math.round(endTime - startTime);

            if (path.length > 0) {
                await this.animatePath(path);
                this.updateStats('找到路徑');
                this.showErrorMessage('');
            } else {
                this.updateStats('無路徑');
                this.showErrorMessage('無法找到路徑');
            }
        } catch (error) {
            console.error('尋路過程中發生錯誤:', error);
            this.updateStats('錯誤');
            this.showErrorMessage('尋路過程中發生錯誤');
        }

        this.isAnimating = false;
        this.updateButtonStates();
    }

    // A* 演算法實現
    async aStar() {
        // 重置所有單元格狀態
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                cell.distance = Infinity;
                cell.heuristic = 0;
                cell.totalCost = Infinity;
                cell.parent = null;
                cell.visited = false;
            }
        }

        const openSet = [];
        const startCell = this.grid[this.start.y][this.start.x];
        const endCell = this.grid[this.end.y][this.end.x];

        startCell.distance = 0;
        startCell.heuristic = this.manhattanDistance(startCell, endCell);
        startCell.totalCost = startCell.heuristic;

        openSet.push(startCell);

        while (openSet.length > 0) {
            // 找到總成本最低的單元格
            openSet.sort((a, b) => a.totalCost - b.totalCost);
            const current = openSet.shift();

            if (current === endCell) {
                return this.reconstructPath(endCell);
            }

            current.visited = true;
            current.type = 'closed';
            this.visitedCount++;

            // 檢查所有鄰居
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                if (neighbor.visited || neighbor.type === 'obstacle') continue;

                const tentativeDistance = current.distance + 1;
                if (tentativeDistance < neighbor.distance) {
                    neighbor.distance = tentativeDistance;
                    neighbor.heuristic = this.manhattanDistance(neighbor, endCell);
                    neighbor.totalCost = neighbor.distance + neighbor.heuristic;
                    neighbor.parent = current;

                    if (!openSet.includes(neighbor)) {
                        neighbor.type = 'open';
                        openSet.push(neighbor);
                        this.updateCellDisplay(neighbor.x, neighbor.y);
                        await this.sleep(this.animationSpeed);
                    }
                }
            }
        }

        return [];
    }

    // Dijkstra 演算法實現
    async dijkstra() {
        // 重置所有單元格狀態
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                cell.distance = Infinity;
                cell.parent = null;
                cell.visited = false;
            }
        }

        const unvisited = [];
        const startCell = this.grid[this.start.y][this.start.x];
        const endCell = this.grid[this.end.y][this.end.x];

        startCell.distance = 0;
        unvisited.push(startCell);

        while (unvisited.length > 0) {
            // 找到距離最小的單元格
            unvisited.sort((a, b) => a.distance - b.distance);
            const current = unvisited.shift();

            if (current === endCell) {
                return this.reconstructPath(endCell);
            }

            current.visited = true;
            current.type = 'closed';
            this.visitedCount++;

            // 檢查所有鄰居
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                if (neighbor.visited || neighbor.type === 'obstacle') continue;

                const tentativeDistance = current.distance + 1;
                if (tentativeDistance < neighbor.distance) {
                    neighbor.distance = tentativeDistance;
                    neighbor.parent = current;

                    if (!unvisited.includes(neighbor)) {
                        neighbor.type = 'open';
                        unvisited.push(neighbor);
                        this.updateCellDisplay(neighbor.x, neighbor.y);
                        await this.sleep(this.animationSpeed);
                    }
                }
            }
        }

        return [];
    }

    // 獲取鄰居單元格
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }  // 左
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                neighbors.push(this.grid[ny][nx]);
            }
        }

        return neighbors;
    }

    // 曼哈頓距離啟發式函數
    manhattanDistance(cell1, cell2) {
        return Math.abs(cell1.x - cell2.x) + Math.abs(cell1.y - cell2.y);
    }

    // 重建路徑
    reconstructPath(endCell) {
        const path = [];
        let current = endCell;

        while (current !== null) {
            path.unshift(current);
            current = current.parent;
        }

        return path;
    }

    // 動畫顯示最終路徑
    async animatePath(path) {
        this.pathLength = path.length - 1; // 減去起點

        for (let i = 1; i < path.length - 1; i++) { // 不包含起點和終點
            const cell = path[i];
            cell.type = 'path';
            this.updateCellDisplay(cell.x, cell.y);
            await this.sleep(this.animationSpeed * 2);
        }
    }

    // 睡眠函數
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 更新統計資訊
    updateStats(status = null) {
        document.getElementById('visitedCount').textContent = `${this.visitedCount} 個`;
        document.getElementById('pathLength').textContent = `${this.pathLength} 步`;
        document.getElementById('executionTime').textContent = `${this.executionTime} ms`;

        if (status) {
            this.currentStatus = status;
        }
        document.getElementById('currentStatus').textContent = this.currentStatus;
    }

    // 顯示錯誤訊息
    showErrorMessage(message) {
        const errorElement = document.getElementById('errorMessage');
        if (message) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        } else {
            errorElement.classList.add('hidden');
        }
    }

    // 隱藏錯誤訊息
    hideErrorMessage() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    // 更新顯示
    updateDisplay() {
        this.createGrid();
        this.updateStats();
        this.updateButtonStates();
    }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new PathfindingVisualizer();
});
