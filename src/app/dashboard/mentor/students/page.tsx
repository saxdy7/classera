import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { ConnectionRequests } from '@/components/mentor/ConnectionRequests';
import Link from 'next/link';

export default async function Students() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Get current user's profile
  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  // Get students from the same university
  const { data: students } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('role', 'student')
    .eq('university_id', profile.university_id)
    .order('full_name');

  return (
    <div className="min-h-screen bg-white">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-3xl p-6 md:p-8 mb-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      My Students
                    </h1>
                  </div>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                    Manage your students from <span className="font-semibold text-indigo-600">{profile.universities?.name}</span>. Review connection requests and track student progress.
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                      <span className="text-2xl font-bold text-indigo-600">{students?.length || 0}</span>
                      <span className="text-xs text-slate-600 ml-2">Total Students</span>
                    </div>
                    <div className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100">
                      <span className="text-2xl font-bold text-purple-600">{pendingRequests?.length || 0}</span>
                      <span className="text-xs text-slate-600 ml-2">Pending Requests</span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block flex-shrink-0">
                  <img
                    src="https://illustrations.popsy.co/amber/customer-support.svg"
                    alt="Students Illustration"
                    className="w-48 h-48 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search students by name, field of study..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - All Students */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">All Students</h2>
                  <span className="ml-auto px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                    {students?.length || 0}
                  </span>
                </div>

                {students && students.length > 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
                    {students.map((student, index) => {
                      const cardColors = [
                        { top: 'bg-orange-50', badge: 'bg-orange-100 border-orange-200 text-orange-700', accent: '#FB923C' },
                        { top: 'bg-emerald-50', badge: 'bg-emerald-100 border-emerald-200 text-emerald-700', accent: '#34D399' },
                        { top: 'bg-purple-50', badge: 'bg-purple-100 border-purple-200 text-purple-700', accent: '#A78BFA' },
                        { top: 'bg-blue-50', badge: 'bg-blue-100 border-blue-200 text-blue-700', accent: '#60A5FA' },
                        { top: 'bg-pink-50', badge: 'bg-pink-100 border-pink-200 text-pink-700', accent: '#F472B6' },
                        { top: 'bg-gray-50', badge: 'bg-gray-100 border-gray-200 text-gray-700', accent: '#9CA3AF' },
                      ];
                      const colorScheme = cardColors[index % cardColors.length];

                      return (
                        <div
                          key={student.id}
                          className="w-full rounded-2xl shadow-sm border border-black/5 transition-transform hover:scale-[1.01] hover:shadow-md overflow-hidden"
                        >
                          {/* Top Section - Colored Background */}
                          <div className={`${colorScheme.top} p-4 relative`}>
                            {/* Decorative elements */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                              <svg className="absolute -top-2 -right-2 w-24 h-24" viewBox="0 0 100 100">
                                <path d="M 0,50 Q 25,25 50,50 T 100,50" stroke={colorScheme.accent} strokeWidth="2" fill="none" />
                              </svg>
                              <div className="absolute bottom-2 left-2 w-6 h-6 border-2 rounded-full" style={{ borderColor: colorScheme.accent }}></div>
                            </div>

                            <div className="flex items-center gap-3 relative z-10">
                              {student.avatar_url ? (
                                <Image
                                  src={student.avatar_url}
                                  alt={student.full_name}
                                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-lg"
                                  width={56}
                                  height={56}
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                                  {student.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 truncate text-base">
                                  {student.full_name}
                                </h3>
                                <p className="text-sm text-slate-600 truncate flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  {student.specialization_board || 'Student'}
                                </p>
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colorScheme.badge}`}>
                                🎓 Student
                              </span>
                            </div>
                          </div>

                          {/* Bottom Section - White Background */}
                          <div className="bg-white p-4 relative">
                            {/* Decorative elements */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                              <div className="absolute top-2 right-4 w-4 h-4 border-2 border-gray-200 rotate-45"></div>
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex flex-col gap-1">
                                {student.degree_type && (
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {student.degree_type}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">{student.email}</span>
                              </div>

                              <Link
                                href={`/dashboard/mentor/student/${student.id}`}
                                className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap shadow-lg"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-12 text-center border border-slate-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">No students yet</h3>
                    <p className="text-sm text-slate-600">Students will appear here once they connect with you</p>
                  </div>
                )}
              </div>

              {/* Right Side - Pending Requests */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Connection Requests</h2>
                  {(pendingRequests?.length || 0) > 0 && (
                    <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold animate-pulse">
                      {pendingRequests?.length}
                    </span>
                  )}
                </div>
                <ConnectionRequests requests={pendingRequests || []} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
