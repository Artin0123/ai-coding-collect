const SIZE = 15
const STAR_POINTS = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11]
]
const BOARD_PX = 660
const PADDING = 20
const GRID_AREA = BOARD_PX - PADDING * 2
const CELL = GRID_AREA / (SIZE - 1)
const STONE_RATIO = 0.8
const STONE_RADIUS = (CELL * STONE_RATIO) / 2

const canvas = document.getElementById('board')
const ctx = canvas.getContext('2d')
const turnEl = document.getElementById('turn')
const restartBtn = document.getElementById('restart')

let board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
let current = 1
let ended = false

function drawBoard() {
  ctx.clearRect(0, 0, BOARD_PX, BOARD_PX)
  ctx.fillStyle = '#DEB887'
  ctx.fillRect(0, 0, BOARD_PX, BOARD_PX)

  ctx.strokeStyle = '#8B4513'
  ctx.lineWidth = 2

  for (let i = 0; i < SIZE; i++) {
    const x = PADDING + i * CELL
    const y = PADDING + i * CELL
    ctx.beginPath()
    ctx.moveTo(PADDING, y)
    ctx.lineTo(PADDING + GRID_AREA, y)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x, PADDING)
    ctx.lineTo(x, PADDING + GRID_AREA)
    ctx.stroke()
  }

  for (const [r, c] of STAR_POINTS) {
    const x = PADDING + c * CELL
    const y = PADDING + r * CELL
    ctx.beginPath()
    ctx.fillStyle = '#8B4513'
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c]
      if (v !== 0) drawStone(r, c, v === 1)
    }
  }
}

function drawStone(r, c, isBlack) {
  const x = PADDING + c * CELL
  const y = PADDING + r * CELL

  const radius = STONE_RADIUS
  const grad = ctx.createRadialGradient(
    x - radius * 0.4, y - radius * 0.4, radius * 0.1,
    x, y, radius
  )
  if (isBlack) {
    grad.addColorStop(0, '#666')
    grad.addColorStop(0.4, '#111')
    grad.addColorStop(1, '#000')
  } else {
    grad.addColorStop(0, '#fff')
    grad.addColorStop(0.5, '#e6e6e6')
    grad.addColorStop(1, '#cfcfcf')
  }
  ctx.beginPath()
  ctx.fillStyle = grad
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function screenToGrid(x, y) {
  const gx = (x - PADDING) / CELL
  const gy = (y - PADDING) / CELL
  const c = Math.round(gx)
  const r = Math.round(gy)
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null
  const px = PADDING + c * CELL
  const py = PADDING + r * CELL
  const dist = Math.hypot(px - x, py - y)
  if (dist <= STONE_RADIUS) return { r, c }
  return null
}

function place(r, c, color) {
  if (ended) return false
  if (board[r][c] !== 0) return false
  board[r][c] = color
  drawBoard()
  const winner = checkWin(r, c, color)
  if (winner) endGame(color)
  return true
}

function countDir(r, c, dr, dc, color) {
  let cnt = 0
  let nr = r + dr
  let nc = c + dc
  while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === color) {
    cnt++
    nr += dr
    nc += dc
  }
  return cnt
}

function checkWin(r, c, color) {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ]
  for (const [dr, dc] of dirs) {
    const total = 1 + countDir(r, c, dr, dc, color) + countDir(r, c, -dr, -dc, color)
    if (total >= 5) return true
  }
  return false
}

function endGame(color) {
  ended = true
  const msg = color === 1 ? '黑方勝利！' : '白方勝利！'
  setTimeout(() => alert(msg), 10)
}

function updateTurn() {
  turnEl.textContent = `當前回合：${current === 1 ? '黑方' : '白方'}`
}

function reset() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  current = 1
  ended = false
  updateTurn()
  drawBoard()
}

canvas.addEventListener('click', (e) => {
  if (ended || current !== 1) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const cell = screenToGrid(x, y)
  if (!cell) return
  if (!place(cell.r, cell.c, 1)) return
  current = 2
  updateTurn()
  if (!ended) setTimeout(aiMove, 300)
})

restartBtn.addEventListener('click', reset)

function aiMove() {
  if (ended) return
  const move = chooseAIMove()
  if (move) {
    place(move.r, move.c, 2)
  }
  if (!ended) {
    current = 1
    updateTurn()
  }
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

function lineScore(r, c, dr, dc, color) {
  let count = 0
  let blocks = 0
  let spaces = 0

  let nr = r + dr
  let nc = c + dc
  while (inBounds(nr, nc) && board[nr][nc] === color) {
    count++
    nr += dr
    nc += dc
  }
  if (!inBounds(nr, nc) || (board[nr]?.[nc] && board[nr][nc] !== 0)) blocks++
  if (inBounds(nr, nc) && board[nr][nc] === 0) spaces++

  nr = r - dr
  nc = c - dc
  while (inBounds(nr, nc) && board[nr][nc] === color) {
    count++
    nr -= dr
    nc -= dc
  }
  if (!inBounds(nr, nc) || (board[nr]?.[nc] && board[nr][nc] !== 0)) blocks++
  if (inBounds(nr, nc) && board[nr][nc] === 0) spaces++

  if (count >= 4) return 100000
  if (count === 3 && blocks === 0) return 10000
  if (count === 3 && blocks === 1) return 1000
  if (count === 2 && blocks === 0) return 200
  if (count === 2 && blocks === 1) return 50
  if (count === 1 && blocks === 0) return 10
  return 1
}

function heuristic(r, c, color) {
  if (board[r][c] !== 0) return -Infinity
  let score = 0
  const dirs = [
    [0,1],[1,0],[1,1],[1,-1]
  ]
  for (const [dr, dc] of dirs) {
    score += lineScore(r, c, dr, dc, color)
  }
  const center = Math.abs(7 - r) + Math.abs(7 - c)
  score += Math.max(0, 20 - center)

  const near = [
    [-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]
  ]
  let adjacency = 0
  for (const [dr, dc] of near) {
    const nr = r + dr, nc = c + dc
    if (inBounds(nr, nc) && board[nr][nc] !== 0) adjacency++
  }
  score += adjacency * 5
  return score
}

function chooseAIMove() {
  let best = null
  let bestScore = -Infinity
  let candidates = []

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== 0) continue

      const myScore = heuristic(r, c, 2)
      const oppScore = heuristic(r, c, 1)

      let score = myScore + oppScore * 1.1

      const testWin = wouldWin(r, c, 2)
      if (testWin) score += 200000
      const blockLoss = wouldWin(r, c, 1)
      if (blockLoss) score += 150000

      candidates.push({ r, c, score })
      if (score > bestScore) {
        bestScore = score
        best = { r, c }
      }
    }
  }

  const top = candidates.sort((a,b)=>b.score-a.score).slice(0, 8)
  if (top.length === 0) return null
  const weights = top.map((t, i) => Math.max(1, top.length - i))
  const sum = weights.reduce((a,b)=>a+b,0)
  let rnd = Math.random() * sum
  for (let i = 0; i < top.length; i++) {
    rnd -= weights[i]
    if (rnd <= 0) return { r: top[i].r, c: top[i].c }
  }
  return best
}

function wouldWin(r, c, color) {
  board[r][c] = color
  const win = checkWin(r, c, color)
  board[r][c] = 0
  return win
}

reset()
