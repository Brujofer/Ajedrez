// Piezas de ajedrez en SVG, estilo Staunton vectorial simplificado.
// Cada pieza usa fill="currentColor" para poder recolorearse por CSS/JS.
// viewBox comun: 0 0 100 100

const ChessPieces = (() => {
  const BASE = `
    <path d="M14 88 L86 88 L93 97 L7 97 Z"/>
    <rect x="5" y="97" width="90" height="4.5" rx="2"/>
  `;

  const BODY = `M 34 82 C 31 65 37 54 41 48 L 59 48 C 63 54 69 65 66 82 Z`;

  const SHAPES = {
    p: `
      <circle cx="50" cy="27" r="13"/>
      <ellipse cx="50" cy="41" rx="9" ry="4"/>
      <path d="${BODY}"/>
      ${BASE}
    `,
    r: `
      <rect x="28" y="44" width="44" height="40" rx="2"/>
      <rect x="25" y="36" width="8" height="12"/>
      <rect x="46" y="36" width="8" height="12"/>
      <rect x="67" y="36" width="8" height="12"/>
      <rect x="24" y="44" width="52" height="7"/>
      ${BASE}
    `,
    b: `
      <path d="${BODY}"/>
      <circle cx="50" cy="30" r="8"/>
      <circle cx="50" cy="15" r="4"/>
      <line x1="40" y1="58" x2="60" y2="68" stroke="var(--piece-stroke)" stroke-width="4" stroke-linecap="round"/>
      ${BASE}
    `,
    n: `
      <path d="M30 88 C28 76 29 68 33 62 C29 58 28 50 32 44 C29 40 29 34 34 30
                C33 24 37 18 45 16 C49 15 52 17 51 21 C56 19 63 21 65 27
                C69 26 74 29 72 35 L78 41 C82 45 80 51 75 50 L66 48
                C68 55 66 63 59 65 L57 72 C62 77 64 83 62 88 Z"/>
      <circle cx="46" cy="27" r="2.6" fill="var(--piece-stroke)"/>
      ${BASE}
    `,
    q: `
      <path d="${BODY}"/>
      <path d="M33 48 C33 44 38 42 50 42 C62 42 67 44 67 48 L64 55 L36 55 Z"/>
      <circle cx="28" cy="38" r="5.5"/>
      <circle cx="39.5" cy="33" r="5.5"/>
      <circle cx="50" cy="30" r="6.5"/>
      <circle cx="60.5" cy="33" r="5.5"/>
      <circle cx="72" cy="38" r="5.5"/>
      ${BASE}
    `,
    k: `
      <path d="${BODY}"/>
      <path d="M33 48 C33 44 38 42 50 42 C62 42 67 44 67 48 L64 54 L36 54 Z"/>
      <rect x="46.5" y="10" width="7" height="20" rx="1.5"/>
      <rect x="39" y="16.5" width="22" height="7" rx="1.5"/>
      <circle cx="50" cy="36" r="4" fill="none" stroke="var(--piece-stroke)" stroke-width="3"/>
      ${BASE}
    `,
  };

  function svg(type, extraClass) {
    const inner = SHAPES[type] || '';
    return `<svg viewBox="0 0 100 100" class="piece-svg ${extraClass || ''}" xmlns="http://www.w3.org/2000/svg">` +
      `<g fill="currentColor" stroke="var(--piece-stroke)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" style="paint-order: stroke fill;">${inner}</g>` +
      `</svg>`;
  }

  return { svg, TYPES: Object.keys(SHAPES) };
})();

if (typeof module !== 'undefined') module.exports = ChessPieces;
