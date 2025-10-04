document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const startNodeBtn = document.getElementById('start-node-btn');
    const endNodeBtn = document.getElementById('end-node-btn');
    const algorithmSelect = document.getElementById('algorithm-select');

    const visitedNodesSpan = document.getElementById('visited-nodes');
    const pathLengthSpan = document.getElementById('path-length');
    const execTimeSpan = document.getElementById('exec-time');
    const statusSpan = document.getElementById('status');

    const GRID_SIZE = 25;
    let grid = [];
    let startNode = { row: 2, col: 2 };
    let endNode = { row: 22, col: 22 };
    let isMouseDown = false;
    let settingStartNode = false;
    let settingEndNode = false;

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
                if (row === startNode.row && col === startNode.col) {
                    cell.classList.add('start-node');
                } else if (row === endNode.row && col === endNode.col) {
                    cell.classList.add('end-node');
                }
                gridContainer.appendChild(cell);
                currentRow.push({ element: cell, isWall: false });
            }
            grid.push(currentRow);
        }
    }

    function handleCellClick(e) {
        const cell = e.target;
        if (!cell.classList.contains('grid-cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (settingStartNode) {
            const oldStart = grid[startNode.row][startNode.col].element;
            oldStart.classList.remove('start-node');
            startNode = { row, col };
            cell.classList.add('start-node');
            settingStartNode = false;
        } else if (settingEndNode) {
            const oldEnd = grid[endNode.row][endNode.col].element;
            oldEnd.classList.remove('end-node');
            endNode = { row, col };
            cell.classList.add('end-node');
            settingEndNode = false;
        } else if (!(row === startNode.row && col === startNode.col) && !(row === endNode.row && col === endNode.col)) {
            grid[row][col].isWall = !grid[row][col].isWall;
            cell.classList.toggle('wall-node');
        }
    }

    function handleMouseDown(e) {
        isMouseDown = true;
        handleCellInteraction(e);
    }

    function handleMouseUp() {
        isMouseDown = false;
    }

    function handleMouseOver(e) {
        if (isMouseDown) {
            handleCellInteraction(e);
        }
    }

    function handleCellInteraction(e) {
        const cell = e.target;
        if (!cell.classList.contains('grid-cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (!(row === startNode.row && col === startNode.col) && !(row === endNode.row && col === endNode.col)) {
            if (!grid[row][col].isWall) {
                grid[row][col].isWall = true;
                cell.classList.add('wall-node');
            }
        }
    }

    function resetGrid() {
        startNode = { row: 2, col: 2 };
        endNode = { row: 22, col: 22 };
        createGrid();
        clearStats();
    }

    function clearPath() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = grid[row][col].element;
                if (!cell.classList.contains('start-node') && !cell.classList.contains('end-node') && !cell.classList.contains('wall-node')) {
                    cell.className = 'grid-cell';
                }
            }
        }
        clearStats();
    }

    function clearStats(){
        visitedNodesSpan.textContent = '0';
        pathLengthSpan.textContent = '0';
        execTimeSpan.textContent = '0';
        statusSpan.textContent = 'Ready';
    }

    async function startPathfinding() {
        disableControls();
        clearPath();
        const algorithm = algorithmSelect.value;
        const startTime = performance.now();
        statusSpan.textContent = 'Searching...';

        let result;
        switch (algorithm) {
            case 'a-star':
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
        execTimeSpan.textContent = (endTime - startTime).toFixed(2);

        if (result && result.path.length > 0) {
            pathLengthSpan.textContent = result.path.length;
            visitedNodesSpan.textContent = result.visitedCount;
            statusSpan.textContent = 'Path Found!';
            await animatePath(result.path);
        } else {
            statusSpan.textContent = 'No Path Found';
            visitedNodesSpan.textContent = result ? result.visitedCount : 0;
        }
        enableControls();
    }

    function disableControls() {
        startBtn.disabled = true;
        resetBtn.disabled = true;
        clearPathBtn.disabled = true;
        startNodeBtn.disabled = true;
        endNodeBtn.disabled = true;
        algorithmSelect.disabled = true;
    }

    function enableControls() {
        startBtn.disabled = false;
        resetBtn.disabled = false;
        clearPathBtn.disabled = false;
        startNodeBtn.disabled = false;
        endNodeBtn.disabled = false;
        algorithmSelect.disabled = false;
    }

    function getNeighbors(row, col) {
        const neighbors = [];
        if (row > 0) neighbors.push({ row: row - 1, col });
        if (row < GRID_SIZE - 1) neighbors.push({ row: row + 1, col });
        if (col > 0) neighbors.push({ row, col: col - 1 });
        if (col < GRID_SIZE - 1) neighbors.push({ row, col: col + 1 });
        return neighbors;
    }

    async function animate(nodes, className) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if ((node.row !== startNode.row || node.col !== startNode.col) && (node.row !== endNode.row || node.col !== endNode.col)) {
                grid[node.row][node.col].element.classList.add(className);
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    async function animatePath(path) {
        for (let i = path.length - 2; i > 0; i--) {
            const node = path[i];
            grid[node.row][node.col].element.classList.remove('closed-node', 'open-node');
            grid[node.row][node.col].element.classList.add('path-node');
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    // Algorithms
    async function aStar() {
        const openSet = new Heap((a, b) => a.f - b.f);
        const nodes = createNodeGrid();
        const start = nodes[startNode.row][startNode.col];
        const end = nodes[endNode.row][endNode.col];
        let visitedCount = 0;

        start.g = 0;
        start.f = manhattanDistance(start, end);
        openSet.push(start);

        const visitedInOrder = [];

        while (!openSet.isEmpty()) {
            const currentNode = openSet.pop();
            visitedCount++;
            visitedInOrder.push(currentNode);

            if(currentNode !== start && currentNode !== end) {
                grid[currentNode.row][currentNode.col].element.classList.add('closed-node');
            }

            if (currentNode === end) {
                return { path: reconstructPath(end), visitedCount };
            }

            const neighbors = getNeighbors(currentNode.row, currentNode.col);

            for (const neighborCoords of neighbors) {
                const neighbor = nodes[neighborCoords.row][neighborCoords.col];
                if (neighbor.isWall || neighbor.isClosed) continue;

                const tentativeG = currentNode.g + 1;

                if (tentativeG < neighbor.g) {
                    neighbor.previous = currentNode;
                    neighbor.g = tentativeG;
                    neighbor.f = neighbor.g + manhattanDistance(neighbor, end);
                    if (!openSet.contains(neighbor)) {
                        openSet.push(neighbor);
                        if(neighbor !== end){
                            grid[neighbor.row][neighbor.col].element.classList.add('open-node');
                        }
                    }
                }
            }
             await new Promise(resolve => setTimeout(resolve, 10));
        }
        return { path: [], visitedCount };
    }

    async function dijkstra() {
        const nodes = createNodeGrid();
        const start = nodes[startNode.row][startNode.col];
        const end = nodes[endNode.row][endNode.col];
        const unvisited = new Heap((a,b) => a.g - b.g);
        let visitedCount = 0;

        for(let row of nodes) {
            for(let node of row) {
                unvisited.push(node);
            }
        }

        start.g = 0;
        unvisited.updateItem(start);

        const visitedInOrder = [];

        while(!unvisited.isEmpty()){
            const currentNode = unvisited.pop();
            if(currentNode.isWall) continue;
            if(currentNode.g === Infinity) return { path: [], visitedCount };
            
            visitedCount++;
            currentNode.isClosed = true;
            visitedInOrder.push(currentNode);

            if(currentNode !== start && currentNode !== end) {
                grid[currentNode.row][currentNode.col].element.classList.add('closed-node');
            }

            if(currentNode === end) return { path: reconstructPath(end), visitedCount };

            const neighbors = getNeighbors(currentNode.row, currentNode.col);

            for (const neighborCoords of neighbors) {
                const neighbor = nodes[neighborCoords.row][neighborCoords.col];
                if(!neighbor.isClosed){
                    const newDist = currentNode.g + 1;
                    if(newDist < neighbor.g){
                        neighbor.g = newDist;
                        neighbor.previous = currentNode;
                        unvisited.updateItem(neighbor);
                        if(neighbor !== end){
                            grid[neighbor.row][neighbor.col].element.classList.add('open-node');
                        }
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return { path: [], visitedCount };
    }

    async function bfs() {
        const nodes = createNodeGrid();
        const start = nodes[startNode.row][startNode.col];
        const end = nodes[endNode.row][endNode.col];
        const queue = [start];
        start.isClosed = true;
        let visitedCount = 0;

        const visitedInOrder = [];

        while (queue.length > 0) {
            const currentNode = queue.shift();
            visitedCount++;
            visitedInOrder.push(currentNode);

            if(currentNode !== start && currentNode !== end) {
                grid[currentNode.row][currentNode.col].element.classList.add('closed-node');
            }

            if (currentNode === end) {
                return { path: reconstructPath(end), visitedCount };
            }

            const neighbors = getNeighbors(currentNode.row, currentNode.col);

            for (const neighborCoords of neighbors) {
                const neighbor = nodes[neighborCoords.row][neighborCoords.col];
                if (!neighbor.isWall && !neighbor.isClosed) {
                    neighbor.isClosed = true;
                    neighbor.previous = currentNode;
                    queue.push(neighbor);
                     if(neighbor !== end){
                        grid[neighbor.row][neighbor.col].element.classList.add('open-node');
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return { path: [], visitedCount };
    }

    function createNodeGrid() {
        const nodeGrid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                currentRow.push({
                    row,
                    col,
                    isWall: grid[row][col].isWall,
                    g: Infinity,
                    f: Infinity,
                    h: 0,
                    previous: null,
                    isClosed: false
                });
            }
            nodeGrid.push(currentRow);
        }
        return nodeGrid;
    }

    function manhattanDistance(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    function reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        while (currentNode !== null) {
            path.push(currentNode);
            currentNode = currentNode.previous;
        }
        return path;
    }

    // Heap implementation for A* and Dijkstra
    class Heap {
        constructor(comparator) {
            this.comparator = comparator;
            this.array = [];
        }
        push(val) {
            this.array.push(val);
            this.bubbleUp();
        }
        pop() {
            const max = this.array[0];
            const end = this.array.pop();
            if (this.array.length > 0) {
                this.array[0] = end;
                this.sinkDown(0);
            }
            return max;
        }
        isEmpty() {
            return this.array.length === 0;
        }
        contains(node){
            return this.array.includes(node);
        }
        updateItem(item) {
            const itemIndex = this.array.indexOf(item);
            if (itemIndex !== -1) {
                this.bubbleUp(itemIndex);
            }
        }
        bubbleUp(index = this.array.length - 1) {
            const element = this.array[index];
            while (index > 0) {
                const parentIndex = Math.floor((index - 1) / 2);
                const parent = this.array[parentIndex];
                if (this.comparator(element, parent) >= 0) break;
                this.array[index] = parent;
                this.array[parentIndex] = element;
                index = parentIndex;
            }
        }
        sinkDown(index) {
            const length = this.array.length;
            const element = this.array[index];
            while (true) {
                const leftChildIdx = 2 * index + 1;
                const rightChildIdx = 2 * index + 2;
                let leftChild, rightChild;
                let swap = null;
                if (leftChildIdx < length) {
                    leftChild = this.array[leftChildIdx];
                    if (this.comparator(leftChild, element) < 0) {
                        swap = leftChildIdx;
                    }
                }
                if (rightChildIdx < length) {
                    rightChild = this.array[rightChildIdx];
                    if (
                        (swap === null && this.comparator(rightChild, element) < 0) ||
                        (swap !== null && this.comparator(rightChild, leftChild) < 0)
                    ) {
                        swap = rightChildIdx;
                    }
                }
                if (swap === null) break;
                this.array[index] = this.array[swap];
                this.array[swap] = element;
                index = swap;
            }
        }
    }

    // Event Listeners
    gridContainer.addEventListener('mousedown', handleMouseDown);
    gridContainer.addEventListener('mouseup', handleMouseUp);
    gridContainer.addEventListener('mouseover', handleMouseOver);
    gridContainer.addEventListener('click', handleCellClick);

    startBtn.addEventListener('click', startPathfinding);
    resetBtn.addEventListener('click', resetGrid);
    clearPathBtn.addEventListener('click', clearPath);
    startNodeBtn.addEventListener('click', () => { 
        settingStartNode = true; 
        settingEndNode = false; 
    });
    endNodeBtn.addEventListener('click', () => { 
        settingEndNode = true; 
        settingStartNode = false; 
    });

    createGrid();
});
