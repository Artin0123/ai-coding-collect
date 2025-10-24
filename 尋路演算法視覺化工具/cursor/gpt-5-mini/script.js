/* Grid & state setup */
const ROWS = 15, COLS = 15;
const CELL_SIZE = 30;

const gridEl = document.getElementById('grid');
const visitedCountEl = document.getElementById('visited-count');
const pathLengthEl = document.getElementById('path-length');
const elapsedMsEl = document.getElementById('elapsed-ms');
const statusTextEl = document.getElementById('status-text');
const messageEl = document.getElementById('message');

let isMouseDown = false;
let isPlacingWalls = false;
let placingModeAdd = true;
let isRunning = false;
let setMode = null; // 'start' | 'end' | null

const defaultStart = {r:2,c:2};
const defaultEnd = {r:12,c:12};

const grid = [];

function createGridData(){
  for(let r=0;r<ROWS;r++){
    grid[r]=[];
    for(let c=0;c<COLS;c++){
      grid[r][c]={r,c,wall:false,visited:false,closed:false,parent:null,g:Infinity,h:0,f:Infinity,el:null};
    }
  }
}

createGridData();

function clearGridElement(){gridEl.innerHTML=''}

function renderGrid(){
  clearGridElement();
  gridEl.style.gridTemplateColumns = `repeat(${COLS}, ${CELL_SIZE}px)`;
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const cell = grid[r][c];
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.r = r; div.dataset.c = c;
      cell.el = div;
      gridEl.appendChild(div);
    }
  }
  updateAllCellStyles();
}

let startPos = {...defaultStart};
let endPos = {...defaultEnd};

function updateAllCellStyles(){
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      applyCellStyle(grid[r][c]);
    }
  }
}

function applyCellStyle(cell){
  const el = cell.el;
  el.className='cell';
  if(cell.r===startPos.r && cell.c===startPos.c) el.classList.add('start');
  else if(cell.r===endPos.r && cell.c===endPos.c) el.classList.add('end');
  else if(cell.wall) el.classList.add('wall');
  else if(cell.inPath) el.classList.add('path');
  else if(cell.open) el.classList.add('open');
  else if(cell.closed) el.classList.add('closed');
}

renderGrid();

/* Helpers */
function inBounds(r,c){return r>=0 && c>=0 && r<ROWS && c<COLS}
function neighbors(cell){
  const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
  const res = [];
  for(const [dr,dc] of deltas){
    const nr = cell.r+dr, nc = cell.c+dc;
    if(inBounds(nr,nc)) res.push(grid[nr][nc]);
  }
  return res;
}

/* Interaction: mouse events for placing walls and setting start/end */
gridEl.addEventListener('mousedown', (e)=>{
  if(isRunning) return;
  const cell = getCellFromEvent(e);
  if(!cell) return;
  if(setMode){
    if(cell.wall) return; // cannot set on wall
    if(setMode==='start'){
      startPos = {r:cell.r,c:cell.c};
    } else if(setMode==='end'){
      endPos = {r:cell.r,c:cell.c};
    }
    setMode=null; updateAllCellStyles(); statusTextEl.textContent='就緒'; return;
  }
  isMouseDown = true;
  // left click toggles
  placingModeAdd = !cell.wall;
  isPlacingWalls = true;
  toggleWall(cell, placingModeAdd);
});

window.addEventListener('mouseup', ()=>{isMouseDown=false; isPlacingWalls=false});

gridEl.addEventListener('mousemove', (e)=>{
  if(!isMouseDown || !isPlacingWalls || isRunning) return;
  const cell = getCellFromEvent(e);
  if(!cell) return;
  toggleWall(cell, placingModeAdd);
});

gridEl.addEventListener('click', (e)=>{
  if(isRunning) return;
  const cell = getCellFromEvent(e);
  if(!cell) return;
  if(setMode) return; // handled in mousedown
  // simple click toggles
  toggleWall(cell, !cell.wall);
});

function getCellFromEvent(e){
  const target = e.target.closest('.cell');
  if(!target) return null;
  const r = parseInt(target.dataset.r,10);
  const c = parseInt(target.dataset.c,10);
  return grid[r][c];
}

function toggleWall(cell, makeWall){
  if((cell.r===startPos.r && cell.c===startPos.c) || (cell.r===endPos.r && cell.c===endPos.c)) return;
  cell.wall = makeWall;
  cell.open=false; cell.closed=false; cell.inPath=false; cell.visited=false; cell.parent=null;
  applyCellStyle(cell);
}

/* Controls */
const setStartBtn = document.getElementById('set-start');
const setEndBtn = document.getElementById('set-end');
const clearPathBtn = document.getElementById('clear-path');
const resetAllBtn = document.getElementById('reset-all');
const startBtn = document.getElementById('start-search');
const algoSelect = document.getElementById('algo-select');

setStartBtn.addEventListener('click', ()=>{ if(isRunning) return; setMode='start'; statusTextEl.textContent='設定起點: 請點選一個格子'; });
setEndBtn.addEventListener('click', ()=>{ if(isRunning) return; setMode='end'; statusTextEl.textContent='設定終點: 請點選一個格子'; });
clearPathBtn.addEventListener('click', ()=>{ if(isRunning) return; clearSearchResults(); updateAllCellStyles(); });
resetAllBtn.addEventListener('click', ()=>{ if(isRunning) return; resetAll(); });

startBtn.addEventListener('click', async ()=>{
  if(isRunning) return;
  clearSearchResults();
  const algo = algoSelect.value;
  await runSearch(algo);
});

function clearSearchResults(){
  messageEl.textContent='';
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const cell=grid[r][c];
    cell.open=false;cell.closed=false;cell.inPath=false;cell.visited=false;cell.parent=null;cell.g=Infinity;cell.h=0;cell.f=Infinity; if(cell.el){ cell.el.classList.remove('open','closed','path'); }
  }
  visitedCountEl.textContent='0';pathLengthEl.textContent='0';elapsedMsEl.textContent='0';statusTextEl.textContent='就緒';
  updateAllCellStyles();
}

function resetAll(){
  createGridData();
  startPos = {...defaultStart}; endPos = {...defaultEnd};
  renderGrid();
  clearSearchResults();
}

/* Algorithms */
function manhattan(a,b){return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)}

function disableControls(dis){setStartBtn.disabled=dis;setEndBtn.disabled=dis;clearPathBtn.disabled=dis;resetAllBtn.disabled=dis;startBtn.disabled=dis;algoSelect.disabled=dis}

async function runSearch(algo){
  isRunning=true; disableControls(true); statusTextEl.textContent='搜尋中'; messageEl.textContent='';
  const startTime = performance.now();
  const result = (algo==='astar') ? await visualizeAStar() : await visualizeDijkstra();
  const endTime = performance.now();
  elapsedMsEl.textContent = Math.round(endTime-startTime);
  isRunning=false; disableControls(false);
  if(result){
    statusTextEl.textContent='找到路徑';
  } else {
    statusTextEl.textContent='無路徑'; messageEl.textContent='無法找到路徑';
  }
}

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function visualizeAStar(){
  // initialize
  const openSet = new MinHeap((a,b)=>a.f-b.f || a.g-b.g);
  const startCell = grid[startPos.r][startPos.c];
  const endCell = grid[endPos.r][endPos.c];
  startCell.g=0; startCell.h=manhattan(startCell,endCell); startCell.f=startCell.h;
  openSet.push(startCell);
  let visitedCount=0;

  while(!openSet.empty()){
    const current = openSet.pop();
    if(current.closed) continue;
    current.closed=true; current.open=false; current.visited=true; visitedCount++;
    if(current.el){ current.el.classList.remove('open'); current.el.classList.add('closed'); }
    visitedCountEl.textContent=visitedCount;
    if(current===endCell) { await reconstructPath(endCell); pathLengthEl.textContent = computePathLength(endCell); return true; }
    for(const nb of neighbors(current)){
      if(nb.wall || nb.closed) continue;
      const tentativeG = current.g + 1;
      if(tentativeG < nb.g){
        nb.parent = current; nb.g = tentativeG; nb.h = manhattan(nb,endCell); nb.f = nb.g + nb.h;
        if(!nb.open){ nb.open=true; nb.el && nb.el.classList.add('open'); openSet.push(nb); }
      }
    }
    await sleep(10);
  }
  return false;
}

async function visualizeDijkstra(){
  const pq = new MinHeap((a,b)=>a.g-b.g);
  const startCell = grid[startPos.r][startPos.c];
  const endCell = grid[endPos.r][endPos.c];
  startCell.g=0; pq.push(startCell);
  let visitedCount=0;
  while(!pq.empty()){
    const current = pq.pop();
    if(current.closed) continue;
    current.closed=true; current.open=false; current.visited=true; visitedCount++;
    if(current.el){ current.el.classList.remove('open'); current.el.classList.add('closed'); }
    visitedCountEl.textContent=visitedCount;
    if(current===endCell){ await reconstructPath(endCell); pathLengthEl.textContent = computePathLength(endCell); return true; }
    for(const nb of neighbors(current)){
      if(nb.wall || nb.closed) continue;
      const tentativeG = current.g + 1;
      if(tentativeG < nb.g){ nb.parent=current; nb.g=tentativeG; if(!nb.open){ nb.open=true; nb.el && nb.el.classList.add('open'); pq.push(nb); } }
    }
    await sleep(10);
  }
  return false;
}

async function reconstructPath(endCell){
  let cur = endCell; const path=[];
  while(cur){ path.push(cur); cur.inPath=true; cur = cur.parent; }
  // mark path excluding start/end? keep including
  for(let i=0;i<path.length;i++){ if(path[i].el){ path[i].el.classList.remove('closed','open'); path[i].el.classList.add('path'); } await sleep(10); }
}

function computePathLength(endCell){
  let len=0; let cur=endCell;
  while(cur && !(cur.r===startPos.r && cur.c===startPos.c)){ len++; cur=cur.parent; }
  return len;
}

/* Simple binary heap */
class MinHeap{
  constructor(compare){this.data=[];this.compare=compare}
  push(item){this.data.push(item); this._siftUp(this.data.length-1)}
  pop(){ if(this.data.length===0) return null; const top=this.data[0]; const last=this.data.pop(); if(this.data.length) { this.data[0]=last; this._siftDown(0);} return top }
  empty(){return this.data.length===0}
  _siftUp(i){let p=Math.floor((i-1)/2); while(i>0 && this.compare(this.data[i],this.data[p])<0){[this.data[i],this.data[p]]=[this.data[p],this.data[i]]; i=p; p=Math.floor((i-1)/2);} }
  _siftDown(i){const n=this.data.length; while(true){ let l=2*i+1,r=2*i+2,small=i; if(l<n && this.compare(this.data[l],this.data[small])<0) small=l; if(r<n && this.compare(this.data[r],this.data[small])<0) small=r; if(small===i) break; [this.data[i],this.data[small]]=[this.data[small],this.data[i]]; i=small; } }
}

// initialization
resetAll();


