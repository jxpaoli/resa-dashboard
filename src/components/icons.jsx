// Jeu d'icônes SVG (trait, currentColor). Taille pilotée par le CSS.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  xmlns: 'http://www.w3.org/2000/svg',
};

export function PlusIcon({ className }) {
  return (
    <svg className={className} {...base} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Table isométrique (plein, currentColor) — d'après le picto fourni
export function TableIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* plateau */}
      <path d="M3 24 L27 11 L45 22 L21 35 Z" />
      {/* pieds (effilés) */}
      <path d="M3 23 L8.5 25.5 L6.5 46 L2.5 44 Z" />
      <path d="M18 33.5 L24 36 L22 48 L19 47 Z" />
      <path d="M42 21.5 L46 23.5 L44 45 L41 44 Z" />
      <path d="M25 12 L30 14 L29 32 L27 31 Z" />
    </svg>
  );
}

// Assiette + couverts (fourchette à gauche, couteau à droite)
export function CouvertIcon({ className }) {
  return (
    <svg className={className} {...base} strokeWidth={1.6}>
      <circle cx="12" cy="12.5" r="4.3" />
      <path d="M4.6 3.2v4.4a1.5 1.5 0 0 0 3 0V3.2" />
      <path d="M6.1 8.6V20.8" />
      <path d="M19.5 3.2c-1.4.4-2.2 2.6-2.2 4.6 0 1.5.8 2.2 2.1 2.2" />
      <path d="M19.4 3.2V20.8" />
    </svg>
  );
}

// Liste / Réservations
export function ReservationsIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Arrivée (entrer par une porte)
export function ArriveeIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M13 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6" />
      <path d="M4 12h11" />
      <path d="M11 8l4 4-4 4" />
    </svg>
  );
}

// Déconnexion (sortir)
export function LogoutIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M11 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6" />
      <path d="M20 12H9" />
      <path d="M16 8l4 4-4 4" />
    </svg>
  );
}
