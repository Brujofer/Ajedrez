// Piezas de ajedrez en SVG, con 3 estilos seleccionables.
// Cada pieza usa fill="currentColor" para poder recolorearse por CSS/JS.
// viewBox comun: 0 0 100 100

const ChessPieces = (() => {
  // ---------------------------------------------------------------
  // Estilo "clasico": Staunton vectorial, trazo fino
  // ---------------------------------------------------------------
  const BASE_CLASICO = `
    <path d="M14 88 L86 88 L93 97 L7 97 Z"/>
    <rect x="5" y="97" width="90" height="4.5" rx="2"/>
  `;
  const BODY_CLASICO = `M 34 82 C 31 65 37 54 41 48 L 59 48 C 63 54 69 65 66 82 Z`;

  const SHAPES_CLASICO = {
    p: `
      <circle cx="50" cy="27" r="13"/>
      <ellipse cx="50" cy="41" rx="9" ry="4"/>
      <path d="${BODY_CLASICO}"/>
      ${BASE_CLASICO}
    `,
    r: `
      <rect x="28" y="44" width="44" height="40" rx="2"/>
      <rect x="25" y="36" width="8" height="12"/>
      <rect x="46" y="36" width="8" height="12"/>
      <rect x="67" y="36" width="8" height="12"/>
      <rect x="24" y="44" width="52" height="7"/>
      ${BASE_CLASICO}
    `,
    b: `
      <path d="${BODY_CLASICO}"/>
      <circle cx="50" cy="30" r="8"/>
      <circle cx="50" cy="15" r="4"/>
      <line x1="40" y1="58" x2="60" y2="68" stroke="var(--piece-stroke)" stroke-width="4" stroke-linecap="round"/>
      ${BASE_CLASICO}
    `,
    n: `
      <path d="M30 88 C28 76 29 68 33 62 C29 58 28 50 32 44 C29 40 29 34 34 30
                C33 24 37 18 45 16 C49 15 52 17 51 21 C56 19 63 21 65 27
                C69 26 74 29 72 35 L78 41 C82 45 80 51 75 50 L66 48
                C68 55 66 63 59 65 L57 72 C62 77 64 83 62 88 Z"/>
      <circle cx="46" cy="27" r="2.6" fill="var(--piece-stroke)"/>
      ${BASE_CLASICO}
    `,
    q: `
      <path d="${BODY_CLASICO}"/>
      <path d="M33 48 C33 44 38 42 50 42 C62 42 67 44 67 48 L64 55 L36 55 Z"/>
      <circle cx="28" cy="38" r="5.5"/>
      <circle cx="39.5" cy="33" r="5.5"/>
      <circle cx="50" cy="30" r="6.5"/>
      <circle cx="60.5" cy="33" r="5.5"/>
      <circle cx="72" cy="38" r="5.5"/>
      ${BASE_CLASICO}
    `,
    k: `
      <path d="${BODY_CLASICO}"/>
      <path d="M33 48 C33 44 38 42 50 42 C62 42 67 44 67 48 L64 54 L36 54 Z"/>
      <rect x="46.5" y="10" width="7" height="20" rx="1.5"/>
      <rect x="39" y="16.5" width="22" height="7" rx="1.5"/>
      <circle cx="50" cy="36" r="4" fill="none" stroke="var(--piece-stroke)" stroke-width="3"/>
      ${BASE_CLASICO}
    `,
  };

  // ---------------------------------------------------------------
  // Estilo "moderno": geometrico, plano, bloques
  // ---------------------------------------------------------------
  const BASE_MODERNO = `<rect x="15" y="86" width="70" height="8" rx="4"/>`;

  const SHAPES_MODERNO = {
    p: `
      <circle cx="50" cy="32" r="16"/>
      <path d="M38 50 Q50 44 62 50 L68 82 Q50 90 32 82 Z"/>
      ${BASE_MODERNO}
    `,
    r: `
      <rect x="26" y="42" width="48" height="40" rx="6"/>
      <rect x="24" y="28" width="13" height="18" rx="3"/>
      <rect x="43.5" y="28" width="13" height="18" rx="3"/>
      <rect x="63" y="28" width="13" height="18" rx="3"/>
      <rect x="24" y="40" width="52" height="9" rx="3"/>
      ${BASE_MODERNO}
    `,
    b: `
      <rect x="38" y="46" width="24" height="38" rx="12"/>
      <circle cx="50" cy="34" r="11"/>
      <circle cx="50" cy="17" r="4.5"/>
      <line x1="41" y1="59" x2="59" y2="59" stroke="var(--piece-stroke)" stroke-width="4.5" stroke-linecap="round"/>
      ${BASE_MODERNO}
    `,
    n: `
      <path d="M30 84 Q28 62 38 52 Q31 47 35 38 Q39 27 52 23 Q61 20 63 28
                Q72 27 75 37 L81 42 Q85 47 78 48 L65 45 Q68 57 57 61 L59 70
                Q65 76 63 84 Z"/>
      <circle cx="48" cy="33" r="3" fill="var(--piece-stroke)"/>
      ${BASE_MODERNO}
    `,
    q: `
      <path d="M32 50 Q50 43 68 50 L72 84 Q50 92 28 84 Z"/>
      <rect x="28" y="44" width="44" height="9" rx="4"/>
      <circle cx="28" cy="35" r="6"/>
      <circle cx="41" cy="28" r="6.5"/>
      <circle cx="50" cy="24" r="7.5"/>
      <circle cx="59" cy="28" r="6.5"/>
      <circle cx="72" cy="35" r="6"/>
      ${BASE_MODERNO}
    `,
    k: `
      <path d="M32 54 Q50 47 68 54 L72 84 Q50 92 28 84 Z"/>
      <rect x="28" y="46" width="44" height="9" rx="4"/>
      <rect x="45.5" y="12" width="9" height="24" rx="3"/>
      <rect x="38" y="19.5" width="24" height="9" rx="3"/>
      ${BASE_MODERNO}
    `,
  };

  // ---------------------------------------------------------------
  // Estilo "redondeado": burbujas, trazo grueso, amigable
  // ---------------------------------------------------------------
  const BASE_REDONDEADO = `<ellipse cx="50" cy="91" rx="36" ry="7"/>`;

  const SHAPES_REDONDEADO = {
    p: `
      <ellipse cx="50" cy="65" rx="20" ry="23"/>
      <circle cx="50" cy="33" r="16"/>
      ${BASE_REDONDEADO}
    `,
    r: `
      <ellipse cx="50" cy="67" rx="22" ry="21"/>
      <rect x="30" y="38" width="40" height="30" rx="14"/>
      <circle cx="35" cy="38" r="9"/>
      <circle cx="50" cy="34" r="10"/>
      <circle cx="65" cy="38" r="9"/>
      ${BASE_REDONDEADO}
    `,
    b: `
      <ellipse cx="50" cy="64" rx="19" ry="24"/>
      <circle cx="50" cy="31" r="12"/>
      <circle cx="50" cy="16" r="5.5"/>
      ${BASE_REDONDEADO}
    `,
    n: `
      <ellipse cx="43" cy="70" rx="19" ry="20"/>
      <circle cx="60" cy="42" r="18"/>
      <path d="M68 28 Q72 14 82 20 Q80 30 70 34 Z"/>
      <circle cx="70" cy="46" r="3.2" fill="var(--piece-stroke)"/>
      ${BASE_REDONDEADO}
    `,
    q: `
      <ellipse cx="50" cy="66" rx="21" ry="22"/>
      <circle cx="27" cy="40" r="8"/>
      <circle cx="39" cy="31" r="8.5"/>
      <circle cx="50" cy="27" r="9.5"/>
      <circle cx="61" cy="31" r="8.5"/>
      <circle cx="73" cy="40" r="8"/>
      ${BASE_REDONDEADO}
    `,
    k: `
      <ellipse cx="50" cy="66" rx="21" ry="22"/>
      <circle cx="50" cy="34" r="13"/>
      <rect x="45.5" y="10" width="9" height="20" rx="4.5"/>
      <rect x="39" y="16.5" width="22" height="9" rx="4.5"/>
      ${BASE_REDONDEADO}
    `,
  };

  const STYLE_STROKE_WIDTH = { clasico: '3.5', moderno: '3', redondeado: '4.5' };
  const STYLES = { clasico: SHAPES_CLASICO, moderno: SHAPES_MODERNO, redondeado: SHAPES_REDONDEADO };
  const STYLE_LABELS = { clasico: 'Clásico', moderno: 'Moderno', redondeado: 'Redondeado' };

  function svg(type, style) {
    const styleKey = STYLES[style] ? style : 'clasico';
    const inner = STYLES[styleKey][type] || '';
    const sw = STYLE_STROKE_WIDTH[styleKey];
    return `<svg viewBox="0 0 100 100" class="piece-svg" xmlns="http://www.w3.org/2000/svg">` +
      `<g fill="currentColor" stroke="var(--piece-stroke)" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" style="paint-order: stroke fill;">${inner}</g>` +
      `</svg>`;
  }

  return { svg, TYPES: Object.keys(SHAPES_CLASICO), STYLES: Object.keys(STYLES), STYLE_LABELS };
})();

if (typeof module !== 'undefined') module.exports = ChessPieces;
