class PathfindingVisualizer {
    constructor() {
        this.gridSize = 25;
        this.cellSize = 20;
        this.grid = [];
        this.start = { row: 2, col: 2 };
        this.end = { row: 22, col: 22 };
        this.isMouseDown = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isRunning = false;
        this.animationSpeed = 10; // ms
        
        this.initializeGrid();
        this.renderGrid();
        this.setupEventListeners();
    }
    
    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    isStart: row === this.start.row && col === this.start.col,
                    isEnd: row === this.end.row && col === this.end.col,
                    isObstacle: false,
                    isOpen: false,
                    isClosed: false,
                    isPath: false,
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null
                };
            }
        }
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
                
                if (this.grid[row][col].isStart) {
                    cell.classList.add('start');
                } else if (this.grid[row][col].isEnd) {
                    cell.classList.add('end');
                } else if (this.grid[row][col].isObstacle) {
                    cell.classList.add('obstacle');
                } else if (this.grid[row][col].isPath) {
                    cell.classList.add('path');
                } else if (this.grid[row][col].isOpen) {
                    cell.classList.add('open');
                } else if (this.grid[row][col].isClosed) {
                    cell.classList.add('closed');
                }
                
                gridElement.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        
        // Grid mouse events
        gridElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell')) {
                this.isMouseDown = true;
                this.handleCellClick(e.target);
            }
        });
        
        gridElement.addEventListener('mouseover', (e) => {
            if (this.isMouseDown && e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        // Button events
        document.getElementById('setStartBtn').addEventListener('click', () => {
            this.isSettingStart = true;
            this.isSettingEnd = false;
            this.updateStatus('點擊網格設定起點');
            this.updateButtons();
        });
        
        document.getElementById('setEndBtn').addEventListener('click', () => {
            this.isSettingEnd = true;
            this.isSettingStart = false;
            this.updateStatus('點擊網格設定終點');
            this.updateButtons();
        });
        
        document.getElementById('clearPathBtn').addEventListener('click', () => {
            this.clearPath();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGrid();
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startPathfinding();
        });
    }
    
    handleCellClick(cell) {
        if (this.isRunning) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.isSettingStart) {
            // Cannot set start on obstacle or end
            if (!this.grid[row][col].isObstacle && !this.grid[row][col].isEnd) {
                this.grid[this.start.row][this.start.col].isStart = false;
                this.start = { row, col };
                this.grid[row][col].isStart = true;
                this.isSettingStart = false;
                this.updateStatus('就緒');
                this.renderGrid();
                this.updateButtons();
            }
        } else if (this.isSettingEnd) {
            // Cannot set end on obstacle or start
            if (!this.grid[row][col].isObstacle && !this.grid[row][col].isStart) {
                this.grid[this.end.row][this.end.col].isEnd = false;
                this.end = { row, col };
                this.grid[row][col].isEnd = true;
                this.isSettingEnd = false;
                this.updateStatus('就緒');
                this.renderGrid();
                this.updateButtons();
            }
        } else {
            // Toggle obstacle (cannot place on start or end)
            if (!this.grid[row][col].isStart && !this.grid[row][col].isEnd) {
                this.grid[row][col].isObstacle = !this.grid[row][col].isObstacle;
                this.renderGrid();
            }
        }
    }
    
    clearPath() {
        if (this.isRunning) return;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (!this.grid[row][col].isStart && !this.grid[row][col].isEnd) {
                    this.grid[row][col].isOpen = false;
                    this.grid[row][col].isClosed = false;
                    this.grid[row][col].isPath = false;
                }
            }
        }
        this.renderGrid();
        this.updateStats(0, 0, 0);
        this.updateStatus('就緒');
        this.clearErrorMessage();
    }
    
    resetGrid() {
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.initializeGrid();
        this.renderGrid();
        this.updateStats(0, 0, 0);
        this.updateStatus('就緒');
        this.clearErrorMessage();
        this.updateButtons();
    }
    
    startPathfinding() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateButtons();
        this.clearPath();
        this.clearErrorMessage();
        
        const algorithm = document.getElementById('algorithmSelect').value;
        const startTime = performance.now();
        
        let result;
        switch (algorithm) {
            case 'astar':
                result = this.runAStar();
                break;
            case 'dijkstra':
                result = this.runDijkstra();
                break;
            case 'bfs':
                result = this.runBFS();
                break;
        }
        
        if (result) {
            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime);
            this.animateSearch(result.visited, result.path, executionTime);
        } else {
            this.isRunning = false;
            this.updateButtons();
            this.updateStatus('無路徑');
            this.showErrorMessage('無法找到路徑');
        }
    }
    
    runAStar() {
        const openSet = [];
        const closedSet = new Set();
        const startNode = this.grid[this.start.row][this.start.col];
        const endNode = this.grid[this.end.row][this.end.col];
        
        startNode.g = 0;
        startNode.h = this.manhattanDistance(startNode, endNode);
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);
        
        const visited = [];
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            
            const currentNode = openSet[lowestIndex];
            visited.push(currentNode);
            
            if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
                // Path found
                const path = this.reconstructPath(currentNode);
                return { visited, path };
            }
            
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${currentNode.row},${currentNode.col}`);
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (closedSet.has(neighborKey)) continue;
                if (neighbor.isObstacle) continue;
                
                const tentativeG = currentNode.g + 1;
                let newPath = false;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    newPath = true;
                } else if (tentativeG < neighbor.g) {
                    newPath = true;
                }
                
                if (newPath) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = this.manhattanDistance(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                }
            }
        }
        
        return null; // No path found
    }
    
    runDijkstra() {
        const openSet = [];
        const closedSet = new Set();
        const startNode = this.grid[this.start.row][this.start.col];
        const endNode = this.grid[this.end.row][this.end.col];
        
        startNode.g = 0;
        openSet.push(startNode);
        
        const visited = [];
        
        while (openSet.length > 0) {
            // Find node with lowest g score
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].g < openSet[lowestIndex].g) {
                    lowestIndex = i;
                }
            }
            
            const currentNode = openSet[lowestIndex];
            visited.push(currentNode);
            
            if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
                // Path found
                const path = this.reconstructPath(currentNode);
                return { visited, path };
            }
            
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${currentNode.row},${currentNode.col}`);
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (closedSet.has(neighborKey)) continue;
                if (neighbor.isObstacle) continue;
                
                const tentativeG = currentNode.g + 1;
                let newPath = false;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    newPath = true;
                } else if (tentativeG < neighbor.g) {
                    newPath = true;
                }
                
                if (newPath) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                }
            }
        }
        
        return null; // No path found
    }
    
    runBFS() {
        const queue = [];
        const visitedSet = new Set();
        const startNode = this.grid[this.start.row][this.start.col];
        const endNode = this.grid[this.end.row][this.end.col];
        
        queue.push(startNode);
        visitedSet.add(`${startNode.row},${startNode.col}`);
        
        const visited = [];
        
        while (queue.length > 0) {
            const currentNode = queue.shift();
            visited.push(currentNode);
            
            if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
                // Path found
                const path = this.reconstructPath(currentNode);
                return { visited, path };
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (visitedSet.has(neighborKey)) continue;
                if (neighbor.isObstacle) continue;
                
                visitedSet.add(neighborKey);
                neighbor.parent = currentNode;
                queue.push(neighbor);
            }
        }
        
        return null; // No path found
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal directions
            // [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal directions (commented out for 4-directional movement)
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
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
        let current = endNode;
        
        while (current !== null) {
            path.unshift(current);
            current = current.parent;
        }
        
        return path;
    }
    
    async animateSearch(visited, path, executionTime) {
        this.updateStatus('搜尋中');
        
        // Animate visited nodes
        for (let i = 0; i < visited.length; i++) {
            const node = visited[i];
            if (!node.isStart && !node.isEnd) {
                if (path.includes(node)) {
                    node.isPath = true;
                } else if (i === visited.length - 1) {
                    // Last visited node is the end (if path found)
                    node.isClosed = true;
                } else {
                    node.isClosed = true;
                }
                this.renderGrid();
                await this.sleep(this.animationSpeed);
            }
        }
        
        // Highlight the final path
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (!node.isStart && !node.isEnd) {
                node.isPath = true;
                this.renderGrid();
                await this.sleep(this.animationSpeed);
            }
        }
        
        this.isRunning = false;
        this.updateButtons();
        this.updateStatus('找到路徑');
        this.updateStats(visited.length, path.length - 1, executionTime);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateStats(visitedCount, pathLength, executionTime) {
        document.getElementById('visitedCount').textContent = visitedCount;
        document.getElementById('pathLength').textContent = pathLength;
        document.getElementById('executionTime').textContent = executionTime;
    }
    
    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }
    
    showErrorMessage(message) {
        document.getElementById('errorMessage').textContent = message;
    }
    
    clearErrorMessage() {
        document.getElementById('errorMessage').textContent = '';
    }
    
    updateButtons() {
        const isDisabled = this.isRunning || this.isSettingStart || this.isSettingEnd;
        const buttons = [
            'setStartBtn', 'setEndBtn', 'clearPathBtn', 'resetBtn', 'startBtn'
        ];
        
        buttons.forEach(id => {
            document.getElementById(id).disabled = isDisabled;
        });
        
        // Algorithm select should also be disabled during running
        document.getElementById('algorithmSelect').disabled = this.isRunning;
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});