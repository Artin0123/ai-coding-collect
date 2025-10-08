class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isWall = false;
        this.isStart = false;
        this.isEnd = false;
        this.isVisited = false;
        this.distance = Infinity;
        this.previousNode = null;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.element = document.createElement('div');
        this.element.classList.add('cell');
        this.element.dataset.row = row;
        this.element.dataset.col = col;
    }

    reset() {
        this.isWall = this.isStart || this.isEnd;
        this.isVisited = false;
        this.distance = Infinity;
        this.previousNode = null;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.updateClass();
    }

    updateClass() {
        this.element.className = 'cell';
        if (this.isStart) this.element.classList.add('start');
        else if (this.isEnd) this.element.classList.add('end');
        else if (this.isWall) this.element.classList.add('wall');
        else if (this.isVisited && !this.element.classList.contains('open') && !this.element.classList.contains('closed')) {
            // For visualization later
        }
    }
}

// Priority queue for Dijkstra and A*
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift();
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

let grid = [];
let startNode = null;
let endNode = null;
let isDrawing = false;
let isSettingStart = false;
let isSettingEnd = false;
let isSearching = false;
let visitedCount = 0;
let pathLength = 0;
let executionTime = 0;
let startTime = 0;

const gridContainer = document.getElementById('grid');
const setStartBtn = document.getElementById('set-start');
const setEndBtn = document.getElementById('set-end');
const clearPathBtn = document.getElementById('clear-path');
const resetBtn = document.getElementById('reset');
const startSearchBtn = document.getElementById('start-search');
const algorithmSelect = document.getElementById('algorithm');
const visitedCountSpan = document.getElementById('visited-count');
const pathLengthSpan = document.getElementById('path-length');
const executionTimeSpan = document.getElementById('execution-time');
const statusSpan = document.getElementById('current-status');

// Initialize grid
function initializeGrid() {
    grid = [];
    for (let row = 0; row < 25; row++) {
        grid[row] = [];
        for (let col = 0; col < 25; col++) {
            const node = new Node(row, col);
            grid[row][col] = node;
            gridContainer.appendChild(node.element);
        }
    }
    // Set default start and end
    startNode = grid[2][2];
    startNode.isStart = true;
    startNode.updateClass();

    endNode = grid[22][22];
    endNode.isEnd = true;
    endNode.updateClass();
}

function clearSearchResults() {
    visitedCount = 0;
    pathLength = 0;
    executionTime = 0;
    updateStats();
    for (let row = 0; row < 25; row++) {
        for (let col = 0; col < 25; col++) {
            const node = grid[row][col];
            node.reset();
            node.element.classList.remove('open', 'closed', 'path');
        }
    }
    if (startNode) startNode.isStart = true;
    if (endNode) endNode.isEnd = true;
    if (startNode) startNode.updateClass();
    if (endNode) endNode.updateClass();
}

function fullReset() {
    clearSearchResults();
    for (let row = 0; row < 25; row++) {
        for (let col = 0; col < 25; col++) {
            const node = grid[row][col];
            node.isWall = false;
            node.isStart = (row === 2 && col === 2);
            node.isEnd = (row === 22 && col === 22);
            node.updateClass();
        }
    }
    startNode = grid[2][2];
    endNode = grid[22][22];
}

// Event listeners
setStartBtn.addEventListener('click', () => {
    if (isSearching) return;
    isSettingStart = true;
    isSettingEnd = false;
    statusSpan.textContent = '當前狀態：選擇起點';
});

setEndBtn.addEventListener('click', () => {
    if (isSearching) return;
    isSettingEnd = true;
    isSettingStart = false;
    statusSpan.textContent = '當前狀態：選擇終點';
});

clearPathBtn.addEventListener('click', clearSearchResults);

resetBtn.addEventListener('click', fullReset);

startSearchBtn.addEventListener('click', () => {
    if (isSearching || !startNode || !endNode) return;
    startSearch();
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && !isSearching && !isSettingStart && !isSettingEnd) {
        isDrawing = true;
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isDrawing = false;
    }
});

document.addEventListener('click', (e) => {
    if (isSearching) return;
    const target = e.target;
    if (target.classList.contains('cell')) {
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const node = grid[row][col];

        if (isSettingStart) {
            if (startNode) startNode.isStart = false;
            startNode = node;
            startNode.isStart = true;
            startNode.isWall = false;
            node.isEnd = false;
            startNode.updateClass();
            if (endNode) endNode.updateClass();
            isSettingStart = false;
            statusSpan.textContent = '當前狀態：就緒';
            return;
        } else if (isSettingEnd) {
            if (endNode) endNode.isEnd = false;
            endNode = node;
            endNode.isEnd = true;
            endNode.isWall = false;
            node.isStart = false;
            endNode.updateClass();
            if (startNode) startNode.updateClass();
            isSettingEnd = false;
            statusSpan.textContent = '當前狀態：就緒';
            return;
        } else if (!node.isStart && !node.isEnd) {
            node.isWall = !node.isWall;
            node.updateClass();
        }
    } else {
        // Click outside grid cancels setting mode
        if (isSettingStart || isSettingEnd) {
            isSettingStart = false;
            isSettingEnd = false;
            statusSpan.textContent = '當前狀態：就緒';
        }
    }
});

document.addEventListener('mouseover', (e) => {
    if (isSearching) return;
    const target = e.target;
    if (target.classList.contains('cell') && isDrawing) {
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const node = grid[row][col];
        if (!node.isStart && !node.isEnd) {
            node.isWall = true;
            node.updateClass();
        }
    }
});

function updateStats() {
    visitedCountSpan.textContent = `已訪問節點數：${visitedCount} 個`;
    pathLengthSpan.textContent = `路徑長度：${pathLength} 步`;
    executionTimeSpan.textContent = `執行時間：${executionTime} ms`;
}

// Algorithms
function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < 24) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < 24) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(neighbor => !neighbor.isWall);
}

function heuristic(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function aStar() {
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    startNode.distance = 0;
    startNode.g = 0;
    startNode.h = heuristic(startNode, endNode);
    startNode.f = startNode.g + startNode.h;
    openSet.enqueue(startNode, startNode.f);

    visitedCount = 0;

    function animate() {
        if (openSet.isEmpty()) {
            statusSpan.textContent = '當前狀態：無路徑';
            isSearching = false;
            enableButtons();
            return;
        }

        const current = openSet.dequeue();
        if (closedSet.has(current)) {
            setTimeout(animate, 5);
            return;
        }

        closedSet.add(current);
        visitedCount++;

        if (current === endNode) {
            reconstructPath();
            executionTime = Date.now() - startTime;
            updateStats();
            statusSpan.textContent = '當前狀態：找到路徑';
            isSearching = false;
            enableButtons();
            return;
        }

        updateVisualization(current, 'closed');

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (closedSet.has(neighbor)) continue;

            const tentativeG = current.g + 1;
            const betterPath = tentativeG < neighbor.g;

            if (betterPath) {
                neighbor.previousNode = current;
                neighbor.g = tentativeG;
                neighbor.h = heuristic(neighbor, endNode);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.distance = neighbor.g;
                const openIndex = openSet.elements.findIndex(item => item.element === neighbor);
                if (openIndex === -1) {
                    openSet.enqueue(neighbor, neighbor.f);
                    updateVisualization(neighbor, 'open');
                } else if (openSet.elements[openIndex].priority > neighbor.f) {
                    openSet.elements[openIndex].priority = neighbor.f;
                    openSet.elements.sort((a, b) => a.priority - b.priority);
                }
            }
        }

        setTimeout(animate, 5);
    }

    animate();
}

function dijkstra() {
    const unvisitedNodes = new PriorityQueue();
    startNode.distance = 0;
    unvisitedNodes.enqueue(startNode, 0);

    visitedCount = 0;

    function animate() {
        if (unvisitedNodes.isEmpty()) {
            statusSpan.textContent = '當前狀態：無路徑';
            isSearching = false;
            enableButtons();
            return;
        }

        const current = unvisitedNodes.dequeue();
        if (current.isVisited) {
            setTimeout(animate, 5);
            return;
        }

        current.isVisited = true;
        visitedCount++;

        if (current === endNode) {
            reconstructPath();
            executionTime = Date.now() - startTime;
            updateStats();
            statusSpan.textContent = '當前狀態：找到路徑';
            isSearching = false;
            enableButtons();
            return;
        }

        updateVisualization(current, 'closed');

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (neighbor.isVisited) continue;

            const tentativeDistance = current.distance + 1;
            if (tentativeDistance < neighbor.distance) {
                neighbor.distance = tentativeDistance;
                neighbor.previousNode = current;
                unvisitedNodes.enqueue(neighbor, tentativeDistance);
                updateVisualization(neighbor, 'open');
            }
        }

        setTimeout(animate, 5);
    }

    animate();
}

function reconstructPath() {
    pathLength = 0;
    let current = endNode.previousNode;
    while (current) {
        setTimeout(() => {
            current.element.classList.add('path');
        }, pathLength * 5);
        pathLength++;
        current = current.previousNode;
    }
    pathLength--; // Exclude end node in path length
}

function updateVisualization(node, type) {
    if (type === 'open') {
        node.element.classList.add('open');
    } else if (type === 'closed') {
        node.element.classList.remove('open');
        node.element.classList.add('closed');
    }
}

function enableButtons() {
    setStartBtn.disabled = false;
    setEndBtn.disabled = false;
    clearPathBtn.disabled = false;
    resetBtn.disabled = false;
    startSearchBtn.disabled = false;
    algorithmSelect.disabled = false;
}

function disableButtons() {
    setStartBtn.disabled = true;
    setEndBtn.disabled = true;
    clearPathBtn.disabled = true;
    resetBtn.disabled = true;
    startSearchBtn.disabled = true;
    algorithmSelect.disabled = true;
}

function startSearch() {
    disableButtons();
    isSearching = true;
    clearSearchResults();
    startTime = Date.now();
    statusSpan.textContent = '當前狀態：搜尋中';

    if (algorithmSelect.value === 'astar') {
        aStar();
    } else {
        dijkstra();
    }
}

// Initialize
initializeGrid();
