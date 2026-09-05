import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabase';
import { MACHINE_COLUMNS, sortMachines, type Machine } from '../utils/machines';

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let revision = 0;
    let requestNumber = 0;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setLive(false);

    let client;
    try {
      client = getSupabaseClient();
    } catch {
      setError('Laundry availability is not configured yet. Add the Supabase project values to .env.local.');
      setLoading(false);
      return;
    }
    const supabase = client;

    async function load() {
      const request = ++requestNumber;
      const initialRevision = revision;
      try {
        const { data, error: queryError } = await supabase.from('machines')
          .select(MACHINE_COLUMNS).abortSignal(controller.signal);
        if (!active || request !== requestNumber) return;
        if (queryError) throw queryError;
        // Never let an older snapshot overwrite a change received mid-request.
        if (initialRevision !== revision) {
          void load();
          return;
        }
        setMachines(sortMachines((data ?? []) as Machine[]));
        setError(null);
      } catch {
        if (active) setError('Unable to refresh availability. Please check your connection and try again.');
      } finally {
        if (active && request === requestNumber) setLoading(false);
      }
    }

    const channel = supabase.channel('public-laundry-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, () => {
        revision += 1;
        // Fetch only public columns; never retain QR tokens from event payloads.
        void load();
      })
      .subscribe((status) => {
        if (!active) return;
        setLive(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') void load();
      });

    void load();
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    window.addEventListener('online', refreshOnReturn);
    return () => {
      active = false;
      controller.abort();
      document.removeEventListener('visibilitychange', refreshOnReturn);
      window.removeEventListener('online', refreshOnReturn);
      void supabase.removeChannel(channel);
    };
  }, [attempt]);

  return { machines, loading, error, live, retry: () => setAttempt((value) => value + 1) };
}
