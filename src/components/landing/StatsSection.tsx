import RadialOrbitalTimelineDemo from '@/components/demo/radial-orbital-timeline-demo';

const STATS = [
  { value: '50+', label: 'Happy educators' },
  { value: '12', label: 'EdTech awards' },
  { value: '4,800+', label: 'Learning hours' },
  { value: '96%', label: 'Student success' },
];

export default function StatsSection() {
  return (
    <section className="py-20 px-6 bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="grid grid-cols-2 gap-6 text-center">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="p-8 border-2 border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] rounded-[var(--cl-r-xl)] bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] hover:border-[var(--cl-primary)] dark:hover:border-[var(--cl-primary)] hover:-translate-y-2 transition-all duration-300 ease-out"
            >
              <div className="text-5xl font-semibold text-[var(--cl-primary)] dark:text-[var(--cl-primary)] mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-[var(--cl-muted)] dark:text-[var(--cl-muted-soft)] uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] mb-1">How Classera fits together</h2>
          <p className="text-sm text-[var(--cl-muted)] dark:text-[var(--cl-muted-soft)] mb-6">Tap a node to see how each piece connects.</p>
          <div className="h-[500px] rounded-[var(--cl-r-xl)] overflow-hidden border-2 border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] bg-[var(--cl-canvas-soft)] dark:bg-[var(--cl-surface-inverse)]">
            <RadialOrbitalTimelineDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
