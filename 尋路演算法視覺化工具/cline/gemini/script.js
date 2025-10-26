document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 15;
    const gridContainer = document.getElementById('grid-container');

    // Controls
    const setStartBtn = document.getElementById('set-start-btn');
    const setEndBtn = document.getElementById('set-end-btn');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const resetBtn = document.getElementById('reset-btn');
    const algorithmSelect = document.getElementById('algorithm-select');
    const startBtn = document.getElementById('start-btn');

    // Stats
    const statusEl = document.getElementById('status');
    const visitedNodesEl = document.getElementById('visited-nodes');
    const pathLengthEl = document.getElementById('path-length');
    const executionTimeEl = document.getElementById('execution-time');

    let grid = [];
    let startNode = { row: 2, col: 2 };
    let endNode = { row: 12, col: 12 };

    let isSettingStart = false;
    let isSettingEnd = false;
    let isDrawingObstacles = false;
    let isAlgorithmRunning = false;

    class Node {
        constructor(row, col) {
            this.row = row;
            this.col = col;
            this.isObstacle = false;
            this.g = Infinity; // Cost from start
            this.h = 0;       // Heuristic cost to end
            this.f = Infinity; // Total cost (g + h)
            this.parent = null;
        }
    }

    function createGrid() {
        gridContainer.innerHTML = '';
        grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridContainer.appendChild(cell);
                currentRow.push(new Node(row, col));
            }
            grid.push(currentRow);
        }
        setupInitialNodes();
        addEventListeners();
    }

    function setupInitialNodes() {
        // Clear old start/end nodes if any
        const oldStart = document.querySelector('.start');
        const oldEnd = document.querySelector('.end');
        if (oldStart) oldStart.classList.remove('start');
        if (oldEnd) oldEnd.classList.remove('end');

        // Set new start/end nodes
        startNode = { row: 2, col: 2 };
        endNode = { row: 12, col: 12 };
        getNodeElement(startNode.row, startNode.col).classList.add('start');
        getNodeElement(endNode.row, endNode.col).classList.add('end');
    }

    function addEventListeners() {
        gridContainer.addEventListener('mousedown', handleMouseDown);
        gridContainer.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseup', handleMouseUp);
        gridContainer.addEventListener('click', handleCellClick);
    }

    function handleMouseDown(e) {
        if (isAlgorithmRunning || isSettingStart || isSettingEnd) return;
        const cell = e.target.closest('.grid-cell');
        if (cell) {
            isDrawingObstacles = true;
            toggleObstacle(cell);
        }
    }

    function handleMouseOver(e) {
        if (!isDrawingObstacles || isAlgorithmRunning) return;
        const cell = e.target.closest('.grid-cell');
        if (cell) {
            toggleObstacle(cell, true);
        }
    }

    function handleMouseUp() {
        isDrawingObstacles = false;
    }

    function handleCellClick(e) {
        if (isAlgorithmRunning) return;
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (isSettingStart) {
            if (grid[row][col].isObstacle || (row === endNode.row && col === endNode.col)) return;
            getNodeElement(startNode.row, startNode.col).classList.remove('start');
            startNode = { row, col };
            cell.classList.add('start');
            isSettingStart = false;
            setStartBtn.style.backgroundColor = '';
        } else if (isSettingEnd) {
            if (grid[row][col].isObstacle || (row === startNode.row && col === startNode.col)) return;
            getNodeElement(endNode.row, endNode.col).classList.remove('end');
            endNode = { row, col };
            cell.classList.add('end');
            isSettingEnd = false;
            setEndBtn.style.backgroundColor = '';
        } else if (!isDrawingObstacles) {
            toggleObstacle(cell);
        }
    }

    function toggleObstacle(cell, forceAdd = false) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if ((row === startNode.row && col === startNode.col) || (row === endNode.row && col === endNode.col)) {
            return;
        }

        const node = grid[row][col];
        if (forceAdd) {
            if (!node.isObstacle) {
                node.isObstacle = true;
                cell.classList.add('obstacle');
            }
        } else {
            node.isObstacle = !node.isObstacle;
            cell.classList.toggle('obstacle');
        }
    }

    function getNodeElement(row, col) {
        return document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    }

    function toggleControls(disabled) {
        isAlgorithmRunning = disabled;
        setStartBtn.disabled = disabled;
        setEndBtn.disabled = disabled;
        clearPathBtn.disabled = disabled;
        resetBtn.disabled = disabled;
        algorithmSelect.disabled = disabled;
        startBtn.disabled = disabled;
    }

    // Button Event Listeners
    setStartBtn.addEventListener('click', () => {
        isSettingStart = !isSettingStart;
        isSettingEnd = false;
        setStartBtn.style.backgroundColor = isSettingStart ? '#2980b9' : '';
        setEndBtn.style.backgroundColor = '';
    });

    setEndBtn.addEventListener('click', () => {
        isSettingEnd = !isSettingEnd;
        isSettingStart = false;
        setEndBtn.style.backgroundColor = isSettingEnd ? '#2980b9' : '';
        setStartBtn.style.backgroundColor = '';
    });

    startBtn.addEventListener('click', () => {
        clearPath();
        runPathfinding();
    });

    clearPathBtn.addEventListener('click', clearPath);

    resetBtn.addEventListener('click', () => {
        createGrid();
        clearPath();
        resetStats();
    });

    function clearGridState() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const node = grid[row][col];
                node.g = Infinity;
                node.h = 0;
                node.f = Infinity;
                node.parent = null;
            }
        }
    }

    function clearPath() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = getNodeElement(row, col);
                cell.classList.remove('open', 'closed', 'path');
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

    // Pathfinding Algorithms
    async function runPathfinding() {
        toggleControls(true);
        clearGridState();
        statusEl.textContent = '搜尋中...';
        const startTime = performance.now();

        const start = grid[startNode.row][startNode.col];
        const end = grid[endNode.row][endNode.col];
        const algorithm = algorithmSelect.value === 'astar' ? aStar : dijkstra;

        const result = await algorithm(start, end);

        const endTime = performance.now();
        executionTimeEl.textContent = (endTime - startTime).toFixed(2);

        if (result.path.length > 0) {
            statusEl.textContent = '找到路徑';
            pathLengthEl.textContent = result.path.length;
            await animatePath(result.path);
        } else {
            statusEl.textContent = '無法找到路徑';
        }
        visitedNodesEl.textContent = result.visitedCount;
        toggleControls(false);
    }

    function manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    async function aStar(start, end) {
        const openSet = [start];
        const closedSet = [];
        let visitedCount = 0;

        start.g = 0;
        start.h = manhattanDistance(start, end);
        start.f = start.g + start.h;

        while (openSet.length > 0) {
            let lowestFIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestFIndex].f) {
                    lowestFIndex = i;
                }
            }
            let current = openSet[lowestFIndex];

            if (current === end) {
                return { path: reconstructPath(current), visitedCount };
            }

            openSet.splice(lowestFIndex, 1);
            closedSet.push(current);
            visitedCount++;

            if (current !== start) {
                getNodeElement(current.row, current.col).classList.add('closed');
            }

            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                if (closedSet.includes(neighbor) || neighbor.isObstacle) {
                    continue;
                }

                let tempG = current.g + 1;
                let newPath = false;
                if (openSet.includes(neighbor)) {
                    if (tempG < neighbor.g) {
                        neighbor.g = tempG;
                        newPath = true;
                    }
                } else {
                    neighbor.g = tempG;
                    newPath = true;
                    openSet.push(neighbor);
                    if (neighbor !== end) {
                        getNodeElement(neighbor.row, neighbor.col).classList.add('open');
                    }
                }

                if (newPath) {
                    neighbor.h = manhattanDistance(neighbor, end);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return { path: [], visitedCount };
    }

    async function dijkstra(start, end) {
        const openSet = [start];
        const closedSet = [];
        let visitedCount = 0;

        start.g = 0;
        start.f = 0;

        while (openSet.length > 0) {
            let lowestFIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].g < openSet[lowestFIndex].g) {
                    lowestFIndex = i;
                }
            }
            let current = openSet[lowestFIndex];

            if (current === end) {
                return { path: reconstructPath(current), visitedCount };
            }

            openSet.splice(lowestFIndex, 1);
            closedSet.push(current);
            visitedCount++;

            if (current !== start) {
                getNodeElement(current.row, current.col).classList.add('closed');
            }

            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                if (closedSet.includes(neighbor) || neighbor.isObstacle) {
                    continue;
                }

                let tempG = current.g + 1;
                if (!openSet.includes(neighbor) || tempG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tempG;
                    neighbor.f = neighbor.g;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        if (neighbor !== end) {
                            getNodeElement(neighbor.row, neighbor.col).classList.add('open');
                        }
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return { path: [], visitedCount };
    }

    function getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);
        return neighbors;
    }

    function reconstructPath(endNode) {
        const path = [];
        let current = endNode;
        while (current !== null) {
            path.push(current);
            current = current.parent;
        }
        return path.reverse();
    }

    async function animatePath(path) {
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (node.row === startNode.row && node.col === startNode.col) continue;
            if (node.row === endNode.row && node.col === endNode.col) continue;
            getNodeElement(node.row, node.col).classList.add('path');
            await new Promise(resolve => setTimeout(resolve, 25));
        }
    }

    // Initial setup
    createGrid();
});
