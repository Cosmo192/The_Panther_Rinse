type MachineType = 'Washer' | 'Dryer';

const groups: Array<{ type: MachineType; available: number; total: number }> = [
  { type: 'Washer', available: 9, total: 15 },
  { type: 'Dryer', available: 6, total: 15 },
];

export default function App() {
  return (
    <main>
      <header>
        <span className="eyebrow">GSU University Commons A</span>
        <h1>Laundry room</h1>
        <p>See what’s available before heading downstairs.</p>
      </header>

      <section aria-label="Machine availability" className="machine-grid">
        {groups.map(({ type, available, total }) => (
          <article key={type}>
            <span className="status-dot" aria-hidden="true" />
            <h2>{type}s</h2>
            <strong>{available}</strong>
            <p>of {total} available</p>
          </article>
        ))}
      </section>

      <footer>Updates automatically every few seconds</footer>
    </main>
  );
}
