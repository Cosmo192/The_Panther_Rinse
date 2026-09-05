import { remainingTime, type Machine } from '../utils/machines';

export function MachineCard({ machine, now }: { machine: Machine; now: number }) {
  const free = machine.status === 'free';
  return (
    <article className={`rounded-2xl border bg-canvas p-4 ${free ? 'border-success-border' : 'border-danger-border'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">{machine.id}</h3>
        <span className={`status-badge ${free ? 'status-free' : 'status-in-use'}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${free ? 'bg-success' : 'bg-danger'}`} />
          {free ? 'Free' : 'In Use'}
        </span>
      </div>
      <p className="mt-5 text-sm text-muted">{remainingTime(machine, now)}</p>
    </article>
  );
}
