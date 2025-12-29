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

  // Get pending connection requests for this mentor
  const { data: pendingRequests } = await supabase
    .from('connection_requests')
    .select(`
      *,
      student:users!connection_requests_student_id_fkey(
        id,
        full_name,
        email,
        avatar_url,
        degree_type,
        specialization_board,
        universities(name)
      )
    `)
    .eq('mentor_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-gray-200 to-gray-100 rounded-3xl p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    My Students 📚
                  </h1>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                    Manage your students from {profile.universities?.name}. Review connection requests and track student progress.
                  </p>
                </div>
                
                <div className="hidden lg:block flex-shrink-0">
                  <img
                    src="https://illustrations.popsy.co/amber/customer-support.svg"
                    alt="Students Illustration"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search students by name..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - All Students */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">All Students</h2>
                
                {students && students.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {student.avatar_url ? (
                            <Image
                              src={student.avatar_url}
                              alt={student.full_name}
                              className="w-12 h-12 rounded-xl object-cover"
                              width={48}
                              height={48}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                              {student.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate text-sm">
                              {student.full_name}
                            </h3>
                            <p className="text-xs text-slate-500 truncate">
                              {student.field_of_study || 'Student'}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/mentor/student/${student.id}`}
                          className="block w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-center text-sm"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600">No students found</p>
                  </div>
                )}
              </div>

              {/* Right Side - Pending Requests */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Connection Requests</h2>
                <ConnectionRequests requests={pendingRequests || []} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
