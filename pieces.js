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
      <path d="M28 86 C20 78 32 72 22 64 C14 58 30 52 20 44 C12 38 28 32 22 24
                C24 18 28 13 36 11 C46 8 56 10 64 16 C72 20 80 26 85 34
                C82 40 76 42 70 40 C66 44 62 46 58 50 C62 56 58 64 54 70
                L52 78 C56 82 60 84 58 86 Z"/>
      <path d="M34 13 L28 2 L42 10 Z"/>
      <circle cx="54" cy="20" r="3" fill="var(--piece-stroke)"/>
      <path d="M80 29 Q87 28 86 35 Q85 40 79 38 Q75 36 78 32 Z" fill="var(--piece-stroke)"/>
      <path d="M68 41 Q62 45 56 43" fill="none" stroke="var(--piece-stroke)" stroke-width="2.3" stroke-linecap="round"/>
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

  function svg(type) {
    const inner = SHAPES[type] || '';
    return `<svg viewBox="0 0 100 100" class="piece-svg" xmlns="http://www.w3.org/2000/svg">` +
      `<g fill="currentColor" stroke="var(--piece-stroke)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" style="paint-order: stroke fill;">${inner}</g>` +
      `</svg>`;
  }

  return { svg, TYPES: Object.keys(SHAPES) };
})();

if (typeof module !== 'undefined') module.exports = ChessPieces;
