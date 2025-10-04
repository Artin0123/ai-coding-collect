class PathfindingVisualizer {
    constructor() {
        this.gridSize = 25;
        this.cellSize = 20;
        this.grid = [];
        this.startPos = { row: 2, col: 2 };
        this.endPos = { row: 22, col: 22 };
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isMouseDown = false;
        this.isSearching = false;
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;

        this.initializeGrid();
        this.renderGrid();
        this.setupEventListeners();
        this.updateStats();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    row: row,
                    col: col,
                    isStart: (row === this.startPos.row && col === this.startPos.col),
                    isEnd: (row === this.endPos.row && col === this.endPos.col),
                    isObstacle: false,
                    f: 0,
                    g: 0,
                    h: 0,
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
                }

                gridElement.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        // 控制面板按鈕事件
        document.getElementById('setStartBtn').addEventListener('click', () => {
            this.isSettingStart = true;
            this.isSettingEnd = false;
            this.updateButtonStates();
        });

        document.getElementById('setEndBtn').addEventListener('click', () => {
            this.isSettingEnd = true;
            this.isSettingStart = false;
            this.updateButtonStates();
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

        // 網格事件
        const gridElement = document.getElementById('grid');
        gridElement.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.handleCellClick(e);
        });

        gridElement.addEventListener('mousemove', (e) => {
            if (this.isMouseDown && !this.isSettingStart && !this.isSettingEnd && !this.isSearching) {
                this.handleCellClick(e);
            }
        });

        gridElement.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        gridElement.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        });
    }

    handleCellClick(e) {
        if (this.isSearching) return;

        const cell = e.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.isSettingStart) {
            // 移除舊的起點
            this.grid[this.startPos.row][this.startPos.col].isStart = false;
            this.startPos = { row, col };
            this.grid[row][col].isStart = true;
            this.grid[row][col].isObstacle = false;
            this.isSettingStart = false;
            this.renderGrid();
            this.updateButtonStates();
        } else if (this.isSettingEnd) {
            // 移除舊的終點
            this.grid[this.endPos.row][this.endPos.col].isEnd = false;
            this.endPos = { row, col };
            this.grid[row][col].isEnd = true;
            this.grid[row][col].isObstacle = false;
            this.isSettingEnd = false;
            this.renderGrid();
            this.updateButtonStates();
        } else {
            // 切換障礙物狀態
            if (!this.grid[row][col].isStart && !this.grid[row][col].isEnd) {
                this.grid[row][col].isObstacle = !this.grid[row][col].isObstacle;
                if (this.grid[row][col].isObstacle) {
                    cell.classList.add('obstacle');
                } else {
                    cell.classList.remove('obstacle');
                }
            }
        }
    }

    updateButtonStates() {
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');
        const startBtn = document.getElementById('startBtn');
        const clearPathBtn = document.getElementById('clearPathBtn');
        const resetBtn = document.getElementById('resetBtn');
        const algorithmSelect = document.getElementById('algorithmSelect');

        if (this.isSettingStart || this.isSettingEnd || this.isSearching) {
            setStartBtn.disabled = true;
            setEndBtn.disabled = true;
            startBtn.disabled = true;
            clearPathBtn.disabled = true;
            resetBtn.disabled = true;
            algorithmSelect.disabled = true;
        } else {
            setStartBtn.disabled = false;
            setEndBtn.disabled = false;
            startBtn.disabled = false;
            clearPathBtn.disabled = false;
            resetBtn.disabled = false;
            algorithmSelect.disabled = false;
        }
    }

    clearPath() {
        // 清除路徑和搜尋狀態，但保留障礙物、起點和終點
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            cell.classList.remove('open', 'closed', 'path');

            if (this.grid[row][col].isStart) {
                cell.classList.add('start');
            } else if (this.grid[row][col].isEnd) {
                cell.classList.add('end');
            } else if (this.grid[row][col].isObstacle) {
                cell.classList.add('obstacle');
            }
        });

        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
    }

    resetGrid() {
        // 重置整個網格到初始狀態
        this.initializeGrid();
        this.renderGrid();
        this.visitedNodesCount = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
    }

    updateStats() {
        document.getElementById('visitedNodes').textContent = this.visitedNodesCount;
        document.getElementById('pathLength').textContent = this.pathLength;
        document.getElementById('executionTime').textContent = this.executionTime;

        const statusElement = document.getElementById('status');
        if (this.isSearching) {
            statusElement.textContent = '搜尋中';
        } else if (this.pathLength > 0) {
            statusElement.textContent = '找到路徑';
        } else if (this.visitedNodesCount > 0) {
            statusElement.textContent = '無路徑';
        } else {
            statusElement.textContent = '就緒';
        }
    }

    getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        const directions = [
            { dr: -1, dc: 0 }, // 上
            { dr: 1, dc: 0 },  // 下
            { dr: 0, dc: -1 }, // 左
            { dr: 0, dc: 1 }   // 右
        ];

        for (const dir of directions) {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;

            // 檢查邊界
            if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                // 檢查是否為障礙物
                if (!this.grid[newRow][newCol].isObstacle) {
                    neighbors.push(this.grid[newRow][newCol]);
                }
            }
        }

        return neighbors;
    }

    manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    async startPathfinding() {
        if (this.isSearching) return;

        this.isSearching = true;
        this.updateButtonStates();
        this.clearPath();

        const algorithm = document.getElementById('algorithmSelect').value;
        const startTime = performance.now();

        let pathFound = false;
        if (algorithm === 'astar') {
            pathFound = await this.aStar();
        } else if (algorithm === 'dijkstra') {
            pathFound = await this.dijkstra();
        } else if (algorithm === 'bfs') {
            pathFound = await this.bfs();
        }

        const endTime = performance.now();
        this.executionTime = Math.round(endTime - startTime);

        if (!pathFound) {
            this.visitedNodesCount = 0;
        }

        this.updateStats();
        this.isSearching = false;
        this.updateButtonStates();
    }

    async aStar() {
        // 重置所有節點的狀態
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].g = 0;
                this.grid[row][col].h = 0;
                this.grid[row][col].f = 0;
                this.grid[row][col].parent = null;
            }
        }

        const openSet = [];
        const closedSet = new Set();
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        const endNode = this.grid[this.endPos.row][this.endPos.col];

        openSet.push(startNode);
        this.visitedNodesCount = 0;

        while (openSet.length > 0) {
            // 找到f值最小的節點
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }

            const currentNode = openSet[lowestIndex];

            // 如果找到終點
            if (currentNode === endNode) {
                await this.reconstructPath(currentNode);
                return true;
            }

            // 從開放列表移到封閉列表
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${currentNode.row},${currentNode.col}`);

            // 更新統計和視覺化
            if (!currentNode.isStart && !currentNode.isEnd) {
                const cell = document.querySelector(`.cell[data-row="${currentNode.row}"][data-col="${currentNode.col}"]`);
                if (cell) {
                    cell.classList.remove('open');
                    cell.classList.add('closed');
                }
                this.visitedNodesCount++;
                this.updateStats();
            }

            // 等待一小段時間以顯示動畫
            await new Promise(resolve => setTimeout(resolve, 10));

            // 檢查所有鄰居
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;

                // 如果在封閉列表中，跳過
                if (closedSet.has(neighborKey)) continue;

                // 計算g值
                const tentativeG = currentNode.g + 1;

                // 如果鄰居不在開放列表中，或找到更好的路徑
                const isInOpenSet = openSet.some(node => node.row === neighbor.row && node.col === neighbor.col);
                if (!isInOpenSet || tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = this.manhattanDistance(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!isInOpenSet) {
                        openSet.push(neighbor);
                        // 更新視覺化
                        if (!neighbor.isStart && !neighbor.isEnd) {
                            const cell = document.querySelector(`.cell[data-row="${neighbor.row}"][data-col="${neighbor.col}"]`);
                            if (cell) {
                                cell.classList.add('open');
                            }
                        }
                    }
                }
            }
        }

        // 無法找到路徑
        return false;
    }

    async dijkstra() {
        // 重置所有節點的狀態
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].g = Infinity;
                this.grid[row][col].parent = null;
            }
        }

        const openSet = [];
        const closedSet = new Set();
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        const endNode = this.grid[this.endPos.row][this.endPos.col];

        startNode.g = 0;
        openSet.push(startNode);
        this.visitedNodesCount = 0;

        while (openSet.length > 0) {
            // 找到g值最小的節點
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].g < openSet[lowestIndex].g) {
                    lowestIndex = i;
                }
            }

            const currentNode = openSet[lowestIndex];

            // 如果找到終點
            if (currentNode === endNode) {
                await this.reconstructPath(currentNode);
                return true;
            }

            // 從開放列表移到封閉列表
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${currentNode.row},${currentNode.col}`);

            // 更新統計和視覺化
            if (!currentNode.isStart && !currentNode.isEnd) {
                const cell = document.querySelector(`.cell[data-row="${currentNode.row}"][data-col="${currentNode.col}"]`);
                if (cell) {
                    cell.classList.remove('open');
                    cell.classList.add('closed');
                }
                this.visitedNodesCount++;
                this.updateStats();
            }

            // 等待一小段時間以顯示動畫
            await new Promise(resolve => setTimeout(resolve, 10));

            // 檢查所有鄰居
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;

                // 如果在封閉列表中，跳過
                if (closedSet.has(neighborKey)) continue;

                // 計算新的g值
                const tentativeG = currentNode.g + 1;

                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;

                    // 如果鄰居不在開放列表中，加入開放列表
                    const isInOpenSet = openSet.some(node => node.row === neighbor.row && node.col === neighbor.col);
                    if (!isInOpenSet) {
                        openSet.push(neighbor);
                        // 更新視覺化
                        if (!neighbor.isStart && !neighbor.isEnd) {
                            const cell = document.querySelector(`.cell[data-row="${neighbor.row}"][data-col="${neighbor.col}"]`);
                            if (cell) {
                                cell.classList.add('open');
                            }
                        }
                    }
                }
            }
        }

        // 無法找到路徑
        return false;
    }

    async bfs() {
        const queue = [];
        const visited = new Set();
        const startNode = this.grid[this.startPos.row][this.startPos.col];
        const endNode = this.grid[this.endPos.row][this.endPos.col];

        queue.push(startNode);
        visited.add(`${startNode.row},${startNode.col}`);
        this.visitedNodesCount = 0;

        while (queue.length > 0) {
            const currentNode = queue.shift();

            // 如果找到終點
            if (currentNode === endNode) {
                await this.reconstructPath(currentNode);
                return true;
            }

            // 更新統計和視覺化
            if (!currentNode.isStart && !currentNode.isEnd) {
                const cell = document.querySelector(`.cell[data-row="${currentNode.row}"][data-col="${currentNode.col}"]`);
                if (cell) {
                    cell.classList.remove('open');
                    cell.classList.add('closed');
                }
                this.visitedNodesCount++;
                this.updateStats();
            }

            // 等待一小段時間以顯示動畫
            await new Promise(resolve => setTimeout(resolve, 10));

            // 檢查所有鄰居
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;

                if (!visited.has(neighborKey)) {
                    visited.add(neighborKey);
                    neighbor.parent = currentNode;
                    queue.push(neighbor);

                    // 更新視覺化
                    if (!neighbor.isStart && !neighbor.isEnd) {
                        const cell = document.querySelector(`.cell[data-row="${neighbor.row}"][data-col="${neighbor.col}"]`);
                        if (cell) {
                            cell.classList.add('open');
                        }
                    }
                }
            }
        }

        // 無法找到路徑
        return false;
    }

    async reconstructPath(node) {
        const path = [];
        let currentNode = node;

        while (currentNode.parent) {
            path.push(currentNode);
            currentNode = currentNode.parent;
        }

        // 反轉路徑（從終點到起點）
        path.reverse();
        this.pathLength = path.length;

        // 顯示路徑
        for (const pathNode of path) {
            if (!pathNode.isStart && !pathNode.isEnd) {
                const cell = document.querySelector(`.cell[data-row="${pathNode.row}"][data-col="${pathNode.col}"]`);
                if (cell) {
                    cell.classList.remove('open', 'closed');
                    cell.classList.add('path');
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.updateStats();
    }
}

// 初始化視覺化工具
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});
