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
    <div className="min-h-screen bg-muted/40">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-6xl mx-auto">

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">My Students</h1>
              <p className="text-muted-foreground text-sm">Students from <span className="font-semibold text-foreground/80">{profile.universities?.name}</span></p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Users, label: 'Total Students', value: students?.length ?? 0, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
                { icon: UserCheck, label: 'Connected', value: connectedIds.size, color: 'text-green-600', bg: 'bg-green-500/10' },
                { icon: Clock, label: 'Pending Requests', value: requests?.length ?? 0, color: 'text-amber-600', bg: 'bg-amber-500/10' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left: All students (2/3 width) ── */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground">All Students</h2>
                  <span className="text-xs text-muted-foreground">{students?.length ?? 0} total</span>
                </div>
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {students && students.length > 0 ? students.map(student => {
                    const isConnected = connectedIds.has(student.id);
                    const initials = student.full_name?.charAt(0).toUpperCase() ?? '?';
                    return (
                      <div key={student.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-accent-purple transition-all">
                        {student.avatar_url ? (
                          <Image src={student.avatar_url} alt={student.full_name} width={48} height={48}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 bg-primary">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate text-sm">{student.full_name}</p>
                            {isConnected && (
                              <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full border border-green-600">
                                Connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{student.specialization_board || student.degree_type || 'Student'}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/dashboard/mentor/messages?userId=${student.id}`}
                            className="p-2 rounded-lg bg-muted hover:bg-accent-purple/10 hover:text-accent-purple text-muted-foreground transition-colors"
                            title="Message">
                            <MessageSquare size={15} />
                          </Link>
                          <Link href={`/dashboard/mentor/student/${student.id}`}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary transition-colors">
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                      <Users size={40} className="text-muted-foreground/70 mx-auto mb-3" />
                      <p className="font-semibold text-foreground/80">No students yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Students will appear here once they join your university</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: Pending connection requests (1/3 width) ── */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground">Connection Requests</h2>
                  {(requests?.length ?? 0) > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center">
                      {requests!.length}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {requests && requests.length > 0 ? requests.map((req: any) => {
                    const s = req.student;
                    return (
                      <div key={req.id} className="bg-card border border-border rounded-xl p-4 hover:border-amber-500 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          {s?.avatar_url ? (
                            <Image src={s.avatar_url} alt={s.full_name} width={40} height={40}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0 bg-amber-500">
                              {s?.full_name?.charAt(0) ?? '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{s?.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{s?.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <form action={`/api/connection-requests/${req.id}/accept`} method="POST" className="flex-1">
                            <button className="w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                              Accept
                            </button>
                          </form>
                          <form action={`/api/connection-requests/${req.id}/decline`} method="POST" className="flex-1">
                            <button className="w-full py-1.5 bg-muted text-foreground/80 rounded-lg text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors">
                              Decline
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-card border border-border rounded-xl p-8 text-center">
                      <div className="text-3xl mb-2">🤝</div>
                      <p className="font-semibold text-foreground/80 text-sm">No pending requests</p>
                      <p className="text-xs text-muted-foreground mt-1">Students can send connection requests from their dashboard</p>
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
