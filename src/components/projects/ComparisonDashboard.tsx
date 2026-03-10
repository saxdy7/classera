'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { AlertTriangle, Trophy, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';

interface SubmissionData {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: string;
  score?: number;
  analytics?: {
    overall_score: number;
    consistency_score: number;
    activity_score: number;
    quality_score: number;
    total_commits: number;
    suspicious_flags: Array<{ type: string; severity: string }>;
  } | null;
}

interface ComparisonDashboardProps {
  assignmentId: string;
  assignmentTitle: string;
  maxScore: number;
  submissions: SubmissionData[];
}

const RADAR_COLORS = ['#7c3aed', '#059669', '#d97706', '#dc2626', '#2563eb'];

type SortKey = 'student_name' | 'overall' | 'consistency' | 'activity' | 'quality' | 'commits' | 'score' | 'flags';

function scoreBin(score: number) {
  return Math.min(9, Math.floor(score / 10)) * 10;
}

export default function ComparisonDashboard({ assignmentId, maxScore, submissions }: ComparisonDashboardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const withAnalytics = useMemo(
    () => submissions.filter((s) => s.analytics),
    [submissions],
  );

  const topPerformer = useMemo(
    () => [...withAnalytics].sort((a, b) => (b.analytics!.overall_score) - (a.analytics!.overall_score))[0],
    [withAnalytics],
  );

  const needsAttention = useMemo(
    () => [...withAnalytics].sort((a, b) => (a.analytics!.overall_score) - (b.analytics!.overall_score))[0],
    [withAnalytics],
  );

  // Score distribution bins
  const distribution = useMemo(() => {
    const bins: Record<number, number> = {};
    for (let i = 0; i <= 90; i += 10) bins[i] = 0;
    withAnalytics.forEach((s) => { bins[scoreBin(s.analytics!.overall_score)]++; });
    return Object.entries(bins).map(([bin, count]) => ({
      range: `${bin}-${Number(bin) + 9}`,
      count,
    }));
  }, [withAnalytics]);

  // Radar data
  const radarData = useMemo(() => {
    const axes = ['Overall', 'Consistency', 'Activity', 'Quality'];
    return axes.map((ax) => {
      const entry: Record<string, string | number> = { subject: ax };
      selectedIds.slice(0, 5).forEach((id, idx) => {
        const sub = submissions.find((s) => s.id === id);
        const ana = sub?.analytics;
        if (ana) {
          const val = ax === 'Overall' ? ana.overall_score
            : ax === 'Consistency' ? ana.consistency_score
            : ax === 'Activity' ? ana.activity_score
            : ana.quality_score;
          entry[`student_${idx}`] = val;
        }
      });
      return entry;
    });
  }, [selectedIds, submissions]);

  // Sorted table rows
  const sorted = useMemo(() => {
    return [...submissions].sort((a, b) => {
      let av = 0, bv = 0;
      switch (sortKey) {
        case 'student_name': return sortDir === 'asc'
          ? a.student_name.localeCompare(b.student_name)
          : b.student_name.localeCompare(a.student_name);
        case 'overall':      av = a.analytics?.overall_score ?? -1; bv = b.analytics?.overall_score ?? -1; break;
        case 'consistency':  av = a.analytics?.consistency_score ?? -1; bv = b.analytics?.consistency_score ?? -1; break;
        case 'activity':     av = a.analytics?.activity_score ?? -1; bv = b.analytics?.activity_score ?? -1; break;
        case 'quality':      av = a.analytics?.quality_score ?? -1; bv = b.analytics?.quality_score ?? -1; break;
        case 'commits':      av = a.analytics?.total_commits ?? -1; bv = b.analytics?.total_commits ?? -1; break;
        case 'score':        av = a.score ?? -1; bv = b.score ?? -1; break;
        case 'flags':        av = a.analytics?.suspicious_flags.length ?? 0; bv = b.analytics?.suspicious_flags.length ?? 0; break;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [submissions, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev.slice(0, 4), id]
    );
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null;

  const ScoreBadge = ({ score }: { score: number | undefined }) => {
    if (score === undefined) return <span className="text-slate-300">—</span>;
    const color = score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Callout cards */}
      {withAnalytics.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {topPerformer && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Top Performer</p>
                <p className="text-sm font-semibold text-slate-800">{topPerformer.student_name}</p>
                <p className="text-xs text-slate-500">Overall score: {topPerformer.analytics!.overall_score}</p>
              </div>
            </div>
          )}
          {needsAttention && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Needs Attention</p>
                <p className="text-sm font-semibold text-slate-800">{needsAttention.student_name}</p>
                <p className="text-xs text-slate-500">Overall score: {needsAttention.analytics!.overall_score}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score distribution */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" name="Students" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart for selected students */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Performance Radar</h3>
          <p className="text-xs text-slate-400 mb-3">Select up to 5 students from the table below</p>
          {selectedIds.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-slate-300 text-sm">
              No students selected
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                {selectedIds.slice(0, 5).map((id, idx) => {
                  const sub = submissions.find((s) => s.id === id);
                  return (
                    <Radar
                      key={id}
                      name={sub?.student_name ?? 'Student'}
                      dataKey={`student_${idx}`}
                      stroke={RADAR_COLORS[idx]}
                      fill={RADAR_COLORS[idx]}
                      fillOpacity={0.1}
                    />
                  );
                })}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="w-8 px-3 py-2.5" />
                <SortTH col="student_name"  label="Student"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTH col="overall"       label="Overall"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTH col="consistency"   label="Consistency" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTH col="activity"      label="Activity"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTH col="quality"       label="Quality"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTH col="commits"       label="Commits"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTH col="score"         label="Grade"       current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortTH col="flags"         label="Flags"       current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map((sub) => {
                const ana = sub.analytics;
                const isSelected = selectedIds.includes(sub.id);
                const selIdx = selectedIds.indexOf(sub.id);
                return (
                  <tr
                    key={sub.id}
                    className={`hover:bg-slate-50/60 transition-colors ${isSelected ? 'bg-violet-50/40' : ''}`}
                  >
                    <td className="pl-3">
                      <button
                        onClick={() => toggleSelect(sub.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-transparent bg-violet-600'
                            : 'border-slate-300 hover:border-violet-400'
                        }`}
                      >
                        {isSelected && (
                          <span
                            className="w-2 h-2 rounded-sm block"
                            style={{ backgroundColor: RADAR_COLORS[selIdx] ?? '#fff' }}
                          />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-800 text-sm">{sub.student_name}</p>
                      <p className="text-xs text-slate-400">{sub.student_email}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center"><ScoreBadge score={ana?.overall_score} /></td>
                    <td className="px-3 py-2.5 text-center"><ScoreBadge score={ana?.consistency_score} /></td>
                    <td className="px-3 py-2.5 text-center"><ScoreBadge score={ana?.activity_score} /></td>
                    <td className="px-3 py-2.5 text-center"><ScoreBadge score={ana?.quality_score} /></td>
                    <td className="px-3 py-2.5 text-center text-slate-600 font-mono text-xs">{ana?.total_commits ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      {sub.score !== undefined
                        ? <span className="font-semibold text-slate-700">{sub.score}<span className="text-slate-400 font-normal">/{maxScore}</span></span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {(ana?.suspicious_flags.length ?? 0) > 0 ? (
                        <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                          {ana!.suspicious_flags.length}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/dashboard/mentor/projects/${assignmentId}/${sub.student_id}`}
                        className="flex items-center gap-1 text-xs text-violet-600 hover:underline whitespace-nowrap"
                      >
                        Review <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortTH({
  col, label, current, dir, onSort,
}: {
  col: SortKey; label: string; current: SortKey; dir: 'asc' | 'desc'; onSort: (k: SortKey) => void;
}) {
  const active = col === current;
  return (
    <th
      className="px-3 py-2.5 text-left cursor-pointer select-none"
      onClick={() => onSort(col)}
    >
      <span className={`flex items-center gap-1 text-xs font-medium ${active ? 'text-violet-600' : 'text-slate-500'}`}>
        {label}
        {active ? (dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null}
      </span>
    </th>
  );
}
