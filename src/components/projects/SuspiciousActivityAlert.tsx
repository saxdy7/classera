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
    border: 'border-destructive bg-destructive/10',
    icon: <AlertOctagon className="w-5 h-5 text-destructive flex-shrink-0" />,
    label: 'bg-destructive text-destructive',
    text: 'text-destructive',
  },
  high: {
    border: 'border-destructive bg-destructive/10',
    icon: <AlertOctagon className="w-5 h-5 text-destructive flex-shrink-0" />,
    label: 'bg-destructive/10 text-destructive',
    text: 'text-destructive',
  },
  medium: {
    border: 'border-amber-500 bg-amber-500/10',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    label: 'bg-amber-500/10 text-amber-600',
    text: 'text-amber-600',
  },
  low: {
    border: 'border-accent-purple bg-accent-purple/10',
    icon: <Info className="w-5 h-5 text-accent-purple flex-shrink-0" />,
    label: 'bg-accent-purple/10 text-accent-purple',
    text: 'text-accent-purple',
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
      <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-600 rounded-lg">
        <span className="text-green-600 text-lg">✓</span>
        <p className="text-sm text-green-600 font-medium">No suspicious activity detected</p>
      </div>
    );
  }

  const sorted = [...flags].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 99) - (order[b.severity] ?? 99);
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground/80">
        {flags.length} suspicious pattern{flags.length !== 1 ? 's' : ''} detected
      </p>
      {sorted.map((flag, i) => {
        const cfg = severityConfig[flag.severity];
        return (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.border}`}>
            {cfg.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.label}`}>
                  {flag.severity.toUpperCase()}
                </span>
                <span className="text-xs font-medium text-foreground/80">
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
