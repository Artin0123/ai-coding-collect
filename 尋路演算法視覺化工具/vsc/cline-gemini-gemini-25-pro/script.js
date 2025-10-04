document.addEventListener('DOMContentLoaded', () => {
    const GRID_WIDTH = 25;
    const GRID_HEIGHT = 25;
    const ANIMATION_DELAY = 10;

    const gridContainer = document.getElementById('grid-container');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const setStartBtn = document.getElementById('set-start-btn');
    const setEndBtn = document.getElementById('set-end-btn');
    const algorithmSelect = document.getElementById('algorithm-select');

    const statusEl = document.getElementById('status');
    const visitedNodesEl = document.getElementById('visited-nodes');
    const pathLengthEl = document.getElementById('path-length');
    const executionTimeEl = document.getElementById('execution-time');

    let grid = [];
    let startNode = { row: 2, col: 2 };
    let endNode = { row: 22, col: 22 };

    let isMouseDown = false;
    let isAnimating = false;
    let currentMode = 'wall'; // 'wall', 'setStart', 'setEnd'

    class Node {
        constructor(row, col) {
            this.row = row;
            this.col = col;
            this.isWall = false;
            this.g = Infinity;
            this.h = 0;
            this.f = Infinity;
            this.parent = null;
            this.element = document.createElement('div');
            this.element.className = 'grid-cell';
            this.element.dataset.row = row;
            this.element.dataset.col = col;
        }

        reset() {
            this.isWall = false;
            this.g = Infinity;
            this.h = 0;
            this.f = Infinity;
            this.parent = null;
            this.updateElementClass();
        }

        updateElementClass() {
            this.element.className = 'grid-cell';
            if (this.row === startNode.row && this.col === startNode.col) {
                this.element.classList.add('start');
            } else if (this.row === endNode.row && this.col === endNode.col) {
                this.element.classList.add('end');
            } else if (this.isWall) {
                this.element.classList.add('wall');
            }
        }
    }

    function initGrid() {
        gridContainer.innerHTML = '';
        grid = [];
        isAnimating = false;
        currentMode = 'wall';
        startNode = { row: 2, col: 2 };
        endNode = { row: 22, col: 22 };

        for (let row = 0; row < GRID_HEIGHT; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_WIDTH; col++) {
                const node = new Node(row, col);
                node.element.addEventListener('mousedown', () => handleMouseDown(row, col));
                node.element.addEventListener('mouseover', () => handleMouseOver(row, col));
                node.element.addEventListener('mouseup', () => handleMouseUp());
                gridContainer.appendChild(node.element);
                currentRow.push(node);
            }
            grid.push(currentRow);
        }

        grid[startNode.row][startNode.col].updateElementClass();
        grid[endNode.row][endNode.col].updateElementClass();
        resetStats();
        enableControls();
    }

    function handleMouseDown(row, col) {
        if (isAnimating) return;
        isMouseDown = true;

        if (currentMode === 'setStart') {
            if (row === endNode.row && col === endNode.col) return;
            const oldStartNode = grid[startNode.row][startNode.col];
            startNode = { row, col };
            oldStartNode.updateElementClass();
            grid[row][col].updateElementClass();
            currentMode = 'wall';
        } else if (currentMode === 'setEnd') {
            if (row === startNode.row && col === startNode.col) return;
            const oldEndNode = grid[endNode.row][endNode.col];
            endNode = { row, col };
            oldEndNode.updateElementClass();
            grid[row][col].updateElementClass();
            currentMode = 'wall';
        } else {
            toggleWall(row, col);
        }
    }

    function handleMouseOver(row, col) {
        if (isAnimating || !isMouseDown || currentMode !== 'wall') return;
        toggleWall(row, col);
    }

    function handleMouseUp() {
        isMouseDown = false;
    }

    function toggleWall(row, col) {
        if ((row === startNode.row && col === startNode.col) || (row === endNode.row && col === endNode.col)) {
            return;
        }
        const node = grid[row][col];
        node.isWall = !node.isWall;
        node.updateElementClass();
    }

    function clearPath() {
        if (isAnimating) return;
        for (let row = 0; row < GRID_HEIGHT; row++) {
            for (let col = 0; col < GRID_WIDTH; col++) {
                const node = grid[row][col];
                node.g = Infinity;
                node.h = 0;
                node.f = Infinity;
                node.parent = null;
                const isSpecialNode = (node.row === startNode.row && node.col === startNode.col) ||
                    (node.row === endNode.row && node.col === endNode.col) ||
                    node.isWall;
                if (!isSpecialNode) {
                    node.element.classList.remove('open', 'closed', 'path');
                }
            }
        }
        resetStats();
    }

    function resetStats() {
        statusEl.textContent = '就緒';
        visitedNodesEl.textContent = '0';
        pathLengthEl.textContent = '0';
        executionTimeEl.textContent = '0';
    }

    function disableControls() {
        startBtn.disabled = true;
        resetBtn.disabled = true;
        clearPathBtn.disabled = true;
        setStartBtn.disabled = true;
        setEndBtn.disabled = true;
        algorithmSelect.disabled = true;
    }

    function enableControls() {
        startBtn.disabled = false;
        resetBtn.disabled = false;
        clearPathBtn.disabled = false;
        setStartBtn.disabled = false;
        setEndBtn.disabled = false;
        algorithmSelect.disabled = false;
    }

    async function startAlgorithm() {
        if (isAnimating) return;
        isAnimating = true;
        disableControls();
        clearPath();
        resetStats();
        statusEl.textContent = '搜尋中...';

        const algorithm = algorithmSelect.value;
        const startTime = performance.now();

        let result;
        switch (algorithm) {
            case 'astar':
                result = await aStar();
                break;
            case 'dijkstra':
                result = await dijkstra();
                break;
            case 'bfs':
                result = await bfs();
                break;
        }

        const endTime = performance.now();
        executionTimeEl.textContent = (endTime - startTime).toFixed(2);

        if (result && result.path.length > 0) {
            statusEl.textContent = '找到路徑';
            await visualizePath(result.path);
            pathLengthEl.textContent = result.path.length;
        } else {
            statusEl.textContent = '無法找到路徑';
        }

        visitedNodesEl.textContent = result ? result.visitedCount : 0;
        isAnimating = false;
        enableControls();
    }

    function getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < GRID_HEIGHT - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < GRID_WIDTH - 1) neighbors.push(grid[row][col + 1]);
        return neighbors.filter(neighbor => !neighbor.isWall);
    }

    function manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    async function aStar() {
        const start = grid[startNode.row][startNode.col];
        const end = grid[endNode.row][endNode.col];
        let openSet = [start];
        let closedSet = [];
        let visitedCount = 0;

        start.g = 0;
        start.h = manhattanDistance(start, end);
        start.f = start.g + start.h;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            if (currentNode === end) {
                return { path: reconstructPath(end), visitedCount };
            }

            closedSet.push(currentNode);
            if (currentNode !== start) {
                currentNode.element.classList.add('closed');
                visitedCount++;
                visitedNodesEl.textContent = visitedCount;
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            }

            const neighbors = getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (closedSet.includes(neighbor)) {
                    continue;
                }

                const tentativeG = currentNode.g + 1;
                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = manhattanDistance(neighbor, end);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        if (neighbor !== end) {
                            neighbor.element.classList.add('open');
                        }
                    }
                }
            }
        }
        return { path: [], visitedCount };
    }

    async function dijkstra() {
        const start = grid[startNode.row][startNode.col];
        const end = grid[endNode.row][endNode.col];
        let openSet = [start];
        let closedSet = [];
        let visitedCount = 0;

        start.g = 0;
        start.f = 0;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.g - b.g);
            const currentNode = openSet.shift();

            if (currentNode === end) {
                return { path: reconstructPath(end), visitedCount };
            }

            if (closedSet.includes(currentNode)) continue;
            closedSet.push(currentNode);

            if (currentNode !== start) {
                currentNode.element.classList.add('closed');
                visitedCount++;
                visitedNodesEl.textContent = visitedCount;
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            }

            const neighbors = getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                const tentativeG = currentNode.g + 1;
                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.f = tentativeG; // For Dijkstra, f = g
                    if (!openSet.find(n => n === neighbor)) {
                        openSet.push(neighbor);
                    }
                    if (neighbor !== end) {
                        neighbor.element.classList.add('open');
                    }
                }
            }
        }
        return { path: [], visitedCount };
    }

    async function bfs() {
        const start = grid[startNode.row][startNode.col];
        const end = grid[endNode.row][endNode.col];
        let queue = [start];
        let visited = new Set([start]);
        let visitedCount = 0;

        while (queue.length > 0) {
            const currentNode = queue.shift();

            if (currentNode === end) {
                return { path: reconstructPath(end), visitedCount };
            }

            if (currentNode !== start) {
                currentNode.element.classList.add('closed');
                visitedCount++;
                visitedNodesEl.textContent = visitedCount;
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            }

            const neighbors = getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    neighbor.parent = currentNode;
                    queue.push(neighbor);
                    if (neighbor !== end) {
                        neighbor.element.classList.add('open');
                    }
                }
            }
        }
        return { path: [], visitedCount };
    }

    function reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        while (currentNode !== null) {
            path.unshift(currentNode);
            currentNode = currentNode.parent;
        }
        return path;
    }

    async function visualizePath(path) {
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (node !== grid[startNode.row][startNode.col] && node !== grid[endNode.row][endNode.col]) {
                node.element.classList.remove('open', 'closed');
                node.element.classList.add('path');
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY * 2));
            }
        }
    }

    setStartBtn.addEventListener('click', () => { currentMode = 'setStart'; });
    setEndBtn.addEventListener('click', () => { currentMode = 'setEnd'; });
    startBtn.addEventListener('click', startAlgorithm);
    resetBtn.addEventListener('click', initGrid);
    clearPathBtn.addEventListener('click', clearPath);

    initGrid();
});
