class PathfindingVisualizer {
    constructor() {
        this.grid = [];
        this.rows = 15;
        this.cols = 15;
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isDragging = false;
        this.isAnimating = false;
        this.algorithm = 'astar';
        
        // 統計資訊
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.status = '就緒';
        
        this.initGrid();
        this.setupEventListeners();
        this.renderGrid();
        this.updateStats();
    }
    
    initGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    isStart: (row === this.startPos.row && col === this.startPos.col),
                    isEnd: (row === this.endPos.row && col === this.endPos.col),
                    isObstacle: false,
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null,
                    visited: false,
                    inOpenSet: false,
                    inClosedSet: false
                };
            }
        }
    }
    
    setupEventListeners() {
        // 控制面板按鈕
        document.getElementById('setStartBtn').addEventListener('click', () => this.setStartMode());
        document.getElementById('setEndBtn').addEventListener('click', () => this.setEndMode());
        document.getElementById('clearPathBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGrid());
        document.getElementById('startBtn').addEventListener('click', () => this.startPathfinding());
        
        // 演算法選擇
        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
        });
        
        // 網格容器事件
        const gridElement = document.getElementById('grid');
        gridElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell')) {
                this.isDragging = true;
                this.handleCellClick(e.target);
            }
        });
        
        gridElement.addEventListener('mouseover', (e) => {
            if (this.isDragging && e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }
    
    handleCellClick(cellElement) {
        if (this.isAnimating) return;
        
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cell = this.grid[row][col];
        
        if (this.isSettingStart) {
            // 設定起點
            if (!cell.isEnd && !cell.isObstacle) {
                this.grid[this.startPos.row][this.startPos.col].isStart = false;
                cell.isStart = true;
                this.startPos = { row, col };
                this.isSettingStart = false;
                this.updateButtonStates();
                this.renderGrid();
            }
        } else if (this.isSettingEnd) {
            // 設定終點
            if (!cell.isStart && !cell.isObstacle) {
                this.grid[this.endPos.row][this.endPos.col].isEnd = false;
                cell.isEnd = true;
                this.endPos = { row, col };
                this.isSettingEnd = false;
                this.updateButtonStates();
                this.renderGrid();
            }
        } else {
            // 設定/移除障礙物
            if (!cell.isStart && !cell.isEnd) {
                cell.isObstacle = !cell.isObstacle;
                this.renderCell(cell);
            }
        }
    }
    
    setStartMode() {
        if (this.isAnimating) return;
        this.isSettingStart = !this.isSettingStart;
        this.isSettingEnd = false;
        this.updateButtonStates();
    }
    
    setEndMode() {
        if (this.isAnimating) return;
        this.isSettingEnd = !this.isSettingEnd;
        this.isSettingStart = false;
        this.updateButtonStates();
    }
    
    updateButtonStates() {
        document.getElementById('setStartBtn').classList.toggle('active', this.isSettingStart);
        document.getElementById('setEndBtn').classList.toggle('active', this.isSettingEnd);
    }
    
    clearPath() {
        if (this.isAnimating) return;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (!cell.isStart && !cell.isEnd && !cell.isObstacle) {
                    cell.g = 0;
                    cell.h = 0;
                    cell.f = 0;
                    cell.parent = null;
                    cell.visited = false;
                    cell.inOpenSet = false;
                    cell.inClosedSet = false;
                    // 移除開放列表和封閉列表的標記
                    const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    cellElement.classList.remove('open', 'closed', 'path');
                }
            }
        }
        
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.status = '就緒';
        this.updateStats();
    }
    
    resetGrid() {
        if (this.isAnimating) return;
        
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isDragging = false;
        
        this.initGrid();
        this.renderGrid();
        this.updateButtonStates();
        
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.status = '就緒';
        this.updateStats();
    }
    
    startPathfinding() {
        if (this.isAnimating) return;
        
        this.clearPath();
        this.isAnimating = true;
        this.status = '搜尋中';
        this.updateStats();
        this.toggleControls(false);
        
        const startTime = performance.now();
        
        // 選擇演算法
        let result;
        if (this.algorithm === 'astar') {
            result = this.aStar();
        } else {
            result = this.dijkstra();
        }
        
        const endTime = performance.now();
        this.executionTime = Math.round(endTime - startTime);
        
        // 動畫顯示結果
        this.animatePathfinding(result.visitedNodes, result.path, () => {
            this.isAnimating = false;
            this.toggleControls(true);
        });
    }
    
    toggleControls(enabled) {
        document.getElementById('setStartBtn').disabled = !enabled;
        document.getElementById('setEndBtn').disabled = !enabled;
        document.getElementById('clearPathBtn').disabled = !enabled;
        document.getElementById('resetBtn').disabled = !enabled;
        document.getElementById('startBtn').disabled = !enabled;
        document.getElementById('algorithmSelect').disabled = !enabled;
    }
    
    aStar() {
        const openSet = [];
        const closedSet = new Set();
        const visitedNodes = [];
        
        // 初始化起點
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        startNode.g = 0;
        startNode.h = this.heuristic(startNode, this.grid[this.endPos.row][this.endPos.col]);
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);
        startNode.inOpenSet = true;
        
        while (openSet.length > 0) {
            // 找到f值最小的節點
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();
            currentNode.inOpenSet = false;
            
            // 如果到達終點
            if (currentNode.row === this.endPos.row && currentNode.col === this.endPos.col) {
                return { visitedNodes, path: this.reconstructPath(currentNode) };
            }
            
            closedSet.add(`${currentNode.row},${currentNode.col}`);
            currentNode.inClosedSet = true;
            currentNode.visited = true;
            visitedNodes.push(currentNode);
            this.visitedNodesCount++;
            
            // 檢查鄰居節點
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                
                // 如果在封閉列表中，跳過
                if (closedSet.has(neighborKey)) continue;
                
                // 計算從當前節點到鄰居的g值
                const tentativeG = currentNode.g + this.getDistance(currentNode, neighbor);
                
                // 如果鄰居不在開放列表中或找到更短的路徑
                if (!neighbor.inOpenSet || tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor, this.grid[this.endPos.row][this.endPos.col]);
                    neighbor.f = neighbor.g + neighbor.h;
                    
                    if (!neighbor.inOpenSet) {
                        openSet.push(neighbor);
                        neighbor.inOpenSet = true;
                    }
                }
            }
        }
        
        // 無法找到路徑
        this.status = '無路徑';
        this.updateStats();
        return { visitedNodes, path: [] };
    }
    
    dijkstra() {
        const openSet = [];
        const closedSet = new Set();
        const visitedNodes = [];
        
        // 初始化起點
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        startNode.g = 0;
        openSet.push(startNode);
        startNode.inOpenSet = true;
        
        while (openSet.length > 0) {
            // 找到g值最小的節點
            openSet.sort((a, b) => a.g - b.g);
            const currentNode = openSet.shift();
            currentNode.inOpenSet = false;
            
            // 如果到達終點
            if (currentNode.row === this.endPos.row && currentNode.col === this.endPos.col) {
                return { visitedNodes, path: this.reconstructPath(currentNode) };
            }
            
            closedSet.add(`${currentNode.row},${currentNode.col}`);
            currentNode.inClosedSet = true;
            currentNode.visited = true;
            visitedNodes.push(currentNode);
            this.visitedNodesCount++;
            
            // 檢查鄰居節點
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                
                // 如果在封閉列表中，跳過
                if (closedSet.has(neighborKey)) continue;
                
                // 計算從當前節點到鄰居的g值
                const tentativeG = currentNode.g + this.getDistance(currentNode, neighbor);
                
                // 如果鄰居不在開放列表中或找到更短的路徑
                if (!neighbor.inOpenSet || tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    
                    if (!neighbor.inOpenSet) {
                        openSet.push(neighbor);
                        neighbor.inOpenSet = true;
                    }
                }
            }
        }
        
        // 無法找到路徑
        this.status = '無路徑';
        this.updateStats();
        return { visitedNodes, path: [] };
    }
    
    getDistance(nodeA, nodeB) {
        const dx = Math.abs(nodeA.row - nodeB.row);
        const dy = Math.abs(nodeA.col - nodeB.col);
        
        // 對角線移動成本為√2，直線移動成本為1
        if (dx === 1 && dy === 1) {
            return Math.SQRT2; // 對角線移動
        }
        return 1; // 直線移動
    }
    
    heuristic(nodeA, nodeB) {
        // 使用對角線距離（Chebyshev距離）
        return Math.max(Math.abs(nodeA.row - nodeB.row), Math.abs(nodeA.col - nodeB.col));
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { row: -1, col: 0 },  // 上
            { row: 1, col: 0 },   // 下
            { row: 0, col: -1 },  // 左
            { row: 0, col: 1 },   // 右
            { row: -1, col: -1 }, // 左上
            { row: -1, col: 1 },  // 右上
            { row: 1, col: -1 },  // 左下
            { row: 1, col: 1 }    // 右下
        ];
        
        for (const dir of directions) {
            const newRow = node.row + dir.row;
            const newCol = node.col + dir.col;
            
            // 檢查邊界
            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                const neighbor = this.grid[newRow][newCol];
                // 不是障礙物
                if (!neighbor.isObstacle) {
                    neighbors.push(neighbor);
                }
            }
        }
        
        return neighbors;
    }
    
    reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        
        while (currentNode !== null) {
            path.unshift({ row: currentNode.row, col: currentNode.col });
            currentNode = currentNode.parent;
        }
        
        this.pathLength = path.length;
        this.status = '找到路徑';
        return path;
    }
    
    animatePathfinding(visitedNodes, path, callback) {
        // 動畫顯示訪問節點（先顯示開放列表（淡藍色），再顯示封閉列表（淡橘色））
        let index = 0;
        const showVisited = () => {
            if (index < visitedNodes.length) {
                const node = visitedNodes[index];
                if (!node.isStart && !node.isEnd) {
                    const cellElement = document.querySelector(`.cell[data-row="${node.row}"][data-col="${node.col}"]`);
                    if (cellElement) {
                        // 根據節點狀態設置顏色
                        if (node.inOpenSet) {
                            cellElement.classList.add('open');
                        } else if (node.inClosedSet) {
                            cellElement.classList.add('closed');
                        }
                    }
                }
                index++;
                setTimeout(showVisited, 10);
            } else {
                // 延遲後顯示路徑
                setTimeout(() => {
                    this.animatePath(path, callback);
                }, 300);
            }
        };
        
        showVisited();
    }
    
    animatePath(path, callback) {
        if (path.length === 0) {
            this.updateStats();
            callback();
            return;
        }
        
        let index = 0;
        const showPath = () => {
            if (index < path.length) {
                const { row, col } = path[index];
                const cell = this.grid[row][col];
                
                // 不改變起點和終點的樣式
                if (!cell.isStart && !cell.isEnd) {
                    const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    if (cellElement) {
                        cellElement.classList.add('path');
                    }
                }
                
                index++;
                setTimeout(showPath, 10);
            } else {
                this.updateStats();
                callback();
            }
        };
        
        showPath();
    }
    
    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                
                if (cell.isStart) {
                    cellElement.classList.add('start');
                } else if (cell.isEnd) {
                    cellElement.classList.add('end');
                } else if (cell.isObstacle) {
                    cellElement.classList.add('obstacle');
                }
                
                gridElement.appendChild(cellElement);
            }
        }
    }
    
    renderCell(cell) {
        const cellElement = document.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
        if (!cellElement) return;
        
        // 清除所有類別
        cellElement.className = 'cell';
        cellElement.dataset.row = cell.row;
        cellElement.dataset.col = cell.col;
        
        // 添加適當的類別
        if (cell.isStart) {
            cellElement.classList.add('start');
        } else if (cell.isEnd) {
            cellElement.classList.add('end');
        } else if (cell.isObstacle) {
            cellElement.classList.add('obstacle');
        } else if (cell.inOpenSet && !cell.isStart && !cell.isEnd) {
            cellElement.classList.add('open');
        } else if (cell.inClosedSet && !cell.isStart && !cell.isEnd) {
            cellElement.classList.add('closed');
        }
    }
    
    updateStats() {
        document.getElementById('visitedNodes').textContent = this.visitedNodesCount;
        document.getElementById('pathLength').textContent = this.pathLength;
        document.getElementById('executionTime').textContent = this.executionTime;
        document.getElementById('status').textContent = this.status;
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});