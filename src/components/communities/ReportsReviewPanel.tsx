'use client';

import { useEffect, useState } from 'react';
import { Flag, AlertCircle, CheckCircle, XCircle, Trash2, Lock } from 'lucide-react';

interface Report {
  id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  post?: { id: string; content: string };
  comment?: { id: string; content: string };
  reported_by: { full_name: string };
  created_at: string;
}

interface ReportsReviewProps {
  communityId: string;
  isMentor: boolean;
}

export function ReportsReviewPanel({ communityId, isMentor }: ReportsReviewProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    if (isMentor) {
      fetchReports();
    }
  }, [communityId, isMentor, filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/community-reports', window.location.origin);
      url.searchParams.append('communityId', communityId);
      if (filter === 'pending') {
        url.searchParams.append('status', 'pending');
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch reports');

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'delete' | 'dismiss' | 'ignore') => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/community-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status: action === 'delete' ? 'resolved' : 'dismissed',
          action
        })
      });

      if (!response.ok) throw new Error('Failed to resolve report');

      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status: action === 'delete' ? 'resolved' : 'dismissed' } : r
      ));
      setSelectedReport(null);
    } catch (err) {
      console.error('Error resolving report:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isMentor) {
    return null;
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] rounded-lg border border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)]">
      {/* Header */}
      <div className="border-b border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[rgba(239,68,68,0.12)] dark:bg-[rgba(239,68,68,0.2)] rounded-lg">
            <Flag className="w-5 h-5 text-[var(--cl-error)] dark:text-[var(--cl-error)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">Reports</h3>
            <p className="text-sm text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">
              {pendingCount} pending • {reports.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-6 py-4 border-b border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-[rgba(239,68,68,0.12)] dark:bg-[rgba(239,68,68,0.3)] text-[var(--cl-error)] dark:text-[var(--cl-error)]'
              : 'bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)] text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] hover:bg-[var(--cl-surface-strong)] dark:hover:bg-[var(--cl-surface-strong)]'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[rgba(13,116,206,0.12)] dark:bg-[rgba(13,116,206,0.3)] text-[var(--cl-info)] dark:text-[var(--cl-info)]'
              : 'bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)] text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] hover:bg-[var(--cl-surface-strong)] dark:hover:bg-[var(--cl-surface-strong)]'
          }`}
        >
          All
        </button>
      </div>

      {/* Reports List */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-8 h-8 text-[var(--cl-success)] mb-2" />
            <p className="text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">No reports to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="p-4 border border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] rounded-lg hover:bg-[var(--cl-canvas-soft)] dark:hover:bg-[var(--cl-surface-card)] cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        report.status === 'pending'
                          ? 'bg-[var(--cl-error)]'
                          : report.status === 'resolved'
                          ? 'bg-[var(--cl-success)]'
                          : 'bg-[var(--cl-surface-strong)]'
                      }`}
                    />
                    <span className="font-medium text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] capitalize">
                      {report.reason}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)] text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] rounded">
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] line-clamp-1 mb-2">
                  {report.post?.content || report.comment?.content}
                </p>
                <div className="text-xs text-[var(--cl-muted)] dark:text-[var(--cl-muted)]">
                  Reported by {report.reported_by?.full_name} •{' '}
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] rounded-lg max-w-md w-full">
            <div className="border-b border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] p-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-[var(--cl-surface-strong)] dark:hover:bg-[var(--cl-surface-inverse)] rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <p className="text-xs font-medium text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mb-1">
                  REASON
                </p>
                <p className="text-sm font-medium text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] capitalize">
                  {selectedReport.reason}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mb-1">
                  REPORTED CONTENT
                </p>
                <div className="bg-[var(--cl-canvas-soft)] dark:bg-[var(--cl-surface-inverse)] p-3 rounded text-sm text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] max-h-24 overflow-y-auto">
                  {selectedReport.post?.content || selectedReport.comment?.content}
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-xs font-medium text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mb-1">
                    ADDITIONAL DETAILS
                  </p>
                  <p className="text-sm text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mb-1">
                  REPORTED BY
                </p>
                <p className="text-sm text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">
                  {selectedReport.reported_by?.full_name}
                </p>
              </div>
            </div>

            {selectedReport.status === 'pending' && (
              <div className="border-t border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] p-4 space-y-2">
                <button
                  onClick={() => handleResolve(selectedReport.id, 'delete')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--cl-error)] hover:bg-[var(--cl-error)] disabled:bg-[var(--cl-surface-strong)] text-[var(--cl-on-dark)] rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Content
                </button>
                <button
                  onClick={() => handleResolve(selectedReport.id, 'dismiss')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)] hover:bg-[var(--cl-surface-strong)] dark:hover:bg-[var(--cl-surface-strong)] disabled:bg-[var(--cl-surface-strong)] text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] rounded-lg font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Dismiss Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
