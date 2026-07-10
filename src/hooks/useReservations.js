import { useEffect, useState, useCallback } from 'react';
import { getReservations, subscribeToChanges } from '../utils/supabase.js';

// Charge les réservations et se re-synchronise à chaque mutation du store.
export function useReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getReservations();
    setReservations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeToChanges(refresh);
    return unsub;
  }, [refresh]);

  return { reservations, loading, refresh };
}
