import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { FileText, Calendar, Clock, Play } from 'lucide-react';
import Link from 'next/link';

export default async function StudentTestsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') redirect('/dashboard');

  // Get available tests
  const { data: availableTests } = await supabase
    .from('tests')
    .select('*, users!tests_mentor_id_fkey(full_name)')
    .eq('university_id', profile.university_id)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });

  // Get completed tests
  const { data: completedSubmissions } = await supabase
    .from('test_submissions')
    .select('*, tests(title, total_marks, scheduled_at, users!tests_mentor_id_fkey(full_name))')
    .eq('student_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-fuchsia-50/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                My Tests
              </h1>
              <p className="text-slate-600">View and take your assessments</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{availableTests?.length || 0}</div>
                    <div className="text-sm text-slate-600">Available Tests</div>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{completedSubmissions?.length || 0}</div>
                    <div className="text-sm text-slate-600">Completed</div>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {completedSubmissions && completedSubmissions.length > 0
                        ? Math.round(completedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / completedSubmissions.length)
                        : 0}%
                    </div>
                    <div className="text-sm text-slate-600">Average Score</div>
                  </div>
                  <Clock className="w-8 h-8 text-fuchsia-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Available Tests */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Available Tests</h2>
                
                {availableTests && availableTests.length > 0 ? (
                  <div className="space-y-3">
                    {availableTests.map((test) => (
                      <div key={test.id} className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 rounded-2xl">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-lg mb-1">{test.title}</h3>
                            {test.description && (
                              <p className="text-sm text-slate-600">{test.description}</p>
                            )}
                          </div>
                          {test.is_live && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full ml-4">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-700 font-bold">LIVE</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap mb-4">
                          <div className="text-sm text-slate-600">
                            <strong>Mentor:</strong> {test.users?.full_name}
                          </div>
                          <div className="text-sm text-slate-600">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(test.scheduled_at).toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {test.duration_minutes} minutes
                          </div>
                          <div className="px-3 py-1 bg-white/60 rounded-lg text-xs font-semibold text-purple-700">
                            {test.total_marks} marks
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/student/tests/${test.id}/take`}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold rounded-xl shadow-lg transition-all"
                        >
                          <Play className="w-4 h-4" />
                          Start Test
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">No tests available</p>
                    <p className="text-sm">Check back later for new assessments</p>
                  </div>
                )}
              </div>

              {/* Completed Tests */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Completed Tests</h2>
                
                {completedSubmissions && completedSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {completedSubmissions.map((submission) => (
                      <div key={submission.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900">{submission.tests?.title}</h3>
                            <p className="text-sm text-slate-600">
                              Mentor: {submission.tests?.users?.full_name}
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-full font-black text-lg ${
                            (submission.percentage || 0) >= 70 ? 'bg-green-100 text-green-700' : 
                            (submission.percentage || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {submission.percentage ? `${Math.round(submission.percentage)}%` : 'Pending'}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span><strong>Score:</strong> {submission.score || 0}/{submission.max_score || submission.tests?.total_marks}</span>
                          <span>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">No completed tests yet</p>
                    <p className="text-sm">Your test results will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
