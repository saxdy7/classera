import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Trophy, BookOpen, CheckCircle, Clock, TrendingUp, Calendar as CalendarIcon, Target, Sparkles, BarChart3 } from 'lucide-react';

export default async function StudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get user profile with university
  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  // Check if profile is complete
  if (!profile) {
    redirect('/onboarding/student');
  }
  
  if (!profile.full_name || !profile.university_id) {
    redirect('/onboarding/student');
  }

  // Get student stats
  const { count: testsCompletedCount } = await supabase
    .from('test_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)

  const { count: totalTasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)

  const { count: tasksCompletedCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('status', 'completed')

  const { count: tasksInProgressCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('status', 'in_progress')

  const { count: totalCoursesCount } = await supabase
    .from('course_progress')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)

  const { data: leaderboardData } = await supabase
    .from('leaderboard')
    .select('rank, total_score, average_percentage')
    .eq('student_id', user.id)
    .eq('month', new Date().getMonth() + 1)
    .eq('year', new Date().getFullYear())
    .single()

  const { data: upcomingTests } = await supabase
    .from('tests')
    .select('*, users!tests_mentor_id_fkey(full_name)')
    .eq('university_id', profile.university_id)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(3)

  const { data: recentSubmissions } = await supabase
    .from('test_submissions')
    .select('*, tests(title)')
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-fuchsia-50/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header with enhanced design */}
            <div className="mb-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-fuchsia-200/20 rounded-full blur-3xl -z-10"></div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent mb-3 animate-gradient">
                    Welcome back, {profile?.full_name}! 🎓
                  </h2>
                  <p className="text-slate-600 flex flex-wrap items-center gap-2 text-sm md:text-base">
                    <span className="font-semibold text-slate-700">{profile.universities?.name}</span>
                    {profile.degree_type && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{profile.degree_type}</span>
                      </>
                    )}
                    {profile.specialization_board && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="px-2 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-semibold">{profile.specialization_board}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-700">Active</span>
                </div>
              </div>
            </div>

            {/* Main Stats Grid - Enhanced with gradients and animations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {/* Tests Completed Card */}
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-purple-100 rounded-full">
                      <span className="text-xs text-purple-700 font-bold">TESTS</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">{testsCompletedCount || 0}</div>
                  <div className="text-sm text-slate-600 font-medium">Completed Tests</div>
                  <div className="mt-3 pt-3 border-t border-purple-100">
                    <div className="flex items-center gap-1 text-xs text-purple-600 font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      <span>Keep going!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks Card with Progress */}
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-blue-100 rounded-full">
                      <span className="text-xs text-blue-700 font-bold">TASKS</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-4xl font-black text-slate-900">{tasksCompletedCount || 0}</div>
                    <div className="text-xl text-slate-400 font-semibold">/ {totalTasksCount || 0}</div>
                  </div>
                  <div className="text-sm text-slate-600 font-medium mb-3">Tasks Completed</div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalTasksCount ? (tasksCompletedCount! / totalTasksCount! * 100) : 0}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600 font-semibold">
                    {tasksInProgressCount || 0} in progress
                  </div>
                </div>
              </div>

              {/* Average Score Card */}
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-fuchsia-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-fuchsia-100 rounded-full">
                      <span className="text-xs text-fuchsia-700 font-bold">SCORE</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">
                    {leaderboardData?.average_percentage ? `${Math.round(leaderboardData.average_percentage)}%` : '0%'}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Average Performance</div>
                  <div className="mt-3 pt-3 border-t border-fuchsia-100">
                    <div className="flex items-center gap-1 text-xs text-fuchsia-600 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        {(leaderboardData?.average_percentage || 0) >= 70 ? 'Excellent!' : 
                         (leaderboardData?.average_percentage || 0) >= 50 ? 'Good job!' : 'Keep improving!'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* University Rank Card - Premium Style */}
              <div className="group relative bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-600 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                      <span className="text-xs text-white font-bold">RANK</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-2">
                    {leaderboardData?.rank ? `#${leaderboardData.rank}` : 'N/A'}
                  </div>
                  <div className="text-sm text-white/90 font-medium mb-3">University Leaderboard</div>
                  {leaderboardData?.total_score && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">Total Score</span>
                        <span className="text-sm text-white font-bold">{Math.round(leaderboardData.total_score)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{totalCoursesCount || 0}</div>
                    <div className="text-sm text-slate-600">Courses Enrolled</div>
                  </div>
                  <BookOpen className="w-8 h-8 text-slate-400" />
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{tasksInProgressCount || 0}</div>
                    <div className="text-sm text-slate-600">Tasks In Progress</div>
                  </div>
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {totalTasksCount ? Math.round((tasksCompletedCount! / totalTasksCount! * 100)) : 0}%
                    </div>
                    <div className="text-sm text-slate-600">Completion Rate</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Tests */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <CalendarIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    Upcoming Tests
                  </h3>
                  <div className="px-3 py-1 bg-purple-100 rounded-full">
                    <span className="text-xs font-bold text-purple-700">{upcomingTests?.length || 0}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {upcomingTests && upcomingTests.length > 0 ? (
                    upcomingTests.map((test) => (
                      <div key={test.id} className="group p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 rounded-2xl hover:shadow-md transition-all cursor-pointer">
                        <div className="font-bold text-slate-900 mb-2">{test.title}</div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-600">
                            Mentor: <span className="font-semibold">{test.users?.full_name || 'Unknown'}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(test.scheduled_at).toLocaleString()}
                          </div>
                          <div className="px-2 py-1 bg-white/60 rounded-lg text-xs font-bold text-purple-700">
                            {test.duration_minutes}min
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <CalendarIcon className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="font-semibold">No upcoming tests</p>
                      <p className="text-xs mt-1">Check back later for new assessments</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Test Results */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-fuchsia-100 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    Recent Results
                  </h3>
                  <div className="px-3 py-1 bg-fuchsia-100 rounded-full">
                    <span className="text-xs font-bold text-fuchsia-700">{recentSubmissions?.length || 0}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {recentSubmissions && recentSubmissions.length > 0 ? (
                    recentSubmissions.map((submission) => (
                      <div key={submission.id} className="group p-4 bg-gradient-to-br from-fuchsia-50 to-purple-50 border border-fuchsia-100 rounded-2xl hover:shadow-md transition-all">
                        <div className="font-bold text-slate-900 mb-2">{submission.tests?.title}</div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            Score: <span className="font-bold text-slate-900">{submission.score}/{submission.max_score}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full font-black text-lg ${
                            (submission.percentage || 0) >= 70 ? 'bg-green-100 text-green-700' : 
                            (submission.percentage || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {submission.percentage ? `${Math.round(submission.percentage)}%` : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="font-semibold">No test results yet</p>
                      <p className="text-xs mt-1">Complete tests to see your scores here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
