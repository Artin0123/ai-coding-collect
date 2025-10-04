const canvas = document.getElementById('board')
const ctx = canvas.getContext('2d')
const statusEl = document.getElementById('status')
const restartBtn = document.getElementById('restart')

const SIZE = 15
let boardPx = Math.min(canvas.width, canvas.height)
let gridCount = SIZE
let cell = Math.floor(boardPx / (gridCount - 1))
let margin = Math.round((boardPx - cell * (gridCount - 1)) / 2)

const LINE_COLOR = '#8B4513'
const LINE_WIDTH = 2
const STAR_RADIUS = 4

const EMPTY = 0
const BLACK = 1
const WHITE = 2

let board = createBoard()
let current = BLACK
let gameOver = false

function createBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY))
  return b
}

function reset() {
  board = createBoard()
  current = BLACK
  gameOver = false
  statusEl.textContent = '當前回合：黑方'
  draw()
}

function canvasCoord(i) {
  return margin + i * cell
}

function drawBoardGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#DEB887'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = LINE_COLOR
  ctx.lineWidth = LINE_WIDTH
  const start = canvasCoord(0)
  const end = canvasCoord(SIZE - 1)

  for (let i = 0; i < SIZE; i++) {
    const pos = canvasCoord(i)
    ctx.beginPath()
    ctx.moveTo(start, pos)
    ctx.lineTo(end, pos)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(pos, start)
    ctx.lineTo(pos, end)
    ctx.stroke()
  }

  const stars = [
    [3,3],[3,7],[3,11],
    [7,3],[7,7],[7,11],
    [11,3],[11,7],[11,11]
  ]
  ctx.fillStyle = LINE_COLOR
  for (const [r, c] of stars) {
    const x = canvasCoord(c)
    const y = canvasCoord(r)
    ctx.beginPath()
    ctx.arc(x, y, STAR_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPiece(x, y, color) {
  const r = (cell * 0.8) / 2
  const grad = ctx.createRadialGradient(x - r/3, y - r/3, r*0.1, x, y, r)
  if (color === BLACK) {
    grad.addColorStop(0, '#666')
    grad.addColorStop(0.6, '#111')
    grad.addColorStop(1, '#000')
  } else {
    grad.addColorStop(0, '#fff')
    grad.addColorStop(0.6, '#eee')
    grad.addColorStop(1, '#ddd')
  }
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawPieces() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c]
      if (v !== EMPTY) {
        drawPiece(canvasCoord(c), canvasCoord(r), v)
      }
    }
  }
}

function draw() {
  drawBoardGrid()
  drawPieces()
}

draw()

function getCellFromEvent(evt) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (evt.clientX - rect.left) * scaleX
  const y = (evt.clientY - rect.top) * scaleY

  let bestR = -1, bestC = -1
  let bestDist = Infinity
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cx = canvasCoord(c)
      const cy = canvasCoord(r)
      const dx = x - cx
      const dy = y - cy
      const dist = Math.hypot(dx, dy)
      if (dist < bestDist) {
        bestDist = dist
        bestR = r
        bestC = c
      }
    }
  }
  const snapTolerance = cell * 0.35
  if (bestDist <= snapTolerance) return { r: bestR, c: bestC }
  return null
}

function inside(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

function place(r, c, color) {
  if (!inside(r, c)) return false
  if (board[r][c] !== EMPTY) return false
  board[r][c] = color
  return true
}

function countDirection(r, c, dr, dc, color) {
  let cnt = 0
  let i = r + dr, j = c + dc
  while (inside(i, j) && board[i][j] === color) {
    cnt++
    i += dr
    j += dc
  }
  return cnt
}

function isWinAt(r, c, color) {
  const dirs = [
    [0,1], [1,0], [1,1], [1,-1]
  ]
  for (const [dr, dc] of dirs) {
    const total = 1 + countDirection(r, c, dr, dc, color) + countDirection(r, c, -dr, -dc, color)
    if (total >= 5) return true
  }
  return false
}

function hasWinner() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c]
      if (v !== EMPTY && isWinAt(r, c, v)) return v
    }
  }
  return EMPTY
}

function emptyCellsNear(radius = 2) {
  const cells = []
  let hasAny = false
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) {
        hasAny = true
        break
      }
    }
    if (hasAny) break
  }
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue
      if (!hasAny) { cells.push([r,c]); continue }
      let ok = false
      for (let dr = -radius; dr <= radius && !ok; dr++) {
        for (let dc = -radius; dc <= radius && !ok; dc++) {
          const nr = r + dr, nc = c + dc
          if (inside(nr, nc) && board[nr][nc] !== EMPTY) ok = true
        }
      }
      if (ok) cells.push([r,c])
    }
  }
  return cells
}

function scorePoint(r, c, color) {
  const opp = color === BLACK ? WHITE : BLACK
  let score = 0
  const dirs = [
    [0,1], [1,0], [1,1], [1,-1]
  ]
  for (const [dr, dc] of dirs) {
    let own = 1 + countDirection(r, c, dr, dc, color) + countDirection(r, c, -dr, -dc, color)
    let blockOwn = 0
    let i1 = r + dr * (countDirection(r, c, dr, dc, color) + 1)
    let j1 = c + dc * (countDirection(r, c, dr, dc, color) + 1)
    if (inside(i1, j1) && board[i1][j1] === opp) blockOwn++
    let i2 = r - dr * (countDirection(r, c, -dr, -dc, color) + 1)
    let j2 = c - dc * (countDirection(r, c, -dr, -dc, color) + 1)
    if (inside(i2, j2) && board[i2][j2] === opp) blockOwn++

    let oppn = 1 + countDirection(r, c, dr, dc, opp) + countDirection(r, c, -dr, -dc, opp)
    let blockOpp = 0
    let k1 = r + dr * (countDirection(r, c, dr, dc, opp) + 1)
    let l1 = c + dc * (countDirection(r, c, dr, dc, opp) + 1)
    if (inside(k1, l1) && board[k1][l1] === color) blockOpp++
    let k2 = r - dr * (countDirection(r, c, -dr, -dc, opp) + 1)
    let l2 = c - dc * (countDirection(r, c, -dr, -dc, opp) + 1)
    if (inside(k2, l2) && board[k2][l2] === color) blockOpp++

    if (own >= 5) score += 100000
    else if (own === 4 && blockOwn < 2) score += 10000
    else if (own === 3 && blockOwn < 2) score += 1000
    else if (own === 2) score += 100

    if (oppn >= 5) score += 90000
    else if (oppn === 4 && blockOpp < 2) score += 9000
    else if (oppn === 3 && blockOpp < 2) score += 900
  }

  const center = Math.floor(SIZE / 2)
  const distCenter = Math.hypot(r - center, c - center)
  score += Math.max(0, (SIZE/2 - distCenter)) * 10

  return score
}

function aiMove() {
  if (gameOver) return
  const cells = emptyCellsNear(2)
  if (cells.length === 0) return

  let best = null
  let bestScore = -Infinity

  for (const [r, c] of cells) {
    const s = scorePoint(r, c, WHITE)
    if (s > bestScore) {
      bestScore = s
      best = [r, c]
    }
  }

  const top = []
  for (const [r, c] of cells) {
    const s = scorePoint(r, c, WHITE)
    if (s >= bestScore * 0.9) top.push([r,c])
  }
  const pick = top.length ? top[Math.floor(Math.random() * top.length)] : best

  placeAndCheck(pick[0], pick[1])
}

function placeAndCheck(r, c) {
  if (!place(r, c, current)) return false
  draw()
  if (isWinAt(r, c, current)) {
    gameOver = true
    alert((current === BLACK ? '黑方' : '白方') + '勝利！')
    return true
  }
  current = current === BLACK ? WHITE : BLACK
  statusEl.textContent = '當前回合：' + (current === BLACK ? '黑方' : '白方')
  return false
}

canvas.addEventListener('click', (evt) => {
  if (gameOver || current !== BLACK) return
  const cellPos = getCellFromEvent(evt)
  if (!cellPos) return
  const { r, c } = cellPos
  if (!placeAndCheck(r, c)) {
    setTimeout(() => {
      if (!gameOver) aiMove()
    }, 300)
  } else {
    return
  }
})

restartBtn.addEventListener('click', () => {
  reset()
})

window.addEventListener('resize', () => {
  const size = Math.min(window.innerWidth - 40, 720)
  canvas.width = size
  canvas.height = size
  boardPx = Math.min(canvas.width, canvas.height)
  cell = Math.floor(boardPx / (gridCount - 1))
  margin = Math.round((boardPx - cell * (gridCount - 1)) / 2)
  draw()
})

;(function init() {
  const size = Math.min(window.innerWidth - 40, 720)
  canvas.width = size
  canvas.height = size
  boardPx = Math.min(canvas.width, canvas.height)
  cell = Math.floor(boardPx / (gridCount - 1))
  margin = Math.round((boardPx - cell * (gridCount - 1)) / 2)
  draw()
})()
