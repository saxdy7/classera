import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StudentSessionsClient } from '@/components/sessions/StudentSessionsClient';

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

  // Get session IDs this student is invited to
  const { data: participantData } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('user_id', user.id);

  const sessionIds = participantData?.map(p => p.session_id) ?? [];

  const { data: sessions } = await supabase
    .from('live_sessions')
    .select(`
      *,
      host:users!live_sessions_mentor_id_fkey(id, full_name, avatar_url)
    `)
    .in('id', sessionIds.length > 0 ? sessionIds : ['00000000-0000-0000-0000-000000000000'])
    .order('scheduled_at', { ascending: true });

  // Map DB values to component-expected values:
  // - DB has no session_type column → default to 'mentor_meeting'
  // - DB meeting_url → component room_url
  // - DB status 'ongoing' → component 'live', DB 'completed' → component 'ended'
  const mappedSessions = (sessions ?? []).map(s => ({
    ...s,
    session_type: 'mentor_meeting' as const,
    room_url: s.meeting_url || undefined,
    status: s.status === 'ongoing' ? 'live' : s.status === 'completed' ? 'ended' : s.status,
  }));

  const upcomingSessions = mappedSessions.filter(
    s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
  );
  const liveSessions = mappedSessions.filter(s => s.status === 'live');
  const pastSessions = mappedSessions.filter(
    s => s.status === 'ended' || s.status === 'cancelled' ||
         (s.status === 'scheduled' && new Date(s.scheduled_at) <= new Date())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          <StudentSessionsClient
            profile={profile}
            upcomingSessions={upcomingSessions}
            liveSessions={liveSessions}
            pastSessions={pastSessions}
          />
        </main>
      </div>
    </div>
  );
}

