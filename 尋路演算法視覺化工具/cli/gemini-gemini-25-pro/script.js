document.addEventListener('DOMContentLoaded', () => {
    const GRID_WIDTH = 25;
    const GRID_HEIGHT = 25;
    const ANIMATION_DELAY = 10; // ms

    // DOM Elements
    const gridContainer = document.getElementById('grid-container');
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
    let startNode = null;
    let endNode = null;
    let isMouseDown = false;
    let currentMode = 'obstacle'; // 'obstacle', 'set_start', 'set_end'
    let isAnimating = false;

    class Node {
        constructor(row, col) {
            this.row = row;
            this.col = col;
            this.isStart = false;
            this.isEnd = false;
            this.isObstacle = false;
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
            this.isStart = false;
            this.isEnd = false;
            this.isObstacle = false;
            this.resetPathfinding();
            this.updateElement();
        }

        resetPathfinding() {
            this.g = Infinity;
            this.h = 0;
            this.f = Infinity;
            this.parent = null;
            this.element.classList.remove('open', 'closed', 'path');
        }

        updateElement() {
            this.element.classList.toggle('start', this.isStart);
            this.element.classList.toggle('end', this.isEnd);
            this.element.classList.toggle('obstacle', this.isObstacle);
        }
    }

    function init() {
        gridContainer.innerHTML = '';
        grid = [];
        isAnimating = false;
        currentMode = 'obstacle';
        updateStats({ status: '就緒', time: 0, visited: 0, path: 0 });
        enableControls();

        for (let row = 0; row < GRID_HEIGHT; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_WIDTH; col++) {
                const node = new Node(row, col);
                currentRow.push(node);
                gridContainer.appendChild(node.element);
            }
            grid.push(currentRow);
        }

        setStartNode(grid[2][2]);
        setEndNode(grid[22][22]);
    }

    function setStartNode(node) {
        if (node.isEnd || node.isObstacle) return;
        if (startNode) {
            startNode.isStart = false;
            startNode.updateElement();
        }
        startNode = node;
        startNode.isStart = true;
        startNode.updateElement();
    }

    function setEndNode(node) {
        if (node.isStart || node.isObstacle) return;
        if (endNode) {
            endNode.isEnd = false;
            endNode.updateElement();
        }
        endNode = node;
        endNode.isEnd = true;
        endNode.updateElement();
    }

    function handleCellInteraction(row, col) {
        if (isAnimating) return;
        const node = grid[row][col];

        switch (currentMode) {
            case 'set_start':
                setStartNode(node);
                currentMode = 'obstacle';
                break;
            case 'set_end':
                setEndNode(node);
                currentMode = 'obstacle';
                break;
            case 'obstacle':
                if (!node.isStart && !node.isEnd) {
                    node.isObstacle = !node.isObstacle;
                    node.updateElement();
                }
                break;
        }
    }

    function clearPath() {
        if (isAnimating) return;
        for (let row of grid) {
            for (let node of row) {
                node.resetPathfinding();
            }
        }
        updateStats({ status: '就緒', time: 0, visited: 0, path: 0 });
    }

    function updateStats({ status, time, visited, path }) {
        if (status !== undefined) statusEl.textContent = status;
        if (time !== undefined) timeEl.textContent = time;
        if (visited !== undefined) visitedNodesEl.textContent = visited;
        if (path !== undefined) pathLengthEl.textContent = path;
    }

    function disableControls() {
        isAnimating = true;
        setStartBtn.disabled = true;
        setEndBtn.disabled = true;
        algorithmSelect.disabled = true;
        startBtn.disabled = true;
        clearPathBtn.disabled = true;
        resetBtn.disabled = true;
    }

    function enableControls() {
        isAnimating = false;
        setStartBtn.disabled = false;
        setEndBtn.disabled = false;
        algorithmSelect.disabled = false;
        startBtn.disabled = false;
        clearPathBtn.disabled = false;
        resetBtn.disabled = false;
    }

    async function visualizeAlgorithm() {
        if (isAnimating) return;
        clearPath();
        disableControls();
        updateStats({ status: '搜尋中...' });

        const algorithm = algorithmSelect.value;
        const startTime = performance.now();

        let result;
        switch (algorithm) {
            case 'astar':
                result = aStar(startNode, endNode);
                break;
            case 'dijkstra':
                result = dijkstra(startNode, endNode);
                break;
            case 'bfs':
                result = bfs(startNode, endNode);
                break;
        }

        const { visitedNodes, path } = result;
        const endTime = performance.now();
        updateStats({ time: (endTime - startTime).toFixed(2) });

        // Animate visited nodes
        for (let i = 0; i < visitedNodes.length; i++) {
            const node = visitedNodes[i];
            if (!node.isStart && !node.isEnd) {
                node.element.classList.add('closed');
            }
            updateStats({ visited: i + 1 });
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
        }

        // Animate path
        if (path.length > 0) {
            for (let i = 0; i < path.length; i++) {
                const node = path[i];
                if (!node.isStart && !node.isEnd) {
                    node.element.classList.add('path');
                }
                updateStats({ path: i + 1 });
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            }
            updateStats({ status: '找到路徑' });
        } else {
            updateStats({ status: '無法找到路徑', path: 0 });
        }

        enableControls();
    }

    function getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < GRID_HEIGHT - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < GRID_WIDTH - 1) neighbors.push(grid[row][col + 1]);
        return neighbors.filter(n => !n.isObstacle);
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

    // --- Algorithms ---

    function aStar(start, end) {
        const openSet = [start];
        const closedSet = new Set();
        const visitedNodes = [];

        start.g = 0;
        start.h = manhattanDistance(start, end);
        start.f = start.h;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            if (currentNode === end) {
                return { visitedNodes, path: reconstructPath(end) };
            }

            if (!currentNode.isStart) {
                visitedNodes.push(currentNode);
            }
            closedSet.add(currentNode);
            if(!currentNode.isStart && !currentNode.isEnd) currentNode.element.classList.add('open');

            for (const neighbor of getNeighbors(currentNode)) {
                if (closedSet.has(neighbor)) continue;

                const tentativeG = currentNode.g + 1;

                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = manhattanDistance(neighbor, end);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        return { visitedNodes, path: [] };
    }

    function dijkstra(start, end) {
        const openSet = [start];
        const closedSet = new Set();
        const visitedNodes = [];

        start.g = 0;
        start.f = 0;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.g - b.g);
            const currentNode = openSet.shift();

            if (currentNode === end) {
                return { visitedNodes, path: reconstructPath(end) };
            }

            if (closedSet.has(currentNode)) continue;
            closedSet.add(currentNode);
            if (!currentNode.isStart) {
                visitedNodes.push(currentNode);
            }
            if(!currentNode.isStart && !currentNode.isEnd) currentNode.element.classList.add('open');

            for (const neighbor of getNeighbors(currentNode)) {
                const tentativeG = currentNode.g + 1;
                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.f = tentativeG; // Dijkstra is A* with h=0
                    if (!openSet.find(n => n === neighbor)){
                         openSet.push(neighbor);
                    }
                }
            }
        }
        return { visitedNodes, path: [] };
    }

    function bfs(start, end) {
        const queue = [start];
        const visited = new Set([start]);
        const visitedNodes = [];

        while (queue.length > 0) {
            const currentNode = queue.shift();

            if (currentNode === end) {
                return { visitedNodes, path: reconstructPath(end) };
            }

            if (!currentNode.isStart) {
                visitedNodes.push(currentNode);
            }
            if(!currentNode.isStart && !currentNode.isEnd) currentNode.element.classList.add('open');

            for (const neighbor of getNeighbors(currentNode)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    neighbor.parent = currentNode;
                    queue.push(neighbor);
                }
            }
        }
        return { visitedNodes, path: [] };
    }

    // --- Event Listeners ---
    gridContainer.addEventListener('mousedown', e => {
        if (e.target.classList.contains('grid-cell')) {
            isMouseDown = true;
            const { row, col } = e.target.dataset;
            handleCellInteraction(parseInt(row), parseInt(col));
        }
    });

    gridContainer.addEventListener('mouseover', e => {
        if (isMouseDown && e.target.classList.contains('grid-cell')) {
            const { row, col } = e.target.dataset;
            handleCellInteraction(parseInt(row), parseInt(col));
        }
    });

    document.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    setStartBtn.addEventListener('click', () => { currentMode = 'set_start'; });
    setEndBtn.addEventListener('click', () => { currentMode = 'set_end'; });
    startBtn.addEventListener('click', visualizeAlgorithm);
    clearPathBtn.addEventListener('click', clearPath);
    resetBtn.addEventListener('click', init);

    // Initial setup
    init();
});
