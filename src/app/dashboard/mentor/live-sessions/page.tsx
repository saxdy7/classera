import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';

export const dynamic = 'force-dynamic';

export default async function MentorLiveSessionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'mentor' || !profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  const admin = createAdminClient();

  // Fetch mentor's sessions with participant details
  const { data: sessions } = await admin
    .from('live_sessions')
    .select(`
      *,
      test:tests(id, title),
      participants:session_participants(
        id,
        user_id,
        user:users(id, full_name, avatar_url)
      )
    `)
    .eq('mentor_id', user.id)
    .order('scheduled_at', { ascending: false });

  // Separate into live, upcoming, and past
  const now = new Date();
  const live = (sessions || []).filter(
    (s) => new Date(s.scheduled_at) <= now && 
            new Date(s.scheduled_at).getTime() + (s.duration_minutes * 60000) > now.getTime()
  );
  const upcoming = (sessions || []).filter((s) => new Date(s.scheduled_at) > now);
  const past = (sessions || []).filter(
    (s) => new Date(s.scheduled_at).getTime() + (s.duration_minutes * 60000) <= now.getTime()
  );

  return (
    <div className="min-h-screen bg-[var(--cl-canvas-soft)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 cl-main p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Live Sessions</h1>
                <p className="text-[var(--cl-body)]">Manage and monitor your teaching sessions</p>
              </div>
              <a
                href="/dashboard/mentor/sessions"
                className="px-6 py-3 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-lg font-medium hover:bg-[var(--cl-primary)] transition-colors"
              >
                ➕ Schedule New Session
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <p className="text-[var(--cl-body)] text-sm font-medium">Live Now</p>
                <p className="text-3xl font-semibold text-[var(--cl-success)]">{live.length}</p>
              </div>
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <p className="text-[var(--cl-body)] text-sm font-medium">Upcoming</p>
                <p className="text-3xl font-semibold text-[var(--cl-info)]">{upcoming.length}</p>
              </div>
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                <p className="text-[var(--cl-body)] text-sm font-medium">Completed</p>
                <p className="text-3xl font-semibold text-[var(--cl-body)]">{past.length}</p>
              </div>
            </div>

            {/* Live Sessions */}
            {live.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-[var(--cl-success)] rounded-full animate-pulse"></span>
                  Live Now ({live.length})
                </h2>
                <div className="grid gap-4">
                  {live.map((session) => (
                    <div
                      key={session.id}
                      className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border-2 border-[var(--cl-success)]"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--cl-ink)]">{session.title}</h3>
                          <p className="text-sm text-[var(--cl-body)]">{session.description}</p>
                        </div>
                        <span className="bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] px-3 py-1 rounded-full text-xs font-semibold">
                          🔴 LIVE
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-[var(--cl-body)]">
                          {session.participants?.length || 0} participant{(session.participants?.length || 0) !== 1 ? 's' : ''}
                        </div>
                        <a
                          href={session.daily_room_url || session.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[var(--cl-success)] text-[var(--cl-on-dark)] rounded-lg text-sm font-medium hover:bg-[var(--cl-success)] transition-colors"
                        >
                          📹 Join Session
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="grid gap-4">
                  {upcoming.map((session) => (
                    <div key={session.id} className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)]">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-[var(--cl-ink)]">{session.title}</h3>
                        <span className="bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] px-3 py-1 rounded-full text-xs font-semibold">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-sm text-[var(--cl-body)] mb-2">{session.description}</p>
                      <div className="flex items-center gap-4 text-sm text-[var(--cl-body)]">
                        <span>📅 {new Date(session.scheduled_at).toLocaleString()}</span>
                        <span>⏱️ {session.duration_minutes} min</span>
                        <span>👥 {session.participants?.length || 0} invited</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Sessions */}
            {past.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4">
                  Completed ({past.length})
                </h2>
                <div className="grid gap-4">
                  {past.map((session) => (
                    <div
                      key={session.id}
                      className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)] opacity-75"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-[var(--cl-ink)]">{session.title}</h3>
                        <span className="bg-[var(--cl-surface-strong)] text-[var(--cl-body)] px-3 py-1 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      </div>
                      <p className="text-sm text-[var(--cl-body)] mb-2">{session.description}</p>
                      <div className="text-sm text-[var(--cl-muted)]">
                        📅 {new Date(session.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Sessions */}
            {sessions?.length === 0 && (
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-16 text-center border border-[var(--cl-hairline)]">
                <div className="w-16 h-16 bg-[var(--cl-surface-strong)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎥</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2">No sessions yet</h3>
                <p className="text-[var(--cl-body)] mb-6">Schedule your first live session to get started</p>
                <a
                  href="/dashboard/mentor/sessions"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium hover:bg-[var(--cl-primary)] transition-colors"
                >
                  ➕ Schedule Session
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

