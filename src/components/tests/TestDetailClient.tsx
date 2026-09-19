'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  Edit, 
  BarChart3, 
  UserPlus, 
  FileSpreadsheet,
  Pencil,
  Download,
  Eye,
  Clock,
  Calendar,
  Target,
  Shield
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { TestAnalytics } from './TestAnalytics';
import { BulkInviteModal } from './BulkInviteModal';
import { ManualGrading } from './ManualGrading';

interface TestDetailClientProps {
  profile: any;
  test: any;
  submissionCount: number;
  avgScore: number;
  hasDescriptiveQuestions: boolean;
}

export default function TestDetailClient({ 
  profile, 
  test: initialTest, 
  submissionCount, 
  avgScore,
  hasDescriptiveQuestions 
}: TestDetailClientProps) {
  const router = useRouter();
  const [test, setTest] = useState(initialTest);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [showManualGrading, setShowManualGrading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [togglingLive, setTogglingLive] = useState(false);

  const handleToggleLive = async () => {
    setTogglingLive(true);
    try {
      const response = await fetch('/api/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: test.id,
          is_live: !test.is_live,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      setTest({ ...test, is_live: !test.is_live });
    } catch (error) {
      console.error('Error toggling live:', error);
      alert('Failed to update test status');
    } finally {
      setTogglingLive(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/tests/${test.id}/export?format=csv`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${test.title.replace(/\s+/g, '_')}_results.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export results');
    } finally {
      setExporting(false);
    }
  };

  const hasNoInvitations = !test.invitations || test.invitations.length === 0;
  const isNewTest = hasNoInvitations && !test.is_live && submissionCount === 0;

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/dashboard/mentor/tests"
              className="inline-flex items-center gap-2 text-[var(--cl-body)] hover:text-[var(--cl-ink)] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tests
            </Link>

            {/* Setup Guide for New Tests */}
            {isNewTest && (
              <div className="border border-[var(--cl-primary)] rounded-[var(--cl-r-lg)] p-6 mb-6 bg-[var(--cl-primary-soft)]">
                <h3 className="text-lg font-semibold text-[var(--cl-primary)] mb-4 flex items-center gap-2">
                  🎉 Test Created! Complete Setup to Go Live
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="bg-[var(--cl-surface-card)] rounded-lg p-4 border border-[var(--cl-primary)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-[var(--cl-success)] text-[var(--cl-on-dark)] rounded-full flex items-center justify-center text-sm font-semibold">✓</div>
                      <span className="font-semibold text-[var(--cl-ink)]">1. Create Test</span>
                    </div>
                    <p className="text-sm text-[var(--cl-body)]">Test created with {test.questions?.length || 0} questions</p>
                  </div>
                  
                  {/* Step 2 */}
                  <div className={`bg-[var(--cl-surface-card)] rounded-lg p-4 border ${hasNoInvitations ? 'border-[var(--cl-warning)] ring-2 ring-[var(--cl-warning)]' : 'border-[var(--cl-success)]'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${hasNoInvitations ? 'bg-[var(--cl-warning)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-success)] text-[var(--cl-on-dark)]'}`}>
                        {hasNoInvitations ? '2' : '✓'}
                      </div>
                      <span className="font-semibold text-[var(--cl-ink)]">2. Invite Students</span>
                    </div>
                    <p className="text-sm text-[var(--cl-body)] mb-2">Add students who should take this test</p>
                    {hasNoInvitations && (
                      <button
                        onClick={() => setShowBulkInvite(true)}
                        className="w-full px-3 py-2 bg-[var(--cl-warning)] text-[var(--cl-on-dark)] text-sm rounded-lg font-medium hover:bg-[var(--cl-warning)] transition-colors"
                      >
                        Invite Students →
                      </button>
                    )}
                  </div>
                  
                  {/* Step 3 */}
                  <div className={`bg-[var(--cl-surface-card)] rounded-lg p-4 border ${!test.is_live ? 'border-[var(--cl-hairline)]' : 'border-[var(--cl-success)]'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${!test.is_live ? 'bg-[var(--cl-surface-strong)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-success)] text-[var(--cl-on-dark)]'}`}>
                        {test.is_live ? '✓' : '3'}
                      </div>
                      <span className="font-semibold text-[var(--cl-ink)]">3. Go Live</span>
                    </div>
                    <p className="text-sm text-[var(--cl-body)] mb-2">Make test available to invited students</p>
                    {!test.is_live && !hasNoInvitations && (
                      <button
                        onClick={handleToggleLive}
                        disabled={togglingLive}
                        className="w-full px-3 py-2 bg-[var(--cl-success)] text-[var(--cl-on-dark)] text-sm rounded-lg font-medium hover:bg-[var(--cl-success)] transition-colors disabled:opacity-50"
                      >
                        {togglingLive ? 'Processing...' : 'Go Live →'}
                      </button>
                    )}
                    {hasNoInvitations && (
                      <p className="text-xs text-[var(--cl-muted)] italic">Complete step 2 first</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Alert: No students invited (shown when not new test) */}
            {hasNoInvitations && !isNewTest && (
              <div className="bg-[rgba(171,100,0,0.12)] border border-[var(--cl-warning)] rounded-[var(--cl-r-lg)] p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[rgba(171,100,0,0.12)] rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[var(--cl-warning)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--cl-warning)]">No students invited yet</p>
                    <p className="text-sm text-[var(--cl-warning)]">Invite students so they can see and take this test</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="px-4 py-2 bg-[var(--cl-warning)] text-[var(--cl-on-dark)] rounded-lg font-medium hover:bg-[var(--cl-warning)] transition-colors"
                >
                  Invite Students Now
                </button>
              </div>
            )}

            {/* Header with Actions */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)] mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-semibold text-[var(--cl-ink)] mb-2">{test.title}</h1>
                  <p className="text-[var(--cl-body)]">{test.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {test.is_live ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] rounded-lg font-medium">
                      <div className="w-2 h-2 bg-[var(--cl-success)] rounded-full animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg font-medium">
                      Not Live
                    </span>
                  )}
                </div>
              </div>

              {/* Primary actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--cl-hairline)]">
                <button
                  onClick={handleToggleLive}
                  disabled={togglingLive}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                    test.is_live
                      ? 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] hover:bg-[rgba(239,68,68,0.12)] border border-[var(--cl-error)]'
                      : 'text-[var(--cl-on-dark)] bg-[var(--cl-success)]'
                  }`}
                >
                  {togglingLive ? (
                    'Updating...'
                  ) : test.is_live ? (
                    <>
                      <span className="w-2 h-2 bg-[var(--cl-error)] rounded-full animate-pulse" />
                      End Test
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-[rgba(255,255,255,0.8)] rounded-full" />
                      Go Live
                    </>
                  )}
                </button>

                <Link
                  href={`/dashboard/mentor/tests/${test.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--cl-surface-card)] text-[var(--cl-body)] border border-[var(--cl-hairline)] rounded-lg font-medium hover:border-[var(--cl-primary)] hover:text-[var(--cl-primary)] transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit Test
                </Link>

                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--cl-surface-card)] text-[var(--cl-body)] border border-[var(--cl-hairline)] rounded-lg font-medium hover:border-[var(--cl-info)] hover:text-[var(--cl-info)] transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Students
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={exporting || submissionCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--cl-surface-card)] text-[var(--cl-body)] border border-[var(--cl-hairline)] rounded-lg font-medium hover:border-[var(--cl-success)] hover:text-[var(--cl-success)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--cl-hairline)] disabled:hover:text-[var(--cl-body)]"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export Results'}
                </button>
              </div>

              {/* Manage — each links to its own dedicated page/action */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Link
                  href={`/dashboard/mentor/tests/${test.id}/analytics`}
                  className="group flex flex-col gap-2 p-4 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] hover:bg-[var(--cl-surface-card)] transition-all"
                >
                  <span className="w-9 h-9 rounded-lg bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--cl-ink)]">Analytics</span>
                  <span className="text-xs text-[var(--cl-muted)]">Scores, pass rate & per-question stats</span>
                </Link>

                <Link
                  href={`/dashboard/mentor/tests/${test.id}/monitor`}
                  className="group flex flex-col gap-2 p-4 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)] hover:bg-[var(--cl-canvas-soft)] transition-all"
                >
                  <span className="w-9 h-9 rounded-lg bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Eye className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--cl-ink)]">Live Monitor</span>
                  <span className="text-xs text-[var(--cl-muted)]">Watch active sessions & violations</span>
                </Link>

                {hasDescriptiveQuestions && submissionCount > 0 ? (
                  <button
                    onClick={() => setShowManualGrading(true)}
                    className="group flex flex-col gap-2 p-4 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] hover:border-[var(--cl-warning)] hover:bg-[rgba(171,100,0,0.4)] transition-all text-left"
                  >
                    <span className="w-9 h-9 rounded-lg bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Pencil className="w-5 h-5" />
                    </span>
                    <span className="text-sm font-semibold text-[var(--cl-ink)]">Manual Grading</span>
                    <span className="text-xs text-[var(--cl-muted)]">Grade descriptive answers</span>
                  </button>
                ) : (
                  <Link
                    href="/dashboard/mentor/question-bank"
                    className="group flex flex-col gap-2 p-4 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] hover:bg-[var(--cl-surface-card)] transition-all"
                  >
                    <span className="w-9 h-9 rounded-lg bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <span className="text-sm font-semibold text-[var(--cl-ink)]">Question Bank</span>
                    <span className="text-xs text-[var(--cl-muted)]">Reuse saved questions</span>
                  </Link>
                )}

                <Link
                  href={`/dashboard/mentor/tests/${test.id}/edit`}
                  className="group flex flex-col gap-2 p-4 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] hover:border-[var(--cl-info)] hover:bg-[rgba(13,116,206,0.4)] transition-all"
                >
                  <span className="w-9 h-9 rounded-lg bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--cl-ink)]">Settings & Security</span>
                  <span className="text-xs text-[var(--cl-muted)]">Proctoring, anti-cheat & timing</span>
                </Link>
              </div>

              {/* Test Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[var(--cl-hairline)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[rgba(13,116,206,0.12)] rounded-lg">
                    <Clock className="w-5 h-5 text-[var(--cl-info)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--cl-body)]">Duration</p>
                    <p className="font-semibold text-[var(--cl-ink)]">{test.duration_minutes} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--cl-primary-soft)] rounded-lg">
                    <Target className="w-5 h-5 text-[var(--cl-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--cl-body)]">Total Marks</p>
                    <p className="font-semibold text-[var(--cl-ink)]">{test.total_marks}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[rgba(22,163,74,0.12)] rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-[var(--cl-success)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--cl-body)]">Questions</p>
                    <p className="font-semibold text-[var(--cl-ink)]">{test.questions?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[rgba(171,100,0,0.12)] rounded-lg">
                    <Users className="w-5 h-5 text-[var(--cl-warning)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--cl-body)]">Submissions</p>
                    <p className="font-semibold text-[var(--cl-ink)]">{submissionCount}</p>
                  </div>
                </div>
              </div>

              {/* Test Settings Info */}
              {(test.settings || test.proctoring_enabled) && (
                <div className="mt-4 pt-4 border-t border-[var(--cl-hairline)]">
                  <div className="flex flex-wrap gap-2">
                    {test.proctoring_enabled && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] rounded-full text-sm">
                        <Shield className="w-3 h-3" />
                        Proctored
                      </span>
                    )}
                    {test.settings?.randomize_questions && (
                      <span className="px-3 py-1 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] rounded-full text-sm">
                        Randomized
                      </span>
                    )}
                    {test.settings?.enable_anti_cheat && (
                      <span className="px-3 py-1 bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] rounded-full text-sm">
                        Anti-Cheat Enabled
                      </span>
                    )}
                    {test.settings?.show_results_immediately && (
                      <span className="px-3 py-1 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] rounded-full text-sm">
                        Instant Results
                      </span>
                    )}
                    {test.scheduled_for && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-full text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(test.scheduled_for).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Invited</span>
                  <Users className="w-5 h-5 text-[var(--cl-info)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-info)]">{test.invitations?.length || 0}</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Submitted</span>
                  <CheckCircle className="w-5 h-5 text-[var(--cl-success)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-success)]">{submissionCount}</p>
              </div>

              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--cl-body)]">Avg Score</span>
                  <CheckCircle className="w-5 h-5 text-[var(--cl-primary)]" />
                </div>
                <p className="text-3xl font-semibold text-[var(--cl-primary)]">{avgScore.toFixed(1)}%</p>
              </div>
            </div>

            {/* Submissions */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)] mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)]">Submissions</h2>
                {submissionCount > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="text-sm text-[var(--cl-primary)] hover:text-[var(--cl-primary)] flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                )}
              </div>
              {test.submissions && test.submissions.length > 0 ? (
                <div className="space-y-3">
                  {test.submissions.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-[var(--cl-canvas-soft)] rounded-lg hover:bg-[var(--cl-surface-strong)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] font-semibold bg-[var(--cl-primary)]">
                          {sub.student?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--cl-ink)]">{sub.student?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-[var(--cl-muted)]">
                            Submitted: {new Date(sub.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-semibold text-[var(--cl-primary)]">{sub.score}/{test.total_marks}</p>
                          <p className="text-sm text-[var(--cl-muted)]">{sub.percentage?.toFixed(1)}%</p>
                        </div>
                        {sub.is_disqualified && (
                          <span className="px-2 py-1 bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] text-xs rounded-full font-semibold">
                            Disqualified
                          </span>
                        )}
                        {!sub.is_disqualified && sub.warnings_count > 0 && (
                          <span className="px-2 py-1 bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)] text-xs rounded-full font-semibold">
                            ⚠️ {sub.warnings_count} violation{sub.warnings_count !== 1 ? 's' : ''}
                          </span>
                        )}
                        {sub.screen_recording_url && (
                          <a href={sub.screen_recording_url} target="_blank" rel="noopener noreferrer"
                            className="px-2 py-1 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] text-xs rounded-full hover:bg-[var(--cl-info)] transition-colors">
                            🎥 Recording
                          </a>
                        )}
                        {sub.manual_grades && (
                          <span className="px-2 py-1 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] text-xs rounded-full">
                            Graded
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                  <p className="text-[var(--cl-muted)]">No submissions yet</p>
                  <button
                    onClick={() => setShowBulkInvite(true)}
                    className="mt-3 text-[var(--cl-primary)] hover:text-[var(--cl-primary)] text-sm"
                  >
                    Invite students to take this test
                  </button>
                </div>
              )}
            </div>

            {/* Invitations */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)]">Invitations</h2>
                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="text-sm text-[var(--cl-primary)] hover:text-[var(--cl-primary)] flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Add More
                </button>
              </div>
              {test.invitations && test.invitations.length > 0 ? (
                <div className="space-y-2">
                  {test.invitations.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-[var(--cl-canvas-soft)] rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] font-semibold text-sm bg-[var(--cl-info)]">
                          {inv.student?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--cl-ink)]">{inv.student?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-[var(--cl-muted)]">{inv.student?.email}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'accepted' ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' :
                        inv.status === 'pending' ? 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]' :
                        inv.status === 'completed' ? 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]' :
                        'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                  <p className="text-[var(--cl-muted)]">No invitations sent yet</p>
                  <button
                    onClick={() => setShowBulkInvite(true)}
                    className="mt-3 text-[var(--cl-primary)] hover:text-[var(--cl-primary)] text-sm"
                  >
                    Send invitations to students
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAnalytics && (
        <TestAnalytics testId={test.id} onClose={() => setShowAnalytics(false)} />
      )}

      {showBulkInvite && (
        <BulkInviteModal 
          testId={test.id} 
          testTitle={test.title}
          onClose={() => setShowBulkInvite(false)}
          onSuccess={() => {
            setShowBulkInvite(false);
            // Hard-navigate to same page to guarantee fresh server data
            router.push(`/dashboard/mentor/tests/${test.id}`);
            router.refresh();
          }}
          existingInvitations={test.invitations?.map((inv: any) => inv.student_id) || []}
        />
      )}

      {showManualGrading && (
        <ManualGrading 
          testId={test.id}
          testTitle={test.title}
          questions={test.questions || []}
          onClose={() => setShowManualGrading(false)} 
        />
      )}
    </div>
  );
}
