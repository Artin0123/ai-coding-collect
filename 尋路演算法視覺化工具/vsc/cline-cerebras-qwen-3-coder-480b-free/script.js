class PathfindingVisualizer {
    constructor() {
        this.grid = [];
        this.start = { x: 2, y: 2 };
        this.end = { x: 12, y: 12 };
        this.isDragging = false;
        this.currentMode = 'normal'; // 'normal', 'setStart', 'setEnd'
        this.algorithm = 'astar';
        this.isSearching = false;

        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.startTime = 0;

        this.initGrid();
        this.createGrid();
        this.bindEvents();
        this.updateStats();
    }

    initGrid() {
        for (let i = 0; i < 15; i++) {
            this.grid[i] = [];
            for (let j = 0; j < 15; j++) {
                this.grid[i][j] = {
                    x: i,
                    y: j,
                    isObstacle: false,
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null,
                    visited: false
                };
            }
        }
    }

    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = i;
                cell.dataset.y = j;

                if (i === this.start.x && j === this.start.y) {
                    cell.classList.add('start');
                } else if (i === this.end.x && j === this.end.y) {
                    cell.classList.add('end');
                }

                gridElement.appendChild(cell);
            }
        }
    }

    bindEvents() {
        // 控制面板按鈕事件
        document.getElementById('setStartBtn').addEventListener('click', () => {
            if (this.isSearching) return;
            this.currentMode = 'setStart';
            this.updateButtonStates();
        });

        document.getElementById('setEndBtn').addEventListener('click', () => {
            if (this.isSearching) return;
            this.currentMode = 'setEnd';
            this.updateButtonStates();
        });

        document.getElementById('clearPathBtn').addEventListener('click', () => {
            if (this.isSearching) return;
            this.clearPath();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (this.isSearching) return;
            this.resetGrid();
        });

        document.getElementById('startSearchBtn').addEventListener('click', () => {
            if (this.isSearching) return;
            this.startSearch();
        });

        // 演算法選擇事件
        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
        });

        // 網格事件
        const gridElement = document.getElementById('grid');
        gridElement.addEventListener('mousedown', (e) => {
            if (this.isSearching) return;
            this.isDragging = true;
            this.handleCellClick(e.target);
        });

        gridElement.addEventListener('mousemove', (e) => {
            if (this.isSearching || !this.isDragging) return;
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });

        gridElement.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        gridElement.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        // 防止拖曳時選取文字
        gridElement.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
    }

    handleCellClick(cell) {
        if (!cell.classList.contains('cell') || this.isSearching) return;

        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        switch (this.currentMode) {
            case 'setStart':
                if (!this.grid[x][y].isObstacle && !(x === this.end.x && y === this.end.y)) {
                    this.setStart(x, y);
                    this.currentMode = 'normal';
                    this.updateButtonStates();
                }
                break;

            case 'setEnd':
                if (!this.grid[x][y].isObstacle && !(x === this.start.x && y === this.start.y)) {
                    this.setEnd(x, y);
                    this.currentMode = 'normal';
                    this.updateButtonStates();
                }
                break;

            case 'normal':
                // 不能在起點或終點上創建障礙物
                if ((x === this.start.x && y === this.start.y) ||
                    (x === this.end.x && y === this.end.y)) {
                    return;
                }

                // 切換障礙物狀態
                this.grid[x][y].isObstacle = !this.grid[x][y].isObstacle;
                if (this.grid[x][y].isObstacle) {
                    cell.classList.add('obstacle');
                } else {
                    cell.classList.remove('obstacle');
                }
                break;
        }
    }

    setStart(x, y) {
        // 清除舊的起點
        const oldStartCell = document.querySelector('.cell.start');
        if (oldStartCell) {
            oldStartCell.classList.remove('start');
        }

        // 設定新的起點
        this.start = { x, y };
        const newStartCell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (newStartCell) {
            newStartCell.classList.add('start');
        }
    }

    setEnd(x, y) {
        // 清除舊的終點
        const oldEndCell = document.querySelector('.cell.end');
        if (oldEndCell) {
            oldEndCell.classList.remove('end');
        }

        // 設定新的終點
        this.end = { x, y };
        const newEndCell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (newEndCell) {
            newEndCell.classList.add('end');
        }
    }

    clearPath() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('open', 'closed', 'path');
            if (!cell.classList.contains('start') && !cell.classList.contains('end') && !cell.classList.contains('obstacle')) {
                cell.classList.add('background');
            }
        });

        // 重置網格數據
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                this.grid[i][j].g = 0;
                this.grid[i][j].h = 0;
                this.grid[i][j].f = 0;
                this.grid[i][j].parent = null;
                this.grid[i][j].visited = false;
            }
        }

        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
    }

    resetGrid() {
        this.start = { x: 2, y: 2 };
        this.end = { x: 12, y: 12 };
        this.currentMode = 'normal';
        this.isSearching = false;

        // 重置網格數據
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                this.grid[i][j].isObstacle = false;
                this.grid[i][j].g = 0;
                this.grid[i][j].h = 0;
                this.grid[i][j].f = 0;
                this.grid[i][j].parent = null;
                this.grid[i][j].visited = false;
            }
        }

        this.createGrid();
        this.updateButtonStates();
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
    }

    updateButtonStates() {
        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(btn => {
            if (btn.id === 'setStartBtn' || btn.id === 'setEndBtn') {
                btn.disabled = this.currentMode === 'setStart' || this.currentMode === 'setEnd' || this.isSearching;
            } else {
                btn.disabled = this.isSearching;
            }
        });

        document.getElementById('algorithmSelect').disabled = this.isSearching;
    }

    updateStats() {
        document.getElementById('visitedNodes').textContent = `${this.visitedNodesCount} 個`;
        document.getElementById('pathLength').textContent = `${this.pathLength} 步`;
        document.getElementById('executionTime').textContent = `${this.executionTime} ms`;
        document.getElementById('currentState').textContent = this.isSearching ? '搜尋中' : '就緒';
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: 1, y: 1 }
        ];

        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;

            if (newX >= 0 && newX < 15 && newY >= 0 && newY < 15) {
                const neighbor = this.grid[newX][newY];
                if (!neighbor.isObstacle) {
                    neighbors.push(neighbor);
                }
            }
        }

        return neighbors;
    }

    heuristic(nodeA, nodeB) {
        // 曼哈頓距離
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
    }

    async startSearch() {
        this.isSearching = true;
        this.updateButtonStates();
        this.startTime = performance.now();

        // 清除之前的路徑
        this.clearPath();

        // 更新狀態為搜尋中
        document.getElementById('currentState').textContent = '搜尋中';

        let pathFound = false;
        if (this.algorithm === 'astar') {
            pathFound = await this.astar();
        } else {
            pathFound = await this.dijkstra();
        }

        this.executionTime = Math.round(performance.now() - this.startTime);
        this.updateStats();

        if (!pathFound) {
            document.getElementById('currentState').textContent = '無路徑';
            alert('無法找到路徑');
        } else {
            document.getElementById('currentState').textContent = '找到路徑';
        }

        this.isSearching = false;
        this.updateButtonStates();
    }

    async astar() {
        const openSet = [];
        const closedSet = new Set();

        // 初始化起點
        const startNode = this.grid[this.start.x][this.start.y];
        const endNode = this.grid[this.end.x][this.end.y];

        startNode.g = 0;
        startNode.h = this.heuristic(startNode, endNode);
        startNode.f = startNode.g + startNode.h;

        openSet.push(startNode);

        while (openSet.length > 0) {
            // 找到f值最小的節點
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            if (currentNode === endNode) {
                await this.reconstructPath(currentNode);
                return true;
            }

            closedSet.add(currentNode);
            currentNode.visited = true;

            // 視覺化：標記為封閉列表（橘色）
            const cell = document.querySelector(`.cell[data-x="${currentNode.x}"][data-y="${currentNode.y}"]`);
            if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.remove('open');
                cell.classList.add('closed');
                this.visitedNodesCount++;
                this.updateStats();
            }

            const neighbors = this.getNeighbors(currentNode);

            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor) || neighbor.isObstacle) {
                    continue;
                }

                // 計算g值（從起點到當前節點的距離）
                const tentativeG = currentNode.g + 1;

                // 如果鄰居不在openSet中，或找到更短的路徑
                const isInOpenSet = openSet.includes(neighbor);
                if (!isInOpenSet || tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!isInOpenSet) {
                        openSet.push(neighbor);

                        // 視覺化：標記為開放列表（藍色）
                        const neighborCell = document.querySelector(`.cell[data-x="${neighbor.x}"][data-y="${neighbor.y}"]`);
                        if (neighborCell && !neighborCell.classList.contains('start') && !neighborCell.classList.contains('end')) {
                            neighborCell.classList.add('open');
                            this.updateStats();
                        }
                    }
                }
            }

            // 延遲以顯示動畫效果
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return false;
    }

    async dijkstra() {
        const openSet = [];
        const closedSet = new Set();

        // 初始化起點
        const startNode = this.grid[this.start.x][this.start.y];
        const endNode = this.grid[this.end.x][this.end.y];

        startNode.g = 0;
        startNode.f = 0;

        openSet.push(startNode);

        while (openSet.length > 0) {
            // 找到g值最小的節點（Dijkstra不使用啟發式函數）
            openSet.sort((a, b) => a.g - b.g);
            const currentNode = openSet.shift();

            if (currentNode === endNode) {
                await this.reconstructPath(currentNode);
                return true;
            }

            closedSet.add(currentNode);
            currentNode.visited = true;

            // 視覺化：標記為封閉列表（橘色）
            const cell = document.querySelector(`.cell[data-x="${currentNode.x}"][data-y="${currentNode.y}"]`);
            if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.remove('open');
                cell.classList.add('closed');
                this.visitedNodesCount++;
                this.updateStats();
            }

            const neighbors = this.getNeighbors(currentNode);

            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor) || neighbor.isObstacle) {
                    continue;
                }

                // 計算g值
                const tentativeG = currentNode.g + 1;

                const isInOpenSet = openSet.includes(neighbor);
                if (!isInOpenSet || tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.f = tentativeG; // Dijkstra中f = g

                    if (!isInOpenSet) {
                        openSet.push(neighbor);

                        // 視覺化：標記為開放列表（藍色）
                        const neighborCell = document.querySelector(`.cell[data-x="${neighbor.x}"][data-y="${neighbor.y}"]`);
                        if (neighborCell && !neighborCell.classList.contains('start') && !neighborCell.classList.contains('end')) {
                            neighborCell.classList.add('open');
                            this.updateStats();
                        }
                    }
                }
            }

            // 延遲以顯示動畫效果
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return false;
    }

    async reconstructPath(node) {
        let path = [];
        let currentNode = node;

        while (currentNode.parent) {
            path.push(currentNode);
            currentNode = currentNode.parent;
        }

        // 反轉路徑（從終點到起點）
        path.reverse();

        this.pathLength = path.length;
        this.updateStats();

        // 視覺化路徑（黃色）
        for (const pathNode of path) {
            const cell = document.querySelector(`.cell[data-x="${pathNode.x}"][data-y="${pathNode.y}"]`);
            if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.remove('open', 'closed');
                cell.classList.add('path');
            }

            // 延遲以顯示動畫效果
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});
