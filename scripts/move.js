/* ----------------------------------------------------
MOVE LOGIC
---------------------------------------------------- */
function isSelectable(cell, state = board) {
  if (cell.owner !== null) return false;
  for (const [dr,dc] of dirs) {
    const nr = cell.row + dr, nc = cell.col + dc;
    if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && state[nr][nc].owner !== null) return true;
  }
  return false;
}

function applyMove(state, r, c, player) {
  const newState = JSON.parse(JSON.stringify(state));
  const cell = newState[r][c];
  cell.owner = player;
  cell.base += 1;
  for (const [dr,dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && newState[nr][nc].owner !== null) {
      newState[nr][nc].owner = player;
      newState[nr][nc].base += 1;
    }
  }
  return newState;
}

function getValidMoves(state, player) {
  let moves = [];
  state.flat().forEach(cell => {
    if (isSelectable(cell, state)) {
      moves.push([cell.row, cell.col]);
    }
  });
  return moves;
}

/* ----------------------------------------------------
HUMAN ACTION
---------------------------------------------------- */
function handleMove(r, c) {
  if (turn === AI_PLAYER && singlePlayer) return;
  if (!isSelectable(board[r][c])) return;
  board = applyMove(board, r, c, turn);
  turn = turn === 1 ? 2 : 1;
  renderBoard();
  if (!checkGameOver() && turn === AI_PLAYER && singlePlayer) {
    setTimeout(aiMove, 200);
  }
}
