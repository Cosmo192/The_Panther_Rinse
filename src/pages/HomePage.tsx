import { useEffect, useState } from 'react';
import { MachineCard } from '../components/MachineCard';
import { useMachines } from '../hooks/useMachines';
import { Spinner } from '../components/Feedback';

export function HomePage() {
  const { machines, loading, error, live, retry } = useMachines();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const groups = [
    { title: 'Washers', type: 'washer' },
    { title: 'Dryers', type: 'dryer' },
  ] as const;
  const ready = !loading && !error;

  return (
    <main className="page-shell max-w-7xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow">GSU University Commons A</p>
          <h1 className="page-title mt-3">Laundry room</h1>
          <p className="mt-3 text-muted">A quick check before you head downstairs.</p>
        </div>
        <p className="flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-2 text-xs text-muted" role="status">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${live ? 'bg-success' : 'bg-danger'}`} />
          {loading ? 'Connecting…' : live ? 'Live updates' : 'Live updates disconnected'}
        </p>
      </header>

      <section aria-label="Available machines" aria-live="polite" className="mb-10 grid grid-cols-2 gap-3 sm:gap-5">
        {groups.map(({ title, type }) => {
          const group = machines.filter((machine) => machine.type === type);
          const free = group.filter((machine) => machine.status === 'free').length;
          return (
            <div key={type} className="panel">
              <p className="text-sm font-medium text-muted">{title} available</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
                {ready ? free : '—'}
                {ready && <span className="ml-2 text-base font-normal text-muted">/ {group.length}</span>}
              </p>
              <p className="mt-2 text-xs text-muted">{ready ? `${free} ${title.toLowerCase()} free` : 'Waiting for current status'}</p>
            </div>
          );
        })}
      </section>

      {error && (
        <div role="alert" className="alert mb-6">
          <p>{error}</p>
          <button onClick={retry} className="btn btn-secondary mt-3">Try again</button>
        </div>
      )}
      {!loading && !error && !live && (
        <p role="status" className="mb-6 rounded-xl bg-danger-soft p-4 text-sm text-danger-ink">
          Live updates are reconnecting. Availability may be out of date.
          <button onClick={retry} className="btn btn-secondary ml-2">Reconnect</button>
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        {groups.map(({ title, type }) => {
          const group = machines.filter((machine) => machine.type === type);
          return (
            <section key={type} aria-labelledby={type} aria-busy={loading}>
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <h2 id={type} className="section-title">{title}</h2>
                <span className="text-xs text-muted">{ready ? `${group.length} machines` : 'Availability'}</span>
              </div>
              {loading ? (
                <div role="status">
                  <div className="mb-4 text-sm text-muted"><Spinner label={`Loading ${title.toLowerCase()}…`} /></div>
                  <div aria-hidden="true" className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                    {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-line/60 motion-safe:animate-pulse" />)}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                  {group.map((machine) => <MachineCard key={machine.id} machine={machine} now={now} />)}
                </div>
              )}
              {ready && group.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">No {title.toLowerCase()} have been added yet.</p>}
            </section>
          );
        })}
      </div>
      <footer className="mt-10 border-t border-line pt-6 text-xs leading-6 text-muted">
        Green = Free · Red = In Use. Times are estimates based on a 50-minute cycle.
        <br />This is a read-only view. No sign-in or QR scan needed.
      </footer>
    </main>
  );
}
