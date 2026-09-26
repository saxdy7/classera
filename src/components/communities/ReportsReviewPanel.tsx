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
    <div className="bg-card dark:bg-neutral-900 rounded-lg border border-border dark:border-border">
      {/* Header */}
      <div className="border-b border-border dark:border-border p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 dark:bg-[rgba(239,68,68,0.2)] rounded-lg">
            <Flag className="w-5 h-5 text-destructive dark:text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground dark:text-white">Reports</h3>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground/70">
              {pendingCount} pending • {reports.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-6 py-4 border-b border-border dark:border-border flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-destructive/10 dark:bg-[rgba(239,68,68,0.3)] text-destructive dark:text-destructive'
              : 'bg-muted dark:bg-neutral-900 text-foreground/80 dark:text-muted-foreground/70 hover:bg-muted dark:hover:bg-muted'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-accent-purple/10 dark:bg-accent-purple/10 text-accent-purple dark:text-accent-purple'
              : 'bg-muted dark:bg-neutral-900 text-foreground/80 dark:text-muted-foreground/70 hover:bg-muted dark:hover:bg-muted'
          }`}
        >
          All
        </button>
      </div>

      {/* Reports List */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-foreground/80 dark:text-muted-foreground/70">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-foreground/80 dark:text-muted-foreground/70">No reports to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="p-4 border border-border dark:border-border rounded-lg hover:bg-muted/40 dark:hover:bg-card cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        report.status === 'pending'
                          ? 'bg-destructive'
                          : report.status === 'resolved'
                          ? 'bg-green-600'
                          : 'bg-muted'
                      }`}
                    />
                    <span className="font-medium text-foreground dark:text-white capitalize">
                      {report.reason}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-muted dark:bg-neutral-900 text-foreground/80 dark:text-muted-foreground/70 rounded">
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 dark:text-muted-foreground/70 line-clamp-1 mb-2">
                  {report.post?.content || report.comment?.content}
                </p>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground">
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
          <div className="bg-card dark:bg-neutral-900 rounded-lg max-w-md w-full">
            <div className="border-b border-border dark:border-border p-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground dark:text-white">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-muted dark:hover:bg-neutral-900 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <p className="text-xs font-medium text-foreground/80 dark:text-muted-foreground/70 mb-1">
                  REASON
                </p>
                <p className="text-sm font-medium text-foreground dark:text-white capitalize">
                  {selectedReport.reason}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-foreground/80 dark:text-muted-foreground/70 mb-1">
                  REPORTED CONTENT
                </p>
                <div className="bg-muted/40 dark:bg-neutral-900 p-3 rounded text-sm text-foreground/80 dark:text-muted-foreground/70 max-h-24 overflow-y-auto">
                  {selectedReport.post?.content || selectedReport.comment?.content}
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-xs font-medium text-foreground/80 dark:text-muted-foreground/70 mb-1">
                    ADDITIONAL DETAILS
                  </p>
                  <p className="text-sm text-foreground/80 dark:text-muted-foreground/70">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-foreground/80 dark:text-muted-foreground/70 mb-1">
                  REPORTED BY
                </p>
                <p className="text-sm text-foreground dark:text-white">
                  {selectedReport.reported_by?.full_name}
                </p>
              </div>
            </div>

            {selectedReport.status === 'pending' && (
              <div className="border-t border-border dark:border-border p-4 space-y-2">
                <button
                  onClick={() => handleResolve(selectedReport.id, 'delete')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive disabled:bg-muted text-white rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Content
                </button>
                <button
                  onClick={() => handleResolve(selectedReport.id, 'dismiss')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted dark:bg-neutral-900 hover:bg-muted dark:hover:bg-muted disabled:bg-muted text-foreground dark:text-white rounded-lg font-medium transition-colors"
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
