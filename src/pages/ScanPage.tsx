import { useEffect, useRef, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase';
import { MACHINE_COLUMNS, type Machine } from '../utils/machines';
import { scanCountdown } from '../utils/scan';
import { useMachines } from '../hooks/useMachines';
import { MachineCard } from '../components/MachineCard';
import { Spinner, useToast } from '../components/Feedback';

export function ScanPage() {
  const notify = useToast();
  const token = new URLSearchParams(window.location.search).get('token')?.trim() ?? '';
  const { machines, loading, error: overviewError, live, retry: refresh } = useMachines();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const lock = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { mounted.current = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    setChecking(true);
    setInvalid(false);
    setError('');
    setMachine(null);
    async function validate() {
      try {
        if (!token) {
          if (active) { setInvalid(true); setError('No QR token found. Scan the code attached to your machine.'); }
          return;
        }
        const client = getSupabaseClient();
        const { data, error: validationError } = await client.functions.invoke(
          `validate-qr-token?token=${encodeURIComponent(token)}`, { method: 'GET' },
        );
        if (validationError) throw validationError;
        if (!data?.valid) {
          if (active) { setInvalid(true); setError('This QR code is invalid or no longer active. Please scan the current code on the machine.'); }
          return;
        }
        const { data: row, error: readError } = await client.from('machines')
          .select(MACHINE_COLUMNS).eq('id', data.machine_id).single();
        if (readError) throw readError;
        if (active) setMachine(row as Machine);
      } catch {
        if (active) setError('Unable to validate this machine. Check your connection and try again.');
      } finally {
        if (active) setChecking(false);
      }
    }
    void validate();
    return () => { active = false; };
  }, [token, attempt]);

  useEffect(() => {
    if (!machine || busy) return;
    const current = machines.find(row => row.id === machine.id);
    if (current) setMachine(current);
    // Only apply fresh snapshots, not the old snapshot after a write response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines]);

  async function mark(status: 'free' | 'in_use') {
    if (!machine || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const { data, error: actionError } = await getSupabaseClient().functions.invoke(
        status === 'free' ? 'mark-machine-free' : 'mark-machine-in-use',
        { body: { machine_id: machine.id, qr_token: token } },
      );
      if (actionError) throw actionError;
      if (!data?.success) throw new Error('Unexpected response');
      if (!mounted.current) return;
      setMachine({ ...machine, status, in_use_since: status === 'free' ? null : data.in_use_since });
      setNow(Date.now());
      setDone(status === 'free');
      notify(status === 'free' ? 'Machine marked free. Thank you!' : 'Machine marked in use. Your timer has started.', 'success');
    } catch (cause) {
      if (!mounted.current) return;
      notify('Could not confirm the update. Check the current status before retrying.', 'error');
      const code = cause instanceof FunctionsHttpError ? cause.context.status : 0;
      if (code === 401 || code === 404) {
        setInvalid(true);
        setError('This QR code is no longer valid for this machine. Please scan again.');
      } else if (code === 409) {
        setError('Someone already marked this machine in use. Refreshing its status.');
      } else {
        setError('Could not confirm the change. Check the live status before trying again.');
      }
    } finally {
      lock.current = false;
      if (mounted.current) { setBusy(false); refresh(); }
    }
  }

  const inUse = machine?.status === 'in_use';
  const countdown = scanCountdown(machine?.in_use_since ?? null, now);
  return (
    <main className="page-shell max-w-3xl">
      <a href="/" className="text-link">← All machines</a>
      <p className="eyebrow mt-4">GSU · Laundry room</p>
      {checking ? <div className="py-16 text-center text-lg"><Spinner label="Checking your QR code…" /></div> : (
        <>
          {error && <div role="alert" className="my-5 rounded-xl bg-danger-soft p-4 text-danger-ink">{error}
            {!invalid && !machine && <button className="btn btn-secondary mt-3" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
          </div>}
          {machine && !invalid && (
            <section className="my-6 rounded-3xl border border-line bg-canvas p-6 text-center sm:p-10">
              <p className="text-sm text-muted">{machine.type === 'washer' ? 'Washing machine' : 'Dryer'}</p>
              <h1 className="page-title mt-2 break-all">{machine.id}</h1>
              <p role="status" className={`mx-auto mt-4 w-fit rounded-full px-4 py-2 text-sm font-bold ${inUse ? 'bg-danger-soft text-danger-ink' : 'bg-success-soft text-success-ink'}`}>
                {inUse ? 'In Use' : done ? 'Done · Free' : 'Free'}
              </p>
              {inUse ? (
                <>
                  <p className="mt-8 text-6xl font-semibold tabular-nums tracking-tight" aria-label={`Time remaining: ${countdown}`}>{countdown}</p>
                  <p className="mt-3 text-sm text-muted">{countdown === '00:00' ? 'Estimated cycle complete. Check your laundry.' : 'Estimated time remaining'}</p>
                  <button disabled={busy} aria-busy={busy} onClick={() => void mark('free')} className="btn btn-success btn-large mt-8">
                    {busy ? <Spinner label="Saving…" /> : 'Mark as Done'}
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-6 text-muted">{done ? 'All done! Thanks for freeing up this machine.' : 'Load your laundry, then let everyone know this machine is taken.'}</p>
                  <button disabled={busy} aria-busy={busy} onClick={() => void mark('in_use')} className="btn btn-primary btn-large mt-8">
                    {busy ? <Spinner label="Starting…" /> : 'Mark as In Use'}
                  </button>
                </>
              )}
              <p className="mt-4 text-xs leading-5 text-muted">45-minute estimate. Automatic release occurs after 50 minutes. These buttons update the tracker, not the physical machine.</p>
            </section>
          )}
        </>
      )}
      <section className="mt-10">
        <h2 className="section-title">Other machines</h2>
        <p className="mb-4 mt-1 text-sm text-muted">{live ? 'Live availability' : 'Live updates reconnecting — status may be outdated'}</p>
        {overviewError && <p role="alert" className="alert mb-4">{overviewError}<button onClick={refresh} className="btn btn-secondary ml-2">Retry</button></p>}
        {loading && <div className="mb-4"><Spinner label="Loading availability…" /></div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {machines.filter(row => row.id !== machine?.id).map(row => <MachineCard key={row.id} machine={row} now={now} />)}
        </div>
      </section>
    </main>
  );
}
