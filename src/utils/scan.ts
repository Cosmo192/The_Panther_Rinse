export function scanCountdown(startedAt: string | null, now: number): string {
  const start = startedAt ? Date.parse(startedAt) : NaN;
  if (!Number.isFinite(start)) return '—:—';
  const seconds = Math.max(0, Math.min(2700, Math.ceil((start + 45 * 60000 - now) / 1000)));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
