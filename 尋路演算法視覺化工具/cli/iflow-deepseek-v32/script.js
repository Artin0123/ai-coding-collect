class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isDragging = false;
        this.isAnimating = false;
        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        
        this.initializeGrid();
        this.initializeEventListeners();
        this.renderGrid();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    isWall: false,
                    isStart: row === this.startPos.row && col === this.startPos.col,
                    isEnd: row === this.endPos.row && col === this.endPos.col,
                    isOpen: false,
                    isClosed: false,
                    isPath: false,
                    previous: null,
                    gCost: Infinity,
                    hCost: 0,
                    fCost: Infinity
                };
            }
        }
    }

    initializeEventListeners() {
        const gridElement = document.getElementById('grid');
        
        // 滑鼠事件
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        
        // 觸控事件
        gridElement.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        gridElement.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        gridElement.addEventListener('touchend', () => this.handleMouseUp());
        
        // 控制按鈕事件
        document.getElementById('setStartBtn').addEventListener('click', () => this.setMode('start'));
        document.getElementById('setEndBtn').addEventListener('click', () => this.setMode('end'));
        document.getElementById('clearPathBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGrid());
        document.getElementById('startBtn').addEventListener('click', () => this.startPathfinding());
    }

    handleMouseDown(e) {
        if (this.isAnimating) return;
        
        const cell = this.getCellFromEvent(e);
        if (!cell) return;
        
        if (this.isSettingStart) {
            this.setStartPosition(cell.row, cell.col);
        } else if (this.isSettingEnd) {
            this.setEndPosition(cell.row, cell.col);
        } else {
            this.isDragging = true;
            this.toggleWall(cell.row, cell.col);
        }
    }

    handleMouseOver(e) {
        if (!this.isDragging || this.isAnimating) return;
        
        const cell = this.getCellFromEvent(e);
        if (cell && !cell.isStart && !cell.isEnd) {
            this.setWall(cell.row, cell.col, true);
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    handleTouchStart(e) {
        if (this.isAnimating) return;
        
        e.preventDefault();
        const cell = this.getCellFromEvent(e);
        if (!cell) return;
        
        if (this.isSettingStart) {
            this.setStartPosition(cell.row, cell.col);
        } else if (this.isSettingEnd) {
            this.setEndPosition(cell.row, cell.col);
        } else {
            this.isDragging = true;
            this.toggleWall(cell.row, cell.col);
        }
    }

    handleTouchMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        
        e.preventDefault();
        const cell = this.getCellFromEvent(e);
        if (cell && !cell.isStart && !cell.isEnd) {
            this.setWall(cell.row, cell.col, true);
        }
    }

    getCellFromEvent(e) {
        const cellElement = e.target.closest('.cell');
        if (!cellElement) return null;
        
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        
        return this.grid[row]?.[col] || null;
    }

    setMode(mode) {
        this.isSettingStart = mode === 'start';
        this.isSettingEnd = mode === 'end';
        
        // 更新按鈕狀態
        document.getElementById('setStartBtn').classList.toggle('active', this.isSettingStart);
        document.getElementById('setEndBtn').classList.toggle('active', this.isSettingEnd);
        
        this.showMessage(this.isSettingStart ? '點擊格子設定起點' : 
                        this.isSettingEnd ? '點擊格子設定終點' : '');
    }

    setStartPosition(row, col) {
        if (this.grid[row][col].isWall || this.grid[row][col].isEnd) {
            this.showMessage('無法在障礙物或終點上設定起點', 'error');
            return;
        }
        
        // 清除舊的起點
        this.grid[this.startPos.row][this.startPos.col].isStart = false;
        
        // 設定新的起點
        this.startPos = { row, col };
        this.grid[row][col].isStart = true;
        
        this.isSettingStart = false;
        document.getElementById('setStartBtn').classList.remove('active');
        this.renderGrid();
        this.showMessage('起點已設定');
    }

    setEndPosition(row, col) {
        if (this.grid[row][col].isWall || this.grid[row][col].isStart) {
            this.showMessage('無法在障礙物或起點上設定終點', 'error');
            return;
        }
        
        // 清除舊的終點
        this.grid[this.endPos.row][this.endPos.col].isEnd = false;
        
        // 設定新的終點
        this.endPos = { row, col };
        this.grid[row][col].isEnd = true;
        
        this.isSettingEnd = false;
        document.getElementById('setEndBtn').classList.remove('active');
        this.renderGrid();
        this.showMessage('終點已設定');
    }

    toggleWall(row, col) {
        if (this.grid[row][col].isStart || this.grid[row][col].isEnd) return;
        
        this.grid[row][col].isWall = !this.grid[row][col].isWall;
        this.renderGrid();
    }

    setWall(row, col, isWall) {
        if (this.grid[row][col].isStart || this.grid[row][col].isEnd) return;
        
        this.grid[row][col].isWall = isWall;
        this.renderGrid();
    }

    clearPath() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].isOpen = false;
                this.grid[row][col].isClosed = false;
                this.grid[row][col].isPath = false;
                this.grid[row][col].previous = null;
                this.grid[row][col].gCost = Infinity;
                this.grid[row][col].hCost = 0;
                this.grid[row][col].fCost = Infinity;
            }
        }
        
        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
        this.renderGrid();
        this.showMessage('路徑已清除');
    }

    resetGrid() {
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isDragging = false;
        
        document.getElementById('setStartBtn').classList.remove('active');
        document.getElementById('setEndBtn').classList.remove('active');
        
        this.initializeGrid();
        this.renderGrid();
        this.updateStats();
        this.showMessage('網格已重置');
    }

    async startPathfinding() {
        if (this.isAnimating) return;
        
        this.clearPath();
        this.setControlsEnabled(false);
        this.isAnimating = true;
        this.updateStatus('搜尋中');
        
        const algorithm = document.getElementById('algorithmSelect').value;
        const startTime = performance.now();
        
        let pathFound = false;
        
        if (algorithm === 'astar') {
            pathFound = await this.aStar();
        } else if (algorithm === 'dijkstra') {
            pathFound = await this.dijkstra();
        }
        
        const endTime = performance.now();
        this.executionTime = Math.round(endTime - startTime);
        
        if (pathFound) {
            this.updateStatus('找到路徑');
            this.showMessage(`找到路徑！路徑長度：${this.pathLength}`, 'success');
        } else {
            this.updateStatus('無路徑');
            this.showMessage('無法找到路徑', 'error');
        }
        
        this.setControlsEnabled(true);
        this.isAnimating = false;
        this.updateStats();
    }

    async aStar() {
        const openSet = [];
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        const endNode = this.grid[this.endPos.row][this.endPos.col];
        
        startNode.gCost = 0;
        startNode.hCost = this.manhattanDistance(startNode, endNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        
        openSet.push(startNode);
        
        while (openSet.length > 0) {
            // 找到fCost最小的節點
            let currentNode = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < currentNode.fCost || 
                    (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)) {
                    currentNode = openSet[i];
                    currentIndex = i;
                }
            }
            
            openSet.splice(currentIndex, 1);
            currentNode.isClosed = true;
            
            this.visitedCount++;
            
            // 視覺化當前節點
            if (!currentNode.isStart && !currentNode.isEnd) {
                currentNode.isOpen = false;
                currentNode.isClosed = true;
            }
            this.renderGrid();
            await this.delay(10);
            
            // 到達終點
            if (currentNode === endNode) {
                this.reconstructPath(currentNode);
                return true;
            }
            
            // 檢查鄰居節點
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isClosed || neighbor.isWall) continue;
                
                const tentativeGCost = currentNode.gCost + 1;
                
                if (tentativeGCost < neighbor.gCost) {
                    neighbor.previous = currentNode;
                    neighbor.gCost = tentativeGCost;
                    neighbor.hCost = this.manhattanDistance(neighbor, endNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!neighbor.isOpen) {
                        neighbor.isOpen = true;
                        openSet.push(neighbor);
                        
                        // 視覺化鄰居節點
                        if (!neighbor.isStart && !neighbor.isEnd) {
                            neighbor.isOpen = true;
                        }
                        this.renderGrid();
                    }
                }
            }
        }
        
        return false;
    }

    async dijkstra() {
        const unvisitedNodes = [];
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        const endNode = this.grid[this.endPos.row][this.endPos.col];
        
        // 初始化所有節點
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const node = this.grid[row][col];
                node.gCost = Infinity;
                node.previous = null;
                unvisitedNodes.push(node);
            }
        }
        
        startNode.gCost = 0;
        
        while (unvisitedNodes.length > 0) {
            // 找到距離最小的節點
            unvisitedNodes.sort((a, b) => a.gCost - b.gCost);
            const currentNode = unvisitedNodes.shift();
            
            if (currentNode.gCost === Infinity) break;
            
            currentNode.isClosed = true;
            this.visitedCount++;
            
            // 視覺化當前節點
            if (!currentNode.isStart && !currentNode.isEnd) {
                currentNode.isClosed = true;
            }
            this.renderGrid();
            await this.delay(10);
            
            // 到達終點
            if (currentNode === endNode) {
                this.reconstructPath(currentNode);
                return true;
            }
            
            // 檢查鄰居節點
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || neighbor.isClosed) continue;
                
                const distance = currentNode.gCost + 1;
                if (distance < neighbor.gCost) {
                    neighbor.gCost = distance;
                    neighbor.previous = currentNode;
                    
                    // 視覺化鄰居節點
                    if (!neighbor.isStart && !neighbor.isEnd) {
                        neighbor.isOpen = true;
                    }
                    this.renderGrid();
                }
            }
        }
        
        return false;
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { row: -1, col: 0 },  // 上
            { row: 1, col: 0 },   // 下
            { row: 0, col: -1 },  // 左
            { row: 0, col: 1 }    // 右
        ];
        
        for (const dir of directions) {
            const newRow = node.row + dir.row;
            const newCol = node.col + dir.col;
            
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize) {
                neighbors.push(this.grid[newRow][newCol]);
            }
        }
        
        return neighbors;
    }

    manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    reconstructPath(endNode) {
        let currentNode = endNode;
        const path = [];
        
        while (currentNode !== null) {
            path.unshift(currentNode);
            currentNode = currentNode.previous;
        }
        
        this.pathLength = path.length - 1; // 減去起點
        
        // 顯示路徑（不包含起點和終點）
        for (let i = 1; i < path.length - 1; i++) {
            path[i].isPath = true;
        }
        
        this.renderGrid();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                
                if (cell.isStart) cellElement.classList.add('start');
                if (cell.isEnd) cellElement.classList.add('end');
                if (cell.isWall) cellElement.classList.add('wall');
                if (cell.isOpen) cellElement.classList.add('open');
                if (cell.isClosed) cellElement.classList.add('closed');
                if (cell.isPath) cellElement.classList.add('path');
                
                gridElement.appendChild(cellElement);
            }
        }
    }

    updateStats() {
        document.getElementById('visitedCount').textContent = this.visitedCount;
        document.getElementById('pathLength').textContent = this.pathLength;
        document.getElementById('executionTime').textContent = this.executionTime;
    }

    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }

    showMessage(message, type = '') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.className = type ? `message ${type}` : 'message';
        
        if (message) {
            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = 'message';
            }, 3000);
        }
    }

    setControlsEnabled(enabled) {
        const controls = ['setStartBtn', 'setEndBtn', 'clearPathBtn', 'resetBtn', 'algorithmSelect', 'startBtn'];
        controls.forEach(id => {
            document.getElementById(id).disabled = !enabled;
        });
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});