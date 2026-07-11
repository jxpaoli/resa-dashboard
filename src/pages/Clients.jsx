import { useEffect, useMemo, useState } from 'react';
import { getClients } from '../utils/supabase.js';
import ModalClient from '../components/ModalClient.jsx';

// Page CLIENTS (Directeur) : base clients, recherche, édition + historique.
export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);

  const load = async () => {
    setClients(await getClients());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      `${c.nom} ${c.prenom || ''} ${c.telephone || ''} ${c.email || ''}`.toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Clients</h1>
        <p className="page__sub">{clients.length} fiche{clients.length > 1 ? 's' : ''}</p>
      </header>

      <input
        className="agenda-search"
        style={{ marginBottom: 12 }}
        placeholder="🔎  Chercher (nom, téléphone, email)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="muted">{clients.length === 0 ? 'Aucun client pour le moment.' : 'Aucun résultat.'}</p>
      ) : (
        <div className="tiles">
          {filtered.map((c) => (
            <button key={c.id} className="client-row" onClick={() => setPicked(c)}>
              <span className="client-row__nom">{c.nom}{c.prenom ? ` ${c.prenom}` : ''}</span>
              <span className="client-row__contact">
                {c.telephone || '—'}{c.email ? ` · ${c.email}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {picked && (
        <ModalClient client={picked} onClose={() => setPicked(null)} onSaved={() => { setPicked(null); load(); }} />
      )}
    </div>
  );
}
