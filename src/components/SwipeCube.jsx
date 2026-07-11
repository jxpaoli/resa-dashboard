import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Cube 3D piloté au doigt : pendant le swipe horizontal, deux pages (courante +
// voisine) sont posées sur deux faces d'un cube qui tourne en suivant le doigt.
// Au relâché : si on a tourné assez → on bascule sur la voisine, sinon retour.
const COMMIT = 0.32;   // fraction de la largeur pour valider le changement
const MIN = 8;         // px avant de décider horizontal vs vertical

export default function SwipeCube({ pages, render }) {
  const location = useLocation();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const cubeRef = useRef(null);
  const t = useRef(null);                 // état du geste en cours
  const [cube, setCube] = useState(null); // { dir, neighbor, scrollY } quand un drag est actif

  const setAngle = (deg) => {
    const c = cubeRef.current;
    if (c) c.style.transform = `translateZ(calc(var(--cube-w) / -2)) rotateY(${deg}deg)`;
  };
  const endCube = useCallback(() => { setCube(null); t.current = null; }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const W = () => window.innerWidth;

    const onStart = (e) => {
      if (e.touches.length !== 1) return;
      if (document.querySelector('.modal-overlay')) return; // pas de cube si une fenêtre est ouverte
      const p = e.touches[0];
      t.current = { x: p.clientX, y: p.clientY, decided: false, active: false, angle: 0, dir: 0, neighbor: null };
    };

    const onMove = (e) => {
      const s = t.current;
      if (!s) return;
      const p = e.touches[0];
      const dx = p.clientX - s.x;
      const dy = p.clientY - s.y;

      if (!s.decided) {
        if (Math.abs(dx) < MIN && Math.abs(dy) < MIN) return;
        if (Math.abs(dy) >= Math.abs(dx)) { t.current = null; return; } // geste vertical → scroll normal
        const dir = dx < 0 ? 1 : -1;                                    // gauche = suivant, droite = précédent
        const i = pages.indexOf(location.pathname);
        const neighbor = i < 0 ? null : pages[i + dir];
        if (!neighbor) { t.current = null; return; }                    // pas de voisin de ce côté
        s.decided = true; s.active = true; s.dir = dir; s.neighbor = neighbor;
        setCube({ dir, neighbor, scrollY: window.scrollY });
      }

      if (s.active) {
        e.preventDefault();                                             // bloque le scroll pendant la rotation
        let deg = (dx / W()) * 90;
        deg = s.dir > 0 ? Math.max(-90, Math.min(0, deg)) : Math.max(0, Math.min(90, deg));
        s.angle = deg;
        setAngle(deg);
      }
    };

    const onEnd = () => {
      const s = t.current;
      if (!s || !s.active) { t.current = null; return; }
      const commit = Math.abs(s.angle) / 90 > COMMIT;
      const target = commit ? (s.dir > 0 ? -90 : 90) : 0;
      const c = cubeRef.current;
      t.current = null;
      if (!c) { if (commit) { window.scrollTo(0, 0); navigate(s.neighbor); } endCube(); return; }
      c.style.transition = 'transform .32s cubic-bezier(.33,.9,.32,1)';
      void c.offsetWidth;                                               // reflow avant d'animer
      setAngle(target);
      const done = () => {
        c.removeEventListener('transitionend', done);
        if (commit) { window.scrollTo(0, 0); navigate(s.neighbor); }
        endCube();
      };
      c.addEventListener('transitionend', done);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [location.pathname, pages, navigate, endCube]);

  return (
    <div ref={wrapRef} className="swipe-wrap">
      {/* Page courante (flux normal, scroll normal) */}
      <div key={location.pathname} className="page-anim">{render(location)}</div>

      {/* Cube pendant le swipe */}
      {cube && (
        <div className="cube-stage" style={{ '--cube-w': `${window.innerWidth}px` }}>
          <div
            ref={cubeRef}
            className="cube"
            style={{ transform: 'translateZ(calc(var(--cube-w) / -2)) rotateY(0deg)' }}
          >
            <div className="cube-face cube-face--front">
              <div className="cube-face__scroll" ref={(n) => { if (n) n.scrollTop = cube.scrollY; }}>
                {render(location)}
              </div>
            </div>
            <div className={`cube-face ${cube.dir > 0 ? 'cube-face--next' : 'cube-face--prev'}`}>
              <div className="cube-face__scroll">
                {render({ pathname: cube.neighbor, search: '', hash: '', state: null, key: 'cube' })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
