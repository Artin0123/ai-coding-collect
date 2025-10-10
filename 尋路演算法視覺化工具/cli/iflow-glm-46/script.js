class PathfindingVisualizer {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.startNode = { row: 2, col: 2 };
        this.endNode = { row: 12, col: 12 };
        this.isMouseDown = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isSearching = false;
        this.animationSpeed = 10;
        
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
            const currentRow = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell empty';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (row === this.startNode.row && col === this.startNode.col) {
                    cell.classList.remove('empty');
                    cell.classList.add('start');
                } else if (row === this.endNode.row && col === this.endNode.col) {
                    cell.classList.remove('empty');
                    cell.classList.add('end');
                }
                
                gridElement.appendChild(cell);
                currentRow.push({
                    element: cell,
                    row,
                    col,
                    isWall: false,
                    isStart: row === this.startNode.row && col === this.startNode.col,
                    isEnd: row === this.endNode.row && col === this.endNode.col,
                    f: 0,
                    g: 0,
                    h: 0,
                    parent: null
                });
            }
            this.grid.push(currentRow);
        }
    }
    
    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        
        gridElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell')) {
                this.isMouseDown = true;
                this.handleCellClick(e.target);
            }
        });
        
        gridElement.addEventListener('mouseover', (e) => {
            if (this.isMouseDown && e.target.classList.contains('cell')) {
                this.handleCellDrag(e.target);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        document.getElementById('setStartBtn').addEventListener('click', () => {
            this.setMode('start');
        });
        
        document.getElementById('setEndBtn').addEventListener('click', () => {
            this.setMode('end');
        });
        
        document.getElementById('clearPathBtn').addEventListener('click', () => {
            this.clearPath();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startPathfinding();
        });
    }
    
    handleCellClick(cellElement) {
        if (this.isSearching) return;
        
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const node = this.grid[row][col];
        
        if (this.isSettingStart && !node.isEnd && !node.isWall) {
            this.setStartNode(row, col);
            this.setMode(null);
        } else if (this.isSettingEnd && !node.isStart && !node.isWall) {
            this.setEndNode(row, col);
            this.setMode(null);
        } else if (!this.isSettingStart && !this.isSettingEnd) {
            if (!node.isStart && !node.isEnd) {
                node.isWall = !node.isWall;
                cellElement.classList.toggle('wall');
                cellElement.classList.toggle('empty');
            }
        }
    }
    
    handleCellDrag(cellElement) {
        if (this.isSearching || this.isSettingStart || this.isSettingEnd) return;
        
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const node = this.grid[row][col];
        
        if (!node.isStart && !node.isEnd && !node.isWall) {
            node.isWall = true;
            cellElement.classList.remove('empty');
            cellElement.classList.add('wall');
        }
    }
    
    setMode(mode) {
        this.isSettingStart = mode === 'start';
        this.isSettingEnd = mode === 'end';
        
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        
        setStartBtn.classList.toggle('active', this.isSettingStart);
        setEndBtn.classList.toggle('active', this.isSettingEnd);
        
        if (mode) {
            document.getElementById('currentStatus').textContent = 
                mode === 'start' ? '設定起點中' : '設定終點中';
        } else {
            document.getElementById('currentStatus').textContent = '就緒';
        }
    }
    
    setStartNode(row, col) {
        const oldStartNode = this.grid[this.startNode.row][this.startNode.col];
        oldStartNode.isStart = false;
        oldStartNode.element.classList.remove('start');
        oldStartNode.element.classList.add('empty');
        
        this.startNode = { row, col };
        const newStartNode = this.grid[row][col];
        newStartNode.isStart = true;
        newStartNode.element.classList.remove('empty', 'wall');
        newStartNode.element.classList.add('start');
        newStartNode.isWall = false;
    }
    
    setEndNode(row, col) {
        const oldEndNode = this.grid[this.endNode.row][this.endNode.col];
        oldEndNode.isEnd = false;
        oldEndNode.element.classList.remove('end');
        oldEndNode.element.classList.add('empty');
        
        this.endNode = { row, col };
        const newEndNode = this.grid[row][col];
        newEndNode.isEnd = true;
        newEndNode.element.classList.remove('empty', 'wall');
        newEndNode.element.classList.add('end');
        newEndNode.isWall = false;
    }
    
    clearPath() {
        for (let row of this.grid) {
            for (let node of row) {
                if (!node.isStart && !node.isEnd && !node.isWall) {
                    node.element.classList.remove('open', 'closed', 'path');
                    node.element.classList.add('empty');
                }
                node.f = 0;
                node.g = 0;
                node.h = 0;
                node.parent = null;
            }
        }
        this.updateStats();
        document.getElementById('currentStatus').textContent = '就緒';
    }
    
    reset() {
        this.startNode = { row: 2, col: 2 };
        this.endNode = { row: 12, col: 12 };
        this.createGrid();
        this.updateStats();
        document.getElementById('currentStatus').textContent = '就緒';
    }
    
    async startPathfinding() {
        if (this.isSearching) return;
        
        this.clearPath();
        this.isSearching = true;
        this.setButtonsDisabled(true);
        document.getElementById('currentStatus').textContent = '搜尋中';
        
        const algorithm = document.getElementById('algorithmSelect').value;
        const startTime = Date.now();
        
        let path;
        if (algorithm === 'astar') {
            path = await this.aStar();
        } else {
            path = await this.dijkstra();
        }
        
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        if (path) {
            await this.animatePath(path);
            document.getElementById('currentStatus').textContent = '找到路徑';
            document.getElementById('pathLength').textContent = path.length;
        } else {
            document.getElementById('currentStatus').textContent = '無路徑';
            this.showMessage('無法找到路徑');
            document.getElementById('pathLength').textContent = '0';
        }
        
        document.getElementById('executionTime').textContent = executionTime;
        this.isSearching = false;
        this.setButtonsDisabled(false);
    }
    
    async aStar() {
        const openList = [];
        const closedList = [];
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        openList.push(startNode);
        
        while (openList.length > 0) {
            let currentNode = openList[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < currentNode.f) {
                    currentNode = openList[i];
                    currentIndex = i;
                }
            }
            
            openList.splice(currentIndex, 1);
            closedList.push(currentNode);
            
            if (currentNode === endNode) {
                return this.reconstructPath(currentNode);
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (let neighbor of neighbors) {
                if (closedList.includes(neighbor) || neighbor.isWall) {
                    continue;
                }
                
                const gScore = currentNode.g + 1;
                let gScoreIsBest = false;
                
                if (!openList.includes(neighbor)) {
                    gScoreIsBest = true;
                    neighbor.h = this.heuristic(neighbor, endNode);
                    openList.push(neighbor);
                    if (!neighbor.isStart && !neighbor.isEnd) {
                        neighbor.element.classList.remove('empty');
                        neighbor.element.classList.add('open');
                        await this.delay(this.animationSpeed);
                    }
                } else if (gScore < neighbor.g) {
                    gScoreIsBest = true;
                }
                
                if (gScoreIsBest) {
                    neighbor.parent = currentNode;
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                }
            }
            
            if (!currentNode.isStart && !currentNode.isEnd) {
                currentNode.element.classList.remove('open');
                currentNode.element.classList.add('closed');
            }
            
            document.getElementById('visitedNodes').textContent = closedList.length;
        }
        
        return null;
    }
    
    async dijkstra() {
        const unvisited = [];
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        for (let row of this.grid) {
            for (let node of row) {
                node.g = Infinity;
                unvisited.push(node);
            }
        }
        
        startNode.g = 0;
        
        while (unvisited.length > 0) {
            unvisited.sort((a, b) => a.g - b.g);
            const currentNode = unvisited.shift();
            
            if (currentNode.g === Infinity) break;
            if (currentNode.isWall) continue;
            
            if (currentNode === endNode) {
                return this.reconstructPath(currentNode);
            }
            
            if (!currentNode.isStart && !currentNode.isEnd) {
                currentNode.element.classList.remove('empty');
                currentNode.element.classList.add('open');
                await this.delay(this.animationSpeed);
                currentNode.element.classList.remove('open');
                currentNode.element.classList.add('closed');
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (let neighbor of neighbors) {
                if (neighbor.isWall) continue;
                
                const alt = currentNode.g + 1;
                if (alt < neighbor.g) {
                    neighbor.g = alt;
                    neighbor.parent = currentNode;
                }
            }
            
            document.getElementById('visitedNodes').textContent = 
                this.gridSize * this.gridSize - unvisited.length;
        }
        
        return null;
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        
        if (row > 0) neighbors.push(this.grid[row - 1][col]);
        if (row < this.gridSize - 1) neighbors.push(this.grid[row + 1][col]);
        if (col > 0) neighbors.push(this.grid[row][col - 1]);
        if (col < this.gridSize - 1) neighbors.push(this.grid[row][col + 1]);
        
        return neighbors;
    }
    
    heuristic(node1, node2) {
        return Math.abs(node1.row - node2.row) + Math.abs(node1.col - node2.col);
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
            node.element.classList.remove('closed', 'open');
            node.element.classList.add('path');
            await this.delay(this.animationSpeed * 2);
        }
    }
    
    updateStats() {
        document.getElementById('visitedNodes').textContent = '0';
        document.getElementById('pathLength').textContent = '0';
        document.getElementById('executionTime').textContent = '0';
    }
    
    setButtonsDisabled(disabled) {
        const buttons = document.querySelectorAll('.btn, .select');
        buttons.forEach(btn => btn.disabled = disabled);
    }
    
    showMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = text;
        messageElement.style.display = 'block';
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 2000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});