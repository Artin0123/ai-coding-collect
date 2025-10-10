const GRID_SIZE = 15;
const CELL_SIZE = 30;
const DELAY = 10;

const COLORS = {
start: 'start',
end: 'end',
wall: 'wall',
open: 'open',
closed: 'closed',
path: 'path'
};

const STATE = {
READY: '就緒',
SEARCHING: '搜尋中',
FOUND: '找到路徑',
NO_PATH: '無路徑'
};

const gridEl = document.getElementById('grid');
const messageEl = document.getElementById('message');
const visitedCountEl = document.getElementById('visitedCount');
const pathLengthEl = document.getElementById('pathLength');
const executionTimeEl = document.getElementById('executionTime');
const currentStatusEl = document.getElementById('currentStatus');
const setStartBtn = document.getElementById('setStart');
const setEndBtn = document.getElementById('setEnd');
const clearPathBtn = document.getElementById('clearPath');
const fullResetBtn = document.getElementById('fullReset');
const startSearchBtn = document.getElementById('startSearch');
const algorithmSelect = document.getElementById('algorithm');

let grid = [];
let startCell = null;
let endCell = null;
let mouseDown = false;
let mode = 'wall';
let animating = false;

function createGrid() {
grid = [];
gridEl.innerHTML = '';
for (let row = 0; row < GRID_SIZE; row += 1) {
const rowArr = [];
for (let col = 0; col < GRID_SIZE; col += 1) {
const cell = document.createElement('div');
cell.className = 'cell';
cell.dataset.row = row;
cell.dataset.col = col;
cell.dataset.state = 'empty';
cell.addEventListener('mousedown', handleMouseDown);
cell.addEventListener('mouseenter', handleMouseEnter);
cell.addEventListener('mouseup', handleMouseUp);
cell.addEventListener('click', handleCellClick);
gridEl.appendChild(cell);
rowArr.push({ row, col, type: 'empty', f: Infinity, g: Infinity, h: 0, parent: null });
}
grid.push(rowArr);
}
setStartCell(2, 2);
setEndCell(12, 12);
updateStatus(STATE.READY);
}

function setStartCell(row, col) {
if (startCell) {
const prevCell = getCellEl(startCell.row, startCell.col);
prevCell.classList.remove(COLORS.start);
}
startCell = { row, col };
const el = getCellEl(row, col);
el.classList.add(COLORS.start);
getCellData(row, col).type = 'start';
}

function setEndCell(row, col) {
if (endCell) {
const prevCell = getCellEl(endCell.row, endCell.col);
prevCell.classList.remove(COLORS.end);
}
endCell = { row, col };
const el = getCellEl(row, col);
el.classList.add(COLORS.end);
getCellData(row, col).type = 'end';
}

function getCellEl(row, col) {
return gridEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function getCellData(row, col) {
return grid[row][col];
}

function handleMouseDown(event) {
if (animating) {
return;
}
mouseDown = true;
const cell = event.currentTarget;
const row = Number(cell.dataset.row);
const col = Number(cell.dataset.col);
if (mode === 'start') {
if (isBlockedForStart(row, col)) {
return;
}
clearType(startCell.row, startCell.col);
setStartCell(row, col);
mode = 'wall';
setStartBtn.classList.remove('active');
return;
}
if (mode === 'end') {
if (isBlockedForEnd(row, col)) {
return;
}
clearType(endCell.row, endCell.col);
setEndCell(row, col);
mode = 'wall';
setEndBtn.classList.remove('active');
return;
}
toggleWall(row, col, true);
}

function handleMouseEnter(event) {
if (!mouseDown || animating) {
return;
}
const cell = event.currentTarget;
const row = Number(cell.dataset.row);
const col = Number(cell.dataset.col);
toggleWall(row, col, true);
}

function handleMouseUp() {
mouseDown = false;
}

function handleCellClick(event) {
if (animating) {
return;
}
const row = Number(event.currentTarget.dataset.row);
const col = Number(event.currentTarget.dataset.col);
if (mode === 'start') {
if (isBlockedForStart(row, col)) {
return;
}
clearType(startCell.row, startCell.col);
setStartCell(row, col);
mode = 'wall';
setStartBtn.classList.remove('active');
return;
}
if (mode === 'end') {
if (isBlockedForEnd(row, col)) {
return;
}
clearType(endCell.row, endCell.col);
setEndCell(row, col);
mode = 'wall';
setEndBtn.classList.remove('active');
return;
}
toggleWall(row, col, false);
}

function toggleWall(row, col, forceAdd) {
if ((startCell.row === row && startCell.col === col) || (endCell.row === row && endCell.col === col)) {
return;
}
const cellData = getCellData(row, col);
const isWall = cellData.type === 'wall';
const newWall = forceAdd ? true : !isWall;
cellData.type = newWall ? 'wall' : 'empty';
const el = getCellEl(row, col);
el.classList.toggle(COLORS.wall, newWall);
}

function clearType(row, col) {
const cellData = getCellData(row, col);
if (cellData.type === 'start' || cellData.type === 'end') {
cellData.type = 'empty';
}
const el = getCellEl(row, col);
el.classList.remove(COLORS.start, COLORS.end);
}

function isBlockedForStart(row, col) {
const cellData = getCellData(row, col);
return cellData.type === 'wall' || (endCell.row === row && endCell.col === col);
}

function isBlockedForEnd(row, col) {
const cellData = getCellData(row, col);
return cellData.type === 'wall' || (startCell.row === row && startCell.col === col);
}

function clearSearch(keepWalls) {
for (let row = 0; row < GRID_SIZE; row += 1) {
for (let col = 0; col < GRID_SIZE; col += 1) {
const cellData = getCellData(row, col);
cellData.f = Infinity;
cellData.g = Infinity;
cellData.h = 0;
cellData.parent = null;
if (!keepWalls) {
cellData.type = 'empty';
}
const el = getCellEl(row, col);
if (!keepWalls) {
el.className = 'cell';
if (startCell.row === row && startCell.col === col) {
el.classList.add(COLORS.start);
cellData.type = 'start';
} else if (endCell.row === row && endCell.col === col) {
el.classList.add(COLORS.end);
cellData.type = 'end';
}
} else {
el.classList.remove(COLORS.open, COLORS.closed, COLORS.path);
if (startCell.row === row && startCell.col === col) {
el.classList.add(COLORS.start);
cellData.type = 'start';
} else if (endCell.row === row && endCell.col === col) {
el.classList.add(COLORS.end);
cellData.type = 'end';
}
if (cellData.type === 'wall') {
el.classList.add(COLORS.wall);
}
}
}
}
messageEl.textContent = '';
visitedCountEl.textContent = '0';
pathLengthEl.textContent = '0';
executionTimeEl.textContent = '0';
}

function resetAll() {
createGrid();
messageEl.textContent = '';
visitedCountEl.textContent = '0';
pathLengthEl.textContent = '0';
executionTimeEl.textContent = '0';
mode = 'wall';
setStartBtn.classList.remove('active');
setEndBtn.classList.remove('active');
}

function disableControls(disabled) {
const elems = [setStartBtn, setEndBtn, clearPathBtn, fullResetBtn, startSearchBtn, algorithmSelect];
elems.forEach((el) => {
el.disabled = disabled;
});
}

function updateStatus(status) {
currentStatusEl.textContent = status;
}

function calculateHeuristic(a, b) {
return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function getNeighbors(node) {
const dirs = [
{ row: -1, col: 0 },
{ row: 1, col: 0 },
{ row: 0, col: -1 },
{ row: 0, col: 1 }
];
const neighbors = [];
for (const dir of dirs) {
const newRow = node.row + dir.row;
const newCol = node.col + dir.col;
if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
neighbors.push(getCellData(newRow, newCol));
}
}
return neighbors;
}

function reconstructPath(endNode) {
const path = [];
let current = endNode;
while (current) {
if (!(current.row === startCell.row && current.col === startCell.col) && !(current.row === endCell.row && current.col === endCell.col)) {
path.push(current);
}
current = current.parent;
}
return path.reverse();
}

function priorityQueuePush(queue, node) {
queue.push(node);
queue.sort((a, b) => a.f - b.f || a.g - b.g);
}

async function runSearch(algorithm) {
if (!startCell || !endCell) {
return;
}
disableControls(true);
animating = true;
updateStatus(STATE.SEARCHING);
clearSearch(true);
const startTime = performance.now();
const openSet = [];
const closedSet = new Set();
const startNode = getCellData(startCell.row, startCell.col);
const endNode = getCellData(endCell.row, endCell.col);
startNode.g = 0;
startNode.h = algorithm === 'astar' ? calculateHeuristic(startNode, endNode) : 0;
startNode.f = startNode.g + startNode.h;
priorityQueuePush(openSet, startNode);
const openVisited = [];
const closedVisited = [];
let visitedCount = 0;
let path = [];
while (openSet.length > 0) {
const current = openSet.shift();
const currentEl = getCellEl(current.row, current.col);
if (!(current.row === startCell.row && current.col === startCell.col)) {
closedVisited.push(current);
}
closedSet.add(current);
visitedCount += 1;
if (current === endNode) {
path = reconstructPath(endNode);
break;
}
const neighbors = getNeighbors(current);
for (const neighbor of neighbors) {
if (neighbor.type === 'wall' || closedSet.has(neighbor)) {
continue;
}
const tentativeG = current.g + 1;
if (tentativeG < neighbor.g) {
neighbor.parent = current;
neighbor.g = tentativeG;
neighbor.h = algorithm === 'astar' ? calculateHeuristic(neighbor, endNode) : 0;
neighbor.f = neighbor.g + neighbor.h;
if (!openSet.includes(neighbor)) {
priorityQueuePush(openSet, neighbor);
if (!(neighbor.row === endCell.row && neighbor.col === endCell.col)) {
openVisited.push(neighbor);
}
} else {
openSet.sort((a, b) => a.f - b.f || a.g - b.g);
}
}
}
if (openVisited.length > 0) {
const node = openVisited.shift();
const nodeEl = getCellEl(node.row, node.col);
if (!(node.row === startCell.row && node.col === startCell.col) && !(node.row === endCell.row && node.col === endCell.col)) {
await colorCell(nodeEl, COLORS.open);
}
}
if (closedVisited.length > 0) {
const node = closedVisited.shift();
const nodeEl = getCellEl(node.row, node.col);
if (!(node.row === startCell.row && node.col === startCell.col) && !(node.row === endCell.row && node.col === endCell.col)) {
await colorCell(nodeEl, COLORS.closed);
}
}
const waitPromises = [];
if (openVisited.length === 0 && closedVisited.length === 0) {
await sleep(DELAY);
}
if (openVisited.length > 0) {
const node = openVisited.shift();
const nodeEl = getCellEl(node.row, node.col);
if (!(node.row === startCell.row && node.col === startCell.col) && !(node.row === endCell.row && node.col === endCell.col)) {
waitPromises.push(colorCell(nodeEl, COLORS.open));
}
}
if (closedVisited.length > 0) {
const node = closedVisited.shift();
const nodeEl = getCellEl(node.row, node.col);
if (!(node.row === startCell.row && node.col === startCell.col) && !(node.row === endCell.row && node.col === endCell.col)) {
waitPromises.push(colorCell(nodeEl, COLORS.closed));
}
}
if (waitPromises.length > 0) {
await Promise.all(waitPromises);
await sleep(DELAY);
}
}
const duration = Math.max(0, Math.round(performance.now() - startTime));
visitedCountEl.textContent = String(visitedCount);
executionTimeEl.textContent = String(duration);
if (path.length > 0) {
await animatePath(path);
pathLengthEl.textContent = String(path.length);
updateStatus(STATE.FOUND);
} else {
pathLengthEl.textContent = '0';
updateStatus(STATE.NO_PATH);
messageEl.textContent = '無法找到路徑';
}
disableControls(false);
animating = false;
}

function colorCell(el, stateClass) {
return new Promise((resolve) => {
if (animating) {
el.classList.remove(COLORS.open, COLORS.closed, COLORS.path);
if (stateClass) {
el.classList.add(stateClass);
}
}
setTimeout(resolve, DELAY);
});
}

async function animatePath(path) {
for (const node of path) {
const el = getCellEl(node.row, node.col);
await colorCell(el, COLORS.path);
}
}

function sleep(ms) {
return new Promise((resolve) => setTimeout(resolve, ms));
}

setStartBtn.addEventListener('click', () => {
if (animating) {
return;
}
mode = mode === 'start' ? 'wall' : 'start';
setStartBtn.classList.toggle('active', mode === 'start');
setEndBtn.classList.remove('active');
});

setEndBtn.addEventListener('click', () => {
if (animating) {
return;
}
mode = mode === 'end' ? 'wall' : 'end';
setEndBtn.classList.toggle('active', mode === 'end');
setStartBtn.classList.remove('active');
});

clearPathBtn.addEventListener('click', () => {
if (animating) {
return;
}
clearSearch(true);
updateStatus(STATE.READY);
});

fullResetBtn.addEventListener('click', () => {
if (animating) {
return;
}
resetAll();
});

startSearchBtn.addEventListener('click', () => {
if (animating) {
return;
}
const algorithm = algorithmSelect.value;
runSearch(algorithm);
});

document.body.addEventListener('mouseup', () => {
mouseDown = false;
});

document.addEventListener('mouseleave', () => {
mouseDown = false;
});

createGrid();
