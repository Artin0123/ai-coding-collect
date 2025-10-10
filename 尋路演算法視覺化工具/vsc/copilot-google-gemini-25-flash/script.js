const GRID_SIZE = 15;
const CELL_SIZE = 30; // px
const ANIMATION_SPEED = 10; // ms

const gridContainer = document.getElementById('grid-container');
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const resetGridBtn = document.getElementById('resetGridBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const startSearchBtn = document.getElementById('startSearchBtn');

const visitedNodesSpan = document.getElementById('visitedNodes');
const pathLengthSpan = document.getElementById('pathLength');
const executionTimeSpan = document.getElementById('executionTime');
const statusSpan = document.getElementById('status');

let grid = [];
let startNode = null;
let endNode = null;
let isSettingStart = false;
let isSettingEnd = false;
let isDrawingObstacles = false;
let isAnimating = false;

// Node class for pathfinding
class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.status = 'empty'; // 'empty', 'start', 'end', 'obstacle', 'open', 'closed', 'path'
        this.gCost = Infinity; // Cost from start to this node
        this.hCost = Infinity; // Heuristic cost from this node to end
        this.fCost = Infinity; // Total cost (gCost + hCost)
        this.parent = null; // Parent node in the path
        this.element = document.createElement('div');
        this.element.classList.add('grid-cell');
        this.element.dataset.row = row;
        this.element.dataset.col = col;
    }

    updateStatus(newStatus) {
        this.element.classList.remove(this.status);
        this.status = newStatus;
        this.element.classList.add(newStatus);
    }
}

// Initialize the grid
function initializeGrid() {
    gridContainer.innerHTML = '';
    grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        const row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            const node = new Node(r, c);
            gridContainer.appendChild(node.element);
            row.push(node);
        }
        grid.push(row);
    }

    // Set default start and end nodes
    startNode = grid[2][2];
    endNode = grid[12][12];
    startNode.updateStatus('start');
    endNode.updateStatus('end');

    addGridEventListeners();
    updateStats(0, 0, 0, '就緒');
}

// Add event listeners for grid interaction
function addGridEventListeners() {
    gridContainer.addEventListener('mousedown', (e) => {
        if (isAnimating) return;
        const target = e.target.closest('.grid-cell');
        if (!target) return;

        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const node = grid[row][col];

        if (isSettingStart) {
            if (node.status === 'obstacle') return;
            if (startNode) startNode.updateStatus('empty');
            startNode = node;
            startNode.updateStatus('start');
            isSettingStart = false;
            setStartBtn.classList.remove('active');
        } else if (isSettingEnd) {
            if (node.status === 'obstacle') return;
            if (endNode) endNode.updateStatus('empty');
            endNode = node;
            endNode.updateStatus('end');
            isSettingEnd = false;
            setEndBtn.classList.remove('active');
        } else {
            if (node !== startNode && node !== endNode) {
                isDrawingObstacles = true;
                node.updateStatus(node.status === 'obstacle' ? 'empty' : 'obstacle');
            }
        }
    });

    gridContainer.addEventListener('mouseover', (e) => {
        if (isAnimating || !isDrawingObstacles) return;
        const target = e.target.closest('.grid-cell');
        if (!target) return;

        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const node = grid[row][col];

        if (node !== startNode && node !== endNode) {
            node.updateStatus('obstacle');
        }
    });

    gridContainer.addEventListener('mouseup', () => {
        isDrawingObstacles = false;
    });

    gridContainer.addEventListener('mouseleave', () => {
        isDrawingObstacles = false;
    });
}

// Control button event listeners
setStartBtn.addEventListener('click', () => {
    if (isAnimating) return;
    isSettingStart = !isSettingStart;
    isSettingEnd = false;
    setStartBtn.classList.toggle('active', isSettingStart);
    setEndBtn.classList.remove('active');
});

setEndBtn.addEventListener('click', () => {
    if (isAnimating) return;
    isSettingEnd = !isSettingEnd;
    isSettingStart = false;
    setEndBtn.classList.toggle('active', isSettingEnd);
    setStartBtn.classList.remove('active');
});

clearPathBtn.addEventListener('click', () => {
    if (isAnimating) return;
    clearPath();
});

resetGridBtn.addEventListener('click', () => {
    if (isAnimating) return;
    initializeGrid();
});

startSearchBtn.addEventListener('click', () => {
    if (isAnimating) return;
    startPathfinding();
});

// Clear path and search results
function clearPath() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const node = grid[r][c];
            if (node.status === 'open' || node.status === 'closed' || node.status === 'path') {
                node.updateStatus('empty');
            }
            node.gCost = Infinity;
            node.hCost = Infinity;
            node.fCost = Infinity;
            node.parent = null;
        }
    }
    updateStats(0, 0, 0, '就緒');
}

// Update statistics display
function updateStats(visited, length, time, status) {
    visitedNodesSpan.textContent = visited;
    pathLengthSpan.textContent = length;
    executionTimeSpan.textContent = time;
    statusSpan.textContent = status;
}

// Get neighbors of a node
function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;

    // Up, Down, Left, Right
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);

    return neighbors.filter(neighbor => neighbor.status !== 'obstacle');
}

// Manhattan distance heuristic
function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// Pathfinding algorithms
async function startPathfinding() {
    clearPath();
    isAnimating = true;
    toggleControls(false);
    updateStats(0, 0, 0, '搜尋中');

    const startTime = performance.now();
    const algorithm = algorithmSelect.value;

    let pathFound = false;
    let visitedNodesCount = 0;
    let finalPathLength = 0;

    if (!startNode || !endNode) {
        alert('請設定起點和終點！');
        isAnimating = false;
        toggleControls(true);
        updateStats(0, 0, 0, '就緒');
        return;
    }

    if (startNode.status === 'obstacle' || endNode.status === 'obstacle') {
        alert('起點或終點不能是障礙物！');
        isAnimating = false;
        toggleControls(true);
        updateStats(0, 0, 0, '就緒');
        return;
    }

    // Initialize start node
    startNode.gCost = 0;
    startNode.hCost = manhattanDistance(startNode, endNode);
    startNode.fCost = startNode.gCost + startNode.hCost;

    const openList = [startNode];
    const closedList = [];

    while (openList.length > 0) {
        // Find node with lowest fCost in openList
        openList.sort((a, b) => a.fCost - b.fCost);
        let currentNode = openList.shift();

        if (currentNode === endNode) {
            pathFound = true;
            break;
        }

        closedList.push(currentNode);
        if (currentNode !== startNode) {
            currentNode.updateStatus('closed');
            await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
        }
        visitedNodesCount++;

        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (closedList.includes(neighbor)) continue;

            const tentativeGCost = currentNode.gCost + 1; // Assuming cost of 1 for each step

            if (tentativeGCost < neighbor.gCost) {
                neighbor.parent = currentNode;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = (algorithm === 'astar') ? manhattanDistance(neighbor, endNode) : 0;
                neighbor.fCost = neighbor.gCost + neighbor.hCost;

                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                    if (neighbor !== endNode) {
                        neighbor.updateStatus('open');
                        await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
                    }
                }
            }
        }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    if (pathFound) {
        let temp = endNode;
        let path = [];
        while (temp !== null) {
            path.push(temp);
            temp = temp.parent;
        }
        path.reverse();
        finalPathLength = path.length - 1; // Exclude start node

        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (node !== startNode && node !== endNode) {
                node.updateStatus('path');
                await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
            }
        }
        updateStats(visitedNodesCount, finalPathLength, duration, '找到路徑');
    } else {
        updateStats(visitedNodesCount, 0, duration, '無路徑');
        alert('無法找到路徑');
    }

    isAnimating = false;
    toggleControls(true);
}

// Toggle control buttons disabled state
function toggleControls(enable) {
    setStartBtn.disabled = !enable;
    setEndBtn.disabled = !enable;
    clearPathBtn.disabled = !enable;
    resetGridBtn.disabled = !enable;
    algorithmSelect.disabled = !enable;
    startSearchBtn.disabled = !enable;
}

// Initial setup
initializeGrid();
