export type Machine = {
  id: string;
  type: 'washer' | 'dryer';
  status: 'free' | 'in_use';
  in_use_since: string | null;
  created_at: string;
};

export const MACHINE_COLUMNS = 'id,type,status,in_use_since,created_at';
export const CYCLE_DURATION_MS = 50 * 60 * 1000;

export function remainingTime(machine: Machine, now: number): string {
  if (machine.status === 'free') return 'Ready for your laundry';
  const started = machine.in_use_since ? Date.parse(machine.in_use_since) : NaN;
  if (!Number.isFinite(started)) return 'Time unavailable';
  const minutes = Math.ceil((started + CYCLE_DURATION_MS - now) / 60000);
  return minutes > 0 ? `${Math.min(minutes, 50)} min remaining` : 'Finishing soon';
}

export function sortMachines(machines: Machine[]): Machine[] {
  return [...machines].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true }));
}
