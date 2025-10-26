class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.cellSize = 30;
        this.grid = [];
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isDragging = false;
        this.isAnimating = false;
        this.algorithm = 'astar';
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.status = '就緒';
        
        this.initGrid();
        this.setupEventListeners();
        this.updateStats();
    }
    
    initGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 設置起點和終點
                if (row === this.startPos.row && col === this.startPos.col) {
                    cell.classList.add('start');
                } else if (row === this.endPos.row && col === this.endPos.col) {
                    cell.classList.add('end');
                }
                
                gridElement.appendChild(cell);
                this.grid[row][col] = {
                    element: cell,
                    isStart: (row === this.startPos.row && col === this.startPos.col),
                    isEnd: (row === this.endPos.row && col === this.endPos.col),
                    isObstacle: false,
                    f: 0,
                    g: 0,
                    h: 0,
                    parent: null,
                    visited: false
                };
            }
        }
    }
    
    setupEventListeners() {
        // 按鈕事件監聽
        document.getElementById('setStartBtn').addEventListener('click', () => this.setStartMode());
        document.getElementById('setEndBtn').addEventListener('click', () => this.setEndMode());
        document.getElementById('clearPathBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGrid());
        document.getElementById('startBtn').addEventListener('click', () => this.startPathfinding());
        
        // 演算法選擇
        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
        });
        
        // 網格事件監聽
        const gridElement = document.getElementById('grid');
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        
        // 防止拖拽時的默認行為
        gridElement.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    setStartMode() {
        if (this.isAnimating) return;
        this.isSettingStart = true;
        this.isSettingEnd = false;
        this.updateStatus('點擊網格設置起點');
    }
    
    setEndMode() {
        if (this.isAnimating) return;
        this.isSettingEnd = true;
        this.isSettingStart = false;
        this.updateStatus('點擊網格設置終點');
    }
    
    handleMouseDown(event) {
        if (this.isAnimating) return;
        
        const cell = event.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // 設置起點或終點
        if (this.isSettingStart) {
            this.setStart(row, col);
            this.isSettingStart = false;
            this.updateStatus('就緒');
            return;
        }
        
        if (this.isSettingEnd) {
            this.setEnd(row, col);
            this.isSettingEnd = false;
            this.updateStatus('就緒');
            return;
        }
        
        // 設置障礙物
        if (!this.grid[row][col].isStart && !this.grid[row][col].isEnd) {
            this.isDragging = true;
            this.toggleObstacle(row, col);
        }
    }
    
    handleMouseOver(event) {
        if (!this.isDragging || this.isAnimating) return;
        
        const cell = event.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // 拖拽設置障礙物
        if (!this.grid[row][col].isStart && !this.grid[row][col].isEnd) {
            this.grid[row][col].isObstacle = true;
            cell.classList.add('obstacle');
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
    }
    
    toggleObstacle(row, col) {
        if (this.grid[row][col].isStart || this.grid[row][col].isEnd) return;
        
        this.grid[row][col].isObstacle = !this.grid[row][col].isObstacle;
        if (this.grid[row][col].isObstacle) {
            this.grid[row][col].element.classList.add('obstacle');
        } else {
            this.grid[row][col].element.classList.remove('obstacle');
        }
    }
    
    setStart(row, col) {
        // 移除舊的起點
        this.grid[this.startPos.row][this.startPos.col].isStart = false;
        this.grid[this.startPos.row][this.startPos.col].element.classList.remove('start');
        
        // 設置新的起點
        this.startPos = { row, col };
        this.grid[row][col].isStart = true;
        this.grid[row][col].isObstacle = false;
        this.grid[row][col].element.classList.add('start');
        this.grid[row][col].element.classList.remove('obstacle');
    }
    
    setEnd(row, col) {
        // 移除舊的終點
        this.grid[this.endPos.row][this.endPos.col].isEnd = false;
        this.grid[this.endPos.row][this.endPos.col].element.classList.remove('end');
        
        // 設置新的終點
        this.endPos = { row, col };
        this.grid[row][col].isEnd = true;
        this.grid[row][col].isObstacle = false;
        this.grid[row][col].element.classList.add('end');
        this.grid[row][col].element.classList.remove('obstacle');
    }
    
    clearPath() {
        if (this.isAnimating) return;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                cell.element.classList.remove('open', 'closed', 'path');
                cell.visited = false;
                cell.f = 0;
                cell.g = 0;
                cell.h = 0;
                cell.parent = null;
            }
        }
        
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStatus('就緒');
        this.updateStats();
    }
    
    resetGrid() {
        if (this.isAnimating) return;
        
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.initGrid();
        
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStatus('就緒');
        this.updateStats();
    }
    
    startPathfinding() {
        if (this.isAnimating) return;
        
        this.clearPath();
        this.disableButtons(true);
        this.updateStatus('搜尋中');
        
        const startTime = performance.now();
        
        // 選擇演算法
        let pathFound;
        if (this.algorithm === 'astar') {
            pathFound = this.aStar();
        } else {
            pathFound = this.dijkstra();
        }
        
        const endTime = performance.now();
        this.executionTime = Math.round(endTime - startTime);
        
        if (pathFound) {
            this.updateStatus('找到路徑');
        } else {
            this.updateStatus('無路徑');
            alert('無法找到路徑');
        }
        
        this.updateStats();
        this.disableButtons(false);
    }
    
    disableButtons(disabled) {
        document.getElementById('setStartBtn').disabled = disabled;
        document.getElementById('setEndBtn').disabled = disabled;
        document.getElementById('clearPathBtn').disabled = disabled;
        document.getElementById('resetBtn').disabled = disabled;
        document.getElementById('startBtn').disabled = disabled;
        document.getElementById('algorithmSelect').disabled = disabled;
    }
    
    aStar() {
        const openSet = [];
        const closedSet = new Set();
        
        // 初始化起點
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        startNode.g = 0;
        startNode.h = this.heuristic(this.startPos, this.endPos);
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);
        
        this.visitedNodesCount = 0;
        
        // 動畫執行尋路
        return this.animatePathfinding(openSet, closedSet, 'astar');
    }
    
    dijkstra() {
        const openSet = [];
        const closedSet = new Set();
        
        // 初始化起點
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        startNode.g = 0;
        startNode.f = 0;
        openSet.push(startNode);
        
        this.visitedNodesCount = 0;
        
        // 動畫執行尋路
        return this.animatePathfinding(openSet, closedSet, 'dijkstra');
    }
    
    animatePathfinding(openSet, closedSet, algorithm) {
        this.isAnimating = true;
        let pathFound = false;
        let finalPath = null;
        
        const processNext = () => {
            if (openSet.length === 0) {
                this.isAnimating = false;
                return false; // 沒有路徑
            }
            
            // 找到f值最小的節點
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            
            // 如果到達終點
            if (current.isEnd) {
                pathFound = true;
                finalPath = this.reconstructPath(current);
                this.isAnimating = false;
                this.animateFinalPath(finalPath);
                return true;
            }
            
            // 添加到已訪問集合
            const currentPos = this.getNodePosition(current);
            closedSet.add(`${currentPos.row},${currentPos.col}`);
            current.visited = true;
            
            if (!current.isStart && !current.isEnd) {
                current.element.classList.add('closed');
            }
            
            this.visitedNodesCount++;
            
            // 檢查鄰居節點
            const neighbors = this.getNeighbors(currentPos);
            for (const neighborPos of neighbors) {
                const neighbor = this.grid[neighborPos.row][neighborPos.col];
                const neighborKey = `${neighborPos.row},${neighborPos.col}`;
                
                // 跳過障礙物和已訪問的節點
                if (neighbor.isObstacle || closedSet.has(neighborKey)) {
                    continue;
                }
                
                // 計算新的g值
                const tentativeG = current.g + this.distance(currentPos, neighborPos);
                
                // 檢查是否找到更短的路徑
                let foundBetterPath = false;
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    if (!neighbor.isStart && !neighbor.isEnd) {
                        neighbor.element.classList.add('open');
                    }
                    foundBetterPath = true;
                } else if (tentativeG < neighbor.g) {
                    foundBetterPath = true;
                }
                
                if (foundBetterPath) {
                    neighbor.parent = current;
                    neighbor.g = tentativeG;
                    
                    if (algorithm === 'astar') {
                        neighbor.h = this.heuristic(neighborPos, this.endPos);
                        neighbor.f = neighbor.g + neighbor.h;
                    } else {
                        neighbor.f = neighbor.g;
                    }
                }
            }
            
            // 繼續動畫
            setTimeout(processNext, 10);
            return null; // 仍在處理中
        };
        
        processNext();
        return pathFound;
    }
    
    animateFinalPath(path) {
        this.pathLength = path.length;
        let i = 0;
        
        const showNext = () => {
            if (i < path.length) {
                const node = path[i];
                if (!node.isStart && !node.isEnd) {
                    node.element.classList.remove('open', 'closed');
                    node.element.classList.add('path');
                }
                i++;
                setTimeout(showNext, 10);
            }
        };
        
        showNext();
    }
    
    reconstructPath(node) {
        const path = [];
        let current = node;
        
        while (current.parent) {
            path.unshift(current);
            current = current.parent;
        }
        
        return path;
    }
    
    getNeighbors(pos) {
        const neighbors = [];
        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];
        
        for (const dir of directions) {
            const newRow = pos.row + dir.row;
            const newCol = pos.col + dir.col;
            
            // 檢查邊界
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        
        return neighbors;
    }
    
    getNodePosition(node) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === node) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    heuristic(pos1, pos2) {
        // 使用曼哈頓距離
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }
    
    distance(pos1, pos2) {
        // 使用曼哈頓距離計算移動成本
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }
    
    updateStats() {
        document.getElementById('visitedNodes').textContent = this.visitedNodesCount;
        document.getElementById('pathLength').textContent = this.pathLength;
        document.getElementById('executionTime').textContent = this.executionTime;
        document.getElementById('status').textContent = this.status;
    }
    
    updateStatus(status) {
        this.status = status;
        document.getElementById('status').textContent = status;
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});