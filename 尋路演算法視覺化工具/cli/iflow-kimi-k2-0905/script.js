class PathfindingVisualizer {
    constructor() {
        this.gridSize = 25;
        this.cellSize = 20;
        this.start = { x: 2, y: 2 };
        this.end = { x: 22, y: 22 };
        this.grid = [];
        this.isMouseDown = false;
        this.mode = 'normal'; // normal, setStart, setEnd
        this.isAnimating = false;
        this.animationSpeed = 10;
        
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
                    isStart: false,
                    isEnd: false,
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
        
        // Set default start and end points
        this.grid[this.start.y][this.start.x].isStart = true;
        this.grid[this.end.y][this.end.x].isEnd = true;
    }
    
    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        const setStartBtn = document.getElementById('setStart');
        const setEndBtn = document.getElementById('setEnd');
        const clearPathBtn = document.getElementById('clearPath');
        const resetBtn = document.getElementById('reset');
        const startSearchBtn = document.getElementById('startSearch');
        
        // Grid mouse events
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        gridElement.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Button events
        setStartBtn.addEventListener('click', () => this.setMode('setStart'));
        setEndBtn.addEventListener('click', () => this.setMode('setEnd'));
        clearPathBtn.addEventListener('click', () => this.clearPath());
        resetBtn.addEventListener('click', () => this.reset());
        startSearchBtn.addEventListener('click', () => this.startSearch());
        
        // Prevent context menu
        gridElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleMouseDown(e) {
        if (this.isAnimating) return;
        
        const rect = e.target.closest('.grid').getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (this.cellSize + 1));
        const y = Math.floor((e.clientY - rect.top) / (this.cellSize + 1));
        
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;
        
        const cell = this.grid[y][x];
        
        if (this.mode === 'setStart') {
            this.setStartPoint(x, y);
            this.setMode('normal');
            return;
        }
        
        if (this.mode === 'setEnd') {
            this.setEndPoint(x, y);
            this.setMode('normal');
            return;
        }
        
        if (!cell.isStart && !cell.isEnd) {
            this.isMouseDown = true;
            cell.isObstacle = !cell.isObstacle;
            this.renderGrid();
        }
    }
    
    handleMouseMove(e) {
        if (!this.isMouseDown || this.isAnimating) return;
        
        const rect = e.target.closest('.grid').getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (this.cellSize + 1));
        const y = Math.floor((e.clientY - rect.top) / (this.cellSize + 1));
        
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;
        
        const cell = this.grid[y][x];
        if (!cell.isStart && !cell.isEnd) {
            cell.isObstacle = true;
            this.renderGrid();
        }
    }
    
    handleMouseUp() {
        this.isMouseDown = false;
    }
    
    setMode(mode) {
        this.mode = mode;
        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        if (mode === 'setStart') {
            document.getElementById('setStart').classList.add('active');
        } else if (mode === 'setEnd') {
            document.getElementById('setEnd').classList.add('active');
        }
    }
    
    setStartPoint(x, y) {
        // Clear previous start point
        this.grid[this.start.y][this.start.x].isStart = false;
        
        // Set new start point
        this.start = { x, y };
        this.grid[y][x].isStart = true;
        this.grid[y][x].isObstacle = false;
        
        this.renderGrid();
    }
    
    setEndPoint(x, y) {
        // Clear previous end point
        this.grid[this.end.y][this.end.x].isEnd = false;
        
        // Set new end point
        this.end = { x, y };
        this.grid[y][x].isEnd = true;
        this.grid[y][x].isObstacle = false;
        
        this.renderGrid();
    }
    
    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.x = x;
                cellElement.dataset.y = y;
                
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
                
                gridElement.appendChild(cellElement);
            }
        }
    }
    
    clearPath() {
        if (this.isAnimating) return;
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x].isOpen = false;
                this.grid[y][x].isClosed = false;
                this.grid[y][x].isPath = false;
                this.grid[y][x].g = 0;
                this.grid[y][x].h = 0;
                this.grid[y][x].f = 0;
                this.grid[y][x].parent = null;
            }
        }
        
        this.renderGrid();
        this.updateStats();
    }
    
    reset() {
        if (this.isAnimating) return;
        
        this.initializeGrid();
        this.renderGrid();
        this.updateStats();
        this.setMode('normal');
    }
    
    async startSearch() {
        if (this.isAnimating) return;
        
        const algorithm = document.getElementById('algorithm').value;
        this.clearPath();
        this.isAnimating = true;
        this.disableControls(true);
        this.updateStatus('搜尋中...');
        
        const startTime = performance.now();
        let result;
        
        try {
            if (algorithm === 'astar') {
                result = await this.aStar();
            } else if (algorithm === 'dijkstra') {
                result = await this.dijkstra();
            } else if (algorithm === 'bfs') {
                result = await this.bfs();
            }
            
            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime);
            
            if (result.path) {
                await this.animatePath(result.path);
                this.updateStatus('找到路徑');
                this.updateStats(result.visitedNodes, result.path.length, executionTime);
            } else {
                this.updateStatus('無路徑');
                alert('無法找到路徑');
                this.updateStats(result.visitedNodes, 0, executionTime);
            }
        } catch (error) {
            console.error('搜尋錯誤:', error);
            this.updateStatus('錯誤');
        } finally {
            this.isAnimating = false;
            this.disableControls(false);
        }
    }
    
    async aStar() {
        const openSet = [this.grid[this.start.y][this.start.x]];
        const closedSet = [];
        let visitedNodes = 0;
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            openSet.splice(currentIndex, 1);
            closedSet.push(current);
            current.isClosed = true;
            current.isOpen = false;
            visitedNodes++;
            
            await this.sleep(this.animationSpeed);
            
            // Check if we reached the end
            if (current.x === this.end.x && current.y === this.end.y) {
                const path = this.reconstructPath(current);
                return { path, visitedNodes };
            }
            
            // Explore neighbors
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) {
                    continue;
                }
                
                const tentativeG = current.g + this.getDistance(current, neighbor);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    neighbor.isOpen = true;
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }
                
                neighbor.parent = current;
                neighbor.g = tentativeG;
                neighbor.h = this.getHeuristic(neighbor, this.grid[this.end.y][this.end.x]);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
        
        return { path: null, visitedNodes };
    }
    
    async dijkstra() {
        const unvisited = [];
        const startNode = this.grid[this.start.y][this.start.x];
        
        // Initialize all nodes
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const node = this.grid[y][x];
                node.distance = Infinity;
                node.visited = false;
                if (!node.isObstacle) {
                    unvisited.push(node);
                }
            }
        }
        
        startNode.distance = 0;
        let visitedNodes = 0;
        
        while (unvisited.length > 0) {
            // Find unvisited node with minimum distance
            unvisited.sort((a, b) => a.distance - b.distance);
            const current = unvisited.shift();
            
            if (current.distance === Infinity) break;
            
            current.visited = true;
            current.isClosed = true;
            visitedNodes++;
            
            await this.sleep(this.animationSpeed);
            
            // Check if we reached the end
            if (current.x === this.end.x && current.y === this.end.y) {
                const path = this.reconstructPath(current);
                return { path, visitedNodes };
            }
            
            // Explore neighbors
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || neighbor.visited) continue;
                
                const newDistance = current.distance + this.getDistance(current, neighbor);
                
                if (newDistance < neighbor.distance) {
                    neighbor.distance = newDistance;
                    neighbor.parent = current;
                    neighbor.isOpen = true;
                }
            }
        }
        
        return { path: null, visitedNodes };
    }
    
    async bfs() {
        const queue = [this.grid[this.start.y][this.start.x]];
        const visited = new Set();
        let visitedNodes = 0;
        
        visited.add(`${this.start.x},${this.start.y}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            current.isClosed = true;
            visitedNodes++;
            
            await this.sleep(this.animationSpeed);
            
            // Check if we reached the end
            if (current.x === this.end.x && current.y === this.end.y) {
                const path = this.reconstructPath(current);
                return { path, visitedNodes };
            }
            
            // Explore neighbors
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                
                if (neighbor.isObstacle || visited.has(key)) continue;
                
                visited.add(key);
                neighbor.parent = current;
                neighbor.isOpen = true;
                queue.push(neighbor);
            }
        }
        
        return { path: null, visitedNodes };
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];
        
        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            
            if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
                neighbors.push(this.grid[newY][newX]);
            }
        }
        
        return neighbors;
    }
    
    getDistance(node1, node2) {
        return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y);
    }
    
    getHeuristic(node1, node2) {
        // Manhattan distance
        return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y);
    }
    
    reconstructPath(endNode) {
        const path = [];
        let current = endNode;
        
        while (current) {
            path.unshift(current);
            current = current.parent;
        }
        
        return path;
    }
    
    async animatePath(path) {
        for (const node of path) {
            if (!node.isStart && !node.isEnd) {
                node.isPath = true;
            }
            node.isOpen = false;
            node.isClosed = false;
        }
        
        // Animate path with delay
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (!node.isStart && !node.isEnd) {
                this.renderGrid();
                await this.sleep(50);
            }
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    disableControls(disabled) {
        const buttons = document.querySelectorAll('.control-btn, .control-select');
        buttons.forEach(btn => btn.disabled = disabled);
    }
    
    updateStatus(status) {
        document.getElementById('currentStatus').textContent = status;
    }
    
    updateStats(visitedNodes = 0, pathLength = 0, executionTime = 0) {
        document.getElementById('visitedNodes').textContent = visitedNodes;
        document.getElementById('pathLength').textContent = pathLength;
        document.getElementById('executionTime').textContent = executionTime;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});