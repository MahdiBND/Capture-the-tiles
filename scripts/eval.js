/* ----------------------------------------------------
AI: EVALUATION
---------------------------------------------------- */
function evaluateBoard(state) {
  let p1 = 0, p2 = 0;
  const corners = [[0,0],[0,7],[7,0],[7,7]];
  let cornerP1 = 0, cornerP2 = 0;
  for (let c of state.flat()) {
    if (c.owner === 1) p1 += c.base;
    if (c.owner === 2) p2 += c.base;
  }
  for (let [r,c] of corners) {
    if (state[r][c].owner === 1) cornerP1++;
    if (state[r][c].owner === 2) cornerP2++;
  }
  const mobilityP1 = getValidMoves(state, 1).length;
  const mobilityP2 = getValidMoves(state, 2).length;
  return (
    (p2 - p1) * 2 +
    (cornerP2 - cornerP1) * 20 +
    (mobilityP2 - mobilityP1) * 3
  );
}

function orderMoves(state, moves, player) {
  return moves.sort((a,b)=>{
    const sA = evaluateBoard(applyMove(state, a[0], a[1], player));
    const sB = evaluateBoard(applyMove(state, b[0], b[1], player));
    return player===AI_PLAYER ? sB-sA : sA-sB;
  });
}
