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
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pendingCount} pending • {reports.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          All
        </button>
      </div>

      {/* Reports List */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No reports to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        report.status === 'pending'
                          ? 'bg-red-500'
                          : report.status === 'resolved'
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {report.reason}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded">
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                  {report.post?.content || report.comment?.content}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  REASON
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {selectedReport.reason}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  REPORTED CONTENT
                </p>
                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded text-sm text-gray-700 dark:text-gray-300 max-h-24 overflow-y-auto">
                  {selectedReport.post?.content || selectedReport.comment?.content}
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    ADDITIONAL DETAILS
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  REPORTED BY
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedReport.reported_by?.full_name}
                </p>
              </div>
            </div>

            {selectedReport.status === 'pending' && (
              <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-2">
                <button
                  onClick={() => handleResolve(selectedReport.id, 'delete')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Content
                </button>
                <button
                  onClick={() => handleResolve(selectedReport.id, 'dismiss')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:bg-gray-400 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
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
