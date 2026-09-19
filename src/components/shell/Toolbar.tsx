'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * aria-hackathon `TasksPage.tsx` toolbar, copied:
 *
 *   row:   flex flex-col sm:flex-row sm:items-center justify-between
 *          border-b border-border pb-2 gap-4
 *   tabs:  flex items-center gap-1 bg-muted p-1 rounded border border-border/40 w-fit
 *   tab:   flex items-center gap-2 px-6 py-1.5 rounded-sm text-sm font-medium
 *          active → bg-background text-foreground shadow-sm
 *   search: relative w-full sm:w-[280px] · Input pl-8 h-9 text-sm bg-muted
 */
export interface SegmentOption { id: string; label: string; icon?: React.ReactNode; count?: number }

export function Segmented({ options, value, onChange, className }: {
  options: SegmentOption[]; value: string; onChange: (id: string) => void; className?: string;
}) {
  return (
    <div className={cn('flex w-fit items-center gap-1 rounded border border-border/40 bg-muted p-1', className)}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-medium transition-colors sm:px-6',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.icon}
            {o.label}
            {typeof o.count === 'number' && (
              <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', active ? 'bg-accent-purple/15 text-accent-purple' : 'bg-background/60 text-muted-foreground')}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn('relative w-full sm:w-[280px]', className)}>
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border bg-muted pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-ring"
      />
    </div>
  );
}

export function Toolbar({ left, right, className }: { left?: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col justify-between gap-4 border-b border-border pb-2 sm:flex-row sm:items-center', className)}>
      <div className="flex items-center gap-3">{left}</div>
      <div className="flex flex-wrap items-center gap-3">{right}</div>
    </div>
  );
}
