import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Calendar, Clock, Plus, Users, Video } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SESSION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  mentor_meeting:  { label: 'Mentor Meeting',  color: 'bg-indigo-100 text-indigo-700' },
  proctored_test:  { label: 'Proctored Test',  color: 'bg-red-100 text-red-700' },
  group_study:     { label: 'Group Study',     color: 'bg-emerald-100 text-emerald-700' },
  office_hours:    { label: 'Office Hours',    color: 'bg-amber-100 text-amber-700' },
  webinar:         { label: 'Webinar',         color: 'bg-purple-100 text-purple-700' },
};

const STATUS_LABELS: Record<string, { label: string; dot: string }> = {
  scheduled:  { label: 'Scheduled',  dot: 'bg-blue-400' },
  live:       { label: 'Live',       dot: 'bg-green-400' },
  completed:  { label: 'Completed',  dot: 'bg-slate-400' },
  cancelled:  { label: 'Cancelled',  dot: 'bg-red-400' },
};

export default async function MentorSchedulePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) redirect('/onboarding/mentor');

  // Fetch all upcoming + today sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: upcomingSessions } = await supabase
    .from('live_sessions')
    .select(`
      id, title, description, session_type, scheduled_at, duration_minutes, status,
      participants:session_participants(count)
    `)
    .eq('host_id', user.id)
    .gte('scheduled_at', today.toISOString())
    .in('status', ['scheduled', 'live'])
    .order('scheduled_at', { ascending: true })
    .limit(30);

  // Fetch recent past sessions
  const { data: pastSessions } = await supabase
    .from('live_sessions')
    .select(`
      id, title, session_type, scheduled_at, duration_minutes, status,
      participants:session_participants(count)
    `)
    .eq('host_id', user.id)
    .lt('scheduled_at', today.toISOString())
    .in('status', ['completed', 'cancelled', 'scheduled'])
    .order('scheduled_at', { ascending: false })
    .limit(10);

  // Group upcoming sessions by date label
  function formatDateGroup(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  const grouped: Record<string, typeof upcomingSessions> = {};
  for (const session of upcomingSessions ?? []) {
    const key = formatDateGroup(session.scheduled_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(session);
  }

  const participantCount = (session: any) =>
    session.participants?.[0]?.count ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-1">Schedule</h2>
                <p className="text-slate-500 text-sm">Your upcoming teaching sessions</p>
              </div>
              <Link
                href="/dashboard/mentor/live-sessions"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Schedule Session
              </Link>
            </div>

            {/* Upcoming sessions grouped by date */}
            {Object.keys(grouped).length > 0 ? (
              <div className="space-y-8 mb-10">
                {Object.entries(grouped).map(([dateLabel, sessions]) => (
                  <div key={dateLabel}>
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{dateLabel}</h3>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="space-y-3">
                      {sessions?.map(session => {
                        const typeInfo = SESSION_TYPE_LABELS[session.session_type] ?? { label: session.session_type, color: 'bg-slate-100 text-slate-700' };
                        const statusInfo = STATUS_LABELS[session.status] ?? { label: session.status, dot: 'bg-slate-400' };
                        const time = new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const endTime = new Date(new Date(session.scheduled_at).getTime() + session.duration_minutes * 60000)
                          .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={session.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
                            {/* Time column */}
                            <div className="w-20 flex-shrink-0 text-center">
                              <p className="text-sm font-bold text-slate-900">{time}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{endTime}</p>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-12 bg-slate-100 flex-shrink-0" />

                            {/* Session info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900 truncate">{session.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {session.duration_minutes} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {participantCount(session)} participants
                                </span>
                              </div>
                            </div>

                            {/* Status badge */}
                            <div className="flex-shrink-0 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                              <span className="text-xs font-medium text-slate-600">{statusInfo.label}</span>
                            </div>

                            {/* Action link */}
                            <Link
                              href="/dashboard/mentor/live-sessions"
                              className="flex-shrink-0 p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                              title="Manage session"
                            >
                              <Video className="w-4 h-4" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm mb-10">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Upcoming Sessions</h3>
                <p className="text-slate-500 text-sm mb-6">Your scheduled sessions will appear here</p>
                <Link
                  href="/dashboard/mentor/live-sessions"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Your First Session
                </Link>
              </div>
            )}

            {/* Recent Past Sessions */}
            {(pastSessions?.length ?? 0) > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Recent Past Sessions</h3>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="space-y-2">
                  {pastSessions?.map(session => {
                    const typeInfo = SESSION_TYPE_LABELS[session.session_type] ?? { label: session.session_type, color: 'bg-slate-100 text-slate-600' };
                    const date = new Date(session.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const time = new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={session.id} className="bg-white/60 rounded-xl px-5 py-3.5 border border-slate-100 flex items-center gap-4 opacity-75">
                        <div className="w-28 flex-shrink-0">
                          <p className="text-xs font-medium text-slate-600">{date}</p>
                          <p className="text-xs text-slate-400">{time}</p>
                        </div>
                        <p className="flex-1 text-sm font-medium text-slate-700 truncate">{session.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-slate-400">{session.duration_minutes} min</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

