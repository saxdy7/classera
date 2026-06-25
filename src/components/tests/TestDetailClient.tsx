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
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/dashboard/mentor/tests"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tests
            </Link>

            {/* Setup Guide for New Tests */}
            {isNewTest && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  🎉 Test Created! Complete Setup to Go Live
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="bg-white rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                      <span className="font-semibold text-slate-900">1. Create Test</span>
                    </div>
                    <p className="text-sm text-slate-600">Test created with {test.questions?.length || 0} questions</p>
                  </div>
                  
                  {/* Step 2 */}
                  <div className={`bg-white rounded-lg p-4 border ${hasNoInvitations ? 'border-amber-300 ring-2 ring-amber-200' : 'border-green-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${hasNoInvitations ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                        {hasNoInvitations ? '2' : '✓'}
                      </div>
                      <span className="font-semibold text-slate-900">2. Invite Students</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Add students who should take this test</p>
                    {hasNoInvitations && (
                      <button
                        onClick={() => setShowBulkInvite(true)}
                        className="w-full px-3 py-2 bg-amber-600 text-white text-sm rounded-lg font-medium hover:bg-amber-700 transition-colors"
                      >
                        Invite Students →
                      </button>
                    )}
                  </div>
                  
                  {/* Step 3 */}
                  <div className={`bg-white rounded-lg p-4 border ${!test.is_live ? 'border-slate-200' : 'border-green-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${!test.is_live ? 'bg-slate-300 text-white' : 'bg-green-500 text-white'}`}>
                        {test.is_live ? '✓' : '3'}
                      </div>
                      <span className="font-semibold text-slate-900">3. Go Live</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Make test available to invited students</p>
                    {!test.is_live && !hasNoInvitations && (
                      <button
                        onClick={handleToggleLive}
                        disabled={togglingLive}
                        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {togglingLive ? 'Processing...' : 'Go Live →'}
                      </button>
                    )}
                    {hasNoInvitations && (
                      <p className="text-xs text-slate-500 italic">Complete step 2 first</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Alert: No students invited (shown when not new test) */}
            {hasNoInvitations && !isNewTest && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">No students invited yet</p>
                    <p className="text-sm text-amber-600">Invite students so they can see and take this test</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  Invite Students Now
                </button>
              </div>
            )}

            {/* Header with Actions */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{test.title}</h1>
                  <p className="text-slate-600">{test.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {test.is_live ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">
                      Not Live
                    </span>
                  )}
                </div>
              </div>

              {/* Primary actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleToggleLive}
                  disabled={togglingLive}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                    test.is_live
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-600/20'
                  }`}
                >
                  {togglingLive ? (
                    'Updating...'
                  ) : test.is_live ? (
                    <>
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      End Test
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-white/80 rounded-full" />
                      Go Live
                    </>
                  )}
                </button>

                <Link
                  href={`/dashboard/mentor/tests/${test.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit Test
                </Link>

                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Students
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={exporting || submissionCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:border-green-300 hover:text-green-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export Results'}
                </button>
              </div>

              {/* Manage — each links to its own dedicated page/action */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Link
                  href={`/dashboard/mentor/tests/${test.id}/analytics`}
                  className="group flex flex-col gap-2 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all"
                >
                  <span className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">Analytics</span>
                  <span className="text-xs text-slate-500">Scores, pass rate & per-question stats</span>
                </Link>

                <Link
                  href={`/dashboard/mentor/tests/${test.id}/monitor`}
                  className="group flex flex-col gap-2 p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all"
                >
                  <span className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Eye className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">Live Monitor</span>
                  <span className="text-xs text-slate-500">Watch active sessions & violations</span>
                </Link>

                {hasDescriptiveQuestions && submissionCount > 0 ? (
                  <button
                    onClick={() => setShowManualGrading(true)}
                    className="group flex flex-col gap-2 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left"
                  >
                    <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Pencil className="w-5 h-5" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">Manual Grading</span>
                    <span className="text-xs text-slate-500">Grade descriptive answers</span>
                  </button>
                ) : (
                  <Link
                    href="/dashboard/mentor/question-bank"
                    className="group flex flex-col gap-2 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
                  >
                    <span className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">Question Bank</span>
                    <span className="text-xs text-slate-500">Reuse saved questions</span>
                  </Link>
                )}

                <Link
                  href={`/dashboard/mentor/tests/${test.id}/edit`}
                  className="group flex flex-col gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
                >
                  <span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">Settings & Security</span>
                  <span className="text-xs text-slate-500">Proctoring, anti-cheat & timing</span>
                </Link>
              </div>

              {/* Test Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Duration</p>
                    <p className="font-semibold text-slate-900">{test.duration_minutes} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Marks</p>
                    <p className="font-semibold text-slate-900">{test.total_marks}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Questions</p>
                    <p className="font-semibold text-slate-900">{test.questions?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Submissions</p>
                    <p className="font-semibold text-slate-900">{submissionCount}</p>
                  </div>
                </div>
              </div>

              {/* Test Settings Info */}
              {(test.settings || test.proctoring_enabled) && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-wrap gap-2">
                    {test.proctoring_enabled && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        <Shield className="w-3 h-3" />
                        Proctored
                      </span>
                    )}
                    {test.settings?.randomize_questions && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Randomized
                      </span>
                    )}
                    {test.settings?.enable_anti_cheat && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                        Anti-Cheat Enabled
                      </span>
                    )}
                    {test.settings?.show_results_immediately && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        Instant Results
                      </span>
                    )}
                    {test.scheduled_for && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
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
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Invited</span>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{test.invitations?.length || 0}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Submitted</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">{submissionCount}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Avg Score</span>
                  <CheckCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-3xl font-bold text-indigo-600">{avgScore.toFixed(1)}%</p>
              </div>
            </div>

            {/* Submissions */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Submissions</h2>
                {submissionCount > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                )}
              </div>
              {test.submissions && test.submissions.length > 0 ? (
                <div className="space-y-3">
                  {test.submissions.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {sub.student?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{sub.student?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">
                            Submitted: {new Date(sub.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-indigo-600">{sub.score}/{test.total_marks}</p>
                          <p className="text-sm text-slate-500">{sub.percentage?.toFixed(1)}%</p>
                        </div>
                        {sub.is_disqualified && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                            Disqualified
                          </span>
                        )}
                        {!sub.is_disqualified && sub.warnings_count > 0 && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">
                            ⚠️ {sub.warnings_count} violation{sub.warnings_count !== 1 ? 's' : ''}
                          </span>
                        )}
                        {sub.screen_recording_url && (
                          <a href={sub.screen_recording_url} target="_blank" rel="noopener noreferrer"
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors">
                            🎥 Recording
                          </a>
                        )}
                        {sub.manual_grades && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Graded
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No submissions yet</p>
                  <button
                    onClick={() => setShowBulkInvite(true)}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    Invite students to take this test
                  </button>
                </div>
              )}
            </div>

            {/* Invitations */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Invitations</h2>
                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Add More
                </button>
              </div>
              {test.invitations && test.invitations.length > 0 ? (
                <div className="space-y-2">
                  {test.invitations.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {inv.student?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{inv.student?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{inv.student?.email}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        inv.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No invitations sent yet</p>
                  <button
                    onClick={() => setShowBulkInvite(true)}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm"
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
