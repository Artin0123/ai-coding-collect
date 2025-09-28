(() => {
    const BOARD_SIZE = 15;
    const EMPTY = 0;
    const HUMAN = 1;
    const AI = 2;
    const WIN_SCORE = 1_000_000;
    const directions = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 }
    ];

    const difficultyConfig = {
        easy: {
            label: "容易",
            weights: { offense: 1, defense: 1.05 },
            randomness: 0.35,
            topChoices: 4
        },
        normal: {
            label: "普通",
            weights: { offense: 1.15, defense: 1.15 },
            randomness: 0.15,
            topChoices: 2
        },
        hard: {
            label: "困難",
            weights: { offense: 1.35, defense: 1.25 },
            randomness: 0.03,
            topChoices: 1
        }
    };

    const boardElement = document.getElementById("board");
    const turnIndicator = document.getElementById("turnIndicator");
    const resetButton = document.getElementById("resetBtn");
    const difficultySelect = document.getElementById("difficulty");
    const logElement = document.getElementById("gameLog");
    const logTemplate = document.getElementById("logEntryTemplate");

    let board = [];
    let currentPlayer = HUMAN;
    let gameActive = true;
    let lastMove = null;

    initialise();

    function initialise() {
        createBoardCells();
        bindEvents();
        resetGame();
    }

    function createBoardCells() {
        boardElement.innerHTML = "";
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                const cell = document.createElement("button");
                cell.className = "cell";
                cell.type = "button";
                cell.dataset.row = String(row);
                cell.dataset.col = String(col);
                cell.setAttribute("role", "gridcell");
                cell.setAttribute("aria-label", `${formatCoordinate(row, col)} 空白`);
                boardElement.appendChild(cell);
            }
        }
    }

    function bindEvents() {
        boardElement.addEventListener("click", handleBoardClick);
        resetButton.addEventListener("click", () => {
            resetGame();
        });
        difficultySelect.addEventListener("change", () => {
            const config = getDifficultyConfig();
            addLog("系統", `已切換難度為「${config.label}」。`);
            updateTurnIndicator();
        });
    }

    function resetGame() {
        board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
        document.querySelectorAll(".cell").forEach((cell) => {
            cell.classList.remove("stone", "stone-human", "stone-ai", "last-move");
            cell.setAttribute("aria-label", `${formatCoordinate(Number(cell.dataset.row), Number(cell.dataset.col))} 空白`);
            cell.disabled = false;
        });

        logElement.innerHTML = "";
        currentPlayer = HUMAN;
        gameActive = true;
        lastMove = null;
        updateTurnIndicator();
        addLog("系統", "新的對局開始，玩家（黑子）先行。");
    }

    function handleBoardClick(event) {
        if (!gameActive || currentPlayer !== HUMAN) {
            return;
        }
        const target = event.target.closest(".cell");
        if (!target) {
            return;
        }
        const row = Number(target.dataset.row);
        const col = Number(target.dataset.col);
        if (board[row][col] !== EMPTY) {
            return;
        }

        makeMove(row, col, HUMAN);
        addLog("玩家", `落子 ${formatCoordinate(row, col)}。`);

        if (checkForConclusion(row, col, HUMAN)) {
            return;
        }

        currentPlayer = AI;
        updateTurnIndicator();

        window.setTimeout(() => {
            if (gameActive) {
                performAiMove();
            }
        }, 350);
    }

    function performAiMove() {
        const { move, reason } = chooseAiMove();
        if (!move) {
            // 極少數狀況：棋盤已滿或評估失敗
            gameActive = false;
            updateTurnIndicator();
            addLog("系統", "棋局結束。無可用步驟。");
            return;
        }

        const { row, col } = move;
        makeMove(row, col, AI);
        addLog("電腦", `${reason} 落子 ${formatCoordinate(row, col)}。`);

        if (checkForConclusion(row, col, AI)) {
            return;
        }

        currentPlayer = HUMAN;
        updateTurnIndicator();
    }

    function makeMove(row, col, player) {
        board[row][col] = player;
        const cell = getCell(row, col);
        cell.classList.add("stone", player === HUMAN ? "stone-human" : "stone-ai");
        cell.disabled = true;
        const labelPlayer = player === HUMAN ? "黑子" : "白子";
        cell.setAttribute("aria-label", `${formatCoordinate(row, col)}，${labelPlayer}`);
        highlightLastMove(row, col);
    }

    function highlightLastMove(row, col) {
        if (lastMove) {
            const prev = getCell(lastMove.row, lastMove.col);
            prev.classList.remove("last-move");
        }
        const current = getCell(row, col);
        current.classList.add("last-move");
        lastMove = { row, col };
    }

    function checkForConclusion(row, col, player) {
        if (hasFiveInARow(row, col, player)) {
            gameActive = false;
            const winner = player === HUMAN ? "玩家" : "電腦";
            updateTurnIndicator(winner);
            addLog("系統", `${winner} 連成五子，獲勝！`);
            announce(`${winner} 勝利！`);
            disableRemainingCells();
            return true;
        }

        if (isBoardFull()) {
            gameActive = false;
            updateTurnIndicator("平手");
            addLog("系統", "棋盤已滿，雙方平手。");
            announce("平手。");
            disableRemainingCells();
            return true;
        }

        return false;
    }

    function disableRemainingCells() {
        document.querySelectorAll(".cell").forEach((cell) => {
            cell.disabled = true;
        });
    }

    function chooseAiMove() {
        const config = getDifficultyConfig();
        let bestMoves = [];
        let maxScore = -Infinity;
        let priorityMove = null;
        let priorityReason = "";

        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                if (board[row][col] !== EMPTY) {
                    continue;
                }
                const { score, offense, defense } = evaluateCell(row, col, config);

                if (offense >= WIN_SCORE) {
                    return {
                        move: { row, col },
                        reason: "發現制勝棋型"
                    };
                }

                if (defense >= 100_000 && (!priorityMove || defense > priorityMove.defense)) {
                    priorityMove = { row, col, defense };
                    priorityReason = "阻擋玩家的威脅";
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestMoves = [{ row, col, score }];
                } else if (score === maxScore) {
                    bestMoves.push({ row, col, score });
                }
            }
        }

        if (priorityMove) {
            return { move: priorityMove, reason: priorityReason };
        }

        if (bestMoves.length === 0) {
            return { move: null, reason: "" };
        }

        bestMoves.sort((a, b) => b.score - a.score);
        const topCandidates = bestMoves.slice(0, Math.min(config.topChoices, bestMoves.length));
        const chosen = pickWithRandomness(topCandidates, maxScore, config.randomness);

        return {
            move: chosen,
            reason: config.label === "困難" ? "精準計算" : "評估最佳位置"
        };
    }

    function evaluateCell(row, col, config) {
        let offense = 0;
        let defense = 0;

        for (const { dx, dy } of directions) {
            const offensivePattern = measurePattern(row, col, dx, dy, AI);
            const defensivePattern = measurePattern(row, col, dx, dy, HUMAN);
            offense += patternScore(offensivePattern.count, offensivePattern.openEnds);
            defense += patternScore(defensivePattern.count, defensivePattern.openEnds);
        }

        const weightedScore = offense * config.weights.offense + defense * config.weights.defense;
        return { score: weightedScore, offense, defense };
    }

    function measurePattern(row, col, dx, dy, player) {
        let total = 1; // 包含當前落子
        let openEnds = 0;

        const forward = traceDirection(row + dx, col + dy, dx, dy, player);
        const backward = traceDirection(row - dx, col - dy, -dx, -dy, player);

        total += forward.count + backward.count;
        openEnds = forward.open + backward.open;

        return { count: total, openEnds };
    }

    function traceDirection(row, col, dx, dy, player) {
        let count = 0;
        let open = 0;
        let currentRow = row;
        let currentCol = col;

        while (isInside(currentRow, currentCol) && board[currentRow][currentCol] === player) {
            count += 1;
            currentRow += dx;
            currentCol += dy;
        }

        if (isInside(currentRow, currentCol) && board[currentRow][currentCol] === EMPTY) {
            open = 1;
        }

        return { count, open };
    }

    function patternScore(count, openEnds) {
        if (count >= 5) {
            return WIN_SCORE;
        }

        if (openEnds === 2) {
            switch (count) {
                case 4:
                    return 200_000;
                case 3:
                    return 30_000;
                case 2:
                    return 2_000;
                default:
                    return 200;
            }
        }

        if (openEnds === 1) {
            switch (count) {
                case 4:
                    return 30_000;
                case 3:
                    return 3_500;
                case 2:
                    return 300;
                default:
                    return 60;
            }
        }

        if (openEnds === 0) {
            switch (count) {
                case 4:
                    return 1_500;
                case 3:
                    return 150;
                case 2:
                    return 40;
                default:
                    return 10;
            }
        }

        return 5;
    }

    function pickWithRandomness(candidates, maxScore, randomness) {
        if (candidates.length === 1 || randomness <= 0) {
            return candidates[0];
        }

        let selected = candidates[0];
        let bestValue = -Infinity;

        for (const candidate of candidates) {
            const value = candidate.score + Math.random() * randomness * maxScore;
            if (value > bestValue) {
                bestValue = value;
                selected = candidate;
            }
        }

        return selected;
    }

    function hasFiveInARow(row, col, player) {
        return directions.some(({ dx, dy }) => countConsecutive(row, col, dx, dy, player) >= 5);
    }

    function countConsecutive(row, col, dx, dy, player) {
        let total = 1;

        total += countOneDirection(row + dx, col + dy, dx, dy, player);
        total += countOneDirection(row - dx, col - dy, -dx, -dy, player);

        return total;
    }

    function countOneDirection(row, col, dx, dy, player) {
        let count = 0;
        let r = row;
        let c = col;

        while (isInside(r, c) && board[r][c] === player) {
            count += 1;
            r += dx;
            c += dy;
        }
        return count;
    }

    function isBoardFull() {
        return board.every((row) => row.every((cell) => cell !== EMPTY));
    }

    function isInside(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    function getCell(row, col) {
        return boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    function updateTurnIndicator(forceText) {
        if (forceText) {
            turnIndicator.textContent = forceText;
            return;
        }
        turnIndicator.textContent = currentPlayer === HUMAN ? "玩家" : "電腦";
    }

    function announce(message) {
        const liveRegion = document.createElement("div");
        liveRegion.setAttribute("role", "alert");
        liveRegion.className = "sr-only";
        liveRegion.textContent = message;
        document.body.appendChild(liveRegion);
        window.setTimeout(() => liveRegion.remove(), 1000);
    }

    function addLog(side, message) {
        const entry = logTemplate.content.firstElementChild.cloneNode(true);
        entry.innerHTML = `<strong>${side}</strong>：${message}`;
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
    }

    function formatCoordinate(row, col) {
        const columnLetter = String.fromCharCode("A".charCodeAt(0) + col);
        return `${columnLetter}${row + 1}`;
    }

    function getDifficultyConfig() {
        const key = difficultySelect.value;
        return difficultyConfig[key] || difficultyConfig.normal;
    }
})();
