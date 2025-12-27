import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Users, FileText, Video, Award, Calendar, TrendingUp, Sparkles, BarChart3, Target } from 'lucide-react';
import Link from 'next/link';

export default async function MentorDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get profile with university
  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  // Check if profile is complete
  if (!profile) {
    redirect('/onboarding/mentor');
  }
  
  if (!profile.full_name || !profile.university_id) {
    redirect('/onboarding/mentor');
  }

  // Get mentor stats
  const { count: communitiesCount } = await supabase
    .from('communities')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', user.id)

  const { count: totalTestsCount } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', user.id)

  const { count: liveTestsCount } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', user.id)
    .eq('is_live', true)

  // Get total students across all communities
  const { data: communities } = await supabase
    .from('communities')
    .select('id')
    .eq('mentor_id', user.id)

  let totalStudents = 0
  let pendingRequests = 0
  if (communities && communities.length > 0) {
    const { count: approvedCount } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .in('community_id', communities.map(c => c.id))
      .eq('status', 'approved')
    totalStudents = approvedCount || 0

    const { count: pendingCount } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .in('community_id', communities.map(c => c.id))
      .eq('status', 'pending')
    pendingRequests = pendingCount || 0
  }

  // Get total submissions count
  const { count: totalSubmissionsCount } = await supabase
    .from('test_submissions')
    .select('*, tests!inner(mentor_id)', { count: 'exact', head: true })
    .eq('tests.mentor_id', user.id)

  const { data: recentSubmissions } = await supabase
    .from('test_submissions')
    .select('*, tests!inner(mentor_id, title), users(full_name)')
    .eq('tests.mentor_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  // Get upcoming tests
  const { data: upcomingTests } = await supabase
    .from('tests')
    .select('*')
    .eq('mentor_id', user.id)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10)

  // Calculate average students per community
  const avgStudentsPerCommunity = communities && communities.length > 0 
    ? Math.round(totalStudents / communities.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header with enhanced design */}
            <div className="mb-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl -z-10"></div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 animate-gradient">
                    Welcome, {profile?.full_name}! 👨‍🏫
                  </h2>
                  <p className="text-slate-600 flex flex-wrap items-center gap-2 text-sm md:text-base">
                    <span className="font-semibold text-slate-700">{profile.universities?.name}</span>
                    {profile.expertise && profile.expertise.length > 0 && (
                      <>
                        <span className="text-slate-400">•</span>
                        {profile.expertise.slice(0, 3).map((exp: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {exp}
                          </span>
                        ))}
                      </>
                    )}
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-full shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-700">Active</span>
                </div>
              </div>
            </div>

            {/* Main Stats Grid - Enhanced with gradients and animations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {/* Students Card */}
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-indigo-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-indigo-100 rounded-full">
                      <span className="text-xs text-indigo-700 font-bold">STUDENTS</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">{totalStudents}</div>
                  <div className="text-sm text-slate-600 font-medium">Active Students</div>
                  {pendingRequests > 0 && (
                    <div className="mt-3 pt-3 border-t border-indigo-100">
                      <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                        <Target className="w-3 h-3" />
                        <span>{pendingRequests} pending requests</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Communities Card */}
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-purple-100 rounded-full">
                      <span className="text-xs text-purple-700 font-bold">GROUPS</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">{communitiesCount || 0}</div>
                  <div className="text-sm text-slate-600 font-medium">Active Communities</div>
                  <div className="mt-3 pt-3 border-t border-purple-100">
                    <div className="flex items-center gap-1 text-xs text-purple-600 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>Engaging learners</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tests Card with Progress */}
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-blue-100 rounded-full">
                      <span className="text-xs text-blue-700 font-bold">TESTS</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">{totalTestsCount || 0}</div>
                  <div className="text-sm text-slate-600 font-medium mb-3">Tests Created</div>
                  {liveTestsCount! > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full w-fit">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-700 font-bold">{liveTestsCount} Live Now</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submissions Card - Premium Style */}
              <div className="group relative bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                      <span className="text-xs text-white font-bold">TOTAL</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-2">{totalSubmissionsCount || 0}</div>
                  <div className="text-sm text-white/90 font-medium mb-3">Total Submissions</div>
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <TrendingUp className="w-3 h-3" />
                    <span>All time stats</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{upcomingTests?.length || 0}</div>
                    <div className="text-sm text-slate-600">Upcoming Tests</div>
                  </div>
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{liveTestsCount || 0}</div>
                    <div className="text-sm text-slate-600">Live Sessions</div>
                  </div>
                  <Video className="w-8 h-8 text-slate-400" />
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {communitiesCount ? Math.round(totalStudents / communitiesCount!) : 0}
                    </div>
                    <div className="text-sm text-slate-600">Avg Students/Community</div>
                  </div>
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Upcoming Tests */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    Upcoming Tests
                  </h3>
                  <Link
                    href="/dashboard/mentor/tests/create"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Create New
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {upcomingTests && upcomingTests.length > 0 ? (
                    upcomingTests.map((test) => (
                      <div key={test.id} className="group p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl hover:shadow-md transition-all cursor-pointer">
                        <div className="font-bold text-slate-900 mb-2">{test.title}</div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-1 bg-white/60 rounded-lg text-xs font-semibold text-indigo-700">
                            {test.test_type === 'individual' ? '👤 Individual' : '👥 Group'}
                          </span>
                          <span className="px-2 py-1 bg-white/60 rounded-lg text-xs font-semibold text-purple-700">
                            {test.question_type}
                          </span>
                          <span className="px-2 py-1 bg-white/60 rounded-lg text-xs font-semibold text-slate-700">
                            {test.duration_minutes}min
                          </span>
                        </div>
                        <div className="text-xs text-indigo-600 font-semibold">
                          📅 {new Date(test.scheduled_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="font-semibold">No upcoming tests</p>
                      <Link
                        href="/dashboard/mentor/tests/create"
                        className="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        Create your first test
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    Recent Submissions
                  </h3>
                  <Link
                    href="/dashboard/mentor/submissions"
                    className="text-sm text-purple-600 hover:text-purple-700 font-bold"
                  >
                    View All →
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {recentSubmissions && recentSubmissions.length > 0 ? (
                    recentSubmissions.map((submission) => (
                      <div key={submission.id} className="group p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-bold text-slate-900 text-sm mb-1">{submission.users?.full_name}</div>
                            <div className="text-xs text-slate-600">{submission.tests?.title}</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full font-black text-sm ${
                            (submission.percentage || 0) >= 70 ? 'bg-green-100 text-green-700' : 
                            (submission.percentage || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {submission.percentage ? `${Math.round(submission.percentage)}%` : 'Pending'}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'In progress'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <FileText className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="font-semibold">No submissions yet</p>
                      <p className="text-xs mt-1">Student submissions will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions - Enhanced Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Link
                href="/dashboard/mentor/tests/create"
                className="group relative bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-xl mb-2">Create Test</h4>
                  <p className="text-sm text-indigo-100 font-medium">Schedule a new assessment for your students</p>
                </div>
              </Link>

              <Link
                href="/dashboard/mentor/communities"
                className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-xl mb-2">Manage Communities</h4>
                  <p className="text-sm text-purple-100 font-medium">View and organize your student groups</p>
                </div>
              </Link>

              <Link
                href="/dashboard/mentor/students"
                className="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Award className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-xl mb-2">View Students</h4>
                  <p className="text-sm text-blue-100 font-medium">Track progress and performance metrics</p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
