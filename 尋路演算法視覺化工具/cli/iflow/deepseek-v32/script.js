class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isAnimating = false;
        this.isDragging = false;
        this.dragType = null; // 'wall' or null
        
        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        
        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
        this.updateStats();
    }

    createGrid() {
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

                cell.addEventListener('mousedown', (e) => this.handleCellMouseDown(e, row, col));
                cell.addEventListener('mouseenter', (e) => this.handleCellMouseEnter(e, row, col));
                cell.addEventListener('mouseup', () => this.handleCellMouseUp());

                gridElement.appendChild(cell);
                this.grid[row][col] = {
                    element: cell,
                    isWall: false,
                    isStart: row === this.startPos.row && col === this.startPos.col,
                    isEnd: row === this.endPos.row && col === this.endPos.col,
                    gCost: Infinity,
                    hCost: 0,
                    fCost: Infinity,
                    parent: null,
                    visited: false
                };
            }
        }

        // 添加滑鼠事件到整個網格以處理拖曳
        gridElement.addEventListener('mouseleave', () => this.handleCellMouseUp());
    }

    setupEventListeners() {
        document.getElementById('setStartBtn').addEventListener('click', () => {
            if (!this.isAnimating) {
                this.isSettingStart = true;
                this.isSettingEnd = false;
                this.updateButtonStates();
            }
        });

        document.getElementById('setEndBtn').addEventListener('click', () => {
            if (!this.isAnimating) {
                this.isSettingEnd = true;
                this.isSettingStart = false;
                this.updateButtonStates();
            }
        });

        document.getElementById('clearPathBtn').addEventListener('click', () => {
            if (!this.isAnimating) {
                this.clearPath();
            }
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (!this.isAnimating) {
                this.resetGrid();
            }
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.isAnimating) {
                this.startPathfinding();
            }
        });

        // 全局滑鼠事件處理拖曳結束
        document.addEventListener('mouseup', () => {
            this.handleCellMouseUp();
        });
    }

    handleCellMouseDown(e, row, col) {
        if (this.isAnimating) return;

        const cell = this.grid[row][col];
        
        if (this.isSettingStart) {
            if (!cell.isWall && !cell.isEnd) {
                this.setStartPosition(row, col);
            }
            this.isSettingStart = false;
            this.updateButtonStates();
            return;
        }

        if (this.isSettingEnd) {
            if (!cell.isWall && !cell.isStart) {
                this.setEndPosition(row, col);
            }
            this.isSettingEnd = false;
            this.updateButtonStates();
            return;
        }

        // 如果不是設置起點或終點，則處理障礙物
        if (!cell.isStart && !cell.isEnd) {
            this.isDragging = true;
            this.dragType = cell.isWall ? 'remove' : 'add';
            this.toggleWall(row, col);
        }
    }

    handleCellMouseEnter(e, row, col) {
        if (this.isAnimating) return;
        
        if (this.isDragging && this.dragType) {
            const cell = this.grid[row][col];
            if (!cell.isStart && !cell.isEnd) {
                if (this.dragType === 'add' && !cell.isWall) {
                    this.toggleWall(row, col);
                } else if (this.dragType === 'remove' && cell.isWall) {
                    this.toggleWall(row, col);
                }
            }
        }
    }

    handleCellMouseUp() {
        this.isDragging = false;
        this.dragType = null;
    }

    toggleWall(row, col) {
        const cell = this.grid[row][col];
        cell.isWall = !cell.isWall;
        cell.element.classList.toggle('wall', cell.isWall);
        
        // 清除搜尋結果
        this.clearPath();
    }

    setStartPosition(row, col) {
        // 清除舊起點
        const oldStart = this.grid[this.startPos.row][this.startPos.col];
        oldStart.isStart = false;
        oldStart.element.classList.remove('start');
        
        // 設置新起點
        this.startPos = { row, col };
        const newStart = this.grid[row][col];
        newStart.isStart = true;
        newStart.element.classList.add('start');
        
        this.clearPath();
    }

    setEndPosition(row, col) {
        // 清除舊終點
        const oldEnd = this.grid[this.endPos.row][this.endPos.col];
        oldEnd.isEnd = false;
        oldEnd.element.classList.remove('end');
        
        // 設置新終點
        this.endPos = { row, col };
        const newEnd = this.grid[row][col];
        newEnd.isEnd = true;
        newEnd.element.classList.add('end');
        
        this.clearPath();
    }

    clearPath() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (!cell.isStart && !cell.isEnd && !cell.isWall) {
                    cell.element.classList.remove('open', 'closed', 'path');
                }
                cell.visited = false;
                cell.gCost = Infinity;
                cell.hCost = 0;
                cell.fCost = Infinity;
                cell.parent = null;
            }
        }
        
        this.visitedCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
    }

    resetGrid() {
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.createGrid();
        this.updateStats();
    }

    updateStats() {
        document.getElementById('visitedCount').textContent = `${this.visitedCount} 個`;
        document.getElementById('pathLength').textContent = `${this.pathLength} 步`;
        document.getElementById('executionTime').textContent = `${this.executionTime} ms`;
        
        const statusElement = document.getElementById('status');
        statusElement.textContent = this.isAnimating ? '搜尋中' : 
                                   this.pathLength > 0 ? '找到路徑' : '就緒';
    }

    updateButtonStates() {
        const buttons = document.querySelectorAll('.control-btn');
        const select = document.getElementById('algorithmSelect');
        
        if (this.isAnimating) {
            buttons.forEach(btn => btn.disabled = true);
            select.disabled = true;
        } else {
            buttons.forEach(btn => btn.disabled = false);
            select.disabled = false;
            
            // 更新設定按鈕狀態
            document.getElementById('setStartBtn').disabled = this.isSettingStart;
            document.getElementById('setEndBtn').disabled = this.isSettingEnd;
        }
    }

    startPathfinding() {
        this.clearPath();
        this.isAnimating = true;
        this.updateButtonStates();
        
        const algorithm = document.getElementById('algorithmSelect').value;
        const startTime = performance.now();
        
        if (algorithm === 'astar') {
            this.aStarAlgorithm().then(() => {
                this.finalizeSearch(startTime);
            });
        } else {
            this.dijkstraAlgorithm().then(() => {
                this.finalizeSearch(startTime);
            });
        }
    }

    finalizeSearch(startTime) {
        this.executionTime = Math.round(performance.now() - startTime);
        this.updateStats();
        this.isAnimating = false;
        this.updateButtonStates();
    }

    async aStarAlgorithm() {
        const openSet = [];
        const closedSet = new Set();
        
        // 初始化起點
        const startCell = this.grid[this.startPos.row][this.startPos.col];
        startCell.gCost = 0;
        startCell.hCost = this.heuristic(this.startPos, this.endPos);
        startCell.fCost = startCell.gCost + startCell.hCost;
        
        openSet.push(startCell);
        
        while (openSet.length > 0) {
            // 找到 fCost 最小的節點
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
            closedSet.add(current);
            
            // 標記為已訪問（關閉列表）
            if (!current.isStart && !current.isEnd) {
                current.element.classList.add('closed');
            }
            
            // 找到終點
            if (current.isEnd) {
                await this.reconstructPath(current);
                return;
            }
            
            // 檢查鄰居
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (neighbor.isWall || closedSet.has(neighbor)) continue;
                
                const tentativeGCost = current.gCost + 1;
                
                if (tentativeGCost < neighbor.gCost) {
                    neighbor.parent = current;
                    neighbor.gCost = tentativeGCost;
                    neighbor.hCost = this.heuristic(
                        this.getCellPosition(neighbor), 
                        this.endPos
                    );
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        if (!neighbor.isEnd) {
                            neighbor.element.classList.add('open');
                        }
                    }
                }
            }
            
            this.visitedCount = closedSet.size;
            this.updateStats();
            await this.delay(10);
        }
        
        // 沒有找到路徑
        this.showMessage('無法找到路徑');
    }

    async dijkstraAlgorithm() {
        const unvisited = [];
        const visited = new Set();
        
        // 初始化所有節點
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                cell.gCost = cell.isStart ? 0 : Infinity;
                cell.parent = null;
                unvisited.push(cell);
            }
        }
        
        while (unvisited.length > 0) {
            // 找到距離最小的節點
            let current = null;
            let minDistance = Infinity;
            
            for (const cell of unvisited) {
                if (cell.gCost < minDistance) {
                    current = cell;
                    minDistance = cell.gCost;
                }
            }
            
            if (!current || current.gCost === Infinity) break;
            
            // 從未訪問列表中移除
            const index = unvisited.indexOf(current);
            unvisited.splice(index, 1);
            visited.add(current);
            
            // 標記為已訪問
            if (!current.isStart && !current.isEnd) {
                current.element.classList.add('closed');
            }
            
            // 找到終點
            if (current.isEnd) {
                await this.reconstructPath(current);
                return;
            }
            
            // 更新鄰居距離
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (neighbor.isWall || visited.has(neighbor)) continue;
                
                const newDistance = current.gCost + 1;
                if (newDistance < neighbor.gCost) {
                    neighbor.gCost = newDistance;
                    neighbor.parent = current;
                    
                    if (!neighbor.isEnd) {
                        neighbor.element.classList.add('open');
                    }
                }
            }
            
            this.visitedCount = visited.size;
            this.updateStats();
            await this.delay(10);
        }
        
        // 沒有找到路徑
        this.showMessage('無法找到路徑');
    }

    heuristic(pos1, pos2) {
        // 曼哈頓距離
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }

    getNeighbors(cell) {
        const neighbors = [];
        const { row, col } = this.getCellPosition(cell);
        
        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];
        
        for (const dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize) {
                neighbors.push(this.grid[newRow][newCol]);
            }
        }
        
        return neighbors;
    }

    getCellPosition(cell) {
        const row = parseInt(cell.element.dataset.row);
        const col = parseInt(cell.element.dataset.col);
        return { row, col };
    }

    async reconstructPath(endCell) {
        let current = endCell.parent;
        const path = [];
        
        while (current && !current.isStart) {
            path.push(current);
            current = current.parent;
        }
        
        // 反向顯示路徑
        for (let i = path.length - 1; i >= 0; i--) {
            path[i].element.classList.remove('open', 'closed');
            path[i].element.classList.add('path');
            await this.delay(10);
        }
        
        this.pathLength = path.length;
        this.updateStats();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showMessage(message) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.classList.remove('hidden');
        
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 3000);
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});