'use client';

import { GitCommit, FolderPlus, GitBranch, Star } from 'lucide-react';

interface TimelineEvent {
  date: string;
  type: string;
  message: string;
}

interface ProjectTimelineProps {
  events: TimelineEvent[];
}

const eventConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  repo_created: {
    icon: <Star className="w-3.5 h-3.5" />,
    color: 'text-amber-600',
    bg: 'bg-amber-100 border-amber-200',
  },
  first_commit: {
    icon: <GitCommit className="w-3.5 h-3.5" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 border-emerald-200',
  },
  latest_commit: {
    icon: <GitCommit className="w-3.5 h-3.5" />,
    color: 'text-violet-600',
    bg: 'bg-violet-100 border-violet-200',
  },
  major_file_add: {
    icon: <FolderPlus className="w-3.5 h-3.5" />,
    color: 'text-blue-600',
    bg: 'bg-blue-100 border-blue-200',
  },
  branch: {
    icon: <GitBranch className="w-3.5 h-3.5" />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100 border-indigo-200',
  },
};

const fallbackConfig = {
  icon: <GitCommit className="w-3.5 h-3.5" />,
  color: 'text-slate-600',
  bg: 'bg-slate-100 border-slate-200',
};

export default function ProjectTimeline({ events }: ProjectTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">No timeline data available.</p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {sorted.map((event, i) => {
          const cfg = eventConfig[event.type] ?? fallbackConfig;
          const dateStr = new Date(event.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div key={i} className="flex items-start gap-4 relative">
              {/* Icon */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}
              >
                {cfg.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-slate-700 font-medium">{event.message}</p>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
