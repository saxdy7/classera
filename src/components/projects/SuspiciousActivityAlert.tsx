'use client';

import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';

interface Flag {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface SuspiciousActivityAlertProps {
  flags: Flag[];
}

const severityConfig = {
  high: {
    border: 'border-red-200 bg-red-50',
    icon: <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />,
    label: 'bg-red-100 text-red-700',
    text: 'text-red-800',
  },
  medium: {
    border: 'border-amber-200 bg-amber-50',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    label: 'bg-amber-100 text-amber-700',
    text: 'text-amber-800',
  },
  low: {
    border: 'border-blue-200 bg-blue-50',
    icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
    label: 'bg-blue-100 text-blue-700',
    text: 'text-blue-800',
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
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <span className="text-emerald-500 text-lg">✓</span>
        <p className="text-sm text-emerald-700 font-medium">No suspicious activity detected</p>
      </div>
    );
  }

  const sorted = [...flags].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">
        {flags.length} suspicious pattern{flags.length !== 1 ? 's' : ''} detected
      </p>
      {sorted.map((flag, i) => {
        const cfg = severityConfig[flag.severity];
        return (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border}`}>
            {cfg.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.label}`}>
                  {flag.severity.toUpperCase()}
                </span>
                <span className="text-xs font-medium text-slate-600">
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
