class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.startNode = { x: 2, y: 2 };
        this.endNode = { x: 12, y: 12 };
        this.isMouseDown = false;
        this.isDragging = false;
        this.currentMode = 'obstacle'; // 'obstacle', 'start', 'end'
        this.isAnimating = false;
        this.animationSpeed = 10; // ms per step
        
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
                    hCost: 0,
                    fCost: Infinity,
                    parent: null
                };
            }
        }
    }

    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        
        // Mouse events for grid interaction
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        gridElement.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Prevent context menu on grid
        gridElement.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Control panel buttons
        document.getElementById('setStart').addEventListener('click', () => this.setMode('start'));
        document.getElementById('setEnd').addEventListener('click', () => this.setMode('end'));
        document.getElementById('clearPath').addEventListener('click', () => this.clearPath());
        document.getElementById('reset').addEventListener('click', () => this.resetGrid());
        document.getElementById('startSearch').addEventListener('click', () => this.startPathfinding());
    }

    handleMouseDown(e) {
        if (this.isAnimating) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        this.isMouseDown = true;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        if (this.currentMode === 'obstacle') {
            this.isDragging = true;
            this.toggleObstacle(x, y);
        } else if (this.currentMode === 'start') {
            this.setStartNode(x, y);
        } else if (this.currentMode === 'end') {
            this.setEndNode(x, y);
        }
    }

    handleMouseMove(e) {
        if (!this.isMouseDown || !this.isDragging || this.isAnimating) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        if (this.currentMode === 'obstacle') {
            this.setObstacle(x, y, true);
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
        this.isDragging = false;
    }

    setMode(mode) {
        if (this.isAnimating) return;
        
        this.currentMode = mode;
        
        // Update button states
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'start') {
            document.getElementById('setStart').classList.add('active');
        } else if (mode === 'end') {
            document.getElementById('setEnd').classList.add('active');
        }
    }

    toggleObstacle(x, y) {
        const node = this.grid[y][x];
        if (node.isStart || node.isEnd) return;
        
        this.setObstacle(x, y, !node.isObstacle);
    }

    setObstacle(x, y, isObstacle) {
        const node = this.grid[y][x];
        if (node.isStart || node.isEnd) return;
        
        node.isObstacle = isObstacle;
        this.renderCell(x, y);
    }

    setStartNode(x, y) {
        const node = this.grid[y][x];
        if (node.isObstacle || node.isEnd) return;
        
        // Clear previous start node
        const prevStart = this.grid[this.startNode.y][this.startNode.x];
        prevStart.isStart = false;
        this.renderCell(prevStart.x, prevStart.y);
        
        // Set new start node
        node.isStart = true;
        this.startNode = { x, y };
        this.renderCell(x, y);
        
        this.setMode('obstacle');
    }

    setEndNode(x, y) {
        const node = this.grid[y][x];
        if (node.isObstacle || node.isStart) return;
        
        // Clear previous end node
        const prevEnd = this.grid[this.endNode.y][this.endNode.x];
        prevEnd.isEnd = false;
        this.renderCell(prevEnd.x, prevEnd.y);
        
        // Set new end node
        node.isEnd = true;
        this.endNode = { x, y };
        this.renderCell(x, y);
        
        this.setMode('obstacle');
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                this.updateCellAppearance(cell, this.grid[y][x]);
                gridElement.appendChild(cell);
            }
        }
    }

    renderCell(x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            this.updateCellAppearance(cell, this.grid[y][x]);
        }
    }

    updateCellAppearance(cell, node) {
        cell.className = 'cell';
        
        if (node.isStart) {
            cell.classList.add('start');
        } else if (node.isEnd) {
            cell.classList.add('end');
        } else if (node.isObstacle) {
            cell.classList.add('obstacle');
        } else if (node.isPath) {
            cell.classList.add('path');
        } else if (node.isOpen) {
            cell.classList.add('open');
        } else if (node.isClosed) {
            cell.classList.add('closed');
        }
    }

    clearPath() {
        if (this.isAnimating) return;
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const node = this.grid[y][x];
                node.isOpen = false;
                node.isClosed = false;
                node.isPath = false;
                node.gCost = Infinity;
                node.hCost = 0;
                node.fCost = Infinity;
                node.parent = null;
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

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }  // left
        ];
        
        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            
            if (newX >= 0 && newX < this.gridSize && 
                newY >= 0 && newY < this.gridSize) {
                const neighbor = this.grid[newY][newX];
                if (!neighbor.isObstacle) {
                    neighbors.push(neighbor);
                }
            }
        }
        
        return neighbors;
    }

    getDistance(nodeA, nodeB) {
        // Manhattan distance
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
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

    async startPathfinding() {
        if (this.isAnimating) return;
        
        const algorithm = document.getElementById('algorithm').value;
        this.clearPath();
        this.isAnimating = true;
        this.disableControls(true);
        
        const startTime = performance.now();
        
        try {
            let result;
            if (algorithm === 'astar') {
                result = await this.aStar();
            } else {
                result = await this.dijkstra();
            }
            
            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime);
            
            if (result.success) {
                await this.animatePath(result.path);
                this.showStatus('找到路徑');
            } else {
                this.showError('無法找到路徑');
                this.showStatus('無路徑');
            }
            
            this.updateStats(result.visitedNodes, result.path ? result.path.length - 1 : 0, executionTime);
            
        } catch (error) {
            console.error('Pathfinding error:', error);
            this.showError('尋路過程中發生錯誤');
        } finally {
            this.isAnimating = false;
            this.disableControls(false);
        }
    }

    async aStar() {
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const endNode = this.grid[this.endNode.y][this.endNode.x];
        
        const openSet = [startNode];
        const closedSet = [];
        let visitedNodes = 0;
        
        startNode.gCost = 0;
        startNode.hCost = this.getDistance(startNode, endNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        
        while (openSet.length > 0) {
            // Get node with lowest fCost
            let currentNode = openSet[0];
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < currentNode.fCost || 
                    (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)) {
                    currentNode = openSet[i];
                }
            }
            
            // Move current node from open to closed set
            openSet.splice(openSet.indexOf(currentNode), 1);
            closedSet.push(currentNode);
            currentNode.isOpen = false;
            currentNode.isClosed = true;
            visitedNodes++;
            
            await this.animateCell(currentNode.x, currentNode.y, 'closed');
            
            if (currentNode === endNode) {
                const path = this.reconstructPath(endNode);
                return { success: true, path, visitedNodes };
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (closedSet.includes(neighbor)) continue;
                
                const newGCost = currentNode.gCost + this.getDistance(currentNode, neighbor);
                
                if (newGCost < neighbor.gCost || !openSet.includes(neighbor)) {
                    neighbor.gCost = newGCost;
                    neighbor.hCost = this.getDistance(neighbor, endNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    neighbor.parent = currentNode;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.isOpen = true;
                        await this.animateCell(neighbor.x, neighbor.y, 'open');
                    }
                }
            }
        }
        
        return { success: false, visitedNodes };
    }

    async dijkstra() {
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const endNode = this.grid[this.endNode.y][this.endNode.x];
        
        const unvisited = [];
        const visited = [];
        let visitedNodes = 0;
        
        // Initialize all nodes
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const node = this.grid[y][x];
                if (!node.isObstacle) {
                    node.gCost = Infinity;
                    unvisited.push(node);
                }
            }
        }
        
        startNode.gCost = 0;
        
        while (unvisited.length > 0) {
            // Get unvisited node with smallest distance
            let currentNode = unvisited[0];
            for (let i = 1; i < unvisited.length; i++) {
                if (unvisited[i].gCost < currentNode.gCost) {
                    currentNode = unvisited[i];
                }
            }
            
            if (currentNode.gCost === Infinity) break;
            
            // Remove from unvisited and add to visited
            unvisited.splice(unvisited.indexOf(currentNode), 1);
            visited.push(currentNode);
            currentNode.isClosed = true;
            visitedNodes++;
            
            await this.animateCell(currentNode.x, currentNode.y, 'closed');
            
            if (currentNode === endNode) {
                const path = this.reconstructPath(endNode);
                return { success: true, path, visitedNodes };
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (visited.includes(neighbor)) continue;
                
                const newDistance = currentNode.gCost + this.getDistance(currentNode, neighbor);
                
                if (newDistance < neighbor.gCost) {
                    neighbor.gCost = newDistance;
                    neighbor.parent = currentNode;
                    
                    if (!neighbor.isOpen) {
                        neighbor.isOpen = true;
                        await this.animateCell(neighbor.x, neighbor.y, 'open');
                    }
                }
            }
        }
        
        return { success: false, visitedNodes };
    }

    async animateCell(x, y, type) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('searching');
            await this.sleep(this.animationSpeed);
            cell.classList.remove('searching');
            this.renderCell(x, y);
        }
    }

    async animatePath(path) {
        for (let i = 1; i < path.length - 1; i++) {
            const node = path[i];
            node.isPath = true;
            await this.animateCell(node.x, node.y, 'path');
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    disableControls(disabled) {
        const buttons = document.querySelectorAll('.control-btn, .algorithm-select');
        buttons.forEach(btn => btn.disabled = disabled);
    }

    updateStats(visitedNodes = 0, pathLength = 0, executionTime = 0) {
        document.getElementById('visitedNodes').textContent = visitedNodes;
        document.getElementById('pathLength').textContent = pathLength;
        document.getElementById('executionTime').textContent = executionTime;
    }

    showStatus(status) {
        document.getElementById('currentStatus').textContent = status;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});