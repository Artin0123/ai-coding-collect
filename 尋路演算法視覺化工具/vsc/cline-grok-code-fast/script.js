class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isStart = false;
        this.isEnd = false;
        this.isWall = false;
        this.isVisited = false;
        this.g = Infinity;
        this.h = 0;
        this.f = Infinity;
        this.previousNode = null;
    }

    getNeighbors(grid) {
        const neighbors = [];
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0] // 右、下、左、上
        ];

        for (const [dr, dc] of directions) {
            const newRow = this.row + dr;
            const newCol = this.col + dc;

            if (newRow >= 0 && newRow < 25 && newCol >= 0 && newCol < 25 &&
                !grid[newRow][newCol].isWall) {
                neighbors.push(grid[newRow][newCol]);
            }
        }

        return neighbors;
    }
}

class PathfindingVisualizer {
    constructor() {
        this.grid = [];
        this.startNode = null;
        this.endNode = null;
        this.isMouseDown = false;
        this.isSettingStart = false;
        this.isSettingEnd = false;
        this.isRunning = false;
        this.visitedNodes = 0;
        this.pathLength = 0;
        this.executionTime = 0;

        this.initGrid();
        this.addEventListeners();
    }

    initGrid() {
        const gridElement = document.getElementById('grid');
        this.grid = [];

        for (let row = 0; row < 25; row++) {
            this.grid[row] = [];
            for (let col = 0; col < 25; col++) {
                const node = new Node(row, col);
                this.grid[row][col] = node;

                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridElement.appendChild(cell);

                // 設定預設起點和終點
                if (row === 2 && col === 2) {
                    node.isStart = true;
                    this.startNode = node;
                    cell.classList.add('start');
                } else if (row === 22 && col === 22) {
                    node.isEnd = true;
                    this.endNode = node;
                    cell.classList.add('end');
                }
            }
        }

        this.updateStats();
    }

    addEventListeners() {
        const gridElement = document.getElementById('grid');

        // 滑鼠事件
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        gridElement.addEventListener('mouseover', (e) => this.handleMouseOver(e));

        // 控制按鈕
        document.getElementById('setStartBtn').addEventListener('click', () => this.setSettingMode('start'));
        document.getElementById('setEndBtn').addEventListener('click', () => this.setSettingMode('end'));
        document.getElementById('clearPathBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('startBtn').addEventListener('click', () => this.runAlgorithm());
    }

    handleMouseDown(e) {
        if (this.isRunning) return;

        const cell = e.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const node = this.grid[row][col];

        if (this.isSettingStart && !node.isEnd) {
            this.moveStart(row, col);
            this.isSettingStart = false;
            this.updateButtonStates();
            return;
        }

        if (this.isSettingEnd && !node.isStart) {
            this.moveEnd(row, col);
            this.isSettingEnd = false;
            this.updateButtonStates();
            return;
        }

        if (!node.isStart && !node.isEnd) {
            this.isMouseDown = true;
            this.toggleWall(cell, row, col);
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
    }

    handleMouseOver(e) {
        if (!this.isMouseDown || this.isRunning) return;

        const cell = e.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const node = this.grid[row][col];

        if (!node.isStart && !node.isEnd) {
            this.setWall(cell, node);
        }
    }

    toggleWall(cell, row, col) {
        const node = this.grid[row][col];
        if (node.isWall) {
            this.removeWall(cell, node);
        } else {
            this.setWall(cell, node);
        }
    }

    setWall(cell, node) {
        node.isWall = true;
        cell.classList.add('wall');
    }

    removeWall(cell, node) {
        node.isWall = false;
        cell.classList.remove('wall');
    }

    setSettingMode(mode) {
        if (this.isRunning) return;

        if (mode === 'start') {
            this.isSettingStart = !this.isSettingStart;
            this.isSettingEnd = false;
        } else {
            this.isSettingEnd = !this.isSettingEnd;
            this.isSettingStart = false;
        }
        this.updateButtonStates();
    }

    moveStart(row, col) {
        // 清除舊起點
        if (this.startNode) {
            this.startNode.isStart = false;
            const oldCell = document.querySelector(`[data-row="${this.startNode.row}"][data-col="${this.startNode.col}"]`);
            oldCell.classList.remove('start');
        }

        // 設定新起點
        this.startNode = this.grid[row][col];
        this.startNode.isStart = true;
        this.startNode.isWall = false;
        const newCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        newCell.classList.remove('wall');
        newCell.classList.add('start');
    }

    moveEnd(row, col) {
        // 清除舊終點
        if (this.endNode) {
            this.endNode.isEnd = false;
            const oldCell = document.querySelector(`[data-row="${this.endNode.row}"][data-col="${this.endNode.col}"]`);
            oldCell.classList.remove('end');
        }

        // 設定新終點
        this.endNode = this.grid[row][col];
        this.endNode.isEnd = true;
        this.endNode.isWall = false;
        const newCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        newCell.classList.remove('wall');
        newCell.classList.add('end');
    }

    updateButtonStates() {
        const setStartBtn = document.getElementById('setStartBtn');
        const setEndBtn = document.getElementById('setEndBtn');

        setStartBtn.classList.toggle('selected', this.isSettingStart);
        setEndBtn.classList.toggle('selected', this.isSettingEnd);

        this.enableControls(!this.isRunning);
    }

    enableControls(enable) {
        const buttons = ['setStartBtn', 'setEndBtn', 'clearPathBtn', 'resetBtn', 'algorithmSelect', 'startBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            btn.disabled = !enable;
        });
    }

    clearPath() {
        if (this.isRunning) return;

        for (let row = 0; row < 25; row++) {
            for (let col = 0; col < 25; col++) {
                const node = this.grid[row][col];
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

                if (!node.isStart && !node.isEnd && !node.isWall) {
                    cell.classList.remove('open', 'closed', 'path');
                }

                node.isVisited = false;
                node.g = Infinity;
                node.h = 0;
                node.f = Infinity;
                node.previousNode = null;
            }
        }

        this.visitedNodes = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
    }

    reset() {
        if (this.isRunning) return;

        for (let row = 0; row < 25; row++) {
            for (let col = 0; col < 25; col++) {
                const node = this.grid[row][col];
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

                // 重置所有狀態
                node.isStart = false;
                node.isEnd = false;
                node.isWall = false;
                node.isVisited = false;
                node.g = Infinity;
                node.h = 0;
                node.f = Infinity;
                node.previousNode = null;

                cell.classList.remove('start', 'end', 'wall', 'open', 'closed', 'path');
            }
        }

        // 重新設定預設起點和終點
        this.startNode = this.grid[2][2];
        this.startNode.isStart = true;
        document.querySelector(`[data-row="2"][data-col="2"]`).classList.add('start');

        this.endNode = this.grid[22][22];
        this.endNode.isEnd = true;
        document.querySelector(`[data-row="22"][data-col="22"]`).classList.add('end');

        this.visitedNodes = 0;
        this.pathLength = 0;
        this.executionTime = 0;
        this.updateStats();
    }

    runAlgorithm() {
        if (this.isRunning || !this.startNode || !this.endNode) return;

        this.isRunning = true;
        this.clearPath();
        this.updateState('搜尋中');

        const algorithm = document.getElementById('algorithmSelect').value;
        let result;

        const startTime = performance.now();

        switch (algorithm) {
            case 'astar':
                result = this.astar();
                break;
            case 'dijkstra':
                result = this.dijkstra();
                break;
            case 'bfs':
                result = this.bfs();
                break;
        }

        if (result.found) {
            this.animatePath(result.path, () => {
                const endTime = performance.now();
                this.executionTime = Math.round(endTime - startTime);
                this.updateStats('找到路徑');
                this.isRunning = false;
                this.enableControls(true);
            });
        } else {
            const endTime = performance.now();
            this.executionTime = Math.round(endTime - startTime);
            this.updateStats('無路徑');
            this.isRunning = false;
            this.enableControls(true);
            alert('無法找到路徑');
        }
    }

    astar() {
        const openSet = [this.startNode];
        const closedSet = new Set();
        this.startNode.g = 0;
        this.startNode.f = this.manhattanDistance(this.startNode, this.endNode);

        while (openSet.length > 0) {
            // 找到f值最小的節點
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            closedSet.add(current);

            this.setCellClass(current, 'closed');
            this.visitedNodes++;

            if (current === this.endNode) {
                const path = this.reconstructPath(current);
                return { found: true, path: path };
            }

            for (const neighbor of current.getNeighbors(this.grid)) {
                if (closedSet.has(neighbor)) continue;

                const tempG = current.g + 1;
                let foundInOpen = false;

                if (tempG < neighbor.g) {
                    neighbor.previousNode = current;
                    neighbor.g = tempG;
                    neighbor.h = this.manhattanDistance(neighbor, this.endNode);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openSet.find(node => node === neighbor)) {
                        openSet.push(neighbor);
                        this.setCellClass(neighbor, 'open');
                    }
                }
            }
        }

        return { found: false, path: [] };
    }

    dijkstra() {
        const unvisited = [];
        for (let row = 0; row < 25; row++) {
            for (let col = 0; col < 25; col++) {
                unvisited.push(this.grid[row][col]);
                this.grid[row][col].g = Infinity;
            }
        }

        this.startNode.g = 0;

        while (unvisited.length > 0) {
            unvisited.sort((a, b) => a.g - b.g);
            const current = unvisited.shift();

            this.setCellClass(current, 'closed');
            this.visitedNodes++;

            if (current === this.endNode) {
                const path = this.reconstructPath(current);
                return { found: true, path: path };
            }

            if (current.g === Infinity) break;

            for (const neighbor of current.getNeighbors(this.grid)) {
                const distance = current.g + 1;
                if (distance < neighbor.g && unvisited.includes(neighbor)) {
                    neighbor.g = distance;
                    neighbor.previousNode = current;

                    if (!this.getCell(neighbor)?.classList.contains('open')) {
                        this.setCellClass(neighbor, 'open');
                    }
                }
            }
        }

        return { found: false, path: [] };
    }

    bfs() {
        const queue = [this.startNode];
        const visited = new Set([this.startNode]);

        while (queue.length > 0) {
            const current = queue.shift();

            this.setCellClass(current, 'closed');
            this.visitedNodes++;

            if (current === this.endNode) {
                const path = this.reconstructPath(current);
                return { found: true, path: path };
            }

            for (const neighbor of current.getNeighbors(this.grid)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    neighbor.previousNode = current;
                    queue.push(neighbor);

                    if (!this.getCell(neighbor)?.classList.contains('closed')) {
                        this.setCellClass(neighbor, 'open');
                    }
                }
            }
        }

        return { found: false, path: [] };
    }

    manhattanDistance(node1, node2) {
        return Math.abs(node1.row - node2.row) + Math.abs(node1.col - node2.col);
    }

    reconstructPath(endNode) {
        const path = [];
        let current = endNode;
        this.pathLength = 0;

        while (current !== null) {
            path.unshift(current);
            current = current.previousNode;
            this.pathLength++;
        }

        return path;
    }

    animatePath(path, callback) {
        this.pathLength = path.length;
        this.updateStats();

        for (let i = 1; i < path.length - 1; i++) {
            setTimeout(() => {
                this.setCellClass(path[i], 'path');
                if (i === path.length - 2) {
                    setTimeout(callback, 0);
                }
            }, i * 10);
        }
    }

    setCellClass(node, className) {
        const cell = document.querySelector(`[data-row="${node.row}"][data-col="${node.col}"]`);
        if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
            cell.classList.remove('open', 'closed', 'path');
            cell.classList.add(className);
        }
    }

    getCell(node) {
        return document.querySelector(`[data-row="${node.row}"][data-col="${node.col}"]`);
    }

    updateStats(state = '就緒') {
        document.getElementById('visitedNodes').textContent = this.visitedNodes;
        document.getElementById('pathLength').textContent = this.pathLength;
        document.getElementById('executionTime').textContent = this.executionTime;
        document.getElementById('currentState').textContent = state;
    }

    updateState(state) {
        document.getElementById('currentState').textContent = state;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});
