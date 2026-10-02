// Motor de reglas de ajedrez. Sin dependencias externas.
// Tablero: array de 64 casillas, indice = rank*8 + file (file 0='a', rank 0=fila 1 blanca).
// Pieza: { t: 'p'|'n'|'b'|'r'|'q'|'k', c: 'w'|'b' } o null.

const ChessEngine = (() => {
  const FILES = 'abcdefgh';

  function idx(file, rank) { return rank * 8 + file; }
  function fileOf(i) { return i % 8; }
  function rankOf(i) { return Math.floor(i / 8); }
  function inBounds(file, rank) { return file >= 0 && file < 8 && rank >= 0 && rank < 8; }
  function squareName(i) { return FILES[fileOf(i)] + (rankOf(i) + 1); }

  function initialBoard() {
    const board = new Array(64).fill(null);
    const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let f = 0; f < 8; f++) {
      board[idx(f, 0)] = { t: back[f], c: 'w' };
      board[idx(f, 1)] = { t: 'p', c: 'w' };
      board[idx(f, 6)] = { t: 'p', c: 'b' };
      board[idx(f, 7)] = { t: back[f], c: 'b' };
    }
    return board;
  }

  function initialState() {
    return {
      board: initialBoard(),
      turn: 'w',
      castling: { wK: true, wQ: true, bK: true, bQ: true },
      ep: null,
      halfmove: 0,
      fullmove: 1,
    };
  }

  function cloneState(state) {
    return {
      board: state.board.slice(),
      turn: state.turn,
      castling: { ...state.castling },
      ep: state.ep,
      halfmove: state.halfmove,
      fullmove: state.fullmove,
    };
  }

  const KNIGHT_OFFSETS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const KING_OFFSETS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Movimientos pseudo-legales (no verifica si dejan al propio rey en jaque)
  function pseudoMovesForSquare(state, i) {
    const piece = state.board[i];
    if (!piece) return [];
    const moves = [];
    const f = fileOf(i), r = rankOf(i);
    const color = piece.c;
    const enemy = color === 'w' ? 'b' : 'w';

    const addMove = (to, extra) => {
      const captured = state.board[to];
      moves.push(Object.assign({ from: i, to, piece, captured: captured || null }, extra || {}));
    };

    if (piece.t === 'p') {
      const dir = color === 'w' ? 1 : -1;
      const startRank = color === 'w' ? 1 : 6;
      const promoRank = color === 'w' ? 7 : 0;
      const oneStep = idx(f, r + dir);
      if (inBounds(f, r + dir) && !state.board[oneStep]) {
        if (r + dir === promoRank) {
          for (const promo of ['q', 'r', 'b', 'n']) addMove(oneStep, { promotion: promo });
        } else {
          addMove(oneStep, {});
          const twoStep = idx(f, r + dir * 2);
          if (r === startRank && !state.board[twoStep]) {
            addMove(twoStep, { double: true });
          }
        }
      }
      for (const df of [-1, 1]) {
        const cf = f + df, cr = r + dir;
        if (!inBounds(cf, cr)) continue;
        const to = idx(cf, cr);
        const target = state.board[to];
        if (target && target.c === enemy) {
          if (cr === promoRank) {
            for (const promo of ['q', 'r', 'b', 'n']) addMove(to, { promotion: promo });
          } else {
            addMove(to, {});
          }
        } else if (state.ep === to) {
          addMove(to, { enPassant: true, captured: state.board[idx(cf, r)] });
        }
      }
    } else if (piece.t === 'n') {
      for (const [df, dr] of KNIGHT_OFFSETS) {
        const cf = f + df, cr = r + dr;
        if (!inBounds(cf, cr)) continue;
        const to = idx(cf, cr);
        const target = state.board[to];
        if (!target || target.c === enemy) addMove(to, {});
      }
    } else if (piece.t === 'k') {
      for (const [df, dr] of KING_OFFSETS) {
        const cf = f + df, cr = r + dr;
        if (!inBounds(cf, cr)) continue;
        const to = idx(cf, cr);
        const target = state.board[to];
        if (!target || target.c === enemy) addMove(to, {});
      }
      // Enroque: casillas intermedias vacias y no atacadas se verifican en legalMoves()
      const rank = color === 'w' ? 0 : 7;
      if (r === rank && f === 4) {
        const kSideFlag = color === 'w' ? 'wK' : 'bK';
        const qSideFlag = color === 'w' ? 'wQ' : 'bQ';
        if (state.castling[kSideFlag] && !state.board[idx(5, rank)] && !state.board[idx(6, rank)]) {
          const rook = state.board[idx(7, rank)];
          if (rook && rook.t === 'r' && rook.c === color) {
            addMove(idx(6, rank), { castle: 'K' });
          }
        }
        if (state.castling[qSideFlag] && !state.board[idx(3, rank)] && !state.board[idx(2, rank)] && !state.board[idx(1, rank)]) {
          const rook = state.board[idx(0, rank)];
          if (rook && rook.t === 'r' && rook.c === color) {
            addMove(idx(2, rank), { castle: 'Q' });
          }
        }
      }
    } else {
      const dirs = piece.t === 'b' ? BISHOP_DIRS : piece.t === 'r' ? ROOK_DIRS : BISHOP_DIRS.concat(ROOK_DIRS);
      for (const [df, dr] of dirs) {
        let cf = f + df, cr = r + dr;
        while (inBounds(cf, cr)) {
          const to = idx(cf, cr);
          const target = state.board[to];
          if (!target) {
            addMove(to, {});
          } else {
            if (target.c === enemy) addMove(to, {});
            break;
          }
          cf += df; cr += dr;
        }
      }
    }
    return moves;
  }

  function allPseudoMoves(state, color) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
      const p = state.board[i];
      if (p && p.c === color) moves.push(...pseudoMovesForSquare(state, i));
    }
    return moves;
  }

  // Ataque "crudo" a una casilla (ignora si el atacante esta clavado; sirve para jaque/enroque)
  function squareAttacked(state, square, byColor) {
    const f = fileOf(square), r = rankOf(square);
    const dir = byColor === 'w' ? 1 : -1;
    for (const df of [-1, 1]) {
      const cf = f + df, cr = r - dir;
      if (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p && p.c === byColor && p.t === 'p') return true;
      }
    }
    for (const [df, dr] of KNIGHT_OFFSETS) {
      const cf = f + df, cr = r + dr;
      if (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p && p.c === byColor && p.t === 'n') return true;
      }
    }
    for (const [df, dr] of KING_OFFSETS) {
      const cf = f + df, cr = r + dr;
      if (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p && p.c === byColor && p.t === 'k') return true;
      }
    }
    for (const [df, dr] of BISHOP_DIRS) {
      let cf = f + df, cr = r + dr;
      while (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p) {
          if (p.c === byColor && (p.t === 'b' || p.t === 'q')) return true;
          break;
        }
        cf += df; cr += dr;
      }
    }
    for (const [df, dr] of ROOK_DIRS) {
      let cf = f + df, cr = r + dr;
      while (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p) {
          if (p.c === byColor && (p.t === 'r' || p.t === 'q')) return true;
          break;
        }
        cf += df; cr += dr;
      }
    }
    return false;
  }

  // Devuelve las casillas de las piezas enemigas que dan jaque al rey de `color`
  function getCheckers(state, color) {
    const ks = kingSquare(state, color);
    if (ks < 0) return [];
    const enemy = color === 'w' ? 'b' : 'w';
    const f = fileOf(ks), r = rankOf(ks);
    const checkers = [];
    const dir = enemy === 'w' ? 1 : -1;
    for (const df of [-1, 1]) {
      const cf = f + df, cr = r - dir;
      if (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p && p.c === enemy && p.t === 'p') checkers.push(idx(cf, cr));
      }
    }
    for (const [df, dr] of KNIGHT_OFFSETS) {
      const cf = f + df, cr = r + dr;
      if (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p && p.c === enemy && p.t === 'n') checkers.push(idx(cf, cr));
      }
    }
    for (const [df, dr] of KING_OFFSETS) {
      const cf = f + df, cr = r + dr;
      if (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p && p.c === enemy && p.t === 'k') checkers.push(idx(cf, cr));
      }
    }
    for (const [df, dr] of BISHOP_DIRS) {
      let cf = f + df, cr = r + dr;
      while (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p) {
          if (p.c === enemy && (p.t === 'b' || p.t === 'q')) checkers.push(idx(cf, cr));
          break;
        }
        cf += df; cr += dr;
      }
    }
    for (const [df, dr] of ROOK_DIRS) {
      let cf = f + df, cr = r + dr;
      while (inBounds(cf, cr)) {
        const p = state.board[idx(cf, cr)];
        if (p) {
          if (p.c === enemy && (p.t === 'r' || p.t === 'q')) checkers.push(idx(cf, cr));
          break;
        }
        cf += df; cr += dr;
      }
    }
    return checkers;
  }

  function kingSquare(state, color) {
    for (let i = 0; i < 64; i++) {
      const p = state.board[i];
      if (p && p.c === color && p.t === 'k') return i;
    }
    return -1;
  }

  function inCheck(state, color) {
    const ks = kingSquare(state, color);
    if (ks < 0) return false;
    const enemy = color === 'w' ? 'b' : 'w';
    return squareAttacked(state, ks, enemy);
  }

  // Aplica un movimiento y devuelve un nuevo estado (no muta el original)
  function applyMove(state, move) {
    const s = cloneState(state);
    const piece = s.board[move.from];
    const color = piece.c;
    const enemy = color === 'w' ? 'b' : 'w';

    s.ep = null;

    if (move.enPassant) {
      const capturedSquare = idx(fileOf(move.to), rankOf(move.from));
      s.board[capturedSquare] = null;
    }

    s.board[move.from] = null;
    s.board[move.to] = move.promotion ? { t: move.promotion, c: color } : piece;

    if (move.castle === 'K') {
      const rank = rankOf(move.from);
      s.board[idx(5, rank)] = s.board[idx(7, rank)];
      s.board[idx(7, rank)] = null;
    } else if (move.castle === 'Q') {
      const rank = rankOf(move.from);
      s.board[idx(3, rank)] = s.board[idx(0, rank)];
      s.board[idx(0, rank)] = null;
    }

    if (move.double) {
      s.ep = idx(fileOf(move.from), (rankOf(move.from) + rankOf(move.to)) / 2);
    }

    if (piece.t === 'k') {
      if (color === 'w') { s.castling.wK = false; s.castling.wQ = false; }
      else { s.castling.bK = false; s.castling.bQ = false; }
    }
    if (piece.t === 'r') {
      if (color === 'w' && move.from === idx(0, 0)) s.castling.wQ = false;
      if (color === 'w' && move.from === idx(7, 0)) s.castling.wK = false;
      if (color === 'b' && move.from === idx(0, 7)) s.castling.bQ = false;
      if (color === 'b' && move.from === idx(7, 7)) s.castling.bK = false;
    }
    if (move.captured && move.captured.t === 'r') {
      if (move.to === idx(0, 0)) s.castling.wQ = false;
      if (move.to === idx(7, 0)) s.castling.wK = false;
      if (move.to === idx(0, 7)) s.castling.bQ = false;
      if (move.to === idx(7, 7)) s.castling.bK = false;
    }

    if (piece.t === 'p' || move.captured || move.enPassant) s.halfmove = 0;
    else s.halfmove++;

    if (color === 'b') s.fullmove++;
    s.turn = enemy;

    return s;
  }

  function legalMoves(state, color) {
    const pseudo = allPseudoMoves(state, color);
    const enemy = color === 'w' ? 'b' : 'w';
    const legal = [];
    for (const move of pseudo) {
      if (move.castle) {
        const rank = rankOf(move.from);
        if (squareAttacked(state, move.from, enemy)) continue;
        const passSquares = move.castle === 'K' ? [idx(5, rank), idx(6, rank)] : [idx(3, rank), idx(2, rank)];
        let blocked = false;
        for (const sq of passSquares) {
          if (squareAttacked(state, sq, enemy)) { blocked = true; break; }
        }
        if (blocked) continue;
      }
      const next = applyMove(state, move);
      if (!inCheck(next, color)) legal.push(move);
    }
    return legal;
  }

  function allLegalMoves(state) {
    return legalMoves(state, state.turn);
  }

  function hasInsufficientMaterial(state) {
    const pieces = state.board.filter(Boolean);
    if (pieces.length <= 2) return true;
    if (pieces.length === 3 && pieces.some(p => p.t === 'n' || p.t === 'b')) return true;
    return false;
  }

  function gameStatus(state) {
    const moves = allLegalMoves(state);
    const check = inCheck(state, state.turn);
    if (moves.length === 0) {
      return check ? 'checkmate' : 'stalemate';
    }
    if (state.halfmove >= 100) return 'draw-50';
    if (hasInsufficientMaterial(state)) return 'draw-material';
    return check ? 'check' : 'playing';
  }

  return {
    idx, fileOf, rankOf, squareName, inBounds,
    initialState, cloneState,
    pseudoMovesForSquare, allLegalMoves, legalMoves,
    squareAttacked, kingSquare, getCheckers, inCheck, applyMove, gameStatus,
    hasInsufficientMaterial,
  };
})();

if (typeof module !== 'undefined') module.exports = ChessEngine;
