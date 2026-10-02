// Sonidos sintetizados con Web Audio API, sin archivos externos.
const ChessAudio = (() => {
  let ctx = null;
  let enabled = true;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, start, duration, type, gainPeak) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const t0 = c.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(gainPeak || 0.15, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.03);
    } catch (e) {}
  }

  function playMove() { tone(520, 0, 0.09, 'sine', 0.14); }
  function playCapture() { tone(300, 0, 0.1, 'square', 0.12); tone(210, 0.05, 0.1, 'square', 0.1); }
  function playCheck() { tone(880, 0, 0.08, 'triangle', 0.16); tone(660, 0.09, 0.13, 'triangle', 0.16); }
  function playCheckmate() { tone(660, 0, 0.12, 'sawtooth', 0.13); tone(440, 0.13, 0.14, 'sawtooth', 0.13); tone(330, 0.27, 0.24, 'sawtooth', 0.13); }
  function playDraw() { tone(440, 0, 0.14, 'sine', 0.12); tone(440, 0.16, 0.18, 'sine', 0.12); }
  function playInvalid() { tone(160, 0, 0.09, 'square', 0.08); }

  function setEnabled(v) { enabled = v; }
  function unlock() { ensureCtx(); }

  return { playMove, playCapture, playCheck, playCheckmate, playDraw, playInvalid, setEnabled, unlock };
})();

if (typeof module !== 'undefined') module.exports = ChessAudio;
