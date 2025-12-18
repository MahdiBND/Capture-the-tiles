/* ----------------------------------------------------
GAME STATE
---------------------------------------------------- */
const SIZE = 8;
let turn = 1;
let board = [];
const AI_PLAYER = 2;
const HUMAN_PLAYER = 1;
/* Directions */
const dirs = [
  [-1,-1],[-1,0],[-1,1],
  [0,-1], [0,1],
  [1,-1],[1,0],[1,1]
];

/* Zobrist hashing for transposition */
let zobrist = [];
let tt = new Map();

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
  for (let r=0; r<SIZE; r++){
    for(let c=0; c<SIZE; c++){
      const o = state[r][c].owner ?? 0;
      h ^= zobrist[r][c][o];
    }
  }
  return h;
}
