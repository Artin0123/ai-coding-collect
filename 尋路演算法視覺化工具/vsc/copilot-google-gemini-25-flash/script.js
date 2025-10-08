// Grid and settings
const ROWS = 25;
const COLS = 25;
const CELL_SIZE = 20; // px
const STEP_DELAY = 5; // ms per step animation

const gridEl = document.getElementById('grid');
const messageEl = document.getElementById('message');
const visitedCountEl = document.getElementById('visited-count');
const pathLengthEl = document.getElementById('path-length');
const elapsedEl = document.getElementById('elapsed-ms');
const statusEl = document.getElementById('status');

const btnSetStart = document.getElementById('set-start');
const btnSetEnd = document.getElementById('set-end');
const btnClearPath = document.getElementById('clear-path');
const btnResetAll = document.getElementById('reset-all');
const btnStartSearch = document.getElementById('start-search');
const algorithmSelect = document.getElementById('algorithm');

let cells = []; // 2D array of cell objects
let isMouseDown = false;
let placingWalls = false;
let mode = null; // 'setStart' | 'setEnd' | null
let running = false;

// default positions
let startPos = { r: 2, c: 2 };
let endPos = { r: 22, c: 22 };

function createGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${COLS}, ${CELL_SIZE}px)`;
    gridEl.style.gridTemplateRows = `repeat(${ROWS}, ${CELL_SIZE}px)`;
    cells = [];
    gridEl.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            const el = document.createElement('div');
            el.className = 'cell';
            el.dataset.r = r;
            el.dataset.c = c;
            el.title = `${r},${c}`;

            el.addEventListener('mousedown', onCellMouseDown);
            el.addEventListener('mouseenter', onCellMouseEnter);
            el.addEventListener('mouseup', onCellMouseUp);
            el.addEventListener('click', onCellClick);

            gridEl.appendChild(el);

            row.push({ el, r, c, isWall: false, parent: null });
        }
        cells.push(row);
    }

    setStart(startPos.r, startPos.c);
    setEnd(endPos.r, endPos.c);
}

function setStart(r, c) {
    // clear previous
    const prev = findCellByClass('start');
    if (prev) prev.classList.remove('start');
    startPos = { r, c };
    const cell = cells[r][c];
    cell.isWall = false;
    cell.el.classList.remove('wall', 'end', 'open', 'closed', 'path');
    cell.el.classList.add('start');
}

function setEnd(r, c) {
    const prev = findCellByClass('end');
    if (prev) prev.classList.remove('end');
    endPos = { r, c };
    const cell = cells[r][c];
    cell.isWall = false;
    cell.el.classList.remove('wall', 'start', 'open', 'closed', 'path');
    cell.el.classList.add('end');
}

function findCellByClass(cls) {
    return gridEl.querySelector('.cell.' + cls);
}

function onCellMouseDown(e) {
    // only left button
    if (e.button !== 0) return;
    if (running) return;
    isMouseDown = true;
    const r = +this.dataset.r; const c = +this.dataset.c;

    if (mode === 'setStart') {
        setStart(r, c);
        mode = null; btnSetStart.classList.remove('active');
        messageEl.textContent = '';
        return;
    }
    if (mode === 'setEnd') {
        setEnd(r, c);
        mode = null; btnSetEnd.classList.remove('active');
        messageEl.textContent = '';
        return;
    }

    // toggle wall on click
    toggleWall(r, c);
    placingWalls = true;
}

function onCellMouseEnter(e) {
    if (!isMouseDown || !placingWalls) return;
    if (running) return;
    const r = +this.dataset.r; const c = +this.dataset.c;
    toggleWall(r, c, true);
}

function onCellMouseUp(e) {
    isMouseDown = false;
    placingWalls = false;
}

function onCellClick(e) {
    // prevent single clicks while setting start/end
}

function toggleWall(r, c, forceSet = false) {
    const cell = cells[r][c];
    // don't allow on start or end
    if ((r === startPos.r && c === startPos.c) || (r === endPos.r && c === endPos.c)) return;
    cell.isWall = forceSet ? true : !cell.isWall;
    cell.el.classList.toggle('wall', cell.isWall);
}

// disable/enable controls during run
function setRunning(val) {
    running = val;
    const disabled = val;
    [btnSetStart, btnSetEnd, btnClearPath, btnResetAll, btnStartSearch, algorithmSelect].forEach(el => el.disabled = disabled);
}

// clear path and search markers
function clearPath() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = cells[r][c];
            cell.parent = null;
            cell.el.classList.remove('open', 'closed', 'path');
        }
    }
    visitedCountEl.textContent = '0';
    pathLengthEl.textContent = '0';
    elapsedEl.textContent = '0';
    messageEl.textContent = '';
    statusEl.textContent = '就緒';
}

function resetAll() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = cells[r][c];
            cell.isWall = false; cell.parent = null;
            cell.el.className = 'cell';
        }
    }
    setStart(2, 2);
    setEnd(22, 22);
    clearPath();
}

// helpers for neighbors
function neighbors(r, c) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const res = [];
    for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) res.push(cells[nr][nc]);
    }
    return res;
}

function manhattan(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

// A* algorithm - returns {visitedOrder:[], path:[], visitedCount, timeMs}
function astar(start, end) {
    const open = new Map(); // key -> node
    const openHeap = [];
    const closed = new Set();

    function push(node, f) { open.set(`${node.r},${node.c}`, node); openHeap.push({ f, node }); }
    function pop() { let idx = 0; for (let i = 1; i < openHeap.length; i++) { if (openHeap[i].f < openHeap[idx].f) idx = i; } const it = openHeap.splice(idx, 1)[0]; if (it) open.delete(`${it.node.r},${it.node.c}`); return it ? it.node : null; }

    const gScore = Array.from({ length: ROWS }, () => Array(COLS, Infinity));
    const fScore = Array.from({ length: ROWS }, () => Array(COLS, Infinity));

    const visitedOrder = [];

    gScore[start.r][start.c] = 0;
    fScore[start.r][start.c] = manhattan(start, end);
    push(start, fScore[start.r][start.c]);

    while (openHeap.length) {
        const current = pop();
        closed.add(`${current.r},${current.c}`);
        visitedOrder.push({ r: current.r, c: current.c, type: 'closed' });
        if (current.r === end.r && current.c === end.c) break;

        for (const nb of neighbors(current.r, current.c)) {
            if (nb.isWall) continue;
            if (closed.has(`${nb.r},${nb.c}`)) continue;

            const tentative = gScore[current.r][current.c] + 1;
            if (tentative < gScore[nb.r][nb.c]) {
                nb.parent = current;
                gScore[nb.r][nb.c] = tentative;
                fScore[nb.r][nb.c] = tentative + manhattan(nb, end);
                if (!open.has(`${nb.r},${nb.c}`)) {
                    push(nb, fScore[nb.r][nb.c]);
                    visitedOrder.push({ r: nb.r, c: nb.c, type: 'open' });
                }
            }
        }
    }

    // reconstruct path
    const path = [];
    let node = cells[end.r][end.c];
    if (node.parent || (node.r === start.r && node.c === start.c)) {
        while (node) { path.push({ r: node.r, c: node.c }); node = node.parent; }
        path.reverse();
    }

    return { visitedOrder, path };
}

// Dijkstra: same as A* but heuristic 0
function dijkstra(start, end) {
    // reuse astar but with manhattan=0
    // We'll implement similarly but with f=g
    const open = new Map();
    const openHeap = [];
    const closed = new Set();

    function push(node, f) { open.set(`${node.r},${node.c}`, node); openHeap.push({ f, node }); }
    function pop() { let idx = 0; for (let i = 1; i < openHeap.length; i++) { if (openHeap[i].f < openHeap[idx].f) idx = i; } const it = openHeap.splice(idx, 1)[0]; if (it) open.delete(`${it.node.r},${it.node.c}`); return it ? it.node : null; }

    const gScore = Array.from({ length: ROWS }, () => Array(COLS, Infinity));

    const visitedOrder = [];

    gScore[start.r][start.c] = 0;
    push(start, 0);

    while (openHeap.length) {
        const current = pop();
        closed.add(`${current.r},${current.c}`);
        visitedOrder.push({ r: current.r, c: current.c, type: 'closed' });
        if (current.r === end.r && current.c === end.c) break;

        for (const nb of neighbors(current.r, current.c)) {
            if (nb.isWall) continue;
            if (closed.has(`${nb.r},${nb.c}`)) continue;

            const tentative = gScore[current.r][current.c] + 1;
            if (tentative < gScore[nb.r][nb.c]) {
                nb.parent = current;
                gScore[nb.r][nb.c] = tentative;
                if (!open.has(`${nb.r},${nb.c}`)) {
                    push(nb, gScore[nb.r][nb.c]);
                    visitedOrder.push({ r: nb.r, c: nb.c, type: 'open' });
                }
            }
        }
    }

    const path = [];
    let node = cells[end.r][end.c];
    if (node.parent || (node.r === start.r && node.c === start.c)) {
        while (node) { path.push({ r: node.r, c: node.c }); node = node.parent; }
        path.reverse();
    }

    return { visitedOrder, path };
}

// animate a sequence of visited nodes then path
async function animateSearch(result) {
    clearPath();
    statusEl.textContent = '搜尋中';
    const visitedOrder = result.visitedOrder;

    let visitedCount = 0;
    const startTime = performance.now();

    for (let i = 0; i < visitedOrder.length; i++) {
        const it = visitedOrder[i];
        // skip start and end styling changes
        if ((it.r === startPos.r && it.c === startPos.c) || (it.r === endPos.r && it.c === endPos.c)) continue;
        const el = cells[it.r][it.c].el;
        if (it.type === 'open') el.classList.add('open');
        else el.classList.add('closed');
        visitedCount++;
        visitedCountEl.textContent = visitedCount;
        // small delay
        await new Promise(res => setTimeout(res, STEP_DELAY));
    }

    const path = result.path;
    const endTime = performance.now();
    elapsedEl.textContent = Math.round(endTime - startTime);

    if (!path || path.length === 0) {
        statusEl.textContent = '無路徑';
        messageEl.textContent = '無法找到路徑';
        // do not re-enable here if startSearch manages running state; but ensure it gets disabled
        setRunning(false);
        return;
    }

    // show path
    statusEl.textContent = '找到路徑';
    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        if ((p.r === startPos.r && p.c === startPos.c) || (p.r === endPos.r && p.c === endPos.c)) continue;
        cells[p.r][p.c].el.classList.add('path');
        pathLengthEl.textContent = path.length - 1;
        await new Promise(res => setTimeout(res, STEP_DELAY));
    }

    setRunning(false);
}

// main start function
async function startSearch() {
    if (running) return;
    setRunning(true);
    // set parent null for all
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells[r][c].parent = null;

    const s = cells[startPos.r][startPos.c];
    const e = cells[endPos.r][endPos.c];

    const alg = algorithmSelect.value;
    let result;
    try {
        if (alg === 'astar') result = astar(s, e);
        else result = dijkstra(s, e);
    } catch (err) {
        console.error(err);
        messageEl.textContent = '演算法錯誤';
        return;
    }

    await animateSearch(result);
}

// UI wiring
btnSetStart.addEventListener('click', () => {
    if (running) return;
    if (mode === 'setStart') {
        mode = null; btnSetStart.classList.remove('active'); messageEl.textContent = '';
    } else {
        mode = 'setStart'; btnSetStart.classList.add('active'); btnSetEnd.classList.remove('active'); messageEl.textContent = '點擊網格設定起點';
    }
});
btnSetEnd.addEventListener('click', () => {
    if (running) return;
    if (mode === 'setEnd') {
        mode = null; btnSetEnd.classList.remove('active'); messageEl.textContent = '';
    } else {
        mode = 'setEnd'; btnSetEnd.classList.add('active'); btnSetStart.classList.remove('active'); messageEl.textContent = '點擊網格設定終點';
    }
});
btnClearPath.addEventListener('click', () => { if (running) return; clearPath(); });
btnResetAll.addEventListener('click', () => { if (running) return; resetAll(); });
btnStartSearch.addEventListener('click', () => { startSearch(); });

// global mouseup to stop dragging
document.addEventListener('mouseup', () => { isMouseDown = false; placingWalls = false; });

// prevent context menu on grid to avoid right-click issues
gridEl.addEventListener('contextmenu', (e) => e.preventDefault());

// init
createGrid();
