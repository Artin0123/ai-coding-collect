document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const size = 15;
    let currentPlayer = 'black';
    let gameBoard = Array(size).fill().map(() => Array(size).fill(null));

    // 初始化棋盘
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }

    function handleCellClick(event) {
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (gameBoard[row][col] !== null) return;

        // 玩家落子
        gameBoard[row][col] = currentPlayer;
        cell.classList.add(currentPlayer);

        if (checkWin(row, col, currentPlayer)) {
            alert(`${currentPlayer === 'black' ? '黑棋' : '白棋'}获胜！`);
            resetGame();
            return;
        }

        currentPlayer = 'white';

        // 简单AI落子
        setTimeout(() => {
            const emptyCells = [];
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (gameBoard[i][j] === null) {
                        emptyCells.push({ row: i, col: j });
                    }
                }
            }

            if (emptyCells.length > 0) {
                const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                gameBoard[randomCell.row][randomCell.col] = 'white';
                const aiCell = document.querySelector(`[data-row="${randomCell.row}"][data-col="${randomCell.col}"]`);
                aiCell.classList.add('white');

                if (checkWin(randomCell.row, randomCell.col, 'white')) {
                    alert('白棋获胜！');
                    resetGame();
                    return;
                }

                currentPlayer = 'black';
            }
        }, 500);
    }

    function checkWin(row, col, player) {
        const directions = [
            { dr: 0, dc: 1 },  // 水平
            { dr: 1, dc: 0 },  // 垂直
            { dr: 1, dc: 1 },  // 对角线
            { dr: 1, dc: -1 }  // 反对角线
        ];

        for (const dir of directions) {
            let count = 1;

            // 正向检查
            for (let i = 1; i < 5; i++) {
                const r = row + dir.dr * i;
                const c = col + dir.dc * i;
                if (r < 0 || r >= size || c < 0 || c >= size || gameBoard[r][c] !== player) break;
                count++;
            }

            // 反向检查
            for (let i = 1; i < 5; i++) {
                const r = row - dir.dr * i;
                const c = col - dir.dc * i;
                if (r < 0 || r >= size || c < 0 || c >= size || gameBoard[r][c] !== player) break;
                count++;
            }

            if (count >= 5) return true;
        }

        return false;
    }

    function resetGame() {
        gameBoard = Array(size).fill().map(() => Array(size).fill(null));
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('black', 'white');
        });
        currentPlayer = 'black';
    }
});