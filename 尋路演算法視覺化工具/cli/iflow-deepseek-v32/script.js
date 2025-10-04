class PathfindingVisualizer {
    constructor() {
        this.gridSize = 25;
        this.grid = [];
        this.startNode = { row: 2, col: 2 };
        this.endNode = { row: 22, col: 22 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isMouseDown = false;
        this.isAnimating = false;
        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        
        this.initializeGrid();
        this.initializeEventListeners();
        this.renderGrid();
        this.updateStats();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    isStart: row === this.startNode.row && col === this.startNode.col,
                    isEnd: row === this.endNode.row && col === this.endNode.col,
                    isWall: false,
                    isOpen: false,
                    isClosed: false,
                    isPath: false,
                    gCost: Infinity,
                    hCost: 0,
                    fCost: Infinity,
                    parent: null
                };
            }
        }
    }

    initializeEventListeners() {
        const gridElement = document.getElementById('grid');
        const setStartBtn = document.getElementById('set-start-btn');
        const setEndBtn = document.getElementById('set-end-btn');
        const clearPathBtn = document.getElementById('clear-path-btn');
        const resetBtn = document.getElementById('reset-btn');
        const startBtn = document.getElementById('start-btn');
        
        // 滑鼠事件
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
        // 按鈕事件
        setStartBtn.addEventListener('click', () => this.toggleSetStart());
        setEndBtn.addEventListener('click', () => this.toggleSetEnd());
        clearPathBtn.addEventListener('click', () => this.clearPath());
        resetBtn.addEventListener('click', () => this.resetGrid());
        startBtn.addEventListener('click', () => this.startPathfinding());
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const node = this.grid[row][col];
                if (node.isStart) cell.classList.add('start');
                if (node.isEnd) cell.classList.add('end');
                if (node.isWall) cell.classList.add('wall');
                if (node.isOpen) cell.classList.add('open');
                if (node.isClosed) cell.classList.add('closed');
                if (node.isPath) cell.classList.add('path');
                
                gridElement.appendChild(cell);
            }
        }
    }

    handleMouseDown(e) {
        if (this.isAnimating) return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.isSettingStart) {
            this.setStartNode(row, col);
            this.isSettingStart = false;
            this.updateButtonStates();
            return;
        }
        
        if (this.isSettingEnd) {
            this.setEndNode(row, col);
            this.isSettingEnd = false;
            this.updateButtonStates();
            return;
        }
        
        this.isMouseDown = true;
        this.toggleWall(row, col);
    }

    handleMouseOver(e) {
        if (!this.isMouseDown || this.isAnimating) return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        this.toggleWall(row, col);
    }

    handleMouseUp() {
        this.isMouseDown = false;
    }

    toggleSetStart() {
        this.isSettingStart = !this.isSettingStart;
        this.isSettingEnd = false;
        this.updateButtonStates();
    }

    toggleSetEnd() {
        this.isSettingEnd = !this.isSettingEnd;
        this.isSettingStart = false;
        this.updateButtonStates();
    }

    setStartNode(row, col) {
        if (this.grid[row][col].isWall || this.grid[row][col].isEnd) return;
        
        // 移除舊起點
        this.grid[this.startNode.row][this.startNode.col].isStart = false;
        
        // 設定新起點
        this.startNode = { row, col };
        this.grid[row][col].isStart = true;
        
        this.renderGrid();
    }

    setEndNode(row, col) {
        if (this.grid[row][col].isWall || this.grid[row][col].isStart) return;
        
        // 移除舊終點
        this.grid[this.endNode.row][this.endNode.col].isEnd = false;
        
        // 設定新終點
        this.endNode = { row, col };
        this.grid[row][col].isEnd = true;
        
        this.renderGrid();
    }

    toggleWall(row, col) {
        const node = this.grid[row][col];
        if (!node.isStart && !node.isEnd) {
            node.isWall = !node.isWall;
            this.renderGrid();
        }
    }

    clearPath() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const node = this.grid[row][col];
                node.isOpen = false;
                node.isClosed = false;
                node.isPath = false;
                node.gCost = Infinity;
                node.hCost = 0;
                node.fCost = Infinity;
                node.parent = null;
            }
        }
        
        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
        this.updateStatus('就緒');
        this.renderGrid();
    }

    resetGrid() {
        this.startNode = { row: 2, col: 2 };
        this.endNode = { row: 22, col: 22 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isMouseDown = false;
        this.isAnimating = false;
        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        
        this.initializeGrid();
        this.updateButtonStates();
        this.updateStats();
        this.updateStatus('就緒');
        this.renderGrid();
    }

    updateButtonStates() {
        const setStartBtn = document.getElementById('set-start-btn');
        const setEndBtn = document.getElementById('set-end-btn');
        const startBtn = document.getElementById('start-btn');
        
        setStartBtn.disabled = this.isAnimating;
        setEndBtn.disabled = this.isAnimating;
        startBtn.disabled = this.isAnimating;
        
        setStartBtn.textContent = this.isSettingStart ? '取消設定起點' : '設定起點';
        setEndBtn.textContent = this.isSettingEnd ? '取消設定終點' : '設定終點';
        
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

    updateStats() {
        document.getElementById('visited-count').textContent = this.visitedCount;
        document.getElementById('path-length').textContent = this.pathLength;
        document.getElementById('execution-time').textContent = this.executionTime;
    }

    updateStatus(status) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = status;
        
        // 移除舊的狀態樣式
        statusElement.className = '';
        
        if (status === '無法找到路徑') {
            statusElement.classList.add('status-error');
        } else if (status === '找到路徑') {
            statusElement.classList.add('status-success');
        }
    }

    async startPathfinding() {
        if (this.isAnimating) return;
        
        this.clearPath();
        this.isAnimating = true;
        this.updateButtonStates();
        this.updateStatus('搜尋中');
        
        const algorithm = document.getElementById('algorithm-select').value;
        const startTime = performance.now();
        
        let result;
        switch (algorithm) {
            case 'astar':
                result = await this.aStar();
                break;
            case 'dijkstra':
                result = await this.dijkstra();
                break;
            case 'bfs':
                result = await this.bfs();
                break;
        }
        
        this.executionTime = Math.round(performance.now() - startTime);
        
        if (result && result.path) {
            await this.animatePath(result.path);
            this.pathLength = result.path.length - 1; // 減去起點
            this.updateStatus('找到路徑');
        } else {
            this.updateStatus('無法找到路徑');
        }
        
        this.updateStats();
        this.isAnimating = false;
        this.updateButtonStates();
    }

    // A* 算法
    async aStar() {
        const openSet = [];
        const closedSet = new Set();
        
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        startNode.gCost = 0;
        startNode.hCost = this.heuristic(startNode, endNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        
        openSet.push(startNode);
        
        while (openSet.length > 0) {
            // 找到fCost最小的節點
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < current.fCost || 
                    (openSet[i].fCost === current.fCost && openSet[i].hCost < current.hCost)) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            openSet.splice(currentIndex, 1);
            closedSet.add(`${current.row},${current.col}`);
            
            if (current === endNode) {
                return this.reconstructPath(current);
            }
            
            current.isOpen = false;
            current.isClosed = true;
            this.visitedCount++;
            
            // 視覺化
            if (current !== startNode && current !== endNode) {
                await this.delay(10);
                this.renderGrid();
                this.updateStats();
            }
            
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || closedSet.has(`${neighbor.row},${neighbor.col}`)) {
                    continue;
                }
                
                const tentativeGCost = current.gCost + 1;
                
                if (tentativeGCost < neighbor.gCost) {
                    neighbor.parent = current;
                    neighbor.gCost = tentativeGCost;
                    neighbor.hCost = this.heuristic(neighbor, endNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.isOpen = true;
                    }
                }
            }
        }
        
        return null;
    }

    // Dijkstra 算法
    async dijkstra() {
        const distances = [];
        const previous = [];
        const unvisited = new Set();
        
        for (let row = 0; row < this.gridSize; row++) {
            distances[row] = [];
            previous[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                distances[row][col] = Infinity;
                previous[row][col] = null;
                unvisited.add(this.grid[row][col]);
            }
        }
        
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        distances[startNode.row][startNode.col] = 0;
        
        while (unvisited.size > 0) {
            // 找到距離最小的節點
            let current = null;
            let minDistance = Infinity;
            
            for (const node of unvisited) {
                if (distances[node.row][node.col] < minDistance) {
                    minDistance = distances[node.row][node.col];
                    current = node;
                }
            }
            
            if (!current || minDistance === Infinity) break;
            
            unvisited.delete(current);
            
            if (current === endNode) {
                return this.reconstructPath(current);
            }
            
            current.isClosed = true;
            this.visitedCount++;
            
            // 視覺化
            if (current !== startNode && current !== endNode) {
                await this.delay(10);
                this.renderGrid();
                this.updateStats();
            }
            
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || !unvisited.has(neighbor)) {
                    continue;
                }
                
                const alt = distances[current.row][current.col] + 1;
                if (alt < distances[neighbor.row][neighbor.col]) {
                    distances[neighbor.row][neighbor.col] = alt;
                    previous[neighbor.row][neighbor.col] = current;
                    neighbor.parent = current;
                    neighbor.isOpen = true;
                }
            }
        }
        
        return null;
    }

    // 廣度優先搜尋 (BFS)
    async bfs() {
        const queue = [];
        const visited = new Set();
        
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        queue.push(startNode);
        visited.add(`${startNode.row},${startNode.col}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current === endNode) {
                return this.reconstructPath(current);
            }
            
            current.isClosed = true;
            this.visitedCount++;
            
            // 視覺化
            if (current !== startNode && current !== endNode) {
                await this.delay(10);
                this.renderGrid();
                this.updateStats();
            }
            
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || visited.has(`${neighbor.row},${neighbor.col}`)) {
                    continue;
                }
                
                visited.add(`${neighbor.row},${neighbor.col}`);
                neighbor.parent = current;
                neighbor.isOpen = true;
                queue.push(neighbor);
            }
        }
        
        return null;
    }

    getNeighbors(node) {
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
            
            if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                neighbors.push(this.grid[newRow][newCol]);
            }
        }
        
        return neighbors;
    }

    heuristic(nodeA, nodeB) {
        // 曼哈頓距離
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    reconstructPath(endNode) {
        const path = [];
        let current = endNode;
        
        while (current) {
            path.unshift(current);
            current = current.parent;
        }
        
        return { path };
    }

    async animatePath(path) {
        for (let i = 1; i < path.length - 1; i++) {
            const node = path[i];
            node.isPath = true;
            node.isOpen = false;
            node.isClosed = false;
            await this.delay(50);
            this.renderGrid();
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});