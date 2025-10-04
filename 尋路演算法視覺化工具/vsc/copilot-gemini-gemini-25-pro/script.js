document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 25;
    const ANIMATION_DELAY = 10;

    const gridContainer = document.getElementById('grid-container');
    const setStartBtn = document.getElementById('set-start-btn');
    const setEndBtn = document.getElementById('set-end-btn');
    const algorithmSelect = document.getElementById('algorithm-select');
    const startBtn = document.getElementById('start-btn');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusEl = document.getElementById('status');
    const visitedNodesEl = document.getElementById('visited-nodes');
    const pathLengthEl = document.getElementById('path-length');
    const executionTimeEl = document.getElementById('execution-time');

    let grid = [];
    let startNode = { row: 2, col: 2 };
    let endNode = { row: 22, col: 22 };

    let isSettingStart = false;
    let isSettingEnd = false;
    let isMouseDown = false;
    let isRunning = false;

    class Node {
        constructor(row, col) {
            this.row = row;
            this.col = col;
            this.isWall = false;
            this.g = Infinity;
            this.h = 0;
            this.f = Infinity;
            this.parent = null;
            this.div = document.createElement('div');
            this.div.className = 'cell';
            this.div.dataset.row = row;
            this.div.dataset.col = col;
        }

        reset() {
            this.g = Infinity;
            this.h = 0;
            this.f = Infinity;
            this.parent = null;
            this.div.classList.remove('open', 'closed', 'path');
        }

        setAsWall() {
            if (!this.isStart() && !this.isEnd()) {
                this.isWall = !this.isWall;
                this.div.classList.toggle('wall', this.isWall);
            }
        }

        isStart() {
            return this.row === startNode.row && this.col === startNode.col;
        }

        isEnd() {
            return this.row === endNode.row && this.col === endNode.col;
        }
    }

    function createGrid() {
        gridContainer.innerHTML = '';
        grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                const node = new Node(row, col);
                addEventListeners(node);
                gridContainer.appendChild(node.div);
                currentRow.push(node);
            }
            grid.push(currentRow);
        }
        updateNodeClasses();
    }

    function addEventListeners(node) {
        node.div.addEventListener('mousedown', () => handleMouseDown(node));
        node.div.addEventListener('mouseenter', () => handleMouseEnter(node));
        node.div.addEventListener('mouseup', () => handleMouseUp());
        node.div.addEventListener('click', () => handleClick(node));
    }

    function handleMouseDown(node) {
        if (isRunning) return;
        isMouseDown = true;
        if (!isSettingStart && !isSettingEnd) {
            // We toggle on mouse down for single click functionality
        }
    }

    function handleMouseEnter(node) {
        if (isRunning || !isMouseDown || isSettingStart || isSettingEnd) return;
        if (!node.isStart() && !node.isEnd() && !node.isWall) {
            node.setAsWall();
        }
    }

    function handleMouseUp() {
        isMouseDown = false;
    }

    function handleClick(node) {
        if (isRunning) return;
        if (isSettingStart) {
            setStartNode(node.row, node.col);
        } else if (isSettingEnd) {
            setEndNode(node.row, node.col);
        } else {
            node.setAsWall();
        }
    }

    function setStartNode(row, col) {
        const oldStart = grid[startNode.row][startNode.col];
        if (oldStart.isWall) oldStart.setAsWall(); // Untoggle wall if it was there

        startNode = { row, col };
        const newStart = grid[row][col];
        if (newStart.isWall) newStart.setAsWall(); // Remove wall from new start

        isSettingStart = false;
        setStartBtn.classList.remove('active');
        updateNodeClasses();
    }

    function setEndNode(row, col) {
        const oldEnd = grid[endNode.row][endNode.col];
        if (oldEnd.isWall) oldEnd.setAsWall();

        endNode = { row, col };
        const newEnd = grid[row][col];
        if (newEnd.isWall) newEnd.setAsWall();

        isSettingEnd = false;
        setEndBtn.classList.remove('active');
        updateNodeClasses();
    }

    function updateNodeClasses() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const node = grid[row][col];
                node.div.classList.remove('start', 'end');
                if (node.isStart()) {
                    node.div.classList.add('start');
                } else if (node.isEnd()) {
                    node.div.classList.add('end');
                }
            }
        }
    }

    function resetGrid(fullReset = true) {
        clearPath();
        if (fullReset) {
            startNode = { row: 2, col: 2 };
            endNode = { row: 22, col: 22 };
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    const node = grid[row][col];
                    node.isWall = false;
                    node.div.classList.remove('wall');
                }
            }
        }
        updateNodeClasses();
    }

    function clearPath() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                grid[row][col].reset();
            }
        }
        updateStats({ status: '就緒', visited: 0, path: 0, time: 0 });
    }

    function updateStats({ status, visited, path, time }) {
        if (status) statusEl.textContent = status;
        if (visited !== undefined) visitedNodesEl.textContent = visited;
        if (path !== undefined) pathLengthEl.textContent = path;
        if (time !== undefined) executionTimeEl.textContent = time;
    }

    function toggleButtons(disabled) {
        isRunning = disabled;
        setStartBtn.disabled = disabled;
        setEndBtn.disabled = disabled;
        algorithmSelect.disabled = disabled;
        startBtn.disabled = disabled;
        clearPathBtn.disabled = disabled;
        resetBtn.disabled = disabled;
    }

    setStartBtn.addEventListener('click', () => {
        isSettingStart = !isSettingStart;
        isSettingEnd = false;
        setStartBtn.classList.toggle('active', isSettingStart);
        setEndBtn.classList.remove('active');
    });

    setEndBtn.addEventListener('click', () => {
        isSettingEnd = !isSettingEnd;
        isSettingStart = false;
        setEndBtn.classList.toggle('active', isSettingEnd);
        setStartBtn.classList.remove('active');
    });

    startBtn.addEventListener('click', () => {
        clearPath();
        const algorithm = algorithmSelect.value;
        const start = grid[startNode.row][startNode.col];
        const end = grid[endNode.row][endNode.col];

        toggleButtons(true);
        updateStats({ status: '搜尋中...' });

        const startTime = performance.now();
        let pathInfo;

        switch (algorithm) {
            case 'astar':
                pathInfo = aStar(start, end);
                break;
            case 'dijkstra':
                pathInfo = dijkstra(start, end);
                break;
            case 'bfs':
                pathInfo = bfs(start, end);
                break;
        }

        const { path, visitedNodes } = pathInfo;
        const endTime = performance.now();

        animateSearch(visitedNodes, path, () => {
            toggleButtons(false);
            const executionTime = (endTime - startTime).toFixed(2);
            if (path.length > 0) {
                updateStats({ status: '找到路徑', visited: visitedNodes.length, path: path.length, time: executionTime });
            } else {
                updateStats({ status: '無法找到路徑', visited: visitedNodes.length, path: 0, time: executionTime });
            }
        });
    });

    clearPathBtn.addEventListener('click', () => clearPath());
    resetBtn.addEventListener('click', () => resetGrid(true));

    function getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);
        return neighbors.filter(neighbor => !neighbor.isWall);
    }

    function manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    // A* Algorithm
    function aStar(startNode, endNode) {
        const openSet = [startNode];
        const visitedNodes = [];
        startNode.g = 0;
        startNode.h = manhattanDistance(startNode, endNode);
        startNode.f = startNode.h;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            visitedNodes.push(currentNode);

            if (currentNode === endNode) {
                return { path: reconstructPath(endNode), visitedNodes };
            }

            currentNode.div.classList.add('closed');

            for (const neighbor of getNeighbors(currentNode)) {
                const tentativeG = currentNode.g + 1;
                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = manhattanDistance(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.div.classList.add('open');
                    }
                }
            }
        }
        return { path: [], visitedNodes };
    }

    // Dijkstra's Algorithm
    function dijkstra(startNode, endNode) {
        const openSet = [startNode];
        const visitedNodes = [];
        startNode.g = 0;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.g - b.g);
            const currentNode = openSet.shift();

            visitedNodes.push(currentNode);

            if (currentNode.isWall) continue;
            if (currentNode.g === Infinity) return { path: [], visitedNodes };

            currentNode.div.classList.add('closed');

            if (currentNode === endNode) {
                return { path: reconstructPath(endNode), visitedNodes };
            }

            for (const neighbor of getNeighbors(currentNode)) {
                const newG = currentNode.g + 1;
                if (newG < neighbor.g) {
                    neighbor.g = newG;
                    neighbor.parent = currentNode;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.div.classList.add('open');
                    }
                }
            }
        }
        return { path: [], visitedNodes };
    }

    // Breadth-First Search (BFS)
    function bfs(startNode, endNode) {
        const queue = [startNode];
        const visited = new Set([startNode]);
        const visitedNodesInOrder = [];

        while (queue.length > 0) {
            const currentNode = queue.shift();
            visitedNodesInOrder.push(currentNode);

            if (currentNode === endNode) {
                return { path: reconstructPath(endNode), visitedNodes: visitedNodesInOrder };
            }

            currentNode.div.classList.add('closed');

            for (const neighbor of getNeighbors(currentNode)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    neighbor.parent = currentNode;
                    queue.push(neighbor);
                    neighbor.div.classList.add('open');
                }
            }
        }
        return { path: [], visitedNodes: visitedNodesInOrder };
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

    function animateSearch(visitedNodes, path, onComplete) {
        for (let i = 0; i <= visitedNodes.length; i++) {
            if (i === visitedNodes.length) {
                setTimeout(() => {
                    animatePath(path, onComplete);
                }, i * ANIMATION_DELAY);
                return;
            }
            setTimeout(() => {
                const node = visitedNodes[i];
                if (!node.isStart() && !node.isEnd()) {
                    node.div.classList.remove('open');
                    node.div.classList.add('closed');
                }
            }, i * ANIMATION_DELAY);
        }
    }

    function animatePath(path, onComplete) {
        for (let i = 0; i < path.length; i++) {
            setTimeout(() => {
                const node = path[i];
                if (!node.isStart() && !node.isEnd()) {
                    node.div.classList.add('path');
                }
                if (i === path.length - 1) {
                    onComplete();
                }
            }, i * (ANIMATION_DELAY * 2));
        }
        if (path.length === 0) {
            onComplete();
        }
    }

    // Initial setup
    createGrid();
});
