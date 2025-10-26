document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 15;
    const gridContainer = document.getElementById('grid-container');

    // Controls
    const setStartBtn = document.getElementById('set-start-btn');
    const setEndBtn = document.getElementById('set-end-btn');
    const startBtn = document.getElementById('start-btn');
    const algorithmSelect = document.getElementById('algorithm-select');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Stats
    const statusEl = document.getElementById('status');
    const timeEl = document.getElementById('time');
    const visitedNodesEl = document.getElementById('visited-nodes');
    const pathLengthEl = document.getElementById('path-length');

    let grid = [];
    let startNode = { row: 2, col: 2 };
    let endNode = { row: 12, col: 12 };

    let mode = 'obstacle'; // 'start', 'end', 'obstacle'
    let isMouseDown = false;
    let isSearching = false;

    class Node {
        constructor(row, col) {
            this.row = row;
            this.col = col;
            this.g = Infinity; // Cost from start to this node
            this.h = 0;        // Heuristic cost from this node to end
            this.f = Infinity; // Total cost (g + h)
            this.parent = null;
            this.isObstacle = false;
        }
    }

    function createGrid() {
        gridContainer.innerHTML = '';
        grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridContainer.appendChild(cell);

                const node = new Node(row, col);
                currentRow.push(node);

                cell.addEventListener('mousedown', () => handleMouseDown(row, col));
                cell.addEventListener('mousemove', () => handleMouseMove(row, col));
                cell.addEventListener('mouseup', () => handleMouseUp());
                cell.addEventListener('click', () => handleClick(row, col));
            }
            grid.push(currentRow);
        }
        gridContainer.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });
        updateGrid();
    }

    function updateGrid() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = gridContainer.children[row * GRID_SIZE + col];
                cell.className = 'grid-cell'; // Reset
                if (row === startNode.row && col === startNode.col) {
                    cell.classList.add('start');
                } else if (row === endNode.row && col === endNode.col) {
                    cell.classList.add('end');
                } else if (grid[row][col].isObstacle) {
                    cell.classList.add('obstacle');
                }
            }
        }
    }

    function handleMouseDown(row, col) {
        if (isSearching) return;
        isMouseDown = true;
        if (mode === 'obstacle') {
            toggleObstacle(row, col);
        }
    }

    function handleMouseMove(row, col) {
        if (isSearching || !isMouseDown || mode !== 'obstacle') return;
        const node = grid[row][col];
        if (!(row === startNode.row && col === startNode.col) && !(row === endNode.row && col === endNode.col)) {
            if (!node.isObstacle) {
                node.isObstacle = true;
                updateCell(row, col);
            }
        }
    }

    function handleMouseUp() {
        isMouseDown = false;
    }

    function handleClick(row, col) {
        if (isSearching) return;
        const node = grid[row][col];
        if (node.isObstacle && (mode === 'start' || mode === 'end')) return;

        if (mode === 'start') {
            if (!(row === endNode.row && col === endNode.col)) {
                startNode = { row, col };
                mode = 'obstacle';
                setStartBtn.style.border = '';
            }
        } else if (mode === 'end') {
            if (!(row === startNode.row && col === startNode.col)) {
                endNode = { row, col };
                mode = 'obstacle';
                setEndBtn.style.border = '';
            }
        } else {
            // This case is handled by mousedown for better drag toggling
        }
        updateGrid();
    }
    
    function toggleObstacle(row, col) {
        if ((row === startNode.row && col === startNode.col) || (row === endNode.row && col === endNode.col)) {
            return;
        }
        grid[row][col].isObstacle = !grid[row][col].isObstacle;
        updateCell(row, col);
    }

    function updateCell(row, col) {
        const cell = gridContainer.children[row * GRID_SIZE + col];
        cell.className = 'grid-cell';
        if (row === startNode.row && col === startNode.col) {
            cell.classList.add('start');
        } else if (row === endNode.row && col === endNode.col) {
            cell.classList.add('end');
        } else if (grid[row][col].isObstacle) {
            cell.classList.add('obstacle');
        }
    }

    setStartBtn.addEventListener('click', () => {
        mode = 'start';
        setStartBtn.style.border = '2px solid #2c3e50';
        setEndBtn.style.border = '';
    });

    setEndBtn.addEventListener('click', () => {
        mode = 'end';
        setEndBtn.style.border = '2px solid #2c3e50';
        setStartBtn.style.border = '';
    });

    startBtn.addEventListener('click', () => {
        if (isSearching) return;
        clearPath();
        const algorithm = algorithmSelect.value;
        findPath(algorithm);
    });

    clearPathBtn.addEventListener('click', () => {
        if (isSearching) return;
        clearPath();
    });

    resetBtn.addEventListener('click', () => {
        if (isSearching) return;
        startNode = { row: 2, col: 2 };
        endNode = { row: 12, col: 12 };
        createGrid();
        clearPath();
        resetStats();
    });

    function clearPath() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = gridContainer.children[row * GRID_SIZE + col];
                if (!cell.classList.contains('start') && !cell.classList.contains('end') && !cell.classList.contains('obstacle')) {
                    cell.className = 'grid-cell';
                }
            }
        }
        resetStats();
    }

    function resetStats() {
        statusEl.textContent = '就緒';
        timeEl.textContent = '0';
        visitedNodesEl.textContent = '0';
        pathLengthEl.textContent = '0';
    }

    function setControlsDisabled(disabled) {
        isSearching = disabled;
        setStartBtn.disabled = disabled;
        setEndBtn.disabled = disabled;
        startBtn.disabled = disabled;
        algorithmSelect.disabled = disabled;
        resetBtn.disabled = disabled;
        clearPathBtn.disabled = disabled;
    }

    async function findPath(algorithm) {
        setControlsDisabled(true);
        statusEl.textContent = '搜尋中...';
        const startTime = performance.now();

        const start = grid[startNode.row][startNode.col];
        const end = grid[endNode.row][endNode.col];

        const openSet = [start];
        const closedSet = [];
        const visitedForAnim = [];

        // Reset grid nodes for new search
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                grid[row][col].g = Infinity;
                grid[row][col].h = 0;
                grid[row][col].f = Infinity;
                grid[row][col].parent = null;
            }
        }

        start.g = 0;
        if (algorithm === 'astar') {
            start.h = manhattanDistance(start, end);
        }
        start.f = start.g + start.h;

        let pathFound = false;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            if (currentNode === end) {
                pathFound = true;
                break;
            }

            closedSet.push(currentNode);
            if (currentNode !== start) {
                visitedForAnim.push({node: currentNode, type: 'closed'});
            }

            const neighbors = getNeighbors(currentNode);

            for (const neighbor of neighbors) {
                if (closedSet.includes(neighbor) || neighbor.isObstacle) {
                    continue;
                }

                const tentativeG = currentNode.g + 1;

                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    if (algorithm === 'astar') {
                        neighbor.h = manhattanDistance(neighbor, end);
                    }
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        if (neighbor !== end) {
                             visitedForAnim.push({node: neighbor, type: 'open'});
                        }
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10));
            await animateSearch(visitedForAnim);
            visitedForAnim.length = 0; // Clear for next step animation
        }

        const endTime = performance.now();
        timeEl.textContent = (endTime - startTime).toFixed(2);

        if (pathFound) {
            const path = reconstructPath(end);
            await animatePath(path);
            statusEl.textContent = '找到路徑';
            pathLengthEl.textContent = path.length;
        } else {
            statusEl.textContent = '無路徑';
        }
        visitedNodesEl.textContent = closedSet.length + openSet.length;

        setControlsDisabled(false);
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

    function manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
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

    async function animateSearch(visitedNodes) {
        for (let i = 0; i < visitedNodes.length; i++) {
            const {node, type} = visitedNodes[i];
            const cell = gridContainer.children[node.row * GRID_SIZE + node.col];
            if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
                 cell.classList.add(type);
            }
        }
    }

    async function animatePath(path) {
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            const cell = gridContainer.children[node.row * GRID_SIZE + node.col];
            if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.remove('open', 'closed');
                cell.classList.add('path');
                await new Promise(resolve => setTimeout(resolve, 25));
            }
        }
    }

    // Initial setup
    createGrid();
});
