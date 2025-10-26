/* Pathfinding Visualizer Script
   Implements 15x15 grid with drag-to-create obstacles,
   start/end positioning, A* and Dijkstra algorithms,
   step-by-step animation, and UI controls.
*/

document.addEventListener('DOMContentLoaded', () => {
    const ROWS = 15;
    const COLS = 15;
    const gridElement = document.getElementById('grid');
    const setStartBtn = document.getElementById('setStartBtn');
    const setEndBtn = document.getElementById('setEndBtn');
    const clearPathBtn = document.getElementById('clearPathBtn');
    const resetBtn = document.getElementById('resetBtn');
    const startBtn = document.getElementById('startBtn');
    const algorithmSelect = document.getElementById('algorithmSelect');

    const visitedCountEl = document.getElementById('visitedCount');
    const pathLengthEl = document.getElementById('pathLength');
    const execTimeEl = document.getElementById('execTime');
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('message');

    let startPos = { row: 2, col: 2 }; // default start (2,2)
    let endPos = { row: 12, col: 12 }; // default end (12,12)
    let mode = null; // null | 'setStart' | 'setEnd'
    let isMouseDown = false;
    let isRunning = false; // algorithm execution flag

    // ---------- Grid Generation ----------
    function createGrid() {
        const fragment = document.createDocumentFragment();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.id = `cell-${r}-${c}`;
                cell.dataset.row = r;
                cell.dataset.col = c;
                fragment.appendChild(cell);
            }
        }
        gridElement.appendChild(fragment);
        // set default start/end
        setCellState(startPos.row, startPos.col, 'start');
        setCellState(endPos.row, endPos.col, 'end');
    }

    // ---------- Cell State Helpers ----------
    function setCellState(row, col, state) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (!cell) return;
        cell.classList.add(state);
    }

    function clearCellState(row, col, state) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (!cell) return;
        cell.classList.remove(state);
    }

    function toggleObstacle(cell) {
        if (cell.classList.contains('start') || cell.classList.contains('end')) return;
        if (cell.classList.contains('obstacle')) {
            cell.classList.remove('obstacle');
        } else {
            cell.classList.add('obstacle');
        }
    }

    // Add obstacle (used during dragging)
    function addObstacle(cell) {
        if (cell.classList.contains('start') || cell.classList.contains('end')) return;
        if (!cell.classList.contains('obstacle')) {
            cell.classList.add('obstacle');
        }
    }

    // ---------- Event Listeners ----------
    // Mouse down handling (drag & click)
    gridElement.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // only left button
        if (isRunning) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;

        if (mode === 'setStart') {
            // Set new start
            if (cell.classList.contains('obstacle')) return; // cannot place on obstacle
            clearCellState(startPos.row, startPos.col, 'start');
            startPos = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
            cell.classList.add('start');
            mode = null;
            return;
        }

        if (mode === 'setEnd') {
            // Set new end
            if (cell.classList.contains('obstacle')) return;
            clearCellState(endPos.row, endPos.col, 'end');
            endPos = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
            cell.classList.add('end');
            mode = null;
            return;
        }

        // Normal obstacle toggle / drag
        isMouseDown = true;
        toggleObstacle(cell);
    });

    // Drag over cells while mouse is down
    gridElement.addEventListener('mouseover', (e) => {
        if (!isMouseDown) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        addObstacle(cell);
    });

    // Release mouse
    document.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    // Set start mode
    setStartBtn.addEventListener('click', () => {
        if (isRunning) return;
        mode = 'setStart';
    });

    // Set end mode
    setEndBtn.addEventListener('click', () => {
        if (isRunning) return;
        mode = 'setEnd';
    });

    // Clear path (open, closed, path)
    function clearPath() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell) => {
            cell.classList.remove('open', 'closed', 'path');
        });
        visitedCountEl.textContent = '0';
        pathLengthEl.textContent = '0';
        execTimeEl.textContent = '0';
        statusEl.textContent = '就緒';
        messageEl.textContent = '';
    }

    clearPathBtn.addEventListener('click', () => {
        if (isRunning) return;
        clearPath();
    });

    // Reset entire grid
    function resetGrid() {
        if (isRunning) return;
        // Clear everything
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell) => {
            cell.className = 'cell';
        });
        // Reset start/end positions
        startPos = { row: 2, col: 2 };
        endPos = { row: 12, col: 12 };
        setCellState(startPos.row, startPos.col, 'start');
        setCellState(endPos.row, endPos.col, 'end');
        // Reset UI
        clearPath();
        algorithmSelect.value = 'astar';
    }

    resetBtn.addEventListener('click', resetGrid);

    // ---------- Algorithm Implementation ----------
    function manhattan(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    function getNeighbors(node) {
        const dirs = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 },
        ];
        const result = [];
        for (const d of dirs) {
            const nr = node.row + d.row;
            const nc = node.col + d.col;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                result.push({ row: nr, col: nc });
            }
        }
        return result;
    }

    function cellKey(node) {
        return `${node.row},${node.col}`;
    }

    function enableControls() {
        const controls = [setStartBtn, setEndBtn, clearPathBtn, resetBtn, startBtn, algorithmSelect];
        controls.forEach((c) => (c.disabled = false));
        isRunning = false;
    }

    function disableControls() {
        const controls = [setStartBtn, setEndBtn, clearPathBtn, resetBtn, startBtn, algorithmSelect];
        controls.forEach((c) => (c.disabled = true));
        isRunning = true;
    }

    async function runAlgorithm(isAStar) {
        const openSet = []; // array of {key, f}
        const closedSet = new Set(); // keys
        const gScore = {}; // key -> g
        const fScore = {}; // key -> f
        const cameFrom = {}; // key -> parent key

        const startKey = cellKey(startPos);
        const endKey = cellKey(endPos);

        gScore[startKey] = 0;
        fScore[startKey] = isAStar ? manhattan(startPos, endPos) : 0;
        openSet.push({ key: startKey, f: fScore[startKey] });

        let visitedCount = 0;
        const startTime = performance.now();

        while (openSet.length > 0) {
            // Sort openSet by f value (ascending)
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift(); // node with lowest f
            const [curRow, curCol] = current.key.split(',').map(Number);
            const curCell = document.getElementById(`cell-${curRow}-${curCol}`);

            // Mark as closed (unless start/end)
            if (!curCell.classList.contains('start') && !curCell.classList.contains('end')) {
                curCell.classList.remove('open');
                curCell.classList.add('closed');
            }
            closedSet.add(current.key);
            visitedCount++;
            visitedCountEl.textContent = visitedCount;

            // Check if reached goal
            if (current.key === endKey) {
                // Reconstruct path
                let pathKey = current.key;
                let pathLen = 0;
                while (pathKey !== startKey) {
                    const [r, c] = pathKey.split(',').map(Number);
                    const cell = document.getElementById(`cell-${r}-${c}`);
                    if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
                        cell.classList.add('path');
                    }
                    pathKey = cameFrom[pathKey];
                    pathLen++;
                }
                pathLengthEl.textContent = pathLen;
                const endTime = performance.now();
                execTimeEl.textContent = Math.round(endTime - startTime);
                statusEl.textContent = '找到路徑';
                enableControls();
                return;
            }

            // Explore neighbors
            const neighbors = getNeighbors({ row: curRow, col: curCol });
            for (const nb of neighbors) {
                const nbKey = cellKey(nb);
                const nbCell = document.getElementById(`cell-${nb.row}-${nb.col}`);

                // Skip obstacles or already closed
                if (nbCell.classList.contains('obstacle') || closedSet.has(nbKey)) continue;

                const tentativeG = gScore[current.key] + 1; // uniform cost

                const nbG = gScore[nbKey];
                if (nbG === undefined || tentativeG < nbG) {
                    // Better path found
                    cameFrom[nbKey] = current.key;
                    gScore[nbKey] = tentativeG;
                    const h = isAStar ? manhattan(nb, endPos) : 0;
                    fScore[nbKey] = tentativeG + h;

                    // Add to openSet if not already there
                    const existing = openSet.find((item) => item.key === nbKey);
                    if (!existing) {
                        openSet.push({ key: nbKey, f: fScore[nbKey] });
                        // Mark as open (unless start/end)
                        if (!nbCell.classList.contains('start') && !nbCell.classList.contains('end')) {
                            nbCell.classList.add('open');
                        }
                    } else {
                        // Update f score
                        existing.f = fScore[nbKey];
                    }
                }
            }

            // Animation delay
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // No path found
        const endTime = performance.now();
        execTimeEl.textContent = Math.round(endTime - startTime);
        statusEl.textContent = '無路徑';
        messageEl.textContent = '無法找到路徑';
        enableControls();
    }

    // ---------- Start Search ----------
    startBtn.addEventListener('click', () => {
        if (isRunning) return;
        // Prepare UI
        clearPath(); // keep obstacles, start, end
        statusEl.textContent = '搜尋中';
        messageEl.textContent = '';
        disableControls();
        const useAStar = algorithmSelect.value === 'astar';
        runAlgorithm(useAStar);
    });

    // Initialize grid on load
    createGrid();
});
