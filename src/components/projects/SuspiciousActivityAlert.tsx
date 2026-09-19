'use client';

import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';

interface Flag {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SuspiciousActivityAlertProps {
  flags: Flag[];
}

const severityConfig = {
  critical: {
    border: 'border-[var(--cl-error)] bg-[rgba(239,68,68,0.12)]',
    icon: <AlertOctagon className="w-5 h-5 text-[var(--cl-error)] flex-shrink-0" />,
    label: 'bg-[var(--cl-error)] text-[var(--cl-error)]',
    text: 'text-[var(--cl-error)]',
  },
  high: {
    border: 'border-[var(--cl-error)] bg-[rgba(239,68,68,0.12)]',
    icon: <AlertOctagon className="w-5 h-5 text-[var(--cl-error)] flex-shrink-0" />,
    label: 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]',
    text: 'text-[var(--cl-error)]',
  },
  medium: {
    border: 'border-[var(--cl-warning)] bg-[rgba(171,100,0,0.12)]',
    icon: <AlertTriangle className="w-5 h-5 text-[var(--cl-warning)] flex-shrink-0" />,
    label: 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]',
    text: 'text-[var(--cl-warning)]',
  },
  low: {
    border: 'border-[var(--cl-info)] bg-[rgba(13,116,206,0.12)]',
    icon: <Info className="w-5 h-5 text-[var(--cl-info)] flex-shrink-0" />,
    label: 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]',
    text: 'text-[var(--cl-info)]',
  },
};

const typeLabels: Record<string, string> = {
  deadline_cramming: 'Deadline Cramming',
  minimal_commits: 'Minimal Commits',
  inactivity_burst: 'Inactivity Then Burst',
  large_commit: 'Large Single Commit',
};

export default function SuspiciousActivityAlert({ flags }: SuspiciousActivityAlertProps) {
  if (!flags || flags.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-[rgba(22,163,74,0.12)] border border-[var(--cl-success)] rounded-[var(--cl-r-lg)]">
        <span className="text-[var(--cl-success)] text-lg">✓</span>
        <p className="text-sm text-[var(--cl-success)] font-medium">No suspicious activity detected</p>
      </div>
    );
  }

  const sorted = [...flags].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 99) - (order[b.severity] ?? 99);
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[var(--cl-body)]">
        {flags.length} suspicious pattern{flags.length !== 1 ? 's' : ''} detected
      </p>
      {sorted.map((flag, i) => {
        const cfg = severityConfig[flag.severity];
        return (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-[var(--cl-r-lg)] border ${cfg.border}`}>
            {cfg.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.label}`}>
                  {flag.severity.toUpperCase()}
                </span>
                <span className="text-xs font-medium text-[var(--cl-body)]">
                  {typeLabels[flag.type] ?? flag.type}
                </span>
              </div>
              <p className={`text-sm ${cfg.text}`}>{flag.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
