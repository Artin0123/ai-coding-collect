/* script.js */
const GRID_SIZE = 25
const CELL_SIZE = 20
const DELAY_MS = 10
const COLORS = {
  start: 'start', end: 'end', wall: 'wall', open: 'open', closed: 'closed', path: 'path'
}
const state = {
  grid: [],
  start: { r: 2, c: 2 },
  end: { r: 22, c: 22 },
  mode: 'normal',
  isMouseDown: false,
  running: false,
  visitedCount: 0,
  pathLength: 0,
  startTime: 0,
}
const gridEl = document.getElementById('grid')
const msgEl = document.getElementById('message')
const visitedEl = document.getElementById('visited')
const pathlenEl = document.getElementById('pathlen')
const timeEl = document.getElementById('time')
const statusEl = document.getElementById('status')
const btnSetStart = document.getElementById('setStart')
const btnSetEnd = document.getElementById('setEnd')
const btnClear = document.getElementById('clearPath')
const btnReset = document.getElementById('resetAll')
const btnRun = document.getElementById('run')
const algoSel = document.getElementById('algo')

function setStatus(text){ statusEl.textContent = `當前狀態：${text}` }
function setVisited(n){ visitedEl.textContent = `已訪問節點數：${n} 個` }
function setPathLen(n){ pathlenEl.textContent = `路徑長度：${n} 步` }
function setTime(ms){ timeEl.textContent = `執行時間：${ms} ms` }
function showMessage(text){ msgEl.textContent = text || '' }
function disableControls(disabled){
  [btnSetStart, btnSetEnd, btnClear, btnReset, btnRun, algoSel].forEach(el=>{ el.disabled = disabled })
}

function createGrid(){
  gridEl.innerHTML = ''
  state.grid = []
  for(let r=0;r<GRID_SIZE;r++){
    const row=[]
    for(let c=0;c<GRID_SIZE;c++){
      const cell={ r, c, wall:false, open:false, closed:false, path:false }
      const div=document.createElement('div')
      div.className='cell'
      div.dataset.r=r
      div.dataset.c=c
      row.push(cell)
      gridEl.appendChild(div)
    }
    state.grid.push(row)
  }
  renderAll()
}

function renderCell(r,c){
  const idx=r*GRID_SIZE+c
  const el=gridEl.children[idx]
  const cell=state.grid[r][c]
  el.className='cell'
  if(r===state.start.r && c===state.start.c) el.classList.add(COLORS.start)
  else if(r===state.end.r && c===state.end.c) el.classList.add(COLORS.end)
  else if(cell.wall) el.classList.add(COLORS.wall)
  if(cell.open) el.classList.add(COLORS.open)
  if(cell.closed) el.classList.add(COLORS.closed)
  if(cell.path) el.classList.add(COLORS.path)
}
function renderAll(){ for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++) renderCell(r,c) }

function inBounds(r,c){ return r>=0 && c>=0 && r<GRID_SIZE && c<GRID_SIZE }
function neighbors4(r,c){ return [ [r-1,c],[r+1,c],[r,c-1],[r,c+1] ].filter(([nr,nc])=>inBounds(nr,nc)) }
function isStart(r,c){ return r===state.start.r && c===state.start.c }
function isEnd(r,c){ return r===state.end.r && c===state.end.c }

function clearSearch(){
  state.visitedCount=0
  state.pathLength=0
  setVisited(0)
  setPathLen(0)
  setTime(0)
  showMessage('')
  for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++){
    const cell=state.grid[r][c]
    cell.open=false
    cell.closed=false
    cell.path=false
  }
  renderAll()
}

function resetAll(){
  state.start={ r:2, c:2 }
  state.end={ r:22, c:22 }
  state.mode='normal'
  state.isMouseDown=false
  state.running=false
  clearSearch()
  for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++){
    state.grid[r][c].wall=false
  }
  renderAll()
  setStatus('就緒')
}

function toggleWall(r,c){
  if(isStart(r,c) || isEnd(r,c)) return
  const cell=state.grid[r][c]
  cell.wall=!cell.wall
  renderCell(r,c)
}

function handleMouseDown(e){
  if(state.running) return
  const target=e.target
  if(!target.classList.contains('cell')) return
  const r=+target.dataset.r, c=+target.dataset.c
  state.isMouseDown=true
  if(state.mode==='setStart'){
    if(r===state.end.r && c===state.end.c) return
    state.start={ r,c }
    state.mode='normal'
    clearSearch()
    renderAll()
    setStatus('就緒')
    return
  }
  if(state.mode==='setEnd'){
    if(r===state.start.r && c===state.start.c) return
    state.end={ r,c }
    state.mode='normal'
    clearSearch()
    renderAll()
    setStatus('就緒')
    return
  }
  toggleWall(r,c)
}
function handleMouseMove(e){
  if(state.running) return
  if(!state.isMouseDown) return
  const target=e.target
  if(!target.classList.contains('cell')) return
  const r=+target.dataset.r, c=+target.dataset.c
  if(state.mode==='normal'){
    if(isStart(r,c)||isEnd(r,c)) return
    const cell=state.grid[r][c]
    if(!cell.wall){ cell.wall=true; renderCell(r,c) }
  }
}
function handleMouseUp(){ state.isMouseDown=false }

btnSetStart.onclick=()=>{ if(state.running) return; state.mode='setStart'; setStatus('設定起點') }
btnSetEnd.onclick=()=>{ if(state.running) return; state.mode='setEnd'; setStatus('設定終點') }
btnClear.onclick=()=>{ if(state.running) return; clearSearch() }
btnReset.onclick=()=>{ if(state.running) return; resetAll() }

function heuristic(a,b){ return Math.abs(a.r-b.r)+Math.abs(a.c-b.c) }
function key(rc){ return `${rc.r},${rc.c}` }

async function visualizeOpen(r,c){
  const cell=state.grid[r][c]
  if(!cell.open){ cell.open=true; renderCell(r,c); await delay(DELAY_MS) }
}
async function visualizeClosed(r,c){
  const cell=state.grid[r][c]
  if(!cell.closed){ cell.closed=true; renderCell(r,c); await delay(DELAY_MS) }
}
async function visualizePath(path){
  for(const {r,c} of path){
    const cell=state.grid[r][c]
    cell.path=true
    renderCell(r,c)
    await delay(DELAY_MS)
  }
}
function delay(ms){ return new Promise(res=>setTimeout(res,ms)) }

async function run(){
  if(state.running) return
  clearSearch()
  state.running=true
  disableControls(true)
  setStatus('搜尋中')
  state.startTime=performance.now()
  const algo=algoSel.value
  let result
  if(algo==='astar') result=await runAStar()
  else if(algo==='dijkstra') result=await runDijkstra()
  else result=await runBFS()
  const endTime=performance.now()
  setTime(Math.round(endTime-state.startTime))
  state.running=false
  disableControls(false)
  if(result && result.path){
    setStatus('找到路徑')
    state.pathLength=result.path.length
    setPathLen(state.pathLength)
    await visualizePath(result.path)
  }else{
    setStatus('無路徑')
    showMessage('無法找到路徑')
  }
}
btnRun.onclick=()=>{ run() }

function passable(r,c){ return !state.grid[r][c].wall }

async function runAStar(){
  const start=state.start, goal=state.end
  const open=[]
  const cameFrom=new Map()
  const gScore=new Map()
  const fScore=new Map()
  const sk=key(start), gk=key(goal)
  gScore.set(sk,0)
  fScore.set(sk,heuristic(start,goal))
  open.push({ r:start.r, c:start.c, f:fScore.get(sk) })
  const inOpen=new Set([sk])
  const closedSet=new Set()
  while(open.length){
    open.sort((a,b)=>a.f-b.f)
    const current=open.shift()
    const ck=key(current)
    inOpen.delete(ck)
    await visualizeClosed(current.r,current.c)
    if(current.r===goal.r && current.c===goal.c){
      const path=reconstructPath(cameFrom,current)
      setVisited(closedSet.size)
      return { path }
    }
    closedSet.add(ck)
    for(const [nr,nc] of neighbors4(current.r,current.c)){
      if(!passable(nr,nc)) continue
      const nk=key({r:nr,c:nc})
      if(closedSet.has(nk)) continue
      const tentativeG=(gScore.get(ck)||Infinity)+1
      if(!inOpen.has(nk) || tentativeG<(gScore.get(nk)||Infinity)){
        cameFrom.set(nk,ck)
        gScore.set(nk,tentativeG)
        const f=tentativeG+heuristic({r:nr,c:nc},goal)
        fScore.set(nk,f)
        if(!inOpen.has(nk)){
          open.push({ r:nr, c:nc, f })
          inOpen.add(nk)
          await visualizeOpen(nr,nc)
        }
      }
    }
  }
  setVisited(closedSet.size)
  return null
}

async function runDijkstra(){
  const start=state.start, goal=state.end
  const dist=new Map()
  const prev=new Map()
  const pq=[]
  const sk=key(start)
  dist.set(sk,0)
  pq.push({ r:start.r, c:start.c, d:0 })
  const visited=new Set()
  while(pq.length){
    pq.sort((a,b)=>a.d-b.d)
    const cur=pq.shift()
    const ck=key(cur)
    if(visited.has(ck)) continue
    visited.add(ck)
    await visualizeClosed(cur.r,cur.c)
    if(cur.r===goal.r && cur.c===goal.c){
      const path=reconstructPath(prev,cur)
      setVisited(visited.size)
      return { path }
    }
    for(const [nr,nc] of neighbors4(cur.r,cur.c)){
      if(!passable(nr,nc)) continue
      const nk=key({r:nr,c:nc})
      const alt=(dist.get(ck)||Infinity)+1
      if(alt<(dist.get(nk)||Infinity)){
        dist.set(nk,alt)
        prev.set(nk,ck)
        pq.push({ r:nr, c:nc, d:alt })
        await visualizeOpen(nr,nc)
      }
    }
  }
  setVisited(visited.size)
  return null
}

async function runBFS(){
  const start=state.start, goal=state.end
  const q=[]
  const prev=new Map()
  const visited=new Set()
  q.push(start)
  visited.add(key(start))
  await visualizeOpen(start.r,start.c)
  while(q.length){
    const cur=q.shift()
    await visualizeClosed(cur.r,cur.c)
    if(cur.r===goal.r && cur.c===goal.c){
      const path=reconstructPath(prev,cur)
      setVisited(visited.size)
      return { path }
    }
    for(const [nr,nc] of neighbors4(cur.r,cur.c)){
      if(!passable(nr,nc)) continue
      const nk=key({r:nr,c:nc})
      if(!visited.has(nk)){
        visited.add(nk)
        prev.set(nk,key(cur))
        q.push({ r:nr, c:nc })
        await visualizeOpen(nr,nc)
      }
    }
  }
  setVisited(visited.size)
  return null
}

function reconstructPath(cameFrom,last){
  const path=[]
  let cur=last
  while(cur){
    if(!(cur.r===state.start.r && cur.c===state.start.c) && !(cur.r===state.end.r && cur.c===state.end.c))
      path.unshift({ r:cur.r, c:cur.c })
    const k=cameFrom.get(key(cur))
    if(!k) break
    const [r,c]=k.split(',').map(Number)
    cur={ r, c }
  }
  return path
}

function init(){
  createGrid()
  resetAll()
  gridEl.addEventListener('mousedown', handleMouseDown)
  gridEl.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

init()
