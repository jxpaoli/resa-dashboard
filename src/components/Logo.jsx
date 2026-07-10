// Logo « Aux Terrasses de Troinex » — recréation vectorielle (branche d'olivier
// + wordmark serif). Deux variantes : couleur (fond clair) et light (fond foncé).
//
// Pour utiliser le vrai logo raster à la place : déposer public/logo.png puis
// remplacer le <svg> par <img src="/logo.png" alt="Aux Terrasses de Troinex" />.

const LEAF = 'M0 0 Q11 -5 22 0 Q11 5 0 0 Z';

function palette(light) {
  return light
    ? { main: '#f2f0e6', sub: '#d6ddc4', branch: '#c7d1a8', olive: '#dbe2c6' }
    : { main: '#3f4a2a', sub: '#7c8a5c', branch: '#6f7d49', olive: '#5a6b34' };
}

// Branche d'olivier seule (réutilisée dans la navbar)
export function Sprig({ light = false, className = '', title = 'Olivier' }) {
  const c = palette(light);
  return (
    <svg className={className} viewBox="140 0 120 44" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title}>
      <Branch c={c} />
    </svg>
  );
}

function Branch({ c }) {
  return (
    <g fill="none" stroke={c.branch} strokeWidth="1.6" strokeLinecap="round">
      <path d="M150 32 Q 200 8 250 32" />
      {[
        [160, 28, 115], [176, 20, 100], [192, 15, 92],
        [210, 15, 82], [228, 21, 68], [242, 29, 55],
      ].map(([x, y, r], i) => (
        <path key={i} d={LEAF} transform={`translate(${x} ${y}) rotate(${r})`} />
      ))}
      {/* olives */}
      <line x1="195" y1="12" x2="197" y2="20" />
      <line x1="208" y1="13" x2="206" y2="21" />
      <ellipse cx="195" cy="11" rx="3.4" ry="4.2" fill={c.olive} stroke="none" />
      <ellipse cx="208" cy="12" rx="3.4" ry="4.2" fill={c.olive} stroke="none" />
    </g>
  );
}

// Logo complet empilé (page de login)
export default function Logo({ light = false, className = '' }) {
  const c = palette(light);
  return (
    <svg
      className={className}
      viewBox="0 0 400 158"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Aux Terrasses de Troinex — Restaurant"
    >
      <Branch c={c} />
      <g
        fill={c.main}
        fontFamily="Georgia, 'Times New Roman', serif"
        textAnchor="middle"
        fontWeight="400"
      >
        <text x="200" y="86" fontSize="32" letterSpacing="3">AUX TERRASSES</text>
        <text x="200" y="120" fontSize="32" letterSpacing="3">DE TROINEX</text>
        <text x="200" y="143" fontSize="11" letterSpacing="8" fill={c.sub}>RESTAURANT</text>
      </g>
    </svg>
  );
}
