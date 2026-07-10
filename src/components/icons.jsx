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

// Table (vue de côté) : plateau + pieds
export function TableIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M2.5 8.5h19" strokeWidth={2.2} />
      <path d="M6 8.5V19M18 8.5V19" />
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
