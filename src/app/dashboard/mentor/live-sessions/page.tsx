import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { LiveSessionsClient } from '@/components/sessions/LiveSessionsClient';

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

  if (!profile?.university_id || !profile?.full_name) redirect('/onboarding/mentor');

  // Fetch mentor's sessions with test and participant count
  const { data: sessions } = await supabase
    .from('live_sessions')
    .select(`
      *,
      test:tests(id, title),
      participants:session_participants(*)
    `)
    .eq('host_id', user.id)
    .order('scheduled_at', { ascending: false });

  // Fetch students at this university for the participant selector
  const { data: students } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, email')
    .eq('role', 'student')
    .eq('university_id', profile.university_id)
    .order('full_name');

  // Fetch mentor's own tests for the linked-test selector
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, duration_minutes')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          <LiveSessionsClient
            profile={profile}
            initialSessions={sessions ?? []}
            students={students ?? []}
            tests={tests ?? []}
          />
        </main>
      </div>
    </div>
  );
}

