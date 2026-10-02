// IA de ajedrez: minimax con poda alfa-beta. Tres niveles de dificultad.
const ChessAI = (() => {
  const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  // Tablas de posicion (desde la perspectiva de blancas, rank 0 = fila 1)
  const PAWN_PST = [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, -20, -20, 10, 10, 5,
    5, -5, -10, 0, 0, -10, -5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, 5, 10, 25, 25, 10, 5, 5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
    0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const KNIGHT_PST = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ];
  const BISHOP_PST = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ];
  const ROOK_PST = [
    0, 0, 0, 5, 5, 0, 0, 0,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    5, 10, 10, 10, 10, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const QUEEN_PST = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ];
  const KING_PST = [
    20, 30, 10, 0, 0, 10, 30, 20,
    20, 20, 0, 0, 0, 0, 20, 20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
  ];
  const PST = { p: PAWN_PST, n: KNIGHT_PST, b: BISHOP_PST, r: ROOK_PST, q: QUEEN_PST, k: KING_PST };

  function pstValue(piece, square) {
    const table = PST[piece.t];
    const i = piece.c === 'w' ? square : 63 - square;
    return table[i];
  }

  function evaluate(state) {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const p = state.board[i];
      if (!p) continue;
      const val = VALUES[p.t] + pstValue(p, i);
      score += p.c === 'w' ? val : -val;
    }
    return score; // positivo favorece a blancas
  }

  function orderMoves(moves) {
    return moves.slice().sort((a, b) => {
      const scoreA = a.captured ? VALUES[a.captured.t] - VALUES[a.piece.t] / 10 : 0;
      const scoreB = b.captured ? VALUES[b.captured.t] - VALUES[b.piece.t] / 10 : 0;
      return scoreB - scoreA;
    });
  }

  function minimax(state, depth, alpha, beta, maximizing) {
    const moves = ChessEngine.allLegalMoves(state);
    if (depth === 0 || moves.length === 0) {
      if (moves.length === 0) {
        const check = ChessEngine.inCheck(state, state.turn);
        if (check) return maximizing ? -100000 - depth : 100000 + depth;
        return 0; // ahogado
      }
      return evaluate(state);
    }
    const ordered = orderMoves(moves);
    if (maximizing) {
      let best = -Infinity;
      for (const move of ordered) {
        const next = ChessEngine.applyMove(state, move);
        const val = minimax(next, depth - 1, alpha, beta, false);
        if (val > best) best = val;
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const move of ordered) {
        const next = ChessEngine.applyMove(state, move);
        const val = minimax(next, depth - 1, alpha, beta, true);
        if (val < best) best = val;
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  // Devuelve el mejor movimiento para el jugador al que le toca mover en `state`
  function chooseMove(state, difficulty) {
    const moves = ChessEngine.allLegalMoves(state);
    if (moves.length === 0) return null;

    const color = state.turn;
    const maximizing = color === 'w';

    if (difficulty === 'easy') {
      // Profundidad baja + eleccion aleatoria entre varias opciones decentes
      const depth = 1;
      const ordered = orderMoves(moves);
      const scored = ordered.map(move => {
        const next = ChessEngine.applyMove(state, move);
        const val = minimax(next, depth, -Infinity, Infinity, !maximizing);
        return { move, val };
      });
      scored.sort((a, b) => maximizing ? b.val - a.val : a.val - b.val);
      // Un 40% de las veces elige al azar entre las 3 mejores (o todas si hay menos), simulando errores de un principiante
      if (Math.random() < 0.4) {
        const pool = scored.slice(0, Math.min(3, scored.length));
        return pool[Math.floor(Math.random() * pool.length)].move;
      }
      return scored[0].move;
    }

    const depth = difficulty === 'medium' ? 2 : 3;
    let bestMove = null;
    let bestVal = maximizing ? -Infinity : Infinity;
    const ordered = orderMoves(moves);
    for (const move of ordered) {
      const next = ChessEngine.applyMove(state, move);
      const val = minimax(next, depth, -Infinity, Infinity, !maximizing);
      if (maximizing ? val > bestVal : val < bestVal) {
        bestVal = val;
        bestMove = move;
      }
    }
    return bestMove || ordered[0];
  }

  return { chooseMove, evaluate };
})();

if (typeof module !== 'undefined') module.exports = ChessAI;
