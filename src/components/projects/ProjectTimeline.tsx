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
    bg: 'bg-amber-500/10 border-amber-500',
  },
  first_commit: {
    icon: <GitCommit className="w-3.5 h-3.5" />,
    color: 'text-green-600',
    bg: 'bg-green-500/10 border-green-600',
  },
  latest_commit: {
    icon: <GitCommit className="w-3.5 h-3.5" />,
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10 border-accent-purple',
  },
  major_file_add: {
    icon: <FolderPlus className="w-3.5 h-3.5" />,
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10 border-accent-purple',
  },
  branch: {
    icon: <GitBranch className="w-3.5 h-3.5" />,
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10 border-accent-purple',
  },
};

const fallbackConfig = {
  icon: <GitCommit className="w-3.5 h-3.5" />,
  color: 'text-foreground/80',
  bg: 'bg-muted border-border',
};

export default function ProjectTimeline({ events }: ProjectTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground/70 text-center py-4">No timeline data available.</p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-muted" />

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
                  <p className="text-sm text-foreground/80 font-medium">{event.message}</p>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{dateStr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
