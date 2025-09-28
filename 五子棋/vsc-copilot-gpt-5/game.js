// 五子棋（Gomoku）— 簡易 AI 人機對戰
// 棋盤 15x15，玩家黑子先手（可切換），AI 使用啟發式評分 + Alpha-Beta 搜尋

(() => {
    const SIZE = 15; // board size
    const WIN_LEN = 5; // five in a row
    const EMPTY = 0, BLACK = 1, WHITE = 2; // stones

    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('status');
    const newGameBtn = document.getElementById('newGameBtn');
    const aiFirstToggle = document.getElementById('aiFirstToggle');
    const aiDepthRange = document.getElementById('aiDepth');
    const aiDepthLabel = document.getElementById('aiDepthLabel');

    // Layout
    const PADDING = 30;
    const GRID = (canvas.width - PADDING * 2) / (SIZE - 1);
    const STONE_R = GRID * 0.42;

    let board = createBoard(SIZE);
    let turn = BLACK; // BLACK: player by default
    let running = true;
    let moveHistory = [];
    let aiDepth = parseInt(aiDepthRange.value, 10) || 2;
    let aiThinking = false;

    aiDepthLabel.textContent = String(aiDepth);

    // Helpers
    function createBoard(n) {
        return Array.from({ length: n }, () => Array(n).fill(EMPTY));
    }

    function inBounds(x, y) { return x >= 0 && x < SIZE && y >= 0 && y < SIZE; }

    function cloneBoard(src) { return src.map(row => row.slice()); }

    function isWinAt(bd, x, y) {
        const c = bd[y][x];
        if (c === EMPTY) return false;
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (const [dx, dy] of dirs) {
            let cnt = 1;
            for (let k = 1; k < WIN_LEN; k++) { const nx = x + dx * k, ny = y + dy * k; if (!inBounds(nx, ny) || bd[ny][nx] !== c) break; cnt++; }
            for (let k = 1; k < WIN_LEN; k++) { const nx = x - dx * k, ny = y - dy * k; if (!inBounds(nx, ny) || bd[ny][nx] !== c) break; cnt++; }
            if (cnt >= WIN_LEN) return true;
        }
        return false;
    }

    function hasAnyWin(bd) {
        // Check only last move in normal gameplay. For generality, scan all.
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (bd[y][x] !== EMPTY && isWinAt(bd, x, y)) return bd[y][x];
            }
        }
        return 0;
    }

    function isFull(bd) {
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (bd[y][x] === EMPTY) return false;
        return true;
    }

    // Drawing
    function drawBoard() {
        // clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // wood texture lines
        ctx.fillStyle = '#c8a16a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // grid
        ctx.strokeStyle = '#5c4632';
        ctx.lineWidth = 1;
        for (let i = 0; i < SIZE; i++) {
            const x = PADDING + i * GRID;
            const y = PADDING + i * GRID;
            ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(canvas.width - PADDING, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, PADDING); ctx.lineTo(x, canvas.height - PADDING); ctx.stroke();
        }

        // star points (for 15x15 typical at 3, 7, 11)
        const stars = [3, 7, 11];
        ctx.fillStyle = '#3a2d22';
        for (const sy of stars) {
            for (const sx of stars) {
                const cx = PADDING + sx * GRID;
                const cy = PADDING + sy * GRID;
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // stones
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const v = board[y][x];
                if (v === EMPTY) continue;
                const cx = PADDING + x * GRID;
                const cy = PADDING + y * GRID;
                drawStone(cx, cy, v === BLACK);
            }
        }
    }

    function drawStone(cx, cy, isBlack) {
        const r = STONE_R;
        const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
        if (isBlack) {
            gradient.addColorStop(0, '#2b2b2b');
            gradient.addColorStop(0.5, '#111');
            gradient.addColorStop(1, '#000');
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#e8e8e8');
            gradient.addColorStop(1, '#d4d4d4');
            ctx.shadowColor = 'rgba(0,0,0,0.35)';
        }
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
    }

    function posToCell(px, py) {
        // snap to nearest grid point
        const x = Math.round((px - PADDING) / GRID);
        const y = Math.round((py - PADDING) / GRID);
        return { x, y };
    }

    function cellToCenter(x, y) {
        return { cx: PADDING + x * GRID, cy: PADDING + y * GRID };
    }

    // Gameplay
    function setStatus(msg) { statusEl.textContent = msg; }

    function resetGame() {
        board = createBoard(SIZE);
        moveHistory = [];
        running = true;
        aiThinking = false;
        turn = aiFirstToggle.checked ? WHITE : BLACK; // if AI first, AI is WHITE for contrast
        drawBoard();
        setStatus(turn === BLACK ? '你的回合（黑）' : '電腦計算中…');
        if (turn === WHITE) {
            // let AI play the first move at center
            aiMove();
        }
    }

    function place(x, y, color) {
        if (!inBounds(x, y) || board[y][x] !== EMPTY) return false;
        board[y][x] = color;
        moveHistory.push({ x, y, color });
        return true;
    }

    function handleClick(ev) {
        if (!running || aiThinking) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const px = (ev.clientX - rect.left) * scaleX;
        const py = (ev.clientY - rect.top) * scaleY;
        const { x, y } = posToCell(px, py);
        if (!inBounds(x, y) || board[y][x] !== EMPTY) return;
        if (turn !== BLACK) return; // player's color fixed as BLACK for UI clarity

        place(x, y, BLACK);
        drawBoard();
        if (isWinAt(board, x, y)) return endGame('你贏了！');
        if (isFull(board)) return endGame('和局');
        turn = WHITE;
        setStatus('電腦計算中…');
        aiMove();
    }

    function endGame(msg) {
        running = false;
        aiThinking = false;
        setStatus(msg);
    }

    // AI implementation
    // Generate moves near existing stones to reduce branching
    function generateMoves(bd) {
        const moves = [];
        let hasStone = false;
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (bd[y][x] !== EMPTY) { hasStone = true; break; }

        const consider = (x, y) => {
            if (!inBounds(x, y) || bd[y][x] !== EMPTY) return false;
            // Check neighborhood radius 2
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx, ny = y + dy;
                    if (inBounds(nx, ny) && bd[ny][nx] !== EMPTY) return true;
                }
            }
            return false;
        };

        if (!hasStone) {
            const c = Math.floor(SIZE / 2);
            return [{ x: c, y: c }];
        }
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (consider(x, y)) moves.push({ x, y });
            }
        }
        return moves;
    }

    // Pattern scoring helper
    // Evaluate a line (array of cells) for a given color
    function scoreLine(line, color) {
        const opp = color === BLACK ? WHITE : BLACK;
        let score = 0;

        // translate line into string of 'x' (color), 'o' (opp), '.' (empty)
        const s = line.map(v => v === color ? 'x' : (v === opp ? 'o' : '.')).join('');

        // count patterns by regex
        const add = (re, val) => { const m = s.match(re); if (m) score += m.length * val; };

        // five
        add(/xxxxx/g, 1000000);
        // open four, closed four（簡化版本）
        add(/\.xxxx\.|x\.xxx\.|xx\.xx\.|xxx\.x\./g, 15000);
        // simpler: detect '.xxxx.' as strongest four
        add(/\.xxxx\./g, 20000);
        // three
        add(/\.xxx\.|x\.xx\.|xx\.x\./g, 5000);
        // two
        add(/\.xx\.|x\.x\./g, 800);
        // one
        add(/\.x\./g, 80);

        // Slight bonus for centralization
        return score;
    }

    function getLines(bd, x, y) {
        // Get 4 lines passing through (x,y), length up to 9 centered
        const lines = [];
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (const [dx, dy] of dirs) {
            const cells = [];
            for (let k = -4; k <= 4; k++) {
                const nx = x + dx * k, ny = y + dy * k;
                if (inBounds(nx, ny)) cells.push(bd[ny][nx]);
            }
            lines.push(cells);
        }
        return lines;
    }

    function evaluateBoard(bd, color) {
        // Heuristic: sum of lines around all stones; faster: sample around last few moves
        // We'll evaluate on entire board but only along lines of occupied cells to keep it reasonable
        let scoreColor = 0, scoreOpp = 0;
        const opp = color === BLACK ? WHITE : BLACK;
        // For efficiency, traverse grid and for each non-empty cell, score lines through it only once per direction
        const seen = new Set();
        const keyFor = (x, y, dx, dy) => `${x},${y},${dx},${dy}`;
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (bd[y][x] === EMPTY) continue;
                for (const [dx, dy] of dirs) {
                    // define segment spanning up to 9 cells including (x,y)
                    let sx = x, sy = y;
                    while (inBounds(sx - dx, sy - dy) && Math.abs((sx - dx) - x) <= 4 && Math.abs((sy - dy) - y) <= 4) { sx -= dx; sy -= dy; }
                    const k = keyFor(sx, sy, dx, dy);
                    if (seen.has(k)) continue;
                    seen.add(k);
                    const line = [];
                    let cx = sx, cy = sy;
                    for (let t = 0; t < 9; t++) { if (!inBounds(cx, cy)) break; line.push(bd[cy][cx]); cx += dx; cy += dy; }
                    scoreColor += scoreLine(line, color);
                    scoreOpp += scoreLine(line, opp);
                }
            }
        }
        return scoreColor - scoreOpp * 1.03; // slight weight to defense
    }

    function aiMove() {
        aiThinking = true;
        // Allow UI to update
        setTimeout(() => {
            const { move } = findBestMove(board, WHITE, aiDepth, 1200); // 1200ms budget soft
            if (!move) {
                // no move means draw or full
                endGame('和局');
                drawBoard();
                return;
            }
            place(move.x, move.y, WHITE);
            drawBoard();
            if (isWinAt(board, move.x, move.y)) return endGame('電腦獲勝');
            if (isFull(board)) return endGame('和局');
            turn = BLACK;
            aiThinking = false;
            setStatus('你的回合（黑）');
        }, 30);
    }

    function orderMoves(bd, moves, color) {
        // quick sort by local evaluation placing color stone
        const scored = moves.map(m => {
            bd[m.y][m.x] = color;
            const val = localEval(bd, m.x, m.y, color);
            bd[m.y][m.x] = EMPTY;
            return { ...m, val };
        });
        scored.sort((a, b) => b.val - a.val);
        return scored.map(({ x, y }) => ({ x, y }));
    }

    function localEval(bd, x, y, color) {
        const lines = getLines(bd, x, y);
        const opp = color === BLACK ? WHITE : BLACK;
        let s = 0;
        for (const line of lines) s += scoreLine(line, color) - scoreLine(line, opp) * 1.02;
        // prefer center
        const center = (SIZE - 1) / 2;
        const d = Math.abs(x - center) + Math.abs(y - center);
        return s - d * 10;
    }

    function findBestMove(bd, color, maxDepth, timeMs = 1000) {
        const start = performance.now();
        let best = null, bestScore = -Infinity;
        const moves = generateMoves(bd);
        const ordered = orderMoves(bd, moves, color);

        // iterative deepening
        for (let depth = 1; depth <= maxDepth; depth++) {
            let curBest = best, curBestScore = bestScore;
            for (const m of (curBest ? [curBest, ...ordered.filter(mm => mm.x !== curBest.x || mm.y !== curBest.y)] : ordered)) {
                if (performance.now() - start > timeMs) break;
                bd[m.y][m.x] = color;
                if (isWinAt(bd, m.x, m.y)) {
                    bd[m.y][m.x] = EMPTY;
                    return { move: m, score: 999999 }; // immediate win
                }
                const sc = alphaBeta(bd, switchColor(color), depth - 1, -Infinity, Infinity, start, timeMs);
                bd[m.y][m.x] = EMPTY;
                if (sc > curBestScore) { curBestScore = sc; curBest = m; }
            }
            if (curBest) { best = curBest; bestScore = curBestScore; }
            if (performance.now() - start > timeMs) break;
        }
        return { move: best, score: bestScore };
    }

    function switchColor(c) { return c === BLACK ? WHITE : BLACK; }

    function alphaBeta(bd, color, depth, alpha, beta, start, timeMs) {
        if (depth === 0 || performance.now() - start > timeMs) {
            return evaluateBoard(bd, WHITE); // 固定以 AI（WHITE）的視角評分
        }
        // quick terminal check: last move in history
        const last = moveHistory[moveHistory.length - 1];
        if (last && isWinAt(bd, last.x, last.y)) {
            return last.color === WHITE ? 999999 - (moveHistory.length) : -999999 + (moveHistory.length);
        }
        if (isFull(bd)) return 0;

        const moves = orderMoves(bd, generateMoves(bd), color);
        if (moves.length === 0) return 0;

        if (color === WHITE) {
            // Maximizing player (AI)
            let value = -Infinity;
            for (const m of moves) {
                bd[m.y][m.x] = color;
                moveHistory.push({ x: m.x, y: m.y, color });
                const sc = alphaBeta(bd, BLACK, depth - 1, alpha, beta, start, timeMs);
                moveHistory.pop();
                bd[m.y][m.x] = EMPTY;
                if (sc > value) value = sc;
                if (value > alpha) alpha = value;
                if (alpha >= beta) break; // prune
                if (performance.now() - start > timeMs) break;
            }
            return value;
        } else {
            // Minimizing player (human)
            let value = Infinity;
            for (const m of moves) {
                bd[m.y][m.x] = color;
                moveHistory.push({ x: m.x, y: m.y, color });
                const sc = alphaBeta(bd, WHITE, depth - 1, alpha, beta, start, timeMs);
                moveHistory.pop();
                bd[m.y][m.x] = EMPTY;
                if (sc < value) value = sc;
                if (value < beta) beta = value;
                if (alpha >= beta) break; // prune
                if (performance.now() - start > timeMs) break;
            }
            return value;
        }
    }

    // UI events
    canvas.addEventListener('click', handleClick);
    newGameBtn.addEventListener('click', resetGame);
    aiFirstToggle.addEventListener('change', resetGame);
    aiDepthRange.addEventListener('input', () => {
        aiDepth = parseInt(aiDepthRange.value, 10) || 2;
        aiDepthLabel.textContent = String(aiDepth);
    });

    // Initial
    drawBoard();
    setStatus('按「新局」開始，或直接落子（你是黑）。');
})();
