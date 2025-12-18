/* ----------------------------------------------------
AI: MINIMAX + TT + ITERATIVE DEEPENING
---------------------------------------------------- */
function minimax(state, depth, alpha, beta, maximizing) {
  const hash = hashState(state);
  if (tt.has(hash)) {
    const entry = tt.get(hash);
    if (entry.depth >= depth) return [entry.score, entry.move];
  }
  const player = maximizing ? AI_PLAYER : HUMAN_PLAYER;
  let moves = getValidMoves(state, player);
  if (depth === 0 || moves.length === 0) {
    return [evaluateBoard(state), null];
  }
  moves = orderMoves(state, moves, player);
  let bestMove = moves[0];
  if (maximizing) {
    let best = -Infinity;
    for (const [r,c] of moves) {
      const result = minimax(applyMove(state,r,c,AI_PLAYER), depth-1, alpha, beta, false);
      if (result[0] > best) {
        best = result[0];
        bestMove = [r,c];
      }
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    tt.set(hash, {score:best, move:bestMove, depth});
    return [best, bestMove];
  } else {
    let best = +Infinity;
    for (const [r,c] of moves) {
      const result = minimax(applyMove(state,r,c,HUMAN_PLAYER), depth-1, alpha, beta, true);
      if (result[0] < best) {
        best = result[0];
        bestMove = [r,c];
      }
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    tt.set(hash, {score:best, move:bestMove, depth});
    return [best, bestMove];
  }
}

async function iterativeDeepening(state, maxDepth) {
  let best = null;
  for (let d=1; d<=maxDepth; d++) {
    best = minimax(state, d, -Infinity, Infinity, true)[1];
    await new Promise(r => setTimeout(r));
  }
  return best;
}

/* ----------------------------------------------------
AI MOVE
---------------------------------------------------- */
async function aiMove() {
  document.getElementById("aiThinking").classList.add("visible");
  await new Promise(requestAnimationFrame);

  const depth = parseInt(document.getElementById("aiDepthSelect").value);
  const move = await iterativeDeepening(board, depth);

  let lastMove = null;
  if (move) {
    board = applyMove(board, move[0], move[1], AI_PLAYER);
    lastMove = move; // remember AI's move
  }

  turn = HUMAN_PLAYER;

  document.getElementById("aiThinking").classList.remove("visible");

  // Render with AI move highlight
  renderBoard(lastMove);

  // Remove highlight after 1 second
  if (lastMove) {
    setTimeout(() => {
      const cells = document.querySelectorAll('.cell');
      const index = lastMove[0] * SIZE + lastMove[1];
      if (cells[index]) {
        cells[index].classList.remove('ai-move-highlight');
      }
    }, 1000);
  }

  checkGameOver();
}
