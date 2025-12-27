import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { FileText, Users, Calendar, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

export default async function TestDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!test) {
    redirect('/dashboard/mentor/tests');
  }

  // Get all submissions
  const { data: submissions } = await supabase
    .from('test_submissions')
    .select('*, users(full_name, email)')
    .eq('test_id', params.id)
    .order('created_at', { ascending: false });

  const totalSubmissions = submissions?.length || 0;
  const avgScore = submissions && submissions.length > 0
    ? submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / submissions.length
    : 0;

  const now = new Date();
  const scheduledAt = new Date(test.scheduled_at);
  const isLive = scheduledAt <= now && scheduledAt.getTime() + (test.duration_minutes * 60 * 1000) >= now.getTime();
  const isUpcoming = scheduledAt > now;
  const isCompleted = scheduledAt.getTime() + (test.duration_minutes * 60 * 1000) < now.getTime();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Test Header */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl font-bold text-black">{test.title}</h1>
                    {isLive && (
                      <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        Upcoming
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mb-4">{test.description}</p>
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(test.scheduled_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {test.duration_minutes} minutes
                    </span>
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {test.questions.length} questions
                    </span>
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {test.total_marks} marks
                    </span>
                  </div>
                </div>
                <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                  Edit Test
                </button>
              </div>

              {/* Test Stats */}
              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">{totalSubmissions}</p>
                  <p className="text-sm text-slate-600">Submissions</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{avgScore.toFixed(1)}%</p>
                  <p className="text-sm text-slate-600">Avg Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {submissions?.filter(s => s.percentage >= 70).length || 0}
                  </p>
                  <p className="text-sm text-slate-600">Passed (≥70%)</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {submissions?.filter(s => s.percentage < 70).length || 0}
                  </p>
                  <p className="text-sm text-slate-600">Failed (&lt;70%)</p>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-black mb-6">Student Submissions</h2>

              {submissions && submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {submission.users.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-black">{submission.users.full_name}</p>
                          <p className="text-sm text-slate-600">{submission.users.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Submitted</p>
                          <p className="text-sm font-medium text-black">
                            {new Date(submission.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-slate-600">Score</p>
                          <p className={`text-xl font-bold ${
                            submission.percentage >= 70
                              ? 'text-green-600'
                              : submission.percentage >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {submission.percentage.toFixed(1)}%
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-slate-600">Marks</p>
                          <p className="text-lg font-bold text-black">
                            {submission.score}/{test.total_marks}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {submission.status === 'completed' && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              Completed
                            </span>
                          )}
                          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">No submissions yet</p>
                  <p className="text-sm text-slate-400">
                    {isUpcoming
                      ? 'Students can submit once the test goes live'
                      : isLive
                      ? 'Waiting for students to complete the test'
                      : 'No students attempted this test'}
                  </p>
                </div>
              )}
            </div>

            {/* Questions Overview */}
            <div className="mt-8 bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-black mb-6">Questions</h2>
              <div className="space-y-4">
                {test.questions.map((question: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-black">
                        {index + 1}. {question.question}
                      </p>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {question.marks} marks
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Type: {question.type === 'mcq' ? 'Multiple Choice' : 'Descriptive'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
