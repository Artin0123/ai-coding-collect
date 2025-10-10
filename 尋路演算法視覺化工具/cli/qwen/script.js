// Grid constants
const ROWS = 15;
const COLS = 15;
const START_ROW = 2;
const START_COL = 2;
const END_ROW = 12;
const END_COL = 12;

// Cell types
const CELL_TYPES = {
    EMPTY: 'empty',
    START: 'start',
    END: 'end',
    OBSTACLE: 'obstacle',
    OPEN: 'open',
    CLOSED: 'closed',
    PATH: 'path'
};

// Color mapping
const CELL_COLORS = {
    [CELL_TYPES.EMPTY]: 'cell-default',
    [CELL_TYPES.START]: 'cell-start',
    [CELL_TYPES.END]: 'cell-end',
    [CELL_TYPES.OBSTACLE]: 'cell-obstacle',
    [CELL_TYPES.OPEN]: 'cell-open',
    [CELL_TYPES.CLOSED]: 'cell-closed',
    [CELL_TYPES.PATH]: 'cell-path'
};

// Global variables
let grid = [];
let isDragging = false;
let dragType = null; // 'obstacle' or 'empty'
let isSettingStart = false;
let isSettingEnd = false;
let isPathfinding = false;
let startCell = { row: START_ROW, col: START_COL };
let endCell = { row: END_ROW, col: END_COL };

// DOM elements
const gridContainer = document.getElementById('gridContainer');
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const resetBtn = document.getElementById('resetBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const startBtn = document.getElementById('startBtn');
const visitedNodesSpan = document.getElementById('visitedNodes');
const pathLengthSpan = document.getElementById('pathLength');
const executionTimeSpan = document.getElementById('executionTime');
const statusSpan = document.getElementById('status');

// Initialize the grid
function initializeGrid() {
    grid = [];
    gridContainer.innerHTML = '';
    
    // Create 2D grid array
    for (let row = 0; row < ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < COLS; col++) {
            // Default to empty cells
            grid[row][col] = {
                type: CELL_TYPES.EMPTY,
                row: row,
                col: col
            };
            
            // Create cell element
            const cell = document.createElement('div');
            cell.className = 'grid-cell cell-default';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add event listeners
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseenter', handleMouseEnter);
            cell.addEventListener('mouseup', handleMouseUp);
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Set initial start and end positions
    grid[startCell.row][startCell.col].type = CELL_TYPES.START;
    grid[endCell.row][endCell.col].type = CELL_TYPES.END;
    
    // Update UI to reflect the initial state
    updateGridUI();
}

// Update the UI to match the grid state
function updateGridUI() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cellState = grid[row][col];
            const cellElement = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            
            if (cellElement) {
                // Remove all existing color classes
                Object.values(CELL_COLORS).forEach(colorClass => {
                    cellElement.classList.remove(colorClass);
                });
                
                // Add the appropriate class based on cell type
                cellElement.classList.add(CELL_COLORS[cellState.type]);
            }
        }
    }
}

// Mouse event handlers for grid interaction
function handleMouseDown(e) {
    if (isPathfinding) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const cell = grid[row][col];
    
    // Don't modify start or end cells during obstacle creation
    if (cell.type === CELL_TYPES.START || cell.type === CELL_TYPES.END) {
        // If we're setting start/end points, handle that instead
        if (isSettingStart) {
            if (cell.type !== CELL_TYPES.OBSTACLE) {
                setStartPoint(row, col);
                isSettingStart = false;
                setStartBtn.disabled = false;
            }
        } else if (isSettingEnd) {
            if (cell.type !== CELL_TYPES.OBSTACLE) {
                setEndPoint(row, col);
                isSettingEnd = false;
                setEndBtn.disabled = false;
            }
        }
        return;
    }
    
    isDragging = true;
    
    // Toggle obstacle state if clicking on an empty cell
    if (cell.type === CELL_TYPES.EMPTY) {
        cell.type = CELL_TYPES.OBSTACLE;
        dragType = 'create'; // We're dragging to create obstacles
    } else if (cell.type === CELL_TYPES.OBSTACLE) {
        cell.type = CELL_TYPES.EMPTY;
        dragType = 'remove'; // We're dragging to remove obstacles
    }
    
    updateGridUI();
}

function handleMouseEnter(e) {
    if (!isDragging || isPathfinding) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const cell = grid[row][col];
    
    // Don't modify start or end cells
    if (cell.type === CELL_TYPES.START || cell.type === CELL_TYPES.END) {
        return;
    }
    
    // Only modify if the cell state is different from intended drag type
    if (dragType === 'create' && cell.type === CELL_TYPES.EMPTY) {
        cell.type = CELL_TYPES.OBSTACLE;
        updateGridUI();
    } else if (dragType === 'remove' && cell.type === CELL_TYPES.OBSTACLE) {
        cell.type = CELL_TYPES.EMPTY;
        updateGridUI();
    }
}

function handleMouseUp() {
    isDragging = false;
}

// Calculate Manhattan distance heuristic
function manhattanDistance(pos1, pos2) {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

// Reconstruct path by following cameFrom pointers
async function reconstructPath(endCameFrom) {
    pathLength = 0;
    let current = endCameFrom;
    const path = [];
    
    // Follow the path backwards
    while (current) {
        path.unshift({ row: current.row, col: current.col });
        current = current.prev;
    }
    
    // Visualize the path
    for (const pos of path) {
        // Skip start and end points
        if (!(pos.row === startCell.row && pos.col === startCell.col) && 
            !(pos.row === endCell.row && pos.col === endCell.col)) {
            grid[pos.row][pos.col].type = CELL_TYPES.PATH;
            const cellElement = document.querySelector(`.grid-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cellElement) {
                cellElement.classList.remove(CELL_COLORS[CELL_TYPES.OPEN], CELL_COLORS[CELL_TYPES.CLOSED]);
                cellElement.classList.add(CELL_COLORS[CELL_TYPES.PATH]);
            }
            pathLength++;
        }
        
        // Add a small delay for animation effect
        await new Promise(resolve => setTimeout(resolve, 5));
    }
}

let pathLength = 0;  // Track the length of the path

// A* Algorithm Implementation
async function aStarAlgorithm() {
    // Reset stats
    let visitedNodes = 0;
    const startTime = performance.now();
    
    // Create open set (priority queue) - using an array sorted by fScore
    const openSet = [];
    
    // Initialize data structures
    const gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    const fScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    
    // Initialize start position
    const startPos = startCell;
    const endPos = endCell;
    
    gScore[startPos.row][startPos.col] = 0;
    fScore[startPos.row][startPos.col] = manhattanDistance(startPos, endPos);
    openSet.push({ ...startPos, fScore: fScore[startPos.row][startPos.col] });
    
    // Keep track of visited nodes
    const closedSet = new Set();
    
    while (openSet.length > 0) {
        // Sort by fScore to get the node with lowest fScore
        openSet.sort((a, b) => a.fScore - b.fScore);
        const current = openSet.shift();
        
        // If we reached the end, reconstruct path
        if (current.row === endPos.row && current.col === endPos.col) {
            await reconstructPath(current.cameFrom);
            const endTime = performance.now();
            executionTimeSpan.textContent = (endTime - startTime).toFixed(2);
            statusSpan.textContent = '找到路徑';
            updateStats(visitedNodes, pathLength);
            return true;
        }
        
        // Mark as closed
        closedSet.add(`${current.row},${current.col}`);
        
        // Temporarily mark as closed in UI
        if (grid[current.row][current.col].type !== CELL_TYPES.START && 
            grid[current.row][current.col].type !== CELL_TYPES.END) {
            grid[current.row][current.col].type = CELL_TYPES.CLOSED;
            const cellElement = document.querySelector(`.grid-cell[data-row="${current.row}"][data-col="${current.col}"]`);
            if (cellElement) {
                cellElement.classList.remove(CELL_COLORS[CELL_TYPES.EMPTY]);
                cellElement.classList.remove(CELL_COLORS[CELL_TYPES.OPEN]);
                cellElement.classList.add(CELL_COLORS[CELL_TYPES.CLOSED]);
            }
        }
        
        visitedNodes++;
        
        // Delay for visualization
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Check all neighbors
        const directions = [
            { row: -1, col: 0 },  // Up
            { row: 1, col: 0 },   // Down
            { row: 0, col: -1 },  // Left
            { row: 0, col: 1 }    // Right
        ];
        
        for (const dir of directions) {
            const neighborRow = current.row + dir.row;
            const neighborCol = current.col + dir.col;
            
            // Check if neighbor is within grid bounds
            if (neighborRow < 0 || neighborRow >= ROWS || neighborCol < 0 || neighborCol >= COLS) {
                continue;
            }
            
            // Skip if it's an obstacle
            if (grid[neighborRow][neighborCol].type === CELL_TYPES.OBSTACLE) {
                continue;
            }
            
            // Skip if already in closed set
            if (closedSet.has(`${neighborRow},${neighborCol}`)) {
                continue;
            }
            
            // Calculate tentative gScore
            const tentativeGScore = gScore[current.row][current.col] + 1;
            
            // If this path to neighbor is better than any previous one
            if (tentativeGScore < gScore[neighborRow][neighborCol]) {
                // Record this path as best so far
                grid[neighborRow][neighborCol].cameFrom = { row: current.row, col: current.col, prev: current.cameFrom || null };
                gScore[neighborRow][neighborCol] = tentativeGScore;
                fScore[neighborRow][neighborCol] = gScore[neighborRow][neighborCol] + manhattanDistance({ row: neighborRow, col: neighborCol }, endPos);
                
                // Add to open set if not already there
                const neighborInOpenSet = openSet.some(node => node.row === neighborRow && node.col === neighborCol);
                if (!neighborInOpenSet) {
                    openSet.push({ 
                        row: neighborRow, 
                        col: neighborCol, 
                        fScore: fScore[neighborRow][neighborCol],
                        cameFrom: grid[neighborRow][neighborCol].cameFrom
                    });
                    
                    // Mark as open in UI if not start or end
                    if (grid[neighborRow][neighborCol].type !== CELL_TYPES.START && 
                        grid[neighborRow][neighborCol].type !== CELL_TYPES.END) {
                        grid[neighborRow][neighborCol].type = CELL_TYPES.OPEN;
                        const cellElement = document.querySelector(`.grid-cell[data-row="${neighborRow}"][data-col="${neighborCol}"]`);
                        if (cellElement) {
                            cellElement.classList.remove(CELL_COLORS[CELL_TYPES.EMPTY]);
                            cellElement.classList.add(CELL_COLORS[CELL_TYPES.OPEN]);
                        }
                    }
                }
            }
        }
    }
    
    // If we get here, there's no path
    const endTime = performance.now();
    executionTimeSpan.textContent = (endTime - startTime).toFixed(2);
    statusSpan.textContent = '無法找到路徑';
    updateStats(visitedNodes, 0);
    return false;
}

// Dijkstra Algorithm Implementation
async function dijkstraAlgorithm() {
    // Reset stats
    let visitedNodes = 0;
    const startTime = performance.now();
    
    // Create priority queue (using an array sorted by distance)
    const pq = [];
    
    // Initialize data structures
    const distances = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    
    // Initialize start position
    const startPos = startCell;
    const endPos = endCell;
    
    distances[startPos.row][startPos.col] = 0;
    pq.push({ ...startPos, distance: 0 });
    
    // Keep track of visited nodes
    const visited = new Set();
    
    while (pq.length > 0) {
        // Sort by distance to get the node with lowest distance
        pq.sort((a, b) => a.distance - b.distance);
        const current = pq.shift();
        
        // If we reached the end, reconstruct path
        if (current.row === endPos.row && current.col === endPos.col) {
            await reconstructPath(current.cameFrom);
            const endTime = performance.now();
            executionTimeSpan.textContent = (endTime - startTime).toFixed(2);
            statusSpan.textContent = '找到路徑';
            updateStats(visitedNodes, pathLength);
            return true;
        }
        
        // Mark as visited
        visited.add(`${current.row},${current.col}`);
        
        // Temporarily mark as closed in UI
        if (grid[current.row][current.col].type !== CELL_TYPES.START && 
            grid[current.row][current.col].type !== CELL_TYPES.END) {
            grid[current.row][current.col].type = CELL_TYPES.CLOSED;
            const cellElement = document.querySelector(`.grid-cell[data-row="${current.row}"][data-col="${current.col}"]`);
            if (cellElement) {
                cellElement.classList.remove(CELL_COLORS[CELL_TYPES.EMPTY]);
                cellElement.classList.remove(CELL_COLORS[CELL_TYPES.OPEN]);
                cellElement.classList.add(CELL_COLORS[CELL_TYPES.CLOSED]);
            }
        }
        
        visitedNodes++;
        
        // Delay for visualization
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Check all neighbors
        const directions = [
            { row: -1, col: 0 },  // Up
            { row: 1, col: 0 },   // Down
            { row: 0, col: -1 },  // Left
            { row: 0, col: 1 }    // Right
        ];
        
        for (const dir of directions) {
            const neighborRow = current.row + dir.row;
            const neighborCol = current.col + dir.col;
            
            // Check if neighbor is within grid bounds
            if (neighborRow < 0 || neighborRow >= ROWS || neighborCol < 0 || neighborCol >= COLS) {
                continue;
            }
            
            // Skip if it's an obstacle
            if (grid[neighborRow][neighborCol].type === CELL_TYPES.OBSTACLE) {
                continue;
            }
            
            // Skip if already visited
            if (visited.has(`${neighborRow},${neighborCol}`)) {
                continue;
            }
            
            // Calculate new distance
            const newDistance = distances[current.row][current.col] + 1;
            
            // If this path to neighbor is better than any previous one
            if (newDistance < distances[neighborRow][neighborCol]) {
                // Record this path as best so far
                distances[neighborRow][neighborCol] = newDistance;
                grid[neighborRow][neighborCol].cameFrom = { row: current.row, col: current.col, prev: current.cameFrom || null };
                
                // Add to priority queue if not already there
                const neighborInPQ = pq.some(node => node.row === neighborRow && node.col === neighborCol);
                if (!neighborInPQ) {
                    pq.push({ 
                        row: neighborRow, 
                        col: neighborCol,
                        distance: newDistance,
                        cameFrom: grid[neighborRow][neighborCol].cameFrom
                    });
                    
                    // Mark as open in UI if not start or end
                    if (grid[neighborRow][neighborCol].type !== CELL_TYPES.START && 
                        grid[neighborRow][neighborCol].type !== CELL_TYPES.END) {
                        grid[neighborRow][neighborCol].type = CELL_TYPES.OPEN;
                        const cellElement = document.querySelector(`.grid-cell[data-row="${neighborRow}"][data-col="${neighborCol}"]`);
                        if (cellElement) {
                            cellElement.classList.remove(CELL_COLORS[CELL_TYPES.EMPTY]);
                            cellElement.classList.add(CELL_COLORS[CELL_TYPES.OPEN]);
                        }
                    }
                }
            }
        }
    }
    
    // If we get here, there's no path
    const endTime = performance.now();
    executionTimeSpan.textContent = (endTime - startTime).toFixed(2);
    statusSpan.textContent = '無法找到路徑';
    updateStats(visitedNodes, 0);
    return false;
}

// Prevent default drag behavior to avoid text selection
document.addEventListener('selectstart', (e) => {
    if (e.target.classList.contains('grid-cell')) {
        e.preventDefault();
    }
});

// Set start point
function setStartPoint(row, col) {
    if (grid[row][col].type === CELL_TYPES.OBSTACLE) return;
    
    // Reset previous start position
    grid[startCell.row][startCell.col].type = CELL_TYPES.EMPTY;
    
    // Set new start position
    startCell = { row, col };
    grid[row][col].type = CELL_TYPES.START;
    
    updateGridUI();
}

// Set end point
function setEndPoint(row, col) {
    if (grid[row][col].type === CELL_TYPES.OBSTACLE) return;
    
    // Reset previous end position
    grid[endCell.row][endCell.col].type = CELL_TYPES.EMPTY;
    
    // Set new end position
    endCell = { row, col };
    grid[row][col].type = CELL_TYPES.END;
    
    updateGridUI();
}

// Update statistics display
function updateStats(visitedNodes, pathLength) {
    visitedNodesSpan.textContent = visitedNodes;
    pathLengthSpan.textContent = pathLength;
}

// Clear the path visualization (keep obstacles, start and end points)
function clearPath() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = grid[row][col];
            if (cell.type === CELL_TYPES.OPEN || cell.type === CELL_TYPES.CLOSED || cell.type === CELL_TYPES.PATH) {
                // Reset to empty unless it's start or end
                if (cell.type !== CELL_TYPES.START && cell.type !== CELL_TYPES.END) {
                    cell.type = CELL_TYPES.EMPTY;
                }
            }
        }
    }
    updateGridUI();
    updateStats(0, 0); // Reset stats when clearing path
    statusSpan.textContent = '就緒';
}

// Reset the entire grid to initial state
function resetGrid() {
    // Clear path first
    clearPath();
    
    // Reset grid to initial state
    initializeGrid();
    
    // Reset stats
    updateStats(0, 0);
    statusSpan.textContent = '就緒';
}

// Execute the selected pathfinding algorithm
async function executePathfinding() {
    if (isPathfinding) return;
    
    // Disable buttons during pathfinding
    isPathfinding = true;
    setStartBtn.disabled = true;
    setEndBtn.disabled = true;
    clearPathBtn.disabled = true;
    resetBtn.disabled = true;
    algorithmSelect.disabled = true;
    startBtn.disabled = true;
    
    // Update status
    statusSpan.textContent = '搜尋中...';
    updateStats(0, 0); // Reset stats before starting
    
    // Clear previous path visualization
    clearPath();
    
    // Get selected algorithm
    const algorithm = algorithmSelect.value;
    
    // Execute the selected algorithm
    if (algorithm === 'astar') {
        await aStarAlgorithm();
    } else if (algorithm === 'dijkstra') {
        await dijkstraAlgorithm();
    }
    
    // Re-enable buttons after completion
    isPathfinding = false;
    setStartBtn.disabled = false;
    setEndBtn.disabled = false;
    clearPathBtn.disabled = false;
    resetBtn.disabled = false;
    algorithmSelect.disabled = false;
    startBtn.disabled = false;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    
    // Set start point button
    setStartBtn.addEventListener('click', () => {
        if (isPathfinding) return;
        isSettingStart = true;
        setStartBtn.disabled = true;
        statusSpan.textContent = '點擊網格設定起點';
    });
    
    // Set end point button
    setEndBtn.addEventListener('click', () => {
        if (isPathfinding) return;
        isSettingEnd = true;
        setEndBtn.disabled = true;
        statusSpan.textContent = '點擊網格設定終點';
    });
    
    // Clear path button
    clearPathBtn.addEventListener('click', () => {
        if (isPathfinding) return;
        clearPath();
    });
    
    // Reset button
    resetBtn.addEventListener('click', () => {
        if (isPathfinding) return;
        resetGrid();
    });
    
    // Start pathfinding button
    startBtn.addEventListener('click', executePathfinding);
    
    // Add click event for setting start/end points
    gridContainer.addEventListener('click', (e) => {
        if (isPathfinding) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        if (isSettingStart) {
            if (grid[row][col].type !== CELL_TYPES.OBSTACLE) {
                setStartPoint(row, col);
                isSettingStart = false;
                setStartBtn.disabled = false;
                statusSpan.textContent = '就緒';
            }
        } else if (isSettingEnd) {
            if (grid[row][col].type !== CELL_TYPES.OBSTACLE) {
                setEndPoint(row, col);
                isSettingEnd = false;
                setEndBtn.disabled = false;
                statusSpan.textContent = '就緒';
            }
        }
    });
    
    // Prevent setting start/end while dragging
    gridContainer.addEventListener('mousedown', (e) => {
        if (isSettingStart || isSettingEnd) {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            const cell = grid[row][col];
            
            if (cell.type !== CELL_TYPES.OBSTACLE) {
                if (isSettingStart) {
                    setStartPoint(row, col);
                } else if (isSettingEnd) {
                    setEndPoint(row, col);
                }
                
                isSettingStart = false;
                isSettingEnd = false;
                setStartBtn.disabled = false;
                setEndBtn.disabled = false;
                statusSpan.textContent = '就緒';
            }
        }
    });
});