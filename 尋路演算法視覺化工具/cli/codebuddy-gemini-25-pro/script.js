document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const setStartBtn = document.getElementById('set-start-btn');
    const setEndBtn = document.getElementById('set-end-btn');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const resetGridBtn = document.getElementById('reset-grid-btn');
    const algorithmSelect = document.getElementById('algorithm-select');
    const startSearchBtn = document.getElementById('start-search-btn');

    const statusEl = document.getElementById('status');
    const visitedNodesEl = document.getElementById('visited-nodes');
    const pathLengthEl = document.getElementById('path-length');
    const executionTimeEl = document.getElementById('execution-time');

    const GRID_SIZE = 15;
    let grid = [];
    let startNode = { row: 2, col: 2 };
    let endNode = { row: 12, col: 12 };

    let settingStart = false;
    let settingEnd = false;
    let isMouseDown = false;
    let isSearching = false;

    class Node {
        constructor(row, col) {
            this.row = row;
            this.col = col;
            this.isObstacle = false;
            this.g = Infinity;
            this.h = 0;
            this.f = Infinity;
            this.parent = null;
            this.isStart = row === startNode.row && col === startNode.col;
            this.isEnd = row === endNode.row && col === endNode.col;
        }

        get isWall() {
            return this.isObstacle;
        }
    }

    function createGrid() {
        gridContainer.innerHTML = '';
        grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                const node = new Node(row, col);
                const cell = document.createElement('div');
                cell.id = `node-${row}-${col}`;
                cell.className = 'grid-cell';
                if (node.isStart) cell.classList.add('start');
                if (node.isEnd) cell.classList.add('end');

                cell.addEventListener('mousedown', () => handleMouseDown(row, col));
                cell.addEventListener('mouseenter', () => handleMouseEnter(row, col));
                cell.addEventListener('mouseup', () => handleMouseUp());
                cell.addEventListener('click', () => handleClick(row, col));

                gridContainer.appendChild(cell);
                currentRow.push(node);
            }
            grid.push(currentRow);
        }
    }

    function handleMouseDown(row, col) {
        if (isSearching) return;
        isMouseDown = true;
        toggleObstacle(row, col);
    }

    function handleMouseEnter(row, col) {
        if (isSearching || !isMouseDown) return;
        toggleObstacle(row, col);
    }

    function handleMouseUp() {
        isMouseDown = false;
    }
    
    function handleClick(row, col) {
        if (isSearching) return;
        const node = grid[row][col];
        if (settingStart) {
            if(node.isEnd || node.isObstacle) return;
            const prevStartNode = grid[startNode.row][startNode.col];
            prevStartNode.isStart = false;
            document.getElementById(`node-${startNode.row}-${startNode.col}`).classList.remove('start');
            
            startNode = { row, col };
            node.isStart = true;
            document.getElementById(`node-${row}-${col}`).classList.add('start');
            settingStart = false;
            setStartBtn.style.backgroundColor = '#3498db';

        } else if (settingEnd) {
            if(node.isStart || node.isObstacle) return;
            const prevEndNode = grid[endNode.row][endNode.col];
            prevEndNode.isEnd = false;
            document.getElementById(`node-${endNode.row}-${endNode.col}`).classList.remove('end');
            
            endNode = { row, col };
            node.isEnd = true;
            document.getElementById(`node-${row}-${col}`).classList.add('end');
            settingEnd = false;
            setEndBtn.style.backgroundColor = '#3498db';
        }
    }

    function toggleObstacle(row, col) {
        const node = grid[row][col];
        if (node.isStart || node.isEnd) return;
        node.isObstacle = !node.isObstacle;
        document.getElementById(`node-${row}-${col}`).classList.toggle('obstacle', node.isObstacle);
    }

    setStartBtn.addEventListener('click', () => {
        settingStart = !settingStart;
        settingEnd = false;
        setStartBtn.style.backgroundColor = settingStart ? '#2980b9' : '#3498db';
        setEndBtn.style.backgroundColor = '#3498db';
    });

    setEndBtn.addEventListener('click', () => {
        settingEnd = !settingEnd;
        settingStart = false;
        setEndBtn.style.backgroundColor = settingEnd ? '#2980b9' : '#3498db';
        setStartBtn.style.backgroundColor = '#3498db';
    });

    clearPathBtn.addEventListener('click', clearPath);
    resetGridBtn.addEventListener('click', resetGrid);
    startSearchBtn.addEventListener('click', startSearch);

    function clearPath() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.getElementById(`node-${row}-${col}`);
                cell.classList.remove('open', 'closed', 'path');
            }
        }
        updateStats({ visited: 0, pathLength: 0, time: 0, status: '就緒' });
    }

    function resetGrid() {
        startNode = { row: 2, col: 2 };
        endNode = { row: 12, col: 12 };
        createGrid();
        updateStats({ visited: 0, pathLength: 0, time: 0, status: '就緒' });
    }

    function setControlsEnabled(enabled) {
        isSearching = !enabled;
        setStartBtn.disabled = !enabled;
        setEndBtn.disabled = !enabled;
        clearPathBtn.disabled = !enabled;
        resetGridBtn.disabled = !enabled;
        algorithmSelect.disabled = !enabled;
        startSearchBtn.disabled = !enabled;
    }

    function updateStats({ visited, pathLength, time, status }) {
        statusEl.textContent = status;
        visitedNodesEl.textContent = visited;
        pathLengthEl.textContent = pathLength;
        executionTimeEl.textContent = time;
    }

    async function startSearch() {
        clearPath();
        setControlsEnabled(false);
        updateStats({ visited: 0, pathLength: 0, time: 0, status: '搜尋中...' });
        const startTime = performance.now();

        const start = grid[startNode.row][startNode.col];
        const end = grid[endNode.row][endNode.col];
        const algorithm = algorithmSelect.value === 'astar' ? astar : dijkstra;

        const result = await algorithm(start, end);
        
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);

        if (result.path) {
            updateStats({
                visited: result.visitedCount,
                pathLength: result.path.length,
                time: executionTime,
                status: '找到路徑'
            });
            await visualizePath(result.path);
        } else {
            updateStats({
                visited: result.visitedCount,
                pathLength: 0,
                time: executionTime,
                status: '無路徑'
            });
        }

        setControlsEnabled(true);
    }

    function getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);
        return neighbors.filter(neighbor => !neighbor.isObstacle);
    }

    function manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    async function astar(startNode, endNode) {
        let openSet = [startNode];
        let visitedCount = 0;

        for (let row of grid) {
            for (let node of row) {
                node.g = Infinity;
                node.f = Infinity;
                node.parent = null;
            }
        }

        startNode.g = 0;
        startNode.f = manhattanDistance(startNode, endNode);

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            let currentNode = openSet.shift();
            visitedCount++;

            if (currentNode === endNode) {
                return { path: reconstructPath(endNode), visitedCount };
            }
            
            if (!currentNode.isStart && !currentNode.isEnd) {
                document.getElementById(`node-${currentNode.row}-${currentNode.col}`).classList.add('closed');
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            

            for (let neighbor of getNeighbors(currentNode)) {
                let tentativeG = currentNode.g + 1;

                if (tentativeG < neighbor.g) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.h = manhattanDistance(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        if(!neighbor.isEnd)
                            document.getElementById(`node-${neighbor.row}-${neighbor.col}`).classList.add('open');
                    }
                }
            }
        }
        return { path: null, visitedCount };
    }

    async function dijkstra(startNode, endNode) {
        let openSet = [startNode];
        let visitedCount = 0;

        for (let row of grid) {
            for (let node of row) {
                node.g = Infinity;
                node.parent = null;
            }
        }
        startNode.g = 0;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.g - b.g);
            let currentNode = openSet.shift();
            visitedCount++;
            
            if(currentNode.isObstacle) continue;

            if (currentNode === endNode) {
                return { path: reconstructPath(endNode), visitedCount };
            }
            
            if (!currentNode.isStart && !currentNode.isEnd) {
                 document.getElementById(`node-${currentNode.row}-${currentNode.col}`).classList.add('closed');
                 await new Promise(resolve => setTimeout(resolve, 10));
            }


            for (let neighbor of getNeighbors(currentNode)) {
                let newG = currentNode.g + 1;
                if(newG < neighbor.g){
                    neighbor.g = newG;
                    neighbor.parent = currentNode;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                         if(!neighbor.isEnd)
                            document.getElementById(`node-${neighbor.row}-${neighbor.col}`).classList.add('open');
                    }
                }
            }
        }

        return { path: null, visitedCount };
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
            if (!node.isStart && !node.isEnd) {
                document.getElementById(`node-${node.row}-${node.col}`).classList.add('path');
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
    }

    createGrid();
});
