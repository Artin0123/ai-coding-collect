class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.startNode = { x: 2, y: 2 };
        this.endNode = { x: 12, y: 12 };
        this.isDragging = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isAnimating = false;
        this.currentAlgorithm = 'astar';
        
        this.initializeGrid();
        this.setupEventListeners();
        this.renderGrid();
        this.updateStats();
    }
    
    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = {
                    x: x,
                    y: y,
                    isObstacle: false,
                    isStart: x === this.startNode.x && y === this.startNode.y,
                    isEnd: x === this.endNode.x && y === this.endNode.y,
                    isOpen: false,
                    isClosed: false,
                    isPath: false,
                    gCost: Infinity,
                    hCost: Infinity,
                    fCost: Infinity,
                    parent: null
                };
            }
        }
    }
    
    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        
        // Mouse events for obstacle creation
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        gridElement.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Touch events for mobile
        gridElement.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        gridElement.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        gridElement.addEventListener('touchend', () => this.handleMouseUp());
        
        // Control panel events
        document.getElementById('setStartBtn').addEventListener('click', () => this.toggleSetStart());
        document.getElementById('setEndBtn').addEventListener('click', () => this.toggleSetEnd());
        document.getElementById('clearPathBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGrid());
        document.getElementById('startBtn').addEventListener('click', () => this.startPathfinding());
        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
        });
        
        // Prevent context menu
        gridElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleMouseDown(e) {
        if (this.isAnimating) return;
        
        const cell = this.getCellFromEvent(e);
        if (!cell) return;
        
        if (this.isSettingStart) {
            this.setStartPoint(cell.x, cell.y);
            this.isSettingStart = false;
            this.updateButtonStates();
            return;
        }
        
        if (this.isSettingEnd) {
            this.setEndPoint(cell.x, cell.y);
            this.isSettingEnd = false;
            this.updateButtonStates();
            return;
        }
        
        // Toggle obstacle on click
        if (!cell.isStart && !cell.isEnd) {
            cell.isObstacle = !cell.isObstacle;
            this.isDragging = true;
            this.renderCell(cell.x, cell.y);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        
        const cell = this.getCellFromEvent(e);
        if (!cell || cell.isStart || cell.isEnd) return;
        
        cell.isObstacle = true;
        this.renderCell(cell.x, cell.y);
    }
    
    handleMouseUp() {
        this.isDragging = false;
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }
    
    getCellFromEvent(e) {
        const rect = e.target.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 31);
        const y = Math.floor((e.clientY - rect.top) / 31);
        
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            return this.grid[y][x];
        }
        return null;
    }
    
    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.id = `cell-${x}-${y}`;
                cellElement.addEventListener('click', (e) => this.handleCellClick(x, y, e));
                gridElement.appendChild(cellElement);
                this.renderCell(x, y);
            }
        }
    }
    
    renderCell(x, y) {
        const cell = this.grid[y][x];
        const cellElement = document.getElementById(`cell-${x}-${y}`);
        
        if (!cellElement) return;
        
        // Remove all state classes
        cellElement.className = 'cell';
        
        // Add appropriate classes
        if (cell.isStart) {
            cellElement.classList.add('start');
        } else if (cell.isEnd) {
            cellElement.classList.add('end');
        } else if (cell.isObstacle) {
            cellElement.classList.add('obstacle');
        } else if (cell.isPath) {
            cellElement.classList.add('path');
        } else if (cell.isOpen) {
            cellElement.classList.add('open');
        } else if (cell.isClosed) {
            cellElement.classList.add('closed');
        }
    }
    
    handleCellClick(x, y, e) {
        if (this.isAnimating) return;
        
        const cell = this.grid[y][x];
        
        if (this.isSettingStart) {
            this.setStartPoint(x, y);
            this.isSettingStart = false;
            this.updateButtonStates();
        } else if (this.isSettingEnd) {
            this.setEndPoint(x, y);
            this.isSettingEnd = false;
            this.updateButtonStates();
        }
    }
    
    setStartPoint(x, y) {
        // Clear previous start point
        for (let row of this.grid) {
            for (let cell of row) {
                cell.isStart = false;
            }
        }
        
        // Set new start point
        this.startNode = { x, y };
        this.grid[y][x].isStart = true;
        this.grid[y][x].isObstacle = false;
        
        this.renderGrid();
    }
    
    setEndPoint(x, y) {
        // Clear previous end point
        for (let row of this.grid) {
            for (let cell of row) {
                cell.isEnd = false;
            }
        }
        
        // Set new end point
        this.endNode = { x, y };
        this.grid[y][x].isEnd = true;
        this.grid[y][x].isObstacle = false;
        
        this.renderGrid();
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
    
    updateButtonStates() {
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        const startBtn = document.getElementById('startBtn');
        const clearPathBtn = document.getElementById('clearPathBtn');
        const resetBtn = document.getElementById('resetBtn');
        const algorithmSelect = document.getElementById('algorithmSelect');
        
        setStartBtn.textContent = this.isSettingStart ? '取消設定' : '設定起點';
        setEndBtn.textContent = this.isSettingEnd ? '取消設定' : '設定終點';
        
        setStartBtn.classList.toggle('active', this.isSettingStart);
        setEndBtn.classList.toggle('active', this.isSettingEnd);
        
        const disabled = this.isAnimating;
        setStartBtn.disabled = disabled;
        setEndBtn.disabled = disabled;
        startBtn.disabled = disabled;
        clearPathBtn.disabled = disabled;
        resetBtn.disabled = disabled;
        algorithmSelect.disabled = disabled;
    }
    
    clearPath() {
        if (this.isAnimating) return;
        
        for (let row of this.grid) {
            for (let cell of row) {
                cell.isOpen = false;
                cell.isClosed = false;
                cell.isPath = false;
                cell.gCost = Infinity;
                cell.hCost = Infinity;
                cell.fCost = Infinity;
                cell.parent = null;
            }
        }
        
        this.renderGrid();
        this.updateStats();
    }
    
    resetGrid() {
        if (this.isAnimating) return;
        
        this.startNode = { x: 2, y: 2 };
        this.endNode = { x: 12, y: 12 };
        this.initializeGrid();
        this.renderGrid();
        this.updateStats();
    }
    
    updateStats(visitedCount = 0, pathLength = 0, executionTime = 0, status = '就緒') {
        document.getElementById('visitedCount').textContent = visitedCount;
        document.getElementById('pathLength').textContent = pathLength;
        document.getElementById('executionTime').textContent = executionTime;
        document.getElementById('currentStatus').textContent = status;
    }
    
    // A* Algorithm implementation
    async startPathfinding() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.updateButtonStates();
        this.clearPath();
        
        const startTime = performance.now();
        
        if (this.currentAlgorithm === 'astar') {
            await this.aStar();
        } else {
            await this.dijkstra();
        }
        
        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);
        
        this.isAnimating = false;
        this.updateButtonStates();
    }
    
    async aStar() {
        const openList = [];
        const closedList = [];
        let visitedCount = 0;
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const endNode = this.grid[this.endNode.y][this.endNode.x];
        
        startNode.gCost = 0;
        startNode.hCost = this.manhattanDistance(startNode, endNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        
        openList.push(startNode);
        
        while (openList.length > 0) {
            // Sort open list by fCost
            openList.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openList.shift();
            
            if (currentNode === endNode) {
                await this.reconstructPath(currentNode);
                this.updateStats(visitedCount, this.getPathLength(), 0, '找到路徑');
                return;
            }
            
            closedList.push(currentNode);
            currentNode.isClosed = true;
            currentNode.isOpen = false;
            visitedCount++;
            
            this.renderCell(currentNode.x, currentNode.y);
            await this.delay(10);
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (let neighbor of neighbors) {
                if (neighbor.isObstacle || closedList.includes(neighbor)) {
                    continue;
                }
                
                const tentativeGCost = currentNode.gCost + 1;
                
                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                    neighbor.isOpen = true;
                    this.renderCell(neighbor.x, neighbor.y);
                } else if (tentativeGCost >= neighbor.gCost) {
                    continue;
                }
                
                neighbor.parent = currentNode;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = this.manhattanDistance(neighbor, endNode);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
            }
        }
        
        this.updateStats(visitedCount, 0, 0, '無路徑');
        alert('無法找到路徑');
    }
    
    async dijkstra() {
        const unvisitedNodes = [];
        let visitedCount = 0;
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const endNode = this.grid[this.endNode.y][this.endNode.x];
        
        // Initialize all nodes
        for (let row of this.grid) {
            for (let node of row) {
                if (!node.isObstacle) {
                    node.gCost = node === startNode ? 0 : Infinity;
                    unvisitedNodes.push(node);
                }
            }
        }
        
        while (unvisitedNodes.length > 0) {
            // Sort by distance
            unvisitedNodes.sort((a, b) => a.gCost - b.gCost);
            const currentNode = unvisitedNodes.shift();
            
            if (currentNode.gCost === Infinity) break;
            if (currentNode === endNode) {
                await this.reconstructPath(currentNode);
                this.updateStats(visitedCount, this.getPathLength(), 0, '找到路徑');
                return;
            }
            
            currentNode.isClosed = true;
            visitedCount++;
            
            this.renderCell(currentNode.x, currentNode.y);
            await this.delay(10);
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (let neighbor of neighbors) {
                if (neighbor.isObstacle || neighbor.isClosed) continue;
                
                const tentativeDistance = currentNode.gCost + 1;
                
                if (tentativeDistance < neighbor.gCost) {
                    neighbor.parent = currentNode;
                    neighbor.gCost = tentativeDistance;
                    neighbor.isOpen = true;
                    this.renderCell(neighbor.x, neighbor.y);
                }
            }
        }
        
        this.updateStats(visitedCount, 0, 0, '無路徑');
        alert('無法找到路徑');
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];
        
        for (let dir of directions) {
            const x = node.x + dir.x;
            const y = node.y + dir.y;
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                neighbors.push(this.grid[y][x]);
            }
        }
        
        return neighbors;
    }
    
    manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
    }
    
    async reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        
        while (currentNode !== null) {
            path.unshift(currentNode);
            currentNode = currentNode.parent;
        }
        
        // Animate path reconstruction
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (!node.isStart && !node.isEnd) {
                node.isPath = true;
                node.isOpen = false;
                node.isClosed = false;
                this.renderCell(node.x, node.y);
                
                if (i < path.length - 1) {
                    await this.delay(50);
                }
            }
        }
    }
    
    getPathLength() {
        let length = 0;
        for (let row of this.grid) {
            for (let cell of row) {
                if (cell.isPath) length++;
            }
        }
        return length;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});