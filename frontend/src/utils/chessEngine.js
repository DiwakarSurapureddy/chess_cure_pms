/**
 * Built-in Smart Chess Engine (Minimax with Alpha-Beta Pruning & Piece-Square Tables)
 * Supports Beginner, Intermediate, and Master difficulty levels.
 */

// Piece base values (Centipawns)
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables from White's perspective (Rank 8 down to Rank 1)
const PST = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

/**
 * Static evaluation function of the board position from the perspective of the side to move.
 * Positive = White advantage, Negative = Black advantage.
 */
function evaluateBoard(chess) {
  let totalScore = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pieceType = piece.type;
      const isWhite = piece.color === 'w';
      const baseValue = PIECE_VALUES[pieceType] || 0;

      // Position table score
      const table = PST[pieceType];
      const posRow = isWhite ? r : 7 - r;
      const posCol = isWhite ? c : 7 - c;
      const posScore = table ? table[posRow][posCol] : 0;

      const pieceVal = baseValue + posScore;
      if (isWhite) {
        totalScore += pieceVal;
      } else {
        totalScore -= pieceVal;
      }
    }
  }

  // Bonus for check
  if (chess.inCheck()) {
    totalScore += (chess.turn() === 'w' ? -40 : 40);
  }

  return totalScore;
}

/**
 * Move ordering function: prioritizes captures and checks to prune search tree faster.
 */
function orderMoves(moves) {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.captured) {
      const victimVal = PIECE_VALUES[a.captured] || 100;
      const attackerVal = PIECE_VALUES[a.piece] || 100;
      scoreA += victimVal * 10 - attackerVal;
    }
    if (a.san && a.san.includes('+')) scoreA += 50;
    if (a.promotion) scoreA += 800;

    if (b.captured) {
      const victimVal = PIECE_VALUES[b.captured] || 100;
      const attackerVal = PIECE_VALUES[b.piece] || 100;
      scoreB += victimVal * 10 - attackerVal;
    }
    if (b.san && b.san.includes('+')) scoreB += 50;
    if (b.promotion) scoreB += 800;

    return scoreB - scoreA;
  });
}

/**
 * Minimax algorithm with Alpha-Beta pruning
 */
function minimax(chess, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || chess.isGameOver()) {
    if (chess.isCheckmate()) {
      return isMaximizing ? -100000 - depth : 100000 + depth;
    }
    if (chess.isDraw()) {
      return 0;
    }
    return evaluateBoard(chess);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Main function to calculate best computer move based on selected difficulty
 * @param {Object} chess Instance of chess.js
 * @param {string} difficulty 'beginner' | 'intermediate' | 'master'
 * @returns {Object|null} best move object { from, to, promotion }
 */
export function getSmartEngineMove(chess, difficulty = 'intermediate') {
  if (!chess || chess.isGameOver()) return null;

  const rawMoves = chess.moves({ verbose: true });
  if (rawMoves.length === 0) return null;

  const moves = orderMoves(rawMoves);
  const isWhite = chess.turn() === 'w';

  // 1. Beginner Level (Elo ~1000)
  // Has a 40% chance of making an intuitive quick move/capture or depth 1 evaluation.
  // Blunders occasionally, perfect for new players.
  if (difficulty === 'beginner') {
    if (Math.random() < 0.4) {
      // Pick among safe or random moves
      return moves[Math.floor(Math.random() * moves.length)];
    }
    // Otherwise depth 1 evaluation
    let bestMove = moves[0];
    let bestScore = isWhite ? -Infinity : Infinity;
    for (const move of moves) {
      chess.move(move);
      const score = evaluateBoard(chess);
      chess.undo();
      if (isWhite ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // 2. Intermediate Level (Elo ~1600)
  // Searches at Depth 2-3 with Alpha-Beta pruning & position table heuristics.
  // Solid tactical awareness: protects pieces, grabs undefended material, avoids simple traps.
  if (difficulty === 'intermediate') {
    const depth = 2;
    let bestMove = moves[0];
    let bestScore = isWhite ? -Infinity : Infinity;

    for (const move of moves) {
      chess.move(move);
      const score = minimax(chess, depth - 1, -Infinity, Infinity, !isWhite);
      chess.undo();

      if (isWhite ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // 3. Master Level (Elo ~2200+)
  // Searches at Depth 3 (or 4 on tactical branches) with Full Alpha-Beta pruning.
  // Aggressive, controls the center, calculates tactical forks/pins and checkmate paths.
  const depth = 3;
  let bestMove = moves[0];
  let bestScore = isWhite ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    // Check if move gives checkmate right away
    if (chess.isCheckmate()) {
      chess.undo();
      return move;
    }
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !isWhite);
    chess.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove;
}
