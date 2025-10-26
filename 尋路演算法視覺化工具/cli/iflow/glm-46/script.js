class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isMouseDown = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isRunning = false;
        this.animationSpeed = 10;
        
        this.initializeGrid();
        this.setupEventListeners();
        this.renderGrid();
    }
    
    initializeGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    isWall: false,
                    isStart: row === this.startPos.row && col === this.startPos.col,
                    isEnd: row === this.endPos.row && col === this.endPos.col,
                    isVisited: false,
                    isPath: false,
                    isOpen: false,
                    isClosed: false,
                    f: Infinity,
                    g: Infinity,
                    h: 0,
                    parent: null
                };
            }
        }
    }
    
    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        const clearPathBtn = document.getElementById('clearPathBtn');
        const resetBtn = document.getElementById('resetBtn');
        const startBtn = document.getElementById('startBtn');
        
        // 鼠標事件
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
        // 按鈕事件
        setStartBtn.addEventListener('click', () => this.toggleSetStart());
        setEndBtn.addEventListener('click', () => this.toggleSetEnd());
        clearPathBtn.addEventListener('click', () => this.clearPath());
        resetBtn.addEventListener('click', () => this.reset());
        startBtn.addEventListener('click', () => this.startPathfinding());
    }
    
    handleMouseDown(e) {
        if (this.isRunning) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.isSettingStart) {
            this.setStart(row, col);
            return;
        }
        
        if (this.isSettingEnd) {
            this.setEnd(row, col);
            return;
        }
        
        if (this.grid[row][col].isStart || this.grid[row][col].isEnd) return;
        
        this.isMouseDown = true;
        this.toggleWall(row, col);
    }
    
    handleMouseOver(e) {
        if (!this.isMouseDown || this.isRunning) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.grid[row][col].isStart || this.grid[row][col].isEnd) return;
        
        this.setWall(row, col, true);
    }
    
    handleMouseUp() {
        this.isMouseDown = false;
    }
    
    toggleWall(row, col) {
        this.grid[row][col].isWall = !this.grid[row][col].isWall;
        this.updateCell(row, col);
    }
    
    setWall(row, col, isWall) {
        this.grid[row][col].isWall = isWall;
        this.updateCell(row, col);
    }
    
    toggleSetStart() {
        this.isSettingStart = !this.isSettingStart;
        this.isSettingEnd = false;
        
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        
        if (this.isSettingStart) {
            setStartBtn.style.backgroundColor = '#27ae60';
            setEndBtn.style.backgroundColor = '#3498db';
        } else {
            setStartBtn.style.backgroundColor = '#3498db';
        }
    }
    
    toggleSetEnd() {
        this.isSettingEnd = !this.isSettingEnd;
        this.isSettingStart = false;
        
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        
        if (this.isSettingEnd) {
            setEndBtn.style.backgroundColor = '#e74c3c';
            setStartBtn.style.backgroundColor = '#3498db';
        } else {
            setEndBtn.style.backgroundColor = '#3498db';
        }
    }
    
    setStart(row, col) {
        if (this.grid[row][col].isWall || this.grid[row][col].isEnd) return;
        
        // 清除舊起點
        this.grid[this.startPos.row][this.startPos.col].isStart = false;
        
        // 設置新起點
        this.startPos = { row, col };
        this.grid[row][col].isStart = true;
        this.grid[row][col].isWall = false;
        
        this.updateCell(this.startPos.row, this.startPos.col);
        this.updateCell(row, col);
        
        this.toggleSetStart();
    }
    
    setEnd(row, col) {
        if (this.grid[row][col].isWall || this.grid[row][col].isStart) return;
        
        // 清除舊終點
        this.grid[this.endPos.row][this.endPos.col].isEnd = false;
        
        // 設置新終點
        this.endPos = { row, col };
        this.grid[row][col].isEnd = true;
        this.grid[row][col].isWall = false;
        
        this.updateCell(this.endPos.row, this.endPos.col);
        this.updateCell(row, col);
        
        this.toggleSetEnd();
    }
    
    clearPath() {
        if (this.isRunning) return;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                cell.isVisited = false;
                cell.isPath = false;
                cell.isOpen = false;
                cell.isClosed = false;
                cell.f = Infinity;
                cell.g = Infinity;
                cell.h = 0;
                cell.parent = null;
            }
        }
        
        this.renderGrid();
        this.updateStats(0, 0, 0, '就緒');
    }
    
    reset() {
        if (this.isRunning) return;
        
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.initializeGrid();
        this.renderGrid();
        this.updateStats(0, 0, 0, '就緒');
    }
    
    async startPathfinding() {
        if (this.isRunning) return;
        
        this.clearPath();
        this.isRunning = true;
        this.setButtonsDisabled(true);
        
        const algorithm = document.getElementById('algorithmSelect').value;
        const startTime = performance.now();
        
        this.updateStats(0, 0, 0, '搜尋中');
        
        let path;
        if (algorithm === 'astar') {
            path = await this.aStar();
        } else {
            path = await this.dijkstra();
        }
        
        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);
        
        if (path) {
            await this.animatePath(path);
            this.updateStats(this.getVisitedCount(), path.length, executionTime, '找到路徑');
        } else {
            this.updateStats(this.getVisitedCount(), 0, executionTime, '無路徑');
            alert('無法找到路徑');
        }
        
        this.isRunning = false;
        this.setButtonsDisabled(false);
    }
    
    async aStar() {
        const openList = [];
        const closedList = new Set();
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        const endNode = this.grid[this.endPos.row][this.endPos.col];
        
        startNode.g = 0;
        startNode.h = this.manhattanDistance(startNode, endNode);
        startNode.f = startNode.h;
        
        openList.push(startNode);
        
        while (openList.length > 0) {
            // 找到f值最小的節點
            let currentNode = openList[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < currentNode.f) {
                    currentNode = openList[i];
                    currentIndex = i;
                }
            }
            
            openList.splice(currentIndex, 1);
            closedList.add(currentNode);
            
            // 找到終點
            if (currentNode === endNode) {
                return this.reconstructPath(currentNode);
            }
            
            // 視覺化搜索過程
            if (!currentNode.isStart && !currentNode.isEnd) {
                currentNode.isClosed = true;
                this.updateCell(currentNode.row, currentNode.col);
                await this.delay(this.animationSpeed);
            }
            
            // 檢查鄰居
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (closedList.has(neighbor) || neighbor.isWall) {
                    continue;
                }
                
                const tentativeG = currentNode.g + 1;
                
                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                    if (!neighbor.isStart && !neighbor.isEnd) {
                        neighbor.isOpen = true;
                        this.updateCell(neighbor.row, neighbor.col);
                    }
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }
                
                neighbor.parent = currentNode;
                neighbor.g = tentativeG;
                neighbor.h = this.manhattanDistance(neighbor, endNode);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
        
        return null;
    }
    
    async dijkstra() {
        const unvisited = [];
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        const endNode = this.grid[this.endPos.row][this.endPos.col];
        
        // 初始化所有節點
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const node = this.grid[row][col];
                node.g = Infinity;
                unvisited.push(node);
            }
        }
        
        startNode.g = 0;
        
        while (unvisited.length > 0) {
            // 找到距離最小的節點
            unvisited.sort((a, b) => a.g - b.g);
            const currentNode = unvisited.shift();
            
            if (currentNode.g === Infinity) break;
            if (currentNode.isWall) continue;
            
            // 找到終點
            if (currentNode === endNode) {
                return this.reconstructPath(currentNode);
            }
            
            // 視覺化搜索過程
            if (!currentNode.isStart && !currentNode.isEnd) {
                currentNode.isClosed = true;
                this.updateCell(currentNode.row, currentNode.col);
                await this.delay(this.animationSpeed);
            }
            
            // 檢查鄰居
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (neighbor.isWall) continue;
                
                const tentativeG = currentNode.g + 1;
                
                if (tentativeG < neighbor.g) {
                    neighbor.g = tentativeG;
                    neighbor.parent = currentNode;
                    
                    if (!neighbor.isStart && !neighbor.isEnd) {
                        neighbor.isOpen = true;
                        this.updateCell(neighbor.row, neighbor.col);
                    }
                }
            }
        }
        
        return null;
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        
        // 上下左右
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
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
        const path = [];
        let currentNode = endNode;
        
        while (currentNode !== null) {
            path.unshift(currentNode);
            currentNode = currentNode.parent;
        }
        
        return path;
    }
    
    async animatePath(path) {
        for (let i = 1; i < path.length - 1; i++) {
            const node = path[i];
            node.isPath = true;
            this.updateCell(node.row, node.col);
            await this.delay(this.animationSpeed * 2);
        }
    }
    
    getVisitedCount() {
        let count = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].isClosed || this.grid[row][col].isOpen) {
                    count++;
                }
            }
        }
        return count;
    }
    
    updateStats(visitedCount, pathLength, executionTime, status) {
        document.getElementById('visitedCount').textContent = visitedCount;
        document.getElementById('pathLength').textContent = pathLength;
        document.getElementById('executionTime').textContent = executionTime;
        document.getElementById('currentStatus').textContent = status;
    }
    
    setButtonsDisabled(disabled) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => button.disabled = disabled);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
                
                this.updateCellElement(cell, row, col);
                gridElement.appendChild(cell);
            }
        }
    }
    
    updateCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            this.updateCellElement(cell, row, col);
        }
    }
    
    updateCellElement(cell, row, col) {
        const gridCell = this.grid[row][col];
        
        cell.className = 'cell';
        
        if (gridCell.isStart) {
            cell.classList.add('start');
        } else if (gridCell.isEnd) {
            cell.classList.add('end');
        } else if (gridCell.isWall) {
            cell.classList.add('wall');
        } else if (gridCell.isPath) {
            cell.classList.add('path');
        } else if (gridCell.isClosed) {
            cell.classList.add('closed');
        } else if (gridCell.isOpen) {
            cell.classList.add('open');
        }
    }
}

// 初始化應用程序
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});