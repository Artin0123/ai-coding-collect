
// 作者：自動生成
// 說明：實作 15x15 網格、障礙物拖曳、起點/終點設定、A* 與 Dijkstra 演算法、動畫與統計資訊

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const ROWS = 15;
    const COLS = 15;
    const gridContainer = document.getElementById('grid');

    // 內部狀態
    let grid = []; // 2D 陣列，每格 {state:0, element:DOM}
    const STATE = { EMPTY: 0, WALL: 1, START: 2, END: 3 };
    let startPos = { row: 2, col: 2 };
    let endPos = { row: 12, col: 12 };
    let isMouseDown = false;
    let currentMode = null; // null / 'setStart' / 'setEnd'
    let isRunning = false; // 演算法執行中，禁用編輯

    // ==== 初始化 ====
    initGrid();

    // ==== 事件綁定 ====
    // 按鈕
    document.getElementById('set-start-btn').addEventListener('click', () => {
        if (isRunning) return;
        currentMode = 'setStart';
        updateStatus('設定起點模式');
    });

    document.getElementById('set-end-btn').addEventListener('click', () => {
        if (isRunning) return;
        currentMode = 'setEnd';
        updateStatus('設定終點模式');
    });

    document.getElementById('clear-path-btn').addEventListener('click', () => {
        if (isRunning) return;
        clearVisualization();
        resetStats();
        updateStatus('就緒');
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        if (isRunning) return;
        resetAll();
        updateStatus('就緒');
    });

    document.getElementById('start-btn').addEventListener('click', async () => {
        if (isRunning) return;
        await runAlgorithm();
    });

    // 滑鼠拖曳障礙物
    gridContainer.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // 只接受左鍵
        if (isRunning) return;
        isMouseDown = true;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        handleCellClick(r, c);
    });

    gridContainer.addEventListener('mouseover', (e) => {
        if (!isMouseDown) return;
        if (isRunning) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        if (currentMode) return; // 設定起點／終點模式下不進行拖曳
        toggleWall(r, c);
    });

    document.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    // ==== 功能函式 ====

    function initGrid() {
        gridContainer.innerHTML = '';
        grid = [];

        for (let r = 0; r < ROWS; r++) {
            const row = [];
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                gridContainer.appendChild(cell);
                row.push({ state: STATE.EMPTY, element: cell });
            }
            grid.push(row);
        }

        // 設定起點、終點
        setCellState(startPos.row, startPos.col, STATE.START);
        setCellState(endPos.row, endPos.col, STATE.END);
    }

    function setCellState(r, c, newState) {
        const cellInfo = grid[r][c];
        // 移除舊的 class
        cellInfo.element.classList.remove('start', 'end', 'wall');
        cellInfo.state = newState;
        if (newState === STATE.START) cellInfo.element.classList.add('start');
        else if (newState === STATE.END) cellInfo.element.classList.add('end');
        else if (newState === STATE.WALL) cellInfo.element.classList.add('wall');
    }

    function handleCellClick(r, c) {
        if (currentMode === 'setStart') {
            if (grid[r][c].state === STATE.WALL) return;
            // 清除舊的起點
            setCellState(startPos.row, startPos.col, STATE.EMPTY);
            startPos = { row: r, col: c };
            setCellState(r, c, STATE.START);
            currentMode = null;
            updateStatus('就緒');
        } else if (currentMode === 'setEnd') {
            if (grid[r][c].state === STATE.WALL) return;
            setCellState(endPos.row, endPos.col, STATE.EMPTY);
            endPos = { row: r, col: c };
            setCellState(r, c, STATE.END);
            currentMode = null;
            updateStatus('就緒');
        } else {
            toggleWall(r, c);
        }
    }

    function toggleWall(r, c) {
        const cellInfo = grid[r][c];
        // 起點或終點不可變成障礙物
        if (cellInfo.state === STATE.START || cellInfo.state === STATE.END) return;
        if (cellInfo.state === STATE.WALL) {
            setCellState(r, c, STATE.EMPTY);
        } else {
            setCellState(r, c, STATE.WALL);
        }
    }

    function clearVisualization() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const el = grid[r][c].element;
                el.classList.remove('open', 'closed', 'path');
            }
        }
    }

    function resetStats() {
        document.getElementById('visited-count').textContent = '0';
        document.getElementById('path-length').textContent = '0';
        document.getElementById('exec-time').textContent = '0';
    }

    function resetAll() {
        // 清除所有狀態回到初始
        startPos = { row: 2, col: 2 };
        endPos = { row: 12, col: 12 };
        initGrid();
        clearVisualization();
        resetStats();
    }

    function updateStatus(text) {
        document.getElementById('status').textContent = text;
    }

    function disableControls(flag) {
        const btns = document.querySelectorAll('#control-panel button, #algorithm-select');
        btns.forEach(b => b.disabled = flag);
    }

    // ==== 演算法 ====

    async function runAlgorithm() {
        isRunning = true;
        disableControls(true);
        clearVisualization();
        resetStats();
        updateStatus('搜尋中');

        const startTime = performance.now();
        const algo = document.getElementById('algorithm-select').value;
        let result;
        if (algo === 'astar') {
            result = await aStar(startPos, endPos);
        } else {
            result = await dijkstra(startPos, endPos);
        }
        const endTime = performance.now();

        document.getElementById('exec-time').textContent = Math.round(endTime - startTime);
        document.getElementById('visited-count').textContent = result.visited;

        if (result.path) {
            document.getElementById('path-length').textContent = result.path.length - 1;
            updateStatus('找到路徑');
            await visualizePath(result.path);
        } else {
            updateStatus('無路徑');
            alert('無法找到路徑');
        }

        disableControls(false);
        isRunning = false;
        currentMode = null;
    }

    function getNeighbors(r, c) {
        const dirs = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0]
        ];
        const result = [];
        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
            if (grid[nr][nc].state === STATE.WALL) continue;
            result.push({ row: nr, col: nc });
        }
        return result;
    }

    async function aStar(start, end) {
        return await genericSearch(start, end, true);
    }

    async function dijkstra(start, end) {
        return await genericSearch(start, end, false);
    }

    // 通用搜尋函式，使用 openSet 陣列 + 手動排序（網格小，效能足夠）
    async function genericSearch(start, end, useHeuristic) {
        const openSet = [];
        const closedSet = new Set();
        const nodeMap = new Map(); // key => node

        function key(r, c) {
            return r + ',' + c;
        }

        const startNode = {
            row: start.row,
            col: start.col,
            g: 0,
            f: useHeuristic ? heuristic(start.row, start.col, end.row, end.col) : 0,
            parent: null
        };
        openSet.push(startNode);
        nodeMap.set(key(start.row, start.col), startNode);

        let visited = 0;

        while (openSet.length > 0) {
            // 取 f 最小的節點
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            const curKey = key(current.row, current.col);
            closedSet.add(curKey);
            visited++;

            // 視覺化 closed（除起點、終點外）
            if (!((current.row === start.row && current.col === start.col) ||
                (current.row === end.row && current.col === end.col))) {
                grid[current.row][current.col].element.classList.add('closed');
            }

            // 到達終點
            if (current.row === end.row && current.col === end.col) {
                const path = [];
                let node = current;
                while (node) {
                    path.push({ row: node.row, col: node.col });
                    node = node.parent;
                }
                path.reverse();
                return { path, visited };
            }

            // 探索鄰居
            for (const nb of getNeighbors(current.row, current.col)) {
                const nbKey = key(nb.row, nb.col);
                if (closedSet.has(nbKey)) continue;

                const tentativeG = current.g + 1; // 每一步成本 1
                let neighborNode = nodeMap.get(nbKey);
                const h = useHeuristic ? heuristic(nb.row, nb.col, end.row, end.col) : 0;
                const f = tentativeG + h;

                if (!neighborNode) {
                    neighborNode = {
                        row: nb.row,
                        col: nb.col,
                        g: tentativeG,
                        f: f,
                        parent: current
                    };
                    nodeMap.set(nbKey, neighborNode);
                    openSet.push(neighborNode);

                    // 視覺化 open（除起點、終點外）
                    if (!((nb.row === start.row && nb.col === start.col) ||
                        (nb.row === end.row && nb.col === end.col))) {
                        grid[nb.row][nb.col].element.classList.add('open');
                    }
                } else if (tentativeG < neighborNode.g) {
                    // 更好的路徑
                    neighborNode.g = tentativeG;
                    neighborNode.f = tentativeG + h;
                    neighborNode.parent = current;
                }
            }

            // 動畫延遲
            await new Promise(r => setTimeout(r, 10));
        }

        // 沒有路徑
        return { path: null, visited };
    }

    function heuristic(r1, c1, r2, c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    async function visualizePath(path) {
        for (let i = 0; i < path.length; i++) {
            const { row, col } = path[i];
            // 起點與終點已經有自己的顏色，仍然加上 path 類別以呈現黃色
            if (!((row === startPos.row && col === startPos.col) ||
                (row === endPos.row && col === endPos.col))) {
                grid[row][col].element.classList.add('path');
                // 讓每一步都有延遲，形成動畫
                await new Promise(r => setTimeout(r, 10));
            }
        }
    }
});
