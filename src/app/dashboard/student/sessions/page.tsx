import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StudentSessionsClient } from '@/components/sessions/StudentSessionsClient';

export const dynamic = 'force-dynamic';

export default async function StudentSessionsPage() {
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

    if (!profile) {
        redirect('/signin');
    }

    // Get sessions where the student is invited
    // First get all session IDs where this student is a participant
    const { data: participantData } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', user.id);

    const sessionIds = participantData?.map(p => p.session_id) || [];

    console.log('Student ID:', user.id);
    console.log('Session IDs student is invited to:', sessionIds);

    // Then fetch those sessions with full details
    // live_sessions uses mentor_id (base column); host_id may exist after FIX_MISSING_COLUMNS migration
    // status values in base schema: 'scheduled', 'ongoing', 'completed', 'cancelled'
    const { data: sessions, error: sessionsError } = await supabase
        .from('live_sessions')
        .select(`
            *,
            mentor:users!live_sessions_mentor_id_fkey(id, full_name, avatar_url)
        `)
        .in('id', sessionIds.length > 0 ? sessionIds : ['00000000-0000-0000-0000-000000000000'])
        .in('status', ['scheduled', 'ongoing', 'live', 'completed', 'cancelled'])
        .order('scheduled_at', { ascending: true });

    console.log('Sessions found:', sessions?.length || 0);
    console.log('Sessions error:', sessionsError);

    // Map sessions — rename `mentor` relation to `host` for StudentSessionsClient,
    // and alias daily_room_url / test_id to the names the client expects
    const mappedSessions = (sessions || []).map(session => ({
        ...session,
        host: (session as any).mentor,
        room_url: (session as any).daily_room_url ?? null,
        linked_test_id: (session as any).test_id ?? null,
    }));

    // Get upcoming sessions
    const now = new Date().toISOString();
    const upcomingSessions = mappedSessions?.filter(s =>
        s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
    ) || [];

    // Get live sessions (DB status is 'ongoing' when mentor starts, 'live' is a legacy alias)
    const liveSessions = mappedSessions?.filter(s => s.status === 'live' || s.status === 'ongoing') || [];

    // Get past sessions
    const pastSessions = mappedSessions?.filter(s =>
        (s.status === 'ended' || s.status === 'completed') ||
        (s.status === 'scheduled' && new Date(s.scheduled_at) < new Date())
    ) || [];

    return (
        <div className="min-h-screen bg-slate-50">
            <Header profile={{ id: user.id, ...profile }} />
            <div className="flex">
                <Sidebar role="student" />
                <main className="flex-1 p-4 md:p-8 md:ml-24">
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
