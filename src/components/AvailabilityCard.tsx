type AvailabilityCardProps = {
  label: string;
  available: number;
  total: number;
};

export function AvailabilityCard({ label, available, total }: AvailabilityCardProps) {
  return (
    <article className="panel">
      <h2 className="section-title">{label}</h2>
      <strong className="mt-3 block text-4xl font-semibold text-primary">{available}</strong>
      <p className="mt-2 text-sm text-muted">of {total} available</p>
    </article>
  );
}
