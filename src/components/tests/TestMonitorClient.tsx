'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, AlertTriangle, CheckCircle2, Eye, RefreshCw, ShieldAlert, Clock } from 'lucide-react';

interface MonitorSession {
  id: string;
  student: { id: string; full_name: string; avatar_url: string | null };
  started_at: string;
  time_remaining_seconds: number;
  state: 'active' | 'submitted' | 'expired' | 'flagged';
  is_flagged: boolean;
  flag_reason: string | null;
  total_violations: number;
  violations: {
    tab_switches: number;
    fullscreen_exits: number;
    copy_paste: number;
    face_failures: number;
    screen_share_stops: number;
    suspicious: number;
  };
  submission: { percentage: number; is_disqualified: boolean } | null;
}

interface MonitorData {
  sessions: MonitorSession[];
  summary: { active: number; submitted: number; flagged: number; total_violations: number };
}

const fmtTime = (secs: number) => {
  if (secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export function TestMonitorClient({ testId }: { testId: string }) {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests/${testId}/monitor`);
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Monitor fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--cl-muted-soft)]" />
      </div>
    );
  }

  const sessions = data?.sessions || [];
  const summary = data?.summary || { active: 0, submitted: 0, flagged: 0, total_violations: 0 };

  const violationChips = (v: MonitorSession['violations']) => {
    const items = [
      { label: 'Tab', n: v.tab_switches },
      { label: 'Fullscreen', n: v.fullscreen_exits },
      { label: 'Copy/Paste', n: v.copy_paste },
      { label: 'Face', n: v.face_failures },
      { label: 'Screen', n: v.screen_share_stops },
      { label: 'Suspicious', n: v.suspicious },
    ].filter((i) => i.n > 0);
    if (items.length === 0) return <span className="text-xs text-[var(--cl-muted-soft)]">No violations</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span key={i.label} className="px-2 py-0.5 rounded-md bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] text-xs font-medium border border-[var(--cl-warning)]">
            {i.label}: {i.n}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-5 border border-[var(--cl-hairline)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--cl-body)]">In Progress</span>
            <Users className="w-5 h-5 text-[var(--cl-info)]" />
          </div>
          <p className="text-3xl font-semibold text-[var(--cl-ink)]">{summary.active}</p>
        </div>
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-5 border border-[var(--cl-hairline)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--cl-body)]">Submitted</span>
            <CheckCircle2 className="w-5 h-5 text-[var(--cl-success)]" />
          </div>
          <p className="text-3xl font-semibold text-[var(--cl-success)]">{summary.submitted}</p>
        </div>
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-5 border border-[var(--cl-hairline)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--cl-body)]">Flagged</span>
            <ShieldAlert className="w-5 h-5 text-[var(--cl-error)]" />
          </div>
          <p className="text-3xl font-semibold text-[var(--cl-error)]">{summary.flagged}</p>
        </div>
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-5 border border-[var(--cl-hairline)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--cl-body)]">Total Violations</span>
            <AlertTriangle className="w-5 h-5 text-[var(--cl-warning)]" />
          </div>
          <p className="text-3xl font-semibold text-[var(--cl-warning)]">{summary.total_violations}</p>
        </div>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-16 text-center border border-[var(--cl-hairline)]">
          <Eye className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-1">No active sessions</h3>
          <p className="text-[var(--cl-muted)]">Students will appear here once they start the test.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => {
            const border =
              s.state === 'flagged' ? 'border-[var(--cl-error)] border-2'
              : s.total_violations > 0 ? 'border-[var(--cl-warning)]'
              : 'border-[var(--cl-hairline)]';
            return (
              <div key={s.id} className={`bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-5 border ${border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] text-sm font-semibold flex-shrink-0 bg-[var(--cl-primary)]">
                      {s.student.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--cl-ink)] truncate">{s.student.full_name}</p>
                      <p className="text-xs text-[var(--cl-muted)]">
                        Started {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <StateBadge state={s.state} />
                </div>

                {s.state === 'active' || s.state === 'flagged' ? (
                  <div className="flex items-center gap-1.5 text-sm text-[var(--cl-body)] mb-3">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-medium">{fmtTime(s.time_remaining_seconds)}</span>
                    <span className="text-xs text-[var(--cl-muted-soft)]">remaining</span>
                  </div>
                ) : s.submission ? (
                  <p className="text-sm text-[var(--cl-body)] mb-3">
                    Score: <span className="font-semibold">{Math.round(s.submission.percentage || 0)}%</span>
                    {s.submission.is_disqualified && <span className="ml-2 text-[var(--cl-error)] font-medium">Disqualified</span>}
                  </p>
                ) : null}

                {s.is_flagged && s.flag_reason && (
                  <p className="text-xs text-[var(--cl-error)] mb-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> {s.flag_reason}
                  </p>
                )}

                {violationChips(s.violations)}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center text-xs text-[var(--cl-muted-soft)] flex items-center justify-center gap-1.5">
        <RefreshCw className="w-3 h-3" />
        Auto-refreshing every 5s{lastUpdated ? ` · updated ${lastUpdated.toLocaleTimeString()}` : ''}
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: MonitorSession['state'] }) {
  const map = {
    active: { label: 'In Progress', cls: 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] border-[var(--cl-info)]' },
    submitted: { label: 'Submitted', cls: 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] border-[var(--cl-success)]' },
    expired: { label: 'Expired', cls: 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)] border-[var(--cl-hairline)]' },
    flagged: { label: 'Flagged', cls: 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] border-[var(--cl-error)]' },
  }[state];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${map.cls}`}>
      {map.label}
    </span>
  );
}
