'use client';

import { useMemo } from 'react';

interface ActivityHeatmapProps {
  dailyActivity: Record<string, number>; // { "2024-01-15": 3, ... }
  weeks?: number; // how many weeks to show (default 26 = ~6 months)
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColor(count: number): string {
  if (count === 0) return 'bg-slate-100';
  if (count <= 1) return 'bg-violet-200';
  if (count <= 3) return 'bg-violet-400';
  if (count <= 6) return 'bg-violet-600';
  return 'bg-violet-800';
}

export default function ActivityHeatmap({ dailyActivity, weeks = 26 }: ActivityHeatmapProps) {
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back `weeks` weeks, starting on Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7);

    const grid: Array<{ date: string; count: number; weekIdx: number; dayIdx: number }> = [];
    const cur = new Date(start);

    while (cur <= today) {
      const key = cur.toISOString().split('T')[0];
      const weekIdx = Math.floor(
        (cur.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      grid.push({
        date: key,
        count: dailyActivity[key] ?? 0,
        weekIdx,
        dayIdx: cur.getDay(),
      });
      cur.setDate(cur.getDate() + 1);
    }

    return grid;
  }, [dailyActivity, weeks]);

  // Group by week index for column layout
  const columns = useMemo(() => {
    const map = new Map<number, typeof cells>();
    for (const cell of cells) {
      const arr = map.get(cell.weekIdx) ?? [];
      arr.push(cell);
      map.set(cell.weekIdx, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [cells]);

  // Month labels
  const monthLabels = useMemo(() => {
    const seen = new Set<string>();
    const labels: Array<{ label: string; weekIdx: number }> = [];
    for (const cell of cells) {
      const month = cell.date.slice(0, 7);
      if (!seen.has(month)) {
        seen.add(month);
        labels.push({
          label: new Date(cell.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }),
          weekIdx: cell.weekIdx,
        });
      }
    }
    return labels;
  }, [cells]);

  const totalCommits = Object.values(dailyActivity).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{totalCommits}</span> commits in the last {weeks} weeks
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Less</span>
          {['bg-slate-100', 'bg-violet-200', 'bg-violet-400', 'bg-violet-600', 'bg-violet-800'].map((c) => (
            <span key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 pl-7">
            {columns.map(([wIdx]) => {
              const label = monthLabels.find((m) => m.weekIdx === wIdx);
              return (
                <div key={wIdx} className="w-3 text-xs text-slate-400 truncate">
                  {label?.label ?? ''}
                </div>
              );
            })}
          </div>

          {/* Day rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1">
              <span className="w-6 text-xs text-slate-400 text-right flex-shrink-0">
                {dayIdx % 2 === 1 ? day.slice(0, 3) : ''}
              </span>
              {columns.map(([wIdx, week]) => {
                const cell = week.find((c) => c.dayIdx === dayIdx);
                if (!cell) {
                  return <div key={wIdx} className="w-3 h-3 rounded-sm bg-transparent" />;
                }
                return (
                  <div
                    key={wIdx}
                    title={`${cell.date}: ${cell.count} commit${cell.count !== 1 ? 's' : ''}`}
                    className={`w-3 h-3 rounded-sm transition-transform hover:scale-125 cursor-default ${getColor(cell.count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
