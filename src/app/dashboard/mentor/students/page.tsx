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
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-6xl mx-auto">

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-[var(--cl-ink)] mb-1">My Students</h1>
              <p className="text-[var(--cl-muted)] text-sm">Students from <span className="font-semibold text-[var(--cl-body)]">{profile.universities?.name}</span></p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Users, label: 'Total Students', value: students?.length ?? 0, color: 'text-[var(--cl-primary)]', bg: 'bg-[var(--cl-primary-soft)]' },
                { icon: UserCheck, label: 'Connected', value: connectedIds.size, color: 'text-[var(--cl-success)]', bg: 'bg-[rgba(22,163,74,0.12)]' },
                { icon: Clock, label: 'Pending Requests', value: requests?.length ?? 0, color: 'text-[var(--cl-warning)]', bg: 'bg-[rgba(171,100,0,0.12)]' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-[var(--cl-r-lg)] ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[var(--cl-ink)]">{value}</p>
                    <p className="text-xs text-[var(--cl-muted)]">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left: All students (2/3 width) ── */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[var(--cl-ink)]">All Students</h2>
                  <span className="text-xs text-[var(--cl-muted)]">{students?.length ?? 0} total</span>
                </div>
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {students && students.length > 0 ? students.map(student => {
                    const isConnected = connectedIds.has(student.id);
                    const initials = student.full_name?.charAt(0).toUpperCase() ?? '?';
                    return (
                      <div key={student.id} className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] p-4 flex items-center gap-4 hover:border-[var(--cl-primary)] transition-all">
                        {student.avatar_url ? (
                          <Image src={student.avatar_url} alt={student.full_name} width={48} height={48}
                            className="w-12 h-12 rounded-[var(--cl-r-lg)] object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-[var(--cl-r-lg)] flex items-center justify-center text-[var(--cl-on-dark)] font-semibold text-lg flex-shrink-0 bg-[var(--cl-primary)]">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--cl-ink)] truncate text-sm">{student.full_name}</p>
                            {isConnected && (
                              <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] rounded-full border border-[var(--cl-success)]">
                                Connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--cl-muted)] truncate">{student.specialization_board || student.degree_type || 'Student'}</p>
                          <p className="text-xs text-[var(--cl-muted)] truncate">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/dashboard/mentor/messages?userId=${student.id}`}
                            className="p-2 rounded-lg bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-primary-soft)] hover:text-[var(--cl-primary)] text-[var(--cl-muted)] transition-colors"
                            title="Message">
                            <MessageSquare size={15} />
                          </Link>
                          <Link href={`/dashboard/mentor/student/${student.id}`}
                            className="px-3 py-1.5 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-lg text-xs font-semibold hover:bg-[var(--cl-primary)] transition-colors">
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] p-12 text-center">
                      <Users size={40} className="text-[var(--cl-muted-soft)] mx-auto mb-3" />
                      <p className="font-semibold text-[var(--cl-body)]">No students yet</p>
                      <p className="text-sm text-[var(--cl-muted)] mt-1">Students will appear here once they join your university</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: Pending connection requests (1/3 width) ── */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[var(--cl-ink)]">Connection Requests</h2>
                  {(requests?.length ?? 0) > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[var(--cl-warning)] text-[var(--cl-on-dark)] text-[10px] font-semibold flex items-center justify-center">
                      {requests!.length}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {requests && requests.length > 0 ? requests.map((req: any) => {
                    const s = req.student;
                    return (
                      <div key={req.id} className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] p-4 hover:border-[var(--cl-warning)] transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          {s?.avatar_url ? (
                            <Image src={s.avatar_url} alt={s.full_name} width={40} height={40}
                              className="w-10 h-10 rounded-[var(--cl-r-lg)] object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-[var(--cl-r-lg)] flex items-center justify-center text-[var(--cl-on-dark)] font-semibold flex-shrink-0 bg-[var(--cl-warning)]">
                              {s?.full_name?.charAt(0) ?? '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--cl-ink)] text-sm truncate">{s?.full_name}</p>
                            <p className="text-xs text-[var(--cl-muted)] truncate">{s?.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <form action={`/api/connection-requests/${req.id}/accept`} method="POST" className="flex-1">
                            <button className="w-full py-1.5 bg-[var(--cl-success)] text-[var(--cl-on-dark)] rounded-lg text-xs font-semibold hover:bg-[var(--cl-success)] transition-colors">
                              Accept
                            </button>
                          </form>
                          <form action={`/api/connection-requests/${req.id}/decline`} method="POST" className="flex-1">
                            <button className="w-full py-1.5 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg text-xs font-semibold hover:bg-[rgba(239,68,68,0.12)] hover:text-[var(--cl-error)] transition-colors">
                              Decline
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] p-8 text-center">
                      <div className="text-3xl mb-2">🤝</div>
                      <p className="font-semibold text-[var(--cl-body)] text-sm">No pending requests</p>
                      <p className="text-xs text-[var(--cl-muted)] mt-1">Students can send connection requests from their dashboard</p>
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
