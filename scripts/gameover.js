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
