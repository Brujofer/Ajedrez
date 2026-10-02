// Logica de interfaz: tablero, ajustes, turnos de IA, persistencia local.
(() => {
  const THEMES = {
    clasico: { label: 'Blanco y negro', light: '#f5f5f5', dark: '#202020' },
    madera: { label: 'Marrón y beige', light: '#e8d4a9', dark: '#6b4226' },
    gris: { label: 'Gris y blanco', light: '#ffffff', dark: '#3a3a3a' },
    rojo: { label: 'Rojo y negro', light: '#c0392b', dark: '#161616' },
  };

  const DEFAULT_SETTINGS = {
    difficulty: 'medium',
    boardTheme: 'madera',
    pieceTheme: 'clasico',
    showLastMove: true,
    soundEnabled: true,
    playerColor: 'w',
  };

  const SETTINGS_KEY = 'chess-app-settings';
  const GAME_KEY = 'chess-app-game';
  const SAVED_GAMES_KEY = 'chess-app-saved-games';

  let settings = loadSettings();
  let game = null;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function saveGame() {
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify({ moves: game.moves, playerColor: game.playerColor }));
    } catch (e) {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(GAME_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.moves)) return null;
      return data;
    } catch (e) { return null; }
  }

  function clearGame() {
    try { localStorage.removeItem(GAME_KEY); } catch (e) {}
  }

  function loadSavedGames() {
    try {
      const raw = localStorage.getItem(SAVED_GAMES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function persistSavedGames(list) {
    try { localStorage.setItem(SAVED_GAMES_KEY, JSON.stringify(list)); } catch (e) {}
  }

  // --- Color helpers -------------------------------------------------
  function luminance(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16) / 255;
    const g = parseInt(c.substr(2, 2), 16) / 255;
    const b = parseInt(c.substr(4, 2), 16) / 255;
    const lin = v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function contrastStroke(hex) {
    return luminance(hex) > 0.45 ? '#202020' : '#f5f5f5';
  }

  function applyThemeVars() {
    const board = THEMES[settings.boardTheme];
    const piece = THEMES[settings.pieceTheme];
    const root = document.documentElement.style;
    root.setProperty('--board-light', board.light);
    root.setProperty('--board-dark', board.dark);
    root.setProperty('--piece-light-fill', piece.light);
    root.setProperty('--piece-light-stroke', contrastStroke(piece.light));
    root.setProperty('--piece-dark-fill', piece.dark);
    root.setProperty('--piece-dark-stroke', contrastStroke(piece.dark));
  }

  function pieceHTML(piece) {
    const cls = piece.c === 'w' ? 'piece-w' : 'piece-b';
    return `<span class="piece-holder ${cls}">${ChessPieces.svg(piece.t)}</span>`;
  }

  // --- DOM refs --------------------------------------------------------
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status-bar');
  const capturedBlackEl = document.getElementById('captured-black');
  const capturedWhiteEl = document.getElementById('captured-white');
  const btnNew = document.getElementById('btn-new');
  const btnUndo = document.getElementById('btn-undo');
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingsPanel = document.getElementById('settings-panel');
  const promotionOverlay = document.getElementById('promotion-overlay');
  const promotionOptions = document.getElementById('promotion-options');
  const endModal = document.getElementById('end-modal');
  const endMessage = document.getElementById('end-message');
  const btnEndNew = document.getElementById('btn-end-new');
  const toggleHighlight = document.getElementById('toggle-highlight');
  const toggleSound = document.getElementById('toggle-sound');
  const btnSaveGame = document.getElementById('btn-save-game');
  const savedGamesListEl = document.getElementById('saved-games-list');

  // --- Game lifecycle ----------------------------------------------------
  function freshGame(playerColor) {
    return {
      state: ChessEngine.initialState(),
      moves: [],
      selected: null,
      legalMovesForSelected: [],
      legalTargets: new Set(),
      lastMove: null,
      playerColor,
      aiThinking: false,
      gameOver: false,
    };
  }

  function rebuildFromMoves(moves, playerColor) {
    let state = ChessEngine.initialState();
    for (const m of moves) state = ChessEngine.applyMove(state, m);
    const g = freshGame(playerColor);
    g.state = state;
    g.moves = moves;
    g.lastMove = moves.length ? { from: moves[moves.length - 1].from, to: moves[moves.length - 1].to } : null;
    const status = ChessEngine.gameStatus(state);
    g.gameOver = status === 'checkmate' || status === 'stalemate' || status === 'draw-50' || status === 'draw-material';
    return g;
  }

  function startNewGame(skipConfirm) {
    if (!skipConfirm && game && game.moves.length > 0 && !game.gameOver) {
      if (!confirm('¿Empezar una partida nueva? Se perderá la partida actual.')) return;
    }
    game = freshGame(settings.playerColor);
    clearGame();
    hideEndModal();
    hidePromotionChooser();
    renderBoard();
    updateCaptured();
    updateStatusBar(ChessEngine.gameStatus(game.state));
    if (game.state.turn !== game.playerColor) scheduleAIMove();
  }

  function performMove(move) {
    const flyingPiece = move.promotion ? { t: move.promotion, c: move.piece.c } : move.piece;
    const fromSquare = move.from;
    const toSquare = move.to;

    game.moves.push(move);
    game.state = ChessEngine.applyMove(game.state, move);
    game.lastMove = { from: move.from, to: move.to };
    game.selected = null;
    game.legalMovesForSelected = [];
    game.legalTargets = new Set();
    saveGame();
    if (move.captured) ChessAudio.playCapture(); else ChessAudio.playMove();

    renderBoard();
    updateCaptured();
    animateMove(fromSquare, toSquare, flyingPiece, () => {
      afterStatusUpdate();
    });
  }

  // --- Animacion del movimiento (deslizamiento con rastro) --------------
  function createGhost(pieceData, rect, opacity) {
    const ghost = document.createElement('div');
    ghost.className = 'move-ghost ' + (pieceData.c === 'w' ? 'piece-w' : 'piece-b');
    ghost.innerHTML = ChessPieces.svg(pieceData.t);
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.opacity = String(opacity);
    document.body.appendChild(ghost);
    return ghost;
  }

  function slideGhost(ghost, dx, dy, duration, fadeOut) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ghost.style.transition = `transform ${duration}ms cubic-bezier(.33,.1,.2,1)` + (fadeOut ? `, opacity ${duration}ms ease-in` : '');
        ghost.style.transform = `translate(${dx}px, ${dy}px)`;
        if (fadeOut) ghost.style.opacity = '0';
      });
    });
  }

  function animateMove(fromSquare, toSquare, pieceData, onDone) {
    const fromEl = boardEl.querySelector(`[data-square="${fromSquare}"]`);
    const toEl = boardEl.querySelector(`[data-square="${toSquare}"]`);
    if (!fromEl || !toEl || !pieceData) { onDone(); return; }

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const dx = toRect.left - fromRect.left;
    const dy = toRect.top - fromRect.top;
    const duration = 420;

    toEl.classList.add('anim-hide-dest');

    const echoes = [];
    const lead = createGhost(pieceData, fromRect, 1);
    slideGhost(lead, dx, dy, duration, false);

    [[45, 0.4, duration - 45], [90, 0.2, duration - 90]].forEach(([delay, opacity, dur]) => {
      const id = setTimeout(() => {
        const ghost = createGhost(pieceData, fromRect, opacity);
        echoes.push(ghost);
        slideGhost(ghost, dx, dy, dur, true);
      }, delay);
      echoes.push(id);
    });

    setTimeout(() => {
      lead.remove();
      for (const e of echoes) {
        if (typeof e === 'number') clearTimeout(e);
        else e.remove();
      }
      toEl.classList.remove('anim-hide-dest');
      onDone();
    }, duration + 40);
  }

  function afterStatusUpdate() {
    const status = ChessEngine.gameStatus(game.state);
    updateStatusBar(status);
    const over = status === 'checkmate' || status === 'stalemate' || status === 'draw-50' || status === 'draw-material';
    if (status === 'checkmate') ChessAudio.playCheckmate();
    else if (status === 'check') ChessAudio.playCheck();
    else if (status === 'stalemate' || status === 'draw-50' || status === 'draw-material') ChessAudio.playDraw();
    if (over) {
      game.gameOver = true;
      showEndModal(status);
      return;
    }
    if (game.state.turn !== game.playerColor) {
      scheduleAIMove();
    }
  }

  function scheduleAIMove() {
    game.aiThinking = true;
    updateStatusBar('thinking');
    setTimeout(() => {
      if (!game || game.gameOver) return;
      const move = ChessAI.chooseMove(game.state, settings.difficulty);
      game.aiThinking = false;
      if (move) performMove(move);
    }, 60);
  }

  function undoMove() {
    if (!game || game.aiThinking || game.moves.length === 0) return;
    game.moves.pop();
    let state = rebuildStateFromMoves(game.moves);
    while (game.moves.length > 0 && state.turn !== game.playerColor) {
      game.moves.pop();
      state = rebuildStateFromMoves(game.moves);
    }
    game.state = state;
    game.selected = null;
    game.legalMovesForSelected = [];
    game.legalTargets = new Set();
    game.lastMove = game.moves.length ? { from: game.moves[game.moves.length - 1].from, to: game.moves[game.moves.length - 1].to } : null;
    game.gameOver = false;
    saveGame();
    hideEndModal();
    renderBoard();
    updateCaptured();
    updateStatusBar(ChessEngine.gameStatus(game.state));
    if (game.state.turn !== game.playerColor) scheduleAIMove();
  }

  function rebuildStateFromMoves(moves) {
    let state = ChessEngine.initialState();
    for (const m of moves) state = ChessEngine.applyMove(state, m);
    return state;
  }

  // --- Board rendering -----------------------------------------------
  function renderBoard() {
    boardEl.innerHTML = '';
    const flipped = game.playerColor === 'b';
    let checkSquare = -1;
    let checkerSquares = [];
    const status = ChessEngine.gameStatus(game.state);
    if (status === 'check' || status === 'checkmate') {
      checkSquare = ChessEngine.kingSquare(game.state, game.state.turn);
      checkerSquares = ChessEngine.getCheckers(game.state, game.state.turn);
    }
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const rank = flipped ? row : 7 - row;
        const file = flipped ? 7 - col : col;
        const square = ChessEngine.idx(file, rank);
        const div = document.createElement('div');
        div.className = 'square ' + ((file + rank) % 2 === 0 ? 'dark' : 'light');
        div.dataset.square = String(square);

        const piece = game.state.board[square];
        if (piece) div.innerHTML = pieceHTML(piece);

        if (game.selected === square) div.classList.add('selected');
        if (settings.showLastMove && game.lastMove && (game.lastMove.from === square || game.lastMove.to === square)) {
          div.classList.add('last-move');
        }
        if (square === checkSquare) div.classList.add('check-king');
        if (checkerSquares.includes(square)) {
          const checker = document.createElement('div');
          checker.className = 'checker-ring';
          div.appendChild(checker);
        }

        if (game.legalTargets.has(square)) {
          const marker = document.createElement('div');
          marker.className = piece ? 'capture-ring' : 'move-dot';
          div.appendChild(marker);
        }

        div.addEventListener('click', () => onSquareClick(square));
        boardEl.appendChild(div);
      }
    }
  }

  function onSquareClick(square) {
    if (!game || game.aiThinking || game.gameOver) return;
    if (game.state.turn !== game.playerColor) return;

    const piece = game.state.board[square];

    if (game.selected !== null) {
      if (game.legalTargets.has(square)) {
        const matches = game.legalMovesForSelected.filter(m => m.to === square);
        if (matches.length > 1) {
          showPromotionChooser(matches);
        } else {
          performMove(matches[0]);
        }
        return;
      }
      if (piece && piece.c === game.playerColor) {
        selectSquare(square);
        return;
      }
      // Intento de movimiento ilegal (destino no permitido por las reglas): se rechaza y se avisa.
      ChessAudio.playInvalid();
      shakeSquare(square);
      return;
    }

    if (piece && piece.c === game.playerColor) {
      selectSquare(square);
    }
  }

  function shakeSquare(square) {
    const el = boardEl.querySelector(`[data-square="${square}"]`);
    if (!el) return;
    el.classList.remove('shake');
    // Forzar reflow para poder reiniciar la animación si se clickea rápido varias veces
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 320);
  }

  function selectSquare(square) {
    game.selected = square;
    const all = ChessEngine.legalMoves(game.state, game.playerColor);
    game.legalMovesForSelected = all.filter(m => m.from === square);
    game.legalTargets = new Set(game.legalMovesForSelected.map(m => m.to));
    renderBoard();
  }

  function deselect() {
    game.selected = null;
    game.legalMovesForSelected = [];
    game.legalTargets = new Set();
    renderBoard();
  }

  // --- Captured pieces -------------------------------------------------
  function updateCaptured() {
    const order = { q: 0, r: 1, b: 2, n: 3, p: 4 };
    const takenFromBlack = [];
    const takenFromWhite = [];
    for (const m of game.moves) {
      if (m.captured) {
        if (m.captured.c === 'b') takenFromBlack.push(m.captured.t);
        else takenFromWhite.push(m.captured.t);
      }
    }
    takenFromBlack.sort((a, b) => order[a] - order[b]);
    takenFromWhite.sort((a, b) => order[a] - order[b]);
    capturedBlackEl.innerHTML = takenFromBlack.map(t => pieceHTML({ t, c: 'b' })).join('');
    capturedWhiteEl.innerHTML = takenFromWhite.map(t => pieceHTML({ t, c: 'w' })).join('');
  }

  // --- Status bar --------------------------------------------------------
  function updateStatusBar(status) {
    statusEl.classList.remove('check', 'thinking');
    if (status === 'thinking') {
      statusEl.textContent = 'La IA está pensando…';
      statusEl.classList.add('thinking');
      return;
    }
    const turnName = game.state.turn === 'w' ? 'blancas' : 'negras';
    if (status === 'checkmate') {
      const winner = game.state.turn === 'w' ? 'negras' : 'blancas';
      statusEl.textContent = `Jaque mate. Ganan las ${winner}.`;
    } else if (status === 'stalemate') {
      statusEl.textContent = 'Tablas por ahogado.';
    } else if (status === 'draw-50') {
      statusEl.textContent = 'Tablas (regla de 50 movimientos sin capturas).';
    } else if (status === 'draw-material') {
      statusEl.textContent = 'Tablas por material insuficiente.';
    } else if (status === 'check') {
      statusEl.textContent = `Jaque a las ${turnName}.`;
      statusEl.classList.add('check');
    } else {
      const isPlayer = game.state.turn === game.playerColor;
      statusEl.textContent = `Turno de ${turnName}${isPlayer ? '' : ' (IA)'}`;
    }
  }

  // --- Promotion chooser -------------------------------------------------
  function showPromotionChooser(matches) {
    promotionOptions.innerHTML = '';
    const color = matches[0].piece.c;
    const order = ['q', 'r', 'b', 'n'];
    for (const t of order) {
      const m = matches.find(x => x.promotion === t);
      if (!m) continue;
      const btn = document.createElement('button');
      btn.innerHTML = pieceHTML({ t, c: color });
      btn.addEventListener('click', () => {
        hidePromotionChooser();
        performMove(m);
      });
      promotionOptions.appendChild(btn);
    }
    promotionOverlay.classList.remove('hidden');
  }
  function hidePromotionChooser() {
    promotionOverlay.classList.add('hidden');
  }

  // --- End-of-game modal -------------------------------------------------
  function showEndModal(status) {
    const messages = {
      checkmate: () => {
        const winner = game.state.turn === 'w' ? 'Negras' : 'Blancas';
        return `Jaque mate. ¡Ganan las ${winner}!`;
      },
      stalemate: () => 'Tablas por ahogado.',
      'draw-50': () => 'Tablas por la regla de 50 movimientos.',
      'draw-material': () => 'Tablas por material insuficiente.',
    };
    endMessage.textContent = messages[status] ? messages[status]() : 'Fin de la partida.';
    endModal.classList.remove('hidden');
  }
  function hideEndModal() { endModal.classList.add('hidden'); }

  // --- Settings panel ------------------------------------------------
  function renderSegmented(containerEl, settingKey, onChange) {
    for (const btn of containerEl.querySelectorAll('.segment')) {
      btn.classList.toggle('active', btn.dataset.value === settings[settingKey]);
      btn.onclick = () => {
        if (settings[settingKey] === btn.dataset.value) return;
        settings[settingKey] = btn.dataset.value;
        saveSettings();
        for (const b of containerEl.querySelectorAll('.segment')) b.classList.toggle('active', b === btn);
        if (onChange) onChange();
      };
    }
  }

  function renderSwatchGroup(containerEl, settingKey, onChange) {
    containerEl.innerHTML = '';
    for (const [key, theme] of Object.entries(THEMES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch' + (settings[settingKey] === key ? ' active' : '');
      btn.style.setProperty('--sw-a', theme.light);
      btn.style.setProperty('--sw-b', theme.dark);
      btn.innerHTML = `<span class="swatch-preview"><span></span><span></span><span></span><span></span></span><span>${theme.label}</span>`;
      btn.addEventListener('click', () => {
        settings[settingKey] = key;
        saveSettings();
        for (const b of containerEl.querySelectorAll('.swatch')) b.classList.remove('active');
        btn.classList.add('active');
        if (onChange) onChange();
      });
      containerEl.appendChild(btn);
    }
  }

  function openSettings() {
    settingsPanel.classList.remove('hidden');
    renderSavedGamesList();
  }
  function closeSettings() { settingsPanel.classList.add('hidden'); }

  // --- Partidas guardadas -------------------------------------------
  function formatSavedDate(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function saveCurrentGame() {
    if (!game || game.moves.length === 0) {
      alert('Todavía no hay movimientos para guardar.');
      return;
    }
    const defaultName = `Partida ${formatSavedDate(Date.now())}`;
    const name = prompt('Nombre para esta partida:', defaultName);
    if (name === null) return;
    const list = loadSavedGames();
    list.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name.trim() || defaultName,
      savedAt: Date.now(),
      moves: game.moves,
      playerColor: game.playerColor,
    });
    persistSavedGames(list);
    renderSavedGamesList();
  }

  function loadSavedGameById(id) {
    const list = loadSavedGames();
    const entry = list.find(g => g.id === id);
    if (!entry) return;
    if (game && game.moves.length > 0 && !game.gameOver) {
      if (!confirm('¿Cargar esta partida? Se perderá la partida actual si no la guardaste.')) return;
    }
    game = rebuildFromMoves(entry.moves, entry.playerColor);
    saveGame();
    hideEndModal();
    hidePromotionChooser();
    closeSettings();
    renderBoard();
    updateCaptured();
    updateStatusBar(ChessEngine.gameStatus(game.state));
    if (!game.gameOver && game.state.turn !== game.playerColor) scheduleAIMove();
  }

  function deleteSavedGame(id) {
    const list = loadSavedGames().filter(g => g.id !== id);
    persistSavedGames(list);
    renderSavedGamesList();
  }

  function renderSavedGamesList() {
    const list = loadSavedGames();
    savedGamesListEl.innerHTML = '';
    if (list.length === 0) {
      const p = document.createElement('p');
      p.className = 'saved-games-empty';
      p.textContent = 'No guardaste ninguna partida todavía.';
      savedGamesListEl.appendChild(p);
      return;
    }
    for (const entry of list) {
      const row = document.createElement('div');
      row.className = 'saved-game-row';
      const sideLabel = entry.playerColor === 'b' ? 'negras' : 'blancas';
      row.innerHTML = `
        <div class="saved-game-info">
          <div class="saved-game-name"></div>
          <div class="saved-game-meta">${formatSavedDate(entry.savedAt)} · jugás con ${sideLabel} · ${entry.moves.length} jugadas</div>
        </div>
        <button type="button" class="btn-load">Cargar</button>
        <button type="button" class="btn-delete" aria-label="Eliminar">✕</button>
      `;
      row.querySelector('.saved-game-name').textContent = entry.name;
      row.querySelector('.btn-load').addEventListener('click', () => loadSavedGameById(entry.id));
      row.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm(`¿Eliminar "${entry.name}"?`)) deleteSavedGame(entry.id);
      });
      savedGamesListEl.appendChild(row);
    }
  }

  // --- Wiring --------------------------------------------------------
  function init() {
    applyThemeVars();

    renderSegmented(document.getElementById('difficulty-group'), 'difficulty');
    renderSegmented(document.getElementById('side-group'), 'playerColor');
    renderSwatchGroup(document.getElementById('board-theme-group'), 'boardTheme', () => { applyThemeVars(); renderBoard(); });
    renderSwatchGroup(document.getElementById('piece-theme-group'), 'pieceTheme', () => { applyThemeVars(); renderBoard(); });

    toggleHighlight.checked = settings.showLastMove;
    toggleHighlight.addEventListener('change', () => {
      settings.showLastMove = toggleHighlight.checked;
      saveSettings();
      renderBoard();
    });

    toggleSound.checked = settings.soundEnabled;
    ChessAudio.setEnabled(settings.soundEnabled);
    toggleSound.addEventListener('change', () => {
      settings.soundEnabled = toggleSound.checked;
      ChessAudio.setEnabled(settings.soundEnabled);
      saveSettings();
      if (settings.soundEnabled) ChessAudio.playMove();
    });

    btnSaveGame.addEventListener('click', saveCurrentGame);

    btnSettings.addEventListener('click', openSettings);
    btnCloseSettings.addEventListener('click', closeSettings);
    settingsPanel.addEventListener('click', (e) => { if (e.target === settingsPanel) closeSettings(); });

    btnNew.addEventListener('click', () => startNewGame(false));
    btnUndo.addEventListener('click', undoMove);
    btnEndNew.addEventListener('click', () => startNewGame(true));

    const saved = loadGame();
    if (saved && saved.moves.length >= 0 && saved.playerColor) {
      try {
        game = rebuildFromMoves(saved.moves, saved.playerColor);
        renderBoard();
        updateCaptured();
        updateStatusBar(ChessEngine.gameStatus(game.state));
        if (!game.gameOver && game.state.turn !== game.playerColor) scheduleAIMove();
      } catch (e) {
        startNewGame(true);
      }
    } else {
      startNewGame(true);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
