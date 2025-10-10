document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const setStartBtn = document.getElementById('setStartBtn');
    const setEndBtn = document.getElementById('setEndBtn');
    const clearPathBtn = document.getElementById('clearPathBtn');
    const resetBtn = document.getElementById('resetBtn');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const startBtn = document.getElementById('startBtn');
    const visitedNodesSpan = document.getElementById('visitedNodes');
    const pathLengthSpan = document.getElementById('pathLength');
    const executionTimeSpan = document.getElementById('executionTime');
    const currentStatusSpan = document.getElementById('currentStatus');

    const ROWS = 15;
    const COLS = 15;
    let gridMatrix = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    let startPos = { row: 2, col: 2 };
    let endPos = { row: 12, col: 12 };
    let isSettingStart = false;
    let isSettingEnd = false;
    let isDragging = false;
    let currentAlgorithm = 'astar';
    let isAnimating = false;

    // 初始化網格
    function initGrid() {
        grid.innerHTML = '';
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('mousedown', handleMouseDown);
                cell.addEventListener('mouseenter', handleMouseEnter);
                cell.addEventListener('mouseup', handleMouseUp);
                grid.appendChild(cell);
            }
        }
        updateGrid();
    }

    // 更新網格顯示
    function updateGrid() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.className = 'cell';
            if (row === startPos.row && col === startPos.col) {
                cell.classList.add('start');
            } else if (row === endPos.row && col === endPos.col) {
                cell.classList.add('end');
            } else if (gridMatrix[row][col] === 1) {
                cell.classList.add('obstacle');
            }
        });
    }

    // 處理鼠標按下事件
    function handleMouseDown(e) {
        if (isAnimating) return;
        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (isSettingStart) {
            if (!(row === endPos.row && col === endPos.col)) {
                startPos = { row, col };
                updateGrid();
                isSettingStart = false;
                setStartBtn.classList.remove('active');
            }
        } else if (isSettingEnd) {
            if (!(row === startPos.row && col === startPos.col)) {
                endPos = { row, col };
                updateGrid();
                isSettingEnd = false;
                setEndBtn.classList.remove('active');
            }
        } else {
            if (!(row === startPos.row && col === startPos.col) && !(row === endPos.row && col === endPos.col)) {
                gridMatrix[row][col] = gridMatrix[row][col] === 1 ? 0 : 1;
                updateGrid();
                isDragging = true;
            }
        }
    }

    // 處理鼠標移動事件
    function handleMouseEnter(e) {
        if (isAnimating || !isDragging) return;
        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (!(row === startPos.row && col === startPos.col) && !(row === endPos.row && col === endPos.col)) {
            gridMatrix[row][col] = 1;
            updateGrid();
        }
    }

    // 處理鼠標彈起事件
    function handleMouseUp() {
        isDragging = false;
    }

    // 設定起點
    setStartBtn.addEventListener('click', () => {
        if (isAnimating) return;
        isSettingStart = !isSettingStart;
        isSettingEnd = false;
        setStartBtn.classList.toggle('active', isSettingStart);
        setEndBtn.classList.remove('active');
    });

    // 設定終點
    setEndBtn.addEventListener('click', () => {
        if (isAnimating) return;
        isSettingEnd = !isSettingEnd;
        isSettingStart = false;
        setEndBtn.classList.toggle('active', isSettingEnd);
        setStartBtn.classList.remove('active');
    });

    // 清除路徑
    clearPathBtn.addEventListener('click', () => {
        if (isAnimating) return;
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('open', 'closed', 'path');
        });
        currentStatusSpan.textContent = '就緒';
    });

    // 完全重置
    resetBtn.addEventListener('click', () => {
        if (isAnimating) return;
        gridMatrix = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        startPos = { row: 2, col: 2 };
        endPos = { row: 12, col: 12 };
        updateGrid();
        clearPathBtn.click();
        currentStatusSpan.textContent = '就緒';
    });

    // 開始尋路
    startBtn.addEventListener('click', () => {
        if (isAnimating) return;
        clearPathBtn.click();
        currentAlgorithm = algorithmSelect.value;
        currentStatusSpan.textContent = '搜尋中';
        isAnimating = true;
        disableButtons(true);

        const startTime = performance.now();
        let visitedNodes = [];
        let path = [];

        if (currentAlgorithm === 'astar') {
            const result = aStar();
            visitedNodes = result.visitedNodes;
            path = result.path;
        } else {
            const result = dijkstra();
            visitedNodes = result.visitedNodes;
            path = result.path;
        }

        const endTime = performance.now();
        executionTimeSpan.textContent = (endTime - startTime).toFixed(2);

        animateAlgorithm(visitedNodes, path, () => {
            isAnimating = false;
            disableButtons(false);
            if (path.length > 0) {
                currentStatusSpan.textContent = '找到路徑';
                pathLengthSpan.textContent = path.length - 1;
            } else {
                currentStatusSpan.textContent = '無路徑';
            }
        });
    });

    // A* 演算法
    function aStar() {
        const openSet = [];
        const closedSet = [];
        const gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
        const fScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
        const cameFrom = Array(ROWS).fill().map(() => Array(COLS).fill(null));
        const visitedNodesInOrder = [];

        openSet.push(startPos);
        gScore[startPos.row][startPos.col] = 0;
        fScore[startPos.row][startPos.col] = heuristic(startPos, endPos);

        while (openSet.length > 0) {
            openSet.sort((a, b) => fScore[a.row][a.col] - fScore[b.row][b.col]);
            const current = openSet.shift();
            visitedNodesInOrder.push(current);

            if (current.row === endPos.row && current.col === endPos.col) {
                return {
                    visitedNodes: visitedNodesInOrder,
                    path: reconstructPath(cameFrom, current)
                };
            }

            closedSet.push(current);
            const neighbors = getNeighbors(current);

            for (const neighbor of neighbors) {
                if (closedSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) continue;
                if (gridMatrix[neighbor.row][neighbor.col] === 1) continue;

                const tentativeGScore = gScore[current.row][current.col] + 1;

                if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore[neighbor.row][neighbor.col]) {
                    continue;
                }

                cameFrom[neighbor.row][neighbor.col] = current;
                gScore[neighbor.row][neighbor.col] = tentativeGScore;
                fScore[neighbor.row][neighbor.col] = tentativeGScore + heuristic(neighbor, endPos);
            }
        }

        return {
            visitedNodes: visitedNodesInOrder,
            path: []
        };
    }

    // Dijkstra 演算法
    function dijkstra() {
        const openSet = [];
        const closedSet = [];
        const gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
        const cameFrom = Array(ROWS).fill().map(() => Array(COLS).fill(null));
        const visitedNodesInOrder = [];

        openSet.push(startPos);
        gScore[startPos.row][startPos.col] = 0;

        while (openSet.length > 0) {
            openSet.sort((a, b) => gScore[a.row][a.col] - gScore[b.row][b.col]);
            const current = openSet.shift();
            visitedNodesInOrder.push(current);

            if (current.row === endPos.row && current.col === endPos.col) {
                return {
                    visitedNodes: visitedNodesInOrder,
                    path: reconstructPath(cameFrom, current)
                };
            }

            closedSet.push(current);
            const neighbors = getNeighbors(current);

            for (const neighbor of neighbors) {
                if (closedSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) continue;
                if (gridMatrix[neighbor.row][neighbor.col] === 1) continue;

                const tentativeGScore = gScore[current.row][current.col] + 1;

                if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore[neighbor.row][neighbor.col]) {
                    continue;
                }

                cameFrom[neighbor.row][neighbor.col] = current;
                gScore[neighbor.row][neighbor.col] = tentativeGScore;
            }
        }

        return {
            visitedNodes: visitedNodesInOrder,
            path: []
        };
    }

    // 重建路徑
    function reconstructPath(cameFrom, current) {
        const path = [];
        while (current) {
            path.unshift(current);
            current = cameFrom[current.row][current.col];
        }
        return path;
    }

    // 獲取鄰居節點
    function getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];

        for (const dir of directions) {
            const newRow = node.row + dir.row;
            const newCol = node.col + dir.col;
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }

        return neighbors;
    }

    // 曼哈頓距離
    function heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    // 動畫顯示
    function animateAlgorithm(visitedNodes, path, callback) {
        visitedNodesSpan.textContent = visitedNodes.length;

        let i = 0;
        const interval = setInterval(() => {
            if (i < visitedNodes.length) {
                const node = visitedNodes[i];
                const cell = document.querySelector(`.cell[data-row="${node.row}"][data-col="${node.col}"]`);
                if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                    cell.classList.add('closed');
                }
                i++;
            } else {
                clearInterval(interval);
                animatePath(path, callback);
            }
        }, 10);
    }

    // 動畫顯示路徑
    function animatePath(path, callback) {
        let i = 0;
        const interval = setInterval(() => {
            if (i < path.length) {
                const node = path[i];
                const cell = document.querySelector(`.cell[data-row="${node.row}"][data-col="${node.col}"]`);
                if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                    cell.classList.add('path');
                }
                i++;
            } else {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 10);
    }

    // 禁用按鈕
    function disableButtons(disabled) {
        setStartBtn.disabled = disabled;
        setEndBtn.disabled = disabled;
        clearPathBtn.disabled = disabled;
        resetBtn.disabled = disabled;
        algorithmSelect.disabled = disabled;
        startBtn.disabled = disabled;
    }

    // 初始化
    initGrid();
});
