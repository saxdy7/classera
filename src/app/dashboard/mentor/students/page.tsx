import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Users, MessageSquare, UserCheck, Clock, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Students() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) redirect('/onboarding/mentor');

  const admin = createAdminClient();

  // All students — show all registered students so mentor can find them
  const { data: students } = await admin
    .from('users')
    .select('id, full_name, avatar_url, specialization_board, current_semester, degree_type, email, bio')
    .eq('role', 'student')
    .not('full_name', 'is', null)
    .order('full_name');

  // Connection requests sent TO this mentor
  const { data: requests } = await admin
    .from('connection_requests')
    .select('*, student:users!connection_requests_student_id_fkey(id, full_name, avatar_url, email, specialization_board)')
    .eq('mentor_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Accepted connections
  const { data: connected } = await admin
    .from('connection_requests')
    .select('student_id')
    .eq('mentor_id', user.id)
    .eq('status', 'accepted');

  const connectedIds = new Set((connected || []).map(c => c.student_id));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-6xl mx-auto">

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">My Students</h1>
              <p className="text-slate-500 text-sm">Students from <span className="font-semibold text-slate-700">{profile.universities?.name}</span></p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Users, label: 'Total Students', value: students?.length ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { icon: UserCheck, label: 'Connected', value: connectedIds.size, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: Clock, label: 'Pending Requests', value: requests?.length ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left: All students (2/3 width) ── */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">All Students</h2>
                  <span className="text-xs text-slate-400">{students?.length ?? 0} total</span>
                </div>
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {students && students.length > 0 ? students.map(student => {
                    const isConnected = connectedIds.has(student.id);
                    const initials = student.full_name?.charAt(0).toUpperCase() ?? '?';
                    return (
                      <div key={student.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                        {student.avatar_url ? (
                          <Image src={student.avatar_url} alt={student.full_name} width={48} height={48}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate text-sm">{student.full_name}</p>
                            {isConnected && (
                              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                Connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{student.specialization_board || student.degree_type || 'Student'}</p>
                          <p className="text-xs text-slate-400 truncate">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/dashboard/mentor/messages?userId=${student.id}`}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 transition-colors"
                            title="Message">
                            <MessageSquare size={15} />
                          </Link>
                          <Link href={`/dashboard/mentor/student/${student.id}`}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                      <Users size={40} className="text-slate-200 mx-auto mb-3" />
                      <p className="font-semibold text-slate-700">No students yet</p>
                      <p className="text-sm text-slate-400 mt-1">Students will appear here once they join your university</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: Pending connection requests (1/3 width) ── */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Connection Requests</h2>
                  {(requests?.length ?? 0) > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {requests!.length}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {requests && requests.length > 0 ? requests.map((req: any) => {
                    const s = req.student;
                    return (
                      <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-amber-200 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          {s?.avatar_url ? (
                            <Image src={s.avatar_url} alt={s.full_name} width={40} height={40}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {s?.full_name?.charAt(0) ?? '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">{s?.full_name}</p>
                            <p className="text-xs text-slate-400 truncate">{s?.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <form action={`/api/connection-requests/${req.id}/accept`} method="POST" className="flex-1">
                            <button className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                              Accept
                            </button>
                          </form>
                          <form action={`/api/connection-requests/${req.id}/decline`} method="POST" className="flex-1">
                            <button className="w-full py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors">
                              Decline
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                      <div className="text-3xl mb-2">🤝</div>
                      <p className="font-semibold text-slate-700 text-sm">No pending requests</p>
                      <p className="text-xs text-slate-400 mt-1">Students can send connection requests from their dashboard</p>
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
