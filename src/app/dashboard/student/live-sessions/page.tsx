import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';

export const dynamic = 'force-dynamic';

export default async function StudentLiveSessionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) redirect('/onboarding/student');

  // Fetch peer sessions this student is involved in
  const { data: peerSessions } = await supabase
    .from('peer_sessions')
    .select('*')
    .or(`created_by.eq.${user.id},target_student_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Get other student details for each peer session
  const sessionsWithDetails = await Promise.all(
    (peerSessions || []).map(async (session) => {
      const otherStudentId = session.created_by === user.id ? session.target_student_id : session.created_by;
      const { data: otherStudent } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', otherStudentId)
        .single();

      return {
        ...session,
        otherStudent,
        isCreator: session.created_by === user.id,
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Peer Study Sessions</h1>
              <p className="text-slate-600">Connect and study with fellow students</p>
            </div>

            {/* Sessions Grid */}
            {sessionsWithDetails.length > 0 ? (
              <div className="grid gap-4">
                {sessionsWithDetails.map((session) => (
                  <div
                    key={session.id}
                    className={`bg-white rounded-2xl p-6 border-2 transition-all ${
                      session.status === 'active'
                        ? 'border-green-500 shadow-lg'
                        : 'border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{session.title}</h3>
                        <p className="text-sm text-slate-600">
                          with {session.otherStudent?.full_name || 'Unknown Student'}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {session.status === 'active' ? '🔴 Active' : 'Completed'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <span>Session ID: {session.id.slice(0, 8)}</span>
                      <span>Started: {new Date(session.created_at).toLocaleString()}</span>
                    </div>

                    {session.status === 'active' && (
                      <a
                        href={session.google_meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        📹 Join Video Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No peer sessions yet</h3>
                <p className="text-slate-600 mb-6">
                  Connect with students and start a live study session with them!
                </p>
                <a
                  href="/dashboard/student/connect-students"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  🔗 Find Study Partners
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

