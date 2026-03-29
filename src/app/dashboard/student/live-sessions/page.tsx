import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Clock, MapPin, Users } from 'lucide-react';

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

  const admin = createAdminClient();

  // Get session IDs this student is invited to
  const { data: participantData } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('user_id', user.id);

  const sessionIds = participantData?.map(p => p.session_id) ?? [];

  // Fetch all sessions with mentor details
  let sessions: any[] = [];
  if (sessionIds.length > 0) {
    const { data } = await admin
      .from('live_sessions')
      .select('*')
      .in('id', sessionIds)
      .order('scheduled_at', { ascending: false });
    sessions = data ?? [];
  }

  // Get mentor details for each session
  const sessionsWithMentor = await Promise.all(
    sessions.map(async (session) => {
      const { data: mentor } = await admin
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', (session as any).mentor_id)
        .single();

      return {
        ...session,
        mentor,
      };
    })
  );

  // Separate sessions by status
  const now = new Date();
  const live = sessionsWithMentor.filter((s) => {
    const start = new Date(s.scheduled_at);
    const end = new Date(start.getTime() + (s.duration_minutes * 60000));
    return start <= now && now <= end && s.status !== 'cancelled';
  });

  const upcoming = sessionsWithMentor.filter(
    (s) => new Date(s.scheduled_at) > now && s.status !== 'cancelled'
  );

  const past = sessionsWithMentor.filter((s) => {
    const end = new Date(new Date(s.scheduled_at).getTime() + (s.duration_minutes * 60000));
    return now > end || s.status === 'completed' || s.status === 'cancelled';
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Mentor Sessions</h1>
              <p className="text-slate-600 mt-2">Your scheduled learning sessions</p>
            </div>

            {/* Live Sessions - Featured */}
            {live.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-lg font-bold text-slate-900">Now Live</h2>
                </div>
                <div className="grid gap-4">
                  {live.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-500 shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                              🔴 LIVE NOW
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900">{session.title}</h3>
                          {session.description && (
                            <p className="text-sm text-slate-600 mt-2">{session.description}</p>
                          )}
                        </div>
                        <a
                          href={session.daily_room_url || session.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors whitespace-nowrap ml-4"
                        >
                          📹 Join Now
                        </a>
                      </div>
                      <div className="flex items-center gap-6 pt-4 border-t border-red-200">
                        <div className="flex items-center gap-3">
                          {session.mentor?.avatar_url && (
                            <img
                              src={session.mentor.avatar_url}
                              alt={session.mentor?.full_name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-xs text-slate-600">Mentor</p>
                            <p className="font-semibold text-slate-900">{session.mentor?.full_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">{session.duration_minutes} minutes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Coming Up</h2>
                <div className="space-y-3">
                  {upcoming.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 mb-2">{session.title}</h3>
                          {session.description && (
                            <p className="text-sm text-slate-600 mb-3">{session.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(session.scheduled_at).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              ⏱️ {session.duration_minutes} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.mentor?.full_name}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                            Scheduled
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Sessions */}
            {past.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Past Sessions</h2>
                <div className="space-y-2">
                  {past.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white rounded-lg p-4 border border-slate-200 opacity-60 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{session.title}</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {new Date(session.scheduled_at).toLocaleString()} • {session.mentor?.full_name}
                          </p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Sessions */}
            {sessions.length === 0 && (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No sessions scheduled</h3>
                <p className="text-slate-600 mb-8 text-lg">
                  Your mentor will schedule sessions with you here. Check back soon!
                </p>
                <a
                  href="/dashboard/student"
                  className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Return to Dashboard
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

