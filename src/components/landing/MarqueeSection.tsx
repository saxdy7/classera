import { Star } from 'lucide-react';

const ITEMS = ['Live Classes', 'Student Management', 'Video Conferencing', 'Course Builder', 'Analytics'];

function MarqueeGroup() {
  return (
    <span className="text-4xl font-semibold uppercase tracking-tight text-[var(--cl-on-dark)] flex items-center gap-8 whitespace-nowrap">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-8">
          {item}
          <Star className="w-8 h-8 fill-white" />
        </span>
      ))}
    </span>
  );
}

export default function MarqueeSection() {
  return (
    <div className="py-12 bg-[var(--cl-primary)] dark:bg-[var(--cl-primary)] -rotate-1 overflow-hidden">
      <div className="flex motion-safe:animate-marquee">
        <MarqueeGroup />
        <MarqueeGroup />
      </div>
    </div>
  );
}
