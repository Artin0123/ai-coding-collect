document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 15;
    const gridContainer = document.getElementById('grid-container');

    // DOM Elements
    const setStartBtn = document.getElementById('set-start-btn');
    const setEndBtn = document.getElementById('set-end-btn');
    const algorithmSelect = document.getElementById('algorithm-select');
    const startBtn = document.getElementById('start-btn');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusEl = document.getElementById('status');
    const timeEl = document.getElementById('time');
    const visitedNodesEl = document.getElementById('visited-nodes');
    const pathLengthEl = document.getElementById('path-length');

    let grid = [];
    let nodes = {}; // Store node objects for pathfinding

    let startNode = { row: 2, col: 2 };
    let endNode = { row: 12, col: 12 };

    let isSettingStart = false;
    let isSettingEnd = false;
    let isMouseDown = false;
    let isAnimating = false;

    class Node {
        constructor(row, col) {
            this.row = row;
            this.col = col;
            this.g = Infinity; // Cost from start
            this.h = 0;        // Heuristic cost to end
            this.f = Infinity; // g + h
            this.parent = null;
            this.isWall = false;
        }

        get id() {
            return `${this.row}-${this.col}`;
        }
    }

    function createGrid() {
        gridContainer.innerHTML = '';
        grid = [];
        nodes = {};
        for (let row = 0; row < GRID_SIZE; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridContainer.appendChild(cell);
                currentRow.push(cell);

                const node = new Node(row, col);
                nodes[node.id] = node;
            }
            grid.push(currentRow);
        }
    }

    function updateGridUI() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = grid[row][col];
                const node = nodes[`${row}-${col}`];
                cell.className = 'cell'; // Reset
                if (node.isWall) {
                    cell.classList.add('wall');
                }
                if (row === startNode.row && col === startNode.col) {
                    cell.classList.add('start');
                }
                if (row === endNode.row && col === endNode.col) {
                    cell.classList.add('end');
                }
            }
        }
    }

    function resetGrid() {
        isAnimating = false;
        startNode = { row: 2, col: 2 };
        endNode = { row: 12, col: 12 };
        Object.values(nodes).forEach(node => node.isWall = false);
        clearPath();
        updateGridUI();
        setStatus('就緒');
    }

    function clearPath() {
        if (isAnimating) return;
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = grid[row][col];
                if (!cell.classList.contains('wall') && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                    cell.className = 'cell';
                }
            }
        }
        visitedNodesEl.textContent = '0';
        pathLengthEl.textContent = '0';
        timeEl.textContent = '0';
        setStatus('就緒');
    }

    function setStatus(text) {
        statusEl.textContent = text;
    }

    function toggleWall(row, col, forceWall = false) {
        if (isAnimating) return;
        if ((row === startNode.row && col === startNode.col) || (row === endNode.row && col === endNode.col)) {
            return;
        }
        const node = nodes[`${row}-${col}`];
        if (forceWall) {
            node.isWall = true;
        } else {
            node.isWall = !node.isWall;
        }
        grid[row][col].classList.toggle('wall', node.isWall);
    }

    function handleGridInteraction(e) {
        if (isAnimating) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const node = nodes[`${row}-${col}`];

        if (isSettingStart) {
            if (!node.isWall && !(row === endNode.row && col === endNode.col)) {
                grid[startNode.row][startNode.col].classList.remove('start');
                startNode = { row, col };
                grid[row][col].classList.add('start');
                isSettingStart = false;
                setStartBtn.style.backgroundColor = '';
            }
        } else if (isSettingEnd) {
            if (!node.isWall && !(row === startNode.row && col === startNode.col)) {
                grid[endNode.row][endNode.col].classList.remove('end');
                endNode = { row, col };
                grid[row][col].classList.add('end');
                isSettingEnd = false;
                setEndBtn.style.backgroundColor = '';
            }
        } else {
            if (e.type === 'mousedown') {
                isMouseDown = true;
                toggleWall(row, col);
            } else if (e.type === 'mousemove' && isMouseDown) {
                toggleWall(row, col, true);
            }
        }
    }

    function manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    async function findPath() {
        clearPath();
        setControlsEnabled(false);
        isAnimating = true;
        setStatus('搜尋中...');
        const startTime = performance.now();

        const algorithm = algorithmSelect.value;
        const start = nodes[`${startNode.row}-${startNode.col}`];
        const end = nodes[`${endNode.row}-${endNode.col}`];

        // Reset nodes for new search
        Object.values(nodes).forEach(node => {
            node.g = Infinity;
            node.h = algorithm === 'astar' ? manhattanDistance(node, end) : 0;
            node.f = Infinity;
            node.parent = null;
        });

        start.g = 0;
        start.f = start.h;

        const openSet = [start];
        const closedSet = new Set();
        const animationSteps = [];

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            if (currentNode === end) {
                const path = [];
                let temp = currentNode;
                while (temp !== null) {
                    path.push(temp);
                    temp = temp.parent;
                }
                const endTime = performance.now();
                await animateSearch(animationSteps, 10);
                await animatePath(path.reverse(), 10);
                setStatus('找到路徑');
                timeEl.textContent = (endTime - startTime).toFixed(2);
                pathLengthEl.textContent = path.length - 1;
                setControlsEnabled(true);
                isAnimating = false;
                return;
            }

            closedSet.add(currentNode.id);
            if (currentNode !== start) {
                animationSteps.push({ node: currentNode, type: 'closed' });
            }

            const neighbors = getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || closedSet.has(neighbor.id)) {
                    continue;
                }

                const tentativeG = currentNode.g + 1;
                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.f = neighbor.g + neighbor.h;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        if (neighbor !== end) {
                            animationSteps.push({ node: neighbor, type: 'open' });
                        }
                    }
                }
            }
        }

        const endTime = performance.now();
        await animateSearch(animationSteps, 10);
        setStatus('無法找到路徑');
        timeEl.textContent = (endTime - startTime).toFixed(2);
        setControlsEnabled(true);
        isAnimating = false;
    }

    function getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
                neighbors.push(nodes[`${newRow}-${newCol}`]);
            }
        }
        return neighbors;
    }

    function animateSearch(steps, delay) {
        return new Promise(resolve => {
            let i = 0;
            function step() {
                if (i >= steps.length) {
                    resolve();
                    return;
                }
                const { node, type } = steps[i];
                grid[node.row][node.col].classList.add(type);
                visitedNodesEl.textContent = i + 1;
                i++;
                setTimeout(step, delay);
            }
            step();
        });
    }

    function animatePath(path, delay) {
        return new Promise(resolve => {
            let i = 0;
            function step() {
                if (i >= path.length) {
                    resolve();
                    return;
                }
                const node = path[i];
                if (node.id !== `${startNode.row}-${startNode.col}` && node.id !== `${endNode.row}-${endNode.col}`) {
                    grid[node.row][node.col].classList.remove('open', 'closed');
                    grid[node.row][node.col].classList.add('path');
                }
                i++;
                setTimeout(step, delay);
            }
            step();
        });
    }

    function setControlsEnabled(enabled) {
        setStartBtn.disabled = !enabled;
        setEndBtn.disabled = !enabled;
        algorithmSelect.disabled = !enabled;
        startBtn.disabled = !enabled;
        clearPathBtn.disabled = !enabled;
        resetBtn.disabled = !enabled;
    }

    // Event Listeners
    setStartBtn.addEventListener('click', () => {
        isSettingStart = true;
        isSettingEnd = false;
        setStartBtn.style.backgroundColor = '#2980b9'; // Indicate active state
        setEndBtn.style.backgroundColor = '';
    });

    setEndBtn.addEventListener('click', () => {
        isSettingEnd = true;
        isSettingStart = false;
        setEndBtn.style.backgroundColor = '#2980b9'; // Indicate active state
        setStartBtn.style.backgroundColor = '';
    });

    startBtn.addEventListener('click', findPath);
    clearPathBtn.addEventListener('click', clearPath);
    resetBtn.addEventListener('click', resetGrid);

    gridContainer.addEventListener('mousedown', handleGridInteraction);
    gridContainer.addEventListener('mousemove', handleGridInteraction);
    document.addEventListener('mouseup', () => isMouseDown = false);

    // Initial setup
    createGrid();
    resetGrid();
});
