'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ProgressSnapshot {
  overall_score: number;
  consistency_score: number;
  activity_score: number;
  quality_score: number;
  total_commits: number;
  active_days: number;
  analyzed_at: string;
}

export default function ProgressChart({ snapshots }: { snapshots: ProgressSnapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        Need at least 2 analyses to show progress trend
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    date: format(new Date(s.analyzed_at), 'MMM d'),
    overall: s.overall_score,
    consistency: s.consistency_score,
    activity: s.activity_score,
    quality: s.quality_score,
  }));

  const first = snapshots[0].overall_score;
  const last = snapshots[snapshots.length - 1].overall_score;
  const delta = last - first;

  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <DeltaIcon size={16} className={deltaColor} />
        <span className={`text-sm font-medium ${deltaColor}`}>
          {delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta} pts overall`}
        </span>
        <span className="text-xs text-slate-400">since first analysis</span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          />
          <Line
            type="monotone"
            dataKey="overall"
            name="Overall"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ r: 3, fill: '#7c3aed' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="consistency"
            name="Consistency"
            stroke="#059669"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="activity"
            name="Activity"
            stroke="#d97706"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="quality"
            name="Quality"
            stroke="#2563eb"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {[
          { label: 'Overall', color: 'bg-violet-600' },
          { label: 'Consistency', color: 'bg-emerald-600' },
          { label: 'Activity', color: 'bg-amber-500' },
          { label: 'Quality', color: 'bg-blue-600' },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`w-3 h-1 rounded ${color} inline-block`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
