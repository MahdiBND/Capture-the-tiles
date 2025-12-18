/* ----------------------------------------------------
BOARD LOGIC
---------------------------------------------------- */
function initBoard() {
  board = [];
  for (let r = 0; r < SIZE; r++) {
    board[r] = [];
    for (let c = 0; c < SIZE; c++) {
      const isCorner = (r===0&&c===0)||(r===0&&c===7)||(r===7&&c===0)||(r===7&&c===7);
      board[r][c] = { row:r, col:c, owner:null, base:isCorner ? 5 : 0 };
    }
  }
  board[0][0].owner = 1;
  board[7][7].owner = 1;
  board[0][7].owner = 2;
  board[7][0].owner = 2;
}

function renderBoard(lastAIMove = null) {
  const container = document.getElementById("board");
  container.innerHTML = "";
  const isHumanTurn = !singlePlayer || turn === HUMAN_PLAYER;
  const gameNotOver = !board.flat().every(c => c.owner !== null);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cellData = board[r][c];
      const cell = document.createElement("div");
      cell.className = "cell";
      if (cellData.owner === 1) cell.classList.add("p1");
      if (cellData.owner === 2) cell.classList.add("p2");

      // Static highlight for valid moves (human turn)
      if (isHumanTurn && gameNotOver && cellData.owner === null && isSelectable(cellData)) {
        cell.classList.add("valid-move");
      }

      // Temporary animated highlight for AI's move
      if (lastAIMove && lastAIMove[0] === r && lastAIMove[1] === c) {
        cell.classList.add("ai-move-highlight");
      }

      if (cellData.base > 0) {
        cell.innerHTML = `<span class="base">${cellData.base}</span>`;
      }
      cell.onclick = () => handleMove(r, c);
      cell.ontouchstart = e => { e.preventDefault(); handleMove(r, c); };
      container.appendChild(cell);
    }
  }
  updateScores();
}

/* ----------------------------------------------------
SCORES + TURNS
---------------------------------------------------- */
function updateScores() {
  let p1 = 0, p2 = 0;
  board.flat().forEach(c => {
    if (c.owner === 1) p1 += c.base;
    if (c.owner === 2) p2 += c.base;
  });
  document.getElementById("p1score").textContent = p1;
  document.getElementById("p2score").textContent = p2;
  updateTurnDisplay();
}

function updateTurnDisplay() {
  const el = document.getElementById("turn-display");
  el.textContent = `Turn: Player ${turn}`;
  el.classList.remove("player1-turn", "player2-turn");
  el.classList.add(turn === 1 ? "player1-turn" : "player2-turn");
}
