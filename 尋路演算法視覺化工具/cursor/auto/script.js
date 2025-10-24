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
        this.visitedNodes = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.currentStatus = '就緒';
        
        this.initializeGrid();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    initializeGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    type: 'empty',
                    element: null
                };
            }
        }
        
        // 創建格子元素
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                this.grid[row][col].element = cell;
                gridElement.appendChild(cell);
            }
        }
        
        // 設定起點和終點
        this.setCellType(this.startPos.row, this.startPos.col, 'start');
        this.setCellType(this.endPos.row, this.endPos.col, 'end');
    }
    
    setCellType(row, col, type) {
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) return;
        
        const cell = this.grid[row][col];
        const element = cell.element;
        
        // 清除之前的類別
        element.className = 'cell';
        
        // 設定新類型
        cell.type = type;
        if (type !== 'empty') {
            element.classList.add(type);
        }
    }
    
    getCellType(row, col) {
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) return 'wall';
        return this.grid[row][col].type;
    }
    
    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        
        // 網格點擊事件
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        gridElement.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        gridElement.addEventListener('click', (e) => this.handleClick(e));
        
        // 控制按鈕事件
        document.getElementById('setStartBtn').addEventListener('click', () => this.toggleSetStart());
        document.getElementById('setEndBtn').addEventListener('click', () => this.toggleSetEnd());
        document.getElementById('clearPathBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('startBtn').addEventListener('click', () => this.startPathfinding());
    }
    
    handleMouseDown(e) {
        if (this.isAnimating) return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
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
        
        // 開始拖曳創建障礙物
        this.isDragging = true;
        this.toggleObstacle(row, col);
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        this.toggleObstacle(row, col);
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
    }
    
    handleClick(e) {
        if (this.isDragging || this.isAnimating) return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.isSettingStart) {
            this.setStart(row, col);
        } else if (this.isSettingEnd) {
            this.setEnd(row, col);
        } else {
            this.toggleObstacle(row, col);
        }
    }
    
    toggleObstacle(row, col) {
        if (this.isAnimating) return;
        
        const cellType = this.getCellType(row, col);
        if (cellType === 'start' || cellType === 'end') return;
        
        if (cellType === 'obstacle') {
            this.setCellType(row, col, 'empty');
        } else {
            this.setCellType(row, col, 'obstacle');
        }
    }
    
    toggleSetStart() {
        if (this.isAnimating) return;
        
        this.isSettingStart = !this.isSettingStart;
        this.isSettingEnd = false;
        this.updateButtonStates();
    }
    
    toggleSetEnd() {
        if (this.isAnimating) return;
        
        this.isSettingEnd = !this.isSettingEnd;
        this.isSettingStart = false;
        this.updateButtonStates();
    }
    
    setStart(row, col) {
        if (this.getCellType(row, col) === 'obstacle') return;
        
        // 清除舊起點
        this.setCellType(this.startPos.row, this.startPos.col, 'empty');
        
        // 設定新起點
        this.startPos = { row, col };
        this.setCellType(row, col, 'start');
        
        this.isSettingStart = false;
        this.updateButtonStates();
    }
    
    setEnd(row, col) {
        if (this.getCellType(row, col) === 'obstacle') return;
        
        // 清除舊終點
        this.setCellType(this.endPos.row, this.endPos.col, 'empty');
        
        // 設定新終點
        this.endPos = { row, col };
        this.setCellType(row, col, 'end');
        
        this.isSettingEnd = false;
        this.updateButtonStates();
    }
    
    clearPath() {
        if (this.isAnimating) return;
        
        // 清除所有搜尋相關的格子
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cellType = this.getCellType(row, col);
                if (cellType === 'open' || cellType === 'closed' || cellType === 'path') {
                    this.setCellType(row, col, 'empty');
                }
            }
        }
        
        this.visitedNodes = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.currentStatus = '就緒';
        this.updateDisplay();
    }
    
    reset() {
        if (this.isAnimating) return;
        
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 12, col: 12 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.visitedNodes = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.currentStatus = '就緒';
        
        this.initializeGrid();
        this.updateButtonStates();
        this.updateDisplay();
    }
    
    async startPathfinding() {
        if (this.isAnimating) return;
        
        this.clearPath();
        this.isAnimating = true;
        this.currentStatus = '搜尋中';
        this.updateButtonStates();
        this.updateDisplay();
        
        const startTime = performance.now();
        const algorithm = document.getElementById('algorithmSelect').value;
        
        let result;
        if (algorithm === 'astar') {
            result = await this.runAStar();
        } else {
            result = await this.runDijkstra();
        }
        
        const endTime = performance.now();
        this.executionTime = Math.round(endTime - startTime);
        
        if (result && result.length > 0) {
            this.currentStatus = '找到路徑';
            this.pathLength = result.length - 1;
            await this.animatePath(result);
        } else {
            this.currentStatus = '無路徑';
            this.showMessage('無法找到路徑');
        }
        
        this.isAnimating = false;
        this.updateButtonStates();
        this.updateDisplay();
    }
    
    async runAStar() {
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${this.startPos.row},${this.startPos.col}`;
        const endKey = `${this.endPos.row},${this.endPos.col}`;
        
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(this.startPos, this.endPos));
        openSet.push({ ...this.startPos, f: fScore.get(startKey) });
        
        while (openSet.length > 0) {
            // 找到f值最小的節點
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            const currentKey = `${current.row},${current.col}`;
            
            if (currentKey === endKey) {
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(currentKey);
            this.setCellType(current.row, current.col, 'closed');
            this.visitedNodes++;
            
            await this.delay(10);
            
            const neighbors = this.getNeighbors(current.row, current.col);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeGScore = gScore.get(currentKey) + 1;
                
                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, this.endPos));
                    
                    if (!openSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                        openSet.push({ ...neighbor, f: fScore.get(neighborKey) });
                        this.setCellType(neighbor.row, neighbor.col, 'open');
                    }
                }
            }
        }
        
        return null;
    }
    
    async runDijkstra() {
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        
        // 初始化所有節點
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const key = `${row},${col}`;
                distances.set(key, Infinity);
                unvisited.add(key);
            }
        }
        
        const startKey = `${this.startPos.row},${this.startPos.col}`;
        const endKey = `${this.endPos.row},${this.endPos.col}`;
        
        distances.set(startKey, 0);
        
        while (unvisited.size > 0) {
            // 找到未訪問節點中距離最小的
            let currentKey = null;
            let minDistance = Infinity;
            
            for (const key of unvisited) {
                if (distances.get(key) < minDistance) {
                    minDistance = distances.get(key);
                    currentKey = key;
                }
            }
            
            if (currentKey === null || minDistance === Infinity) break;
            
            const [row, col] = currentKey.split(',').map(Number);
            unvisited.delete(currentKey);
            
            if (this.getCellType(row, col) !== 'obstacle') {
                this.setCellType(row, col, 'closed');
                this.visitedNodes++;
            }
            
            await this.delay(10);
            
            if (currentKey === endKey) {
                return this.reconstructPath(previous, { row, col });
            }
            
            const neighbors = this.getNeighbors(row, col);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                
                if (!unvisited.has(neighborKey)) continue;
                
                const alt = distances.get(currentKey) + 1;
                
                if (alt < distances.get(neighborKey)) {
                    distances.set(neighborKey, alt);
                    previous.set(neighborKey, { row, col });
                    
                    if (this.getCellType(neighbor.row, neighbor.col) !== 'obstacle') {
                        this.setCellType(neighbor.row, neighbor.col, 'open');
                    }
                }
            }
        }
        
        return null;
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // 上下左右
            [-1, -1], [-1, 1], [1, -1], [1, 1]  // 對角線
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize && 
                this.getCellType(newRow, newCol) !== 'obstacle') {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        
        return neighbors;
    }
    
    heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }
    
    reconstructPath(cameFrom, current) {
        const path = [current];
        
        while (cameFrom.has(`${current.row},${current.col}`)) {
            current = cameFrom.get(`${current.row},${current.col}`);
            path.unshift(current);
        }
        
        return path;
    }
    
    async animatePath(path) {
        for (let i = 1; i < path.length - 1; i++) {
            const { row, col } = path[i];
            this.setCellType(row, col, 'path');
            await this.delay(50);
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateButtonStates() {
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        const clearPathBtn = document.getElementById('clearPathBtn');
        const resetBtn = document.getElementById('resetBtn');
        const startBtn = document.getElementById('startBtn');
        
        const isDisabled = this.isAnimating;
        
        setStartBtn.disabled = isDisabled;
        setEndBtn.disabled = isDisabled;
        clearPathBtn.disabled = isDisabled;
        resetBtn.disabled = isDisabled;
        startBtn.disabled = isDisabled;
        
        setStartBtn.classList.toggle('active', this.isSettingStart);
        setEndBtn.classList.toggle('active', this.isSettingEnd);
    }
    
    updateDisplay() {
        document.getElementById('visitedNodes').textContent = this.visitedNodes;
        document.getElementById('pathLength').textContent = this.pathLength;
        document.getElementById('executionTime').textContent = this.executionTime;
        document.getElementById('currentStatus').textContent = this.currentStatus;
    }
    
    showMessage(text) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.classList.remove('hidden');
        
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 3000);
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});
