/* app.js */
const GRID_SIZE = 25
const CELL_SIZE = 20
const ANIM_DELAY = 10

const gridEl = document.getElementById('grid')
const setStartBtn = document.getElementById('setStart')
const setEndBtn = document.getElementById('setEnd')
const clearPathBtn = document.getElementById('clearPath')
const resetAllBtn = document.getElementById('resetAll')
const algoSelect = document.getElementById('algoSelect')
const startSearchBtn = document.getElementById('startSearch')
const visitedCountEl = document.getElementById('visitedCount')
const pathLengthEl = document.getElementById('pathLength')
const execTimeEl = document.getElementById('execTime')
const statusTextEl = document.getElementById('statusText')
const messageEl = document.getElementById('message')

const State = {
  READY: '就緒',
  SEARCHING: '搜尋中',
  FOUND: '找到路徑',
  NOT_FOUND: '無路徑'
}

let mode = 'none' // 'setStart' | 'setEnd' | 'none'
let isMouseDown = false
let isSearching = false

function makeCellId(r, c){ return `${r}-${c}` }

const grid = []
let start = { r: 2, c: 2 }
let end = { r: 22, c: 22 }

function createGrid(){
  gridEl.style.setProperty('--grid-size', GRID_SIZE)
  grid.length = 0
  gridEl.innerHTML = ''
  for(let r=0;r<GRID_SIZE;r++){
    const row = []
    for(let c=0;c<GRID_SIZE;c++){
      const cell = {
        r,c,
        wall:false,
        open:false,
        closed:false,
        path:false,
        el:document.createElement('div')
      }
      cell.el.className = 'cell'
      cell.el.dataset.r = r
      cell.el.dataset.c = c
      cell.el.id = makeCellId(r,c)
      cell.el.addEventListener('mousedown', onCellMouseDown)
      cell.el.addEventListener('mouseenter', onCellMouseEnter)
      cell.el.addEventListener('click', onCellClick)
      row.push(cell)
      gridEl.appendChild(cell.el)
    }
    grid.push(row)
  }
  updateStartEnd()
}

function updateStartEnd(){
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      const cell = grid[r][c]
      cell.el.classList.remove('start','end')
    }
  }
  grid[start.r][start.c].el.classList.add('start')
  grid[end.r][end.c].el.classList.add('end')
}

function clearSearchLayers(){
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      const cell = grid[r][c]
      cell.open = cell.closed = cell.path = false
      cell.el.classList.remove('open','closed','path')
    }
  }
  visitedCountEl.textContent = '0'
  pathLengthEl.textContent = '0'
  execTimeEl.textContent = '0'
  messageEl.textContent = ''
  statusTextEl.textContent = State.READY
}

function resetAll(){
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      const cell = grid[r][c]
      cell.wall = false
      cell.open = cell.closed = cell.path = false
      cell.el.className = 'cell'
    }
  }
  start = { r: 2, c: 2 }
  end = { r: 22, c: 22 }
  updateStartEnd()
  clearSearchLayers()
}

function setStatus(s){ statusTextEl.textContent = s }
function setMessage(m){ messageEl.textContent = m }

function inBounds(r,c){ return r>=0 && c>=0 && r<GRID_SIZE && c<GRID_SIZE }
function isStart(r,c){ return r===start.r && c===start.c }
function isEnd(r,c){ return r===end.r && c===end.c }

function onCellMouseDown(e){
  if(isSearching) return
  isMouseDown = e.buttons===1
  const r = +e.target.dataset.r
  const c = +e.target.dataset.c
  if(mode==='setStart'){
    if(!grid[r][c].wall && !isEnd(r,c)){
      start = { r, c }
      mode = 'none'
      updateStartEnd()
    }
    return
  }
  if(mode==='setEnd'){
    if(!grid[r][c].wall && !isStart(r,c)){
      end = { r, c }
      mode = 'none'
      updateStartEnd()
    }
    return
  }
  if(isStart(r,c) || isEnd(r,c)) return
  grid[r][c].wall = !grid[r][c].wall
  grid[r][c].el.classList.toggle('wall', grid[r][c].wall)
}

function onCellMouseEnter(e){
  if(isSearching) return
  if(!isMouseDown) return
  const r = +e.target.dataset.r
  const c = +e.target.dataset.c
  if(isStart(r,c) || isEnd(r,c)) return
  grid[r][c].wall = true
  grid[r][c].el.classList.add('wall')
}

function onCellClick(e){
  if(isSearching) return
  const r = +e.target.dataset.r
  const c = +e.target.dataset.c
  if(mode==='setStart'){
    if(!grid[r][c].wall && !isEnd(r,c)){
      start = { r, c }
      mode = 'none'
      updateStartEnd()
    }
    return
  }
  if(mode==='setEnd'){
    if(!grid[r][c].wall && !isStart(r,c)){
      end = { r, c }
      mode = 'none'
      updateStartEnd()
    }
    return
  }
  if(isStart(r,c) || isEnd(r,c)) return
  grid[r][c].wall = !grid[r][c].wall
  grid[r][c].el.classList.toggle('wall', grid[r][c].wall)
}

document.addEventListener('mouseup', ()=>{ isMouseDown = false })

document.addEventListener('dragstart', e=>{ e.preventDefault() })

document.addEventListener('selectstart', e=>{ e.preventDefault() })

function disableControls(disabled){
  setStartBtn.disabled = disabled
  setEndBtn.disabled = disabled
  clearPathBtn.disabled = disabled
  resetAllBtn.disabled = disabled
  algoSelect.disabled = disabled
  startSearchBtn.disabled = disabled
}

setStartBtn.addEventListener('click', ()=>{ if(!isSearching){ mode='setStart' } })
setEndBtn.addEventListener('click', ()=>{ if(!isSearching){ mode='setEnd' } })
clearPathBtn.addEventListener('click', ()=>{ if(!isSearching){ clearSearchLayers() } })
resetAllBtn.addEventListener('click', ()=>{ if(!isSearching){ resetAll() } })
startSearchBtn.addEventListener('click', startSearch)

function neighbors(r,c){
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
  const res = []
  for(const [dr,dc] of dirs){
    const nr=r+dr, nc=c+dc
    if(inBounds(nr,nc) && !grid[nr][nc].wall) res.push([nr,nc])
  }
  return res
}

function heuristic(a,b){
  return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)
}

function key(r,c){ return `${r},${c}` }

function reconstructPath(cameFrom){
  const path = []
  let k = key(end.r,end.c)
  while(cameFrom.has(k)){
    const [r,c] = cameFrom.get(k)
    if(!(r===start.r && c===start.c)) path.push([r,c])
    k = key(r,c)
  }
  path.reverse()
  return path
}

async function animateExploration(order){
  for(const [r,c,kind] of order){
    if(isStart(r,c) || isEnd(r,c)) continue
    const cell = grid[r][c]
    if(kind==='open' && !cell.open){ cell.open=true; cell.el.classList.add('open') }
    if(kind==='closed' && !cell.closed){ cell.closed=true; cell.el.classList.add('closed') }
    await new Promise(res=>setTimeout(res, ANIM_DELAY))
  }
}

async function animatePath(path){
  for(const [r,c] of path){
    if(isStart(r,c) || isEnd(r,c)) continue
    const cell = grid[r][c]
    cell.path = true
    cell.el.classList.add('path')
    await new Promise(res=>setTimeout(res, ANIM_DELAY))
  }
}

async function runAStar(){
  const openSet = new Set([key(start.r,start.c)])
  const cameFrom = new Map()
  const gScore = new Map([[key(start.r,start.c),0]])
  const fScore = new Map([[key(start.r,start.c), heuristic(start,end)]])
  const exploration = []
  let visited = 0

  while(openSet.size){
    let currentK = null
    let currentF = Infinity
    for(const k of openSet){
      const f = fScore.get(k) ?? Infinity
      if(f < currentF){ currentF = f; currentK = k }
    }
    const [cr,cc] = currentK.split(',').map(Number)
    if(!(cr===start.r && cc===start.c)) exploration.push([cr,cc,'closed'])
    if(cr===end.r && cc===end.c){
      const path = reconstructPath(cameFrom)
      return { path, exploration, visited }
    }
    openSet.delete(currentK)
    visited++
    for(const [nr,nc] of neighbors(cr,cc)){
      const nk = key(nr,nc)
      const tentativeG = (gScore.get(currentK) ?? Infinity) + 1
      if(tentativeG < (gScore.get(nk) ?? Infinity)){
        cameFrom.set(nk, [cr,cc])
        gScore.set(nk, tentativeG)
        fScore.set(nk, tentativeG + heuristic({r:nr,c:nc}, end))
        if(!openSet.has(nk)){
          openSet.add(nk)
          if(!(nr===start.r && nc===start.c)) exploration.push([nr,nc,'open'])
        }
      }
    }
  }
  return { path: null, exploration, visited }
}

async function runDijkstra(){
  const dist = new Map([[key(start.r,start.c),0]])
  const visitedSet = new Set()
  const cameFrom = new Map()
  const exploration = []
  let visited = 0

  function extractMin(){
    let minK=null, minV=Infinity
    for(const [k,v] of dist){
      if(visitedSet.has(k)) continue
      if(v < minV){ minV=v; minK=k }
    }
    return minK
  }

  while(true){
    const currentK = extractMin()
    if(currentK==null) break
    visitedSet.add(currentK)
    const [cr,cc] = currentK.split(',').map(Number)
    if(!(cr===start.r && cc===start.c)) exploration.push([cr,cc,'closed'])
    if(cr===end.r && cc===end.c){
      const path = reconstructPath(cameFrom)
      return { path, exploration, visited }
    }
    visited++
    for(const [nr,nc] of neighbors(cr,cc)){
      const nk = key(nr,nc)
      const alt = (dist.get(currentK) ?? Infinity) + 1
      if(alt < (dist.get(nk) ?? Infinity)){
        dist.set(nk, alt)
        cameFrom.set(nk, [cr,cc])
        if(!(nr===start.r && nc===start.c)) exploration.push([nr,nc,'open'])
      }
    }
  }
  return { path: null, exploration, visited }
}

async function runBFS(){
  const q = [[start.r,start.c]]
  const visitedSet = new Set([key(start.r,start.c)])
  const cameFrom = new Map()
  const exploration = []
  let visited = 0

  while(q.length){
    const [cr,cc] = q.shift()
    if(!(cr===start.r && cc===start.c)) exploration.push([cr,cc,'closed'])
    if(cr===end.r && cc===end.c){
      const path = reconstructPath(cameFrom)
      return { path, exploration, visited }
    }
    visited++
    for(const [nr,nc] of neighbors(cr,cc)){
      const nk = key(nr,nc)
      if(!visitedSet.has(nk)){
        visitedSet.add(nk)
        cameFrom.set(nk, [cr,cc])
        q.push([nr,nc])
        if(!(nr===start.r && nc===start.c)) exploration.push([nr,nc,'open'])
      }
    }
  }
  return { path: null, exploration, visited }
}

async function startSearch(){
  if(isSearching) return
  clearSearchLayers()
  isSearching = true
  disableControls(true)
  setStatus(State.SEARCHING)
  setMessage('')
  const t0 = performance.now()
  let result
  if(algoSelect.value==='astar') result = await runAStar()
  else if(algoSelect.value==='dijkstra') result = await runDijkstra()
  else result = await runBFS()
  const t1 = performance.now()
  execTimeEl.textContent = Math.round(t1 - t0).toString()
  visitedCountEl.textContent = result.visited.toString()
  await animateExploration(result.exploration)
  if(result.path){
    await animatePath(result.path)
    pathLengthEl.textContent = result.path.length.toString()
    setStatus(State.FOUND)
  } else {
    pathLengthEl.textContent = '0'
    setStatus(State.NOT_FOUND)
    setMessage('無法找到路徑')
  }
  isSearching = false
  disableControls(false)
}

createGrid()
