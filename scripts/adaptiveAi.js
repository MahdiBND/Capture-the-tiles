/* ----------------------------------------------------
ULTRA HARD AI — ADAPTIVE DEPTH EXTENSION
Only logic-related changes are included.
---------------------------------------------------- */

const SIZE = 8;
let turn = 1;
let board = [];
let singlePlayer = true;
const AI_PLAYER = 2;
const HUMAN_PLAYER = 1;

const dirs = [
  [-1,-1],[-1,0],[-1,1],
  [0,-1], [0,1],
  [1,-1],[1,0],[1,1]
];

let zobrist = [];
let tt = new Map();
let playerThreatLevel = 0;

/* ----------------------------------------------------
ZOBRIST
---------------------------------------------------- */
function initZobrist() {
  zobrist = [];
  for (let r = 0; r < SIZE; r++) {
    zobrist[r] = [];
    for (let c = 0; c < SIZE; c++) {
      zobrist[r][c] = [
        Math.random()*2**32,
        Math.random()*2**32,
        Math.random()*2**32
      ];
    }
  }
}

function hashState(state) {
  let h = 0;
  for (let r=0; r<SIZE; r++) {
    for (let c=0; c<SIZE; c++) {
      const o = state[r][c].owner ?? 0;
      h ^= zobrist[r][c][o];
    }
  }
  return h;
}

/* ----------------------------------------------------
INIT + MODE SELECT
---------------------------------------------------- */
function startGame(vsAI) {
  singlePlayer = vsAI;
  document.getElementById("scores").style.display = "block";
  document.getElementById("turn-container").style.display = "block";
  document.getElementById("restartBtn").style.display = "inline-block";
  document.getElementById("playerThreat").style.display = "inline-block";

  initGame();
}

function initGame() {
  turn = 1;
  initBoard();
  initZobrist();
  tt.clear();

  document.getElementById("aiThinking").classList.remove("visible");
  document.getElementById("overlay").style.display = "none";

  renderBoard();
}

function restartGame() {
  turn = 1;
  initBoard();
  initZobrist();
  tt.clear();
  document.getElementById("aiThinking").classList.remove("visible");
  document.getElementById("overlay").style.display = "none";
  document.getElementById("aiDepthContainer").style.display = "block";
  document.getElementById("modeScreen").style.display = "flex";

  renderBoard();
}

/* ----------------------------------------------------
BOARD INIT
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

/* ----------------------------------------------------
MOVE UTILS
---------------------------------------------------- */
function isSelectable(cell, state = board) {
  if (cell.owner !== null) return false;
  for (const [dr,dc] of dirs) {
    const nr = cell.row + dr, nc = cell.col + dc;
    if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && state[nr][nc].owner !== null)
      return true;
  }
  return false;
}

function applyMove(state, r, c, player) {
  const newState = structuredClone(state);
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
  return state.flat().filter(c => isSelectable(c, state)).map(c => [c.row, c.col]);
}

/* ----------------------------------------------------
HUMAN ACTION
---------------------------------------------------- */

function handleMove(r, c) {
  if (turn === AI_PLAYER && singlePlayer) return;
  if (!isSelectable(board[r][c])) return;

  const prevState = board;               // snapshot
  board = applyMove(board, r, c, turn);  // apply move

  // ONLY track human impact
  if (turn === HUMAN_PLAYER && singlePlayer) {
    updatePlayerThreat(prevState, board);
  }

  turn = AI_PLAYER;
  renderBoard();

  if (!checkGameOver() && turn === AI_PLAYER && singlePlayer) {
    setTimeout(aiMove, 200);
  }
}


/* ----------------------------------------------------
EVALUATION
---------------------------------------------------- */
function evaluateBoard(state) {
  let p1 = 0, p2 = 0;
  let cornerP1 = 0, cornerP2 = 0;
  const corners = [[0,0],[0,7],[7,0],[7,7]];

  for (const c of state.flat()) {
    if (c.owner === 1) p1 += c.base;
    if (c.owner === 2) p2 += c.base;
  }
  for (const [r,c] of corners) {
    if (state[r][c].owner === 1) cornerP1++;
    if (state[r][c].owner === 2) cornerP2++;
  }
  return (p2-p1)*2 + (cornerP2-cornerP1)*20 + (getValidMoves(state,2).length - getValidMoves(state,1).length)*3;
}

/* ----------------------------------------------------
ADAPTIVE DEPTH CORE
---------------------------------------------------- */
function gamePhase(state) {
  const filled = state.flat().filter(c => c.owner !== null).length;
  return filled / (SIZE*SIZE);
}

function estimateVolatility(state, player) {
  let maxSwing = 0;
  const baseEval = evaluateBoard(state);
  for (const [r,c] of getValidMoves(state, player)) {
    const e = Math.abs(evaluateBoard(applyMove(state,r,c,player)) - baseEval);
    maxSwing = Math.max(maxSwing, e);
  }
  return maxSwing;
}

function computeAdaptiveDepth(state, baseDepth) {
  const phase = gamePhase(state);
  const volatility = estimateVolatility(state, AI_PLAYER);

  let depth = baseDepth;

  // Phase bias (soft)
  if (phase < 0.25) depth -= 2;
  else if (phase < 0.45) depth -= 1;
  else depth += 1;

  const normVol = volatility * (0.5 + phase);
  if (normVol > 40) depth += 2;
  else if (normVol > 20) depth += 1;

  depth += Math.floor(playerThreatLevel / 60);

  const result = Math.max(2, Math.min(depth, baseDepth + 2));
  document.getElementById("depth-indocator").textContent = `Current Depth: ${result}`;

  return result;
}

function updatePlayerThreat(prev, next) {
  const delta = Math.abs(evaluateBoard(next) - evaluateBoard(prev));
  playerThreatLevel =
    Math.max(0, playerThreatLevel * 0.6 + delta * 0.4);
    document.getElementById("playerThreat").textContent = `${playerThreatLevel}`;
}

/* ----------------------------------------------------
MINIMAX (UNCHANGED CORE)
---------------------------------------------------- */
function minimax(state, depth, alpha, beta, maximizing) {
  const hash = hashState(state);
  if (tt.has(hash) && tt.get(hash).depth >= depth)
    return [tt.get(hash).score, tt.get(hash).move];

  const player = maximizing ? AI_PLAYER : HUMAN_PLAYER;
  const moves = getValidMoves(state, player);

  if (depth === 0 || moves.length === 0)
    return [evaluateBoard(state), null];

  let bestMove = moves[0];

  if (maximizing) {
    let best = -Infinity;
    for (const [r,c] of moves) {
      const [score] = minimax(applyMove(state,r,c,AI_PLAYER), depth-1, alpha, beta, false);
      if (score > best) { best = score; bestMove = [r,c]; }
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    tt.set(hash, {score:best, move:bestMove, depth});
    return [best, bestMove];
  } else {
    let best = Infinity;
    for (const [r,c] of moves) {
      const [score] = minimax(applyMove(state,r,c,HUMAN_PLAYER), depth-1, alpha, beta, true);
      if (score < best) { best = score; bestMove = [r,c]; }
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

  const baseDepth = 3; // Ultra Hard baseline
  const depth = computeAdaptiveDepth(board, baseDepth);
  const move = await iterativeDeepening(board, depth);

  const volatility = estimateVolatility(board, AI_PLAYER);
  const aggression = computeAggression(
    depth,
    baseDepth,
    playerThreatLevel,
    volatility
  );

  document.getElementById("aiAggroLive").textContent =
  `AI Aggression: ${aggression}`;

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

/* ----------------------------------------------------
Ai Aggression
---------------------------------------------------- */
function computeAggression(depth, baseDepth, threat, volatility) {
  let score = 0;

  score += (depth - baseDepth) * 20;          // depth escalation
  score += Math.min(threat, 100) * 0.4;       // respect for player
  score += Math.min(volatility, 50) * 0.6;    // tactical chaos

  return Math.round(Math.min(100, score));
}


/* ----------------------------------------------------
GAME OVER
---------------------------------------------------- */
function checkGameOver() {
  if (board.flat().every(c => c.owner !== null)) {
    showGameOver();
    return true;
  }
  return false;
}

function showGameOver() {
  document.getElementById("gameover").style.display = "block";
  const p1 = +document.getElementById("p1score").textContent;
  const p2 = +document.getElementById("p2score").textContent;
  const txt = p1 > p2 ? "Winner: Player 1" :
  p2 > p1 ? "Winner: Player 2" :
  "It's a tie!";
  document.getElementById("winner").textContent = txt;
  document.getElementById("overlay").style.display = "flex";

}

/* ----------------------------------------------------
START
---------------------------------------------------- */
startGame(true);
