import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { LiveSessionsClient } from '@/components/sessions/LiveSessionsClient';

export default async function LiveSessionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  const admin = createAdminClient();

  // Fetch upcoming sessions — use mentor_id (the actual column in live_sessions)
  const { data: sessions } = await admin
    .from('live_sessions')
    .select(`
      *,
      mentor:users!live_sessions_mentor_id_fkey(id, full_name, avatar_url),
      test:tests(id, title),
      participants:session_participants(
        id,
        user_id,
        user:users(id, full_name, avatar_url)
      )
    `)
    .eq('mentor_id', user.id)
    .order('scheduled_at', { ascending: true });

  // Fetch students — if mentor has no university_id show all students
  let studentsQuery = admin
    .from('users')
    .select('id, full_name, avatar_url, email')
    .eq('role', 'student')
    .order('full_name');

  if (profile.university_id) {
    studentsQuery = studentsQuery.or(`university_id.eq.${profile.university_id},university_id.is.null`);
  }

  const { data: students } = await studentsQuery;

  // Fetch tests for linking to proctored sessions
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, duration_minutes, is_live')
    .eq('mentor_id', user.id)
    .eq('is_live', false) // Only tests not yet live
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-14">
          <LiveSessionsClient 
            profile={profile}
            initialSessions={sessions || []}
            students={students || []}
            tests={tests || []}
          />
        </main>
      </div>
    </div>
  );
}
