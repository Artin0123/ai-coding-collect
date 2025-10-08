const GRID_SIZE = 25;
const CELL_SIZE = 20; // px
const ANIMATION_SPEED = 5; // ms

const gridContainer = document.getElementById('grid-container');
const setStartNodeBtn = document.getElementById('setStartNodeBtn');
const setEndNodeBtn = document.getElementById('setEndNodeBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const resetGridBtn = document.getElementById('resetGridBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const startSearchBtn = document.getElementById('startSearchBtn');

const visitedNodesSpan = document.getElementById('visitedNodes');
const pathLengthSpan = document.getElementById('pathLength');
const executionTimeSpan = document.getElementById('executionTime');
const currentStateSpan = document.getElementById('currentState');

let grid = [];
let startNode = { row: 2, col: 2 };
let endNode = { row: 22, col: 22 };
let isSettingStart = false;
let isSettingEnd = false;
let isDrawingObstacles = false;
let isAnimating = false;

// Node class for pathfinding algorithms
class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isStart = false;
        this.isEnd = false;
        this.isObstacle = false;
        this.distance = Infinity; // For Dijkstra
        this.f = Infinity; // For A*
        this.g = Infinity; // For A*
        this.h = 0; // For A* (heuristic)
        this.parent = null;
        this.element = null; // Reference to the DOM element
    }
}

// Initialize grid
function initializeGrid() {
    gridContainer.innerHTML = '';
    grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        const row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            const node = new Node(r, c);
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;

            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseup', handleMouseUp);
            cell.addEventListener('mouseenter', handleMouseEnter);

            node.element = cell;
            row.push(node);
            gridContainer.appendChild(cell);
        }
        grid.push(row);
    }

    // Set default start and end nodes
    setStartEndNodes(startNode.row, startNode.col, 'start');
    setStartEndNodes(endNode.row, endNode.col, 'end');
    updateState('就緒');
}

function setStartEndNodes(row, col, type) {
    if (type === 'start') {
        if (grid[startNode.row][startNode.col]) {
            grid[startNode.row][startNode.col].isStart = false;
            grid[startNode.row][startNode.col].element.classList.remove('start');
        }
        startNode = { row, col };
        grid[row][col].isStart = true;
        grid[row][col].isObstacle = false; // Ensure start/end are not obstacles
        grid[row][col].element.classList.add('start');
        grid[row][col].element.classList.remove('obstacle');
    } else if (type === 'end') {
        if (grid[endNode.row][endNode.col]) {
            grid[endNode.row][endNode.col].isEnd = false;
            grid[endNode.row][endNode.col].element.classList.remove('end');
        }
        endNode = { row, col };
        grid[row][col].isEnd = true;
        grid[row][col].isObstacle = false; // Ensure start/end are not obstacles
        grid[row][col].element.classList.add('end');
        grid[row][col].element.classList.remove('obstacle');
    }
}

function handleMouseDown(e) {
    if (isAnimating) return;
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const node = grid[row][col];

    if (isSettingStart) {
        if (!node.isEnd) {
            setStartEndNodes(row, col, 'start');
            isSettingStart = false;
            setStartNodeBtn.classList.remove('active');
        }
    } else if (isSettingEnd) {
        if (!node.isStart) {
            setStartEndNodes(row, col, 'end');
            isSettingEnd = false;
            setEndNodeBtn.classList.remove('active');
        }
    } else {
        if (!node.isStart && !node.isEnd) {
            node.isObstacle = !node.isObstacle;
            node.element.classList.toggle('obstacle', node.isObstacle);
            isDrawingObstacles = true;
        }
    }
}

function handleMouseUp() {
    if (isAnimating) return;
    isDrawingObstacles = false;
}

function handleMouseEnter(e) {
    if (isAnimating) return;
    if (isDrawingObstacles) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const node = grid[row][col];
        if (!node.isStart && !node.isEnd) {
            node.isObstacle = true;
            node.element.classList.add('obstacle');
        }
    }
}

function updateState(state) {
    currentStateSpan.textContent = state;
}

function resetStats() {
    visitedNodesSpan.textContent = '0';
    pathLengthSpan.textContent = '0';
    executionTimeSpan.textContent = '0';
}

function disableControls(disabled) {
    setStartNodeBtn.disabled = disabled;
    setEndNodeBtn.disabled = disabled;
    clearPathBtn.disabled = disabled;
    resetGridBtn.disabled = disabled;
    algorithmSelect.disabled = disabled;
    startSearchBtn.disabled = disabled;
}

// Event Listeners for control buttons
setStartNodeBtn.addEventListener('click', () => {
    if (isAnimating) return;
    isSettingStart = true;
    isSettingEnd = false;
    setStartNodeBtn.classList.add('active');
    setEndNodeBtn.classList.remove('active');
    updateState('設定起點中...');
});

setEndNodeBtn.addEventListener('click', () => {
    if (isAnimating) return;
    isSettingEnd = true;
    isSettingStart = false;
    setEndNodeBtn.classList.add('active');
    setStartNodeBtn.classList.remove('active');
    updateState('設定終點中...');
});

clearPathBtn.addEventListener('click', () => {
    if (isAnimating) return;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const node = grid[r][c];
            node.element.classList.remove('open', 'closed', 'path');
            node.distance = Infinity;
            node.f = Infinity;
            node.g = Infinity;
            node.h = 0;
            node.parent = null;
        }
    }
    resetStats();
    updateState('就緒');
});

resetGridBtn.addEventListener('click', () => {
    if (isAnimating) return;
    startNode = { row: 2, col: 2 };
    endNode = { row: 22, col: 22 };
    initializeGrid();
    resetStats();
    updateState('就緒');
});

startSearchBtn.addEventListener('click', () => {
    if (isAnimating) return;
    clearPathBtn.click(); // Clear previous path before starting new search
    const selectedAlgorithm = algorithmSelect.value;
    updateState('搜尋中...');
    disableControls(true);
    isAnimating = true;
    if (selectedAlgorithm === 'astar') {
        astar();
    } else if (selectedAlgorithm === 'dijkstra') {
        dijkstra();
    }
});

// Helper function to get neighbors
function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;

    // Up, Down, Left, Right
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < GRID_SIZE - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < GRID_SIZE - 1) neighbors.push(grid[row][col + 1]);

    return neighbors.filter(neighbor => !neighbor.isObstacle);
}

// Manhattan distance heuristic for A*
function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// A* Algorithm
async function astar() {
    const openSet = [];
    const start = grid[startNode.row][startNode.col];
    const end = grid[endNode.row][endNode.col];

    start.g = 0;
    start.h = manhattanDistance(start, end);
    start.f = start.g + start.h;
    openSet.push(start);

    const visitedNodesInOrder = [];

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f); // Sort by f-score
        const currentNode = openSet.shift();

        if (currentNode.isObstacle) continue;

        if (currentNode === end) {
            await animatePath(visitedNodesInOrder, end);
            return;
        }

        if (!currentNode.isStart && !currentNode.isEnd) {
            currentNode.element.classList.add('closed');
            visitedNodesInOrder.push(currentNode);
            await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
        }

        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            const tentative_g = currentNode.g + 1; // Assuming cost of 1 to move to neighbor

            if (tentative_g < neighbor.g) {
                neighbor.parent = currentNode;
                neighbor.g = tentative_g;
                neighbor.h = manhattanDistance(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;

                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    if (!neighbor.isStart && !neighbor.isEnd) {
                        neighbor.element.classList.add('open');
                        await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
                    }
                }
            }
        }
    }
    updateState('無法找到路徑');
    disableControls(false);
    isAnimating = false;
}

// Dijkstra Algorithm
async function dijkstra() {
    const unvisitedNodes = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            unvisitedNodes.push(grid[r][c]);
        }
    }

    const start = grid[startNode.row][startNode.col];
    const end = grid[endNode.row][endNode.col];
    start.distance = 0;

    const visitedNodesInOrder = [];

    while (unvisitedNodes.length > 0) {
        unvisitedNodes.sort((a, b) => a.distance - b.distance);
        const currentNode = unvisitedNodes.shift();

        if (currentNode.isObstacle || currentNode.distance === Infinity) continue;

        if (currentNode === end) {
            await animatePath(visitedNodesInOrder, end);
            return;
        }

        if (!currentNode.isStart && !currentNode.isEnd) {
            currentNode.element.classList.add('closed');
            visitedNodesInOrder.push(currentNode);
            await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
        }

        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            const newDistance = currentNode.distance + 1; // Assuming cost of 1
            if (newDistance < neighbor.distance) {
                neighbor.distance = newDistance;
                neighbor.parent = currentNode;
                if (!neighbor.isStart && !neighbor.isEnd) {
                    neighbor.element.classList.add('open');
                    await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
                }
            }
        }
    }
    updateState('無法找到路徑');
    disableControls(false);
    isAnimating = false;
}

// Animate the path
async function animatePath(visitedNodesInOrder, endNode) {
    visitedNodesSpan.textContent = visitedNodesInOrder.length;
    let path = [];
    let currentNode = endNode;
    while (currentNode !== null) {
        path.unshift(currentNode);
        currentNode = currentNode.parent;
    }

    pathLengthSpan.textContent = path.length > 0 ? path.length - 1 : 0; // Exclude start node from length

    const startTime = performance.now();

    for (const node of visitedNodesInOrder) {
        if (!node.isStart && !node.isEnd) {
            node.element.classList.remove('open', 'closed');
            node.element.classList.add('closed'); // Ensure it stays closed until path animation
        }
    }

    for (let i = 0; i < path.length; i++) {
        const node = path[i];
        if (!node.isStart && !node.isEnd) {
            node.element.classList.remove('open', 'closed');
            node.element.classList.add('path');
            await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEED));
        }
    }

    const endTime = performance.now();
    executionTimeSpan.textContent = (endTime - startTime).toFixed(2);
    updateState('找到路徑');
    disableControls(false);
    isAnimating = false;
}

// Initial setup
initializeGrid();