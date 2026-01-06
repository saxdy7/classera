import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StudentSessionsClient } from '@/components/sessions/StudentSessionsClient';

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
    const { data: sessions, error: sessionsError } = await supabase
        .from('live_sessions')
        .select(`
            *,
            host:users!live_sessions_host_id_fkey(id, full_name, avatar_url),
            linked_test_id
        `)
        .in('id', sessionIds.length > 0 ? sessionIds : ['00000000-0000-0000-0000-000000000000']) // Use dummy ID if no sessions
        .in('status', ['scheduled', 'live', 'ended', 'completed'])
        .order('scheduled_at', { ascending: true });

    console.log('Sessions found:', sessions?.length || 0);
    console.log('Sessions error:', sessionsError);

    // Map sessions to match expected structure
    const mappedSessions = (sessions || []).map(session => ({
        ...session,
        room_url: session.daily_room_url,
        linked_test_id: session.test_id
    }));

    // Get upcoming sessions
    const now = new Date().toISOString();
    const upcomingSessions = mappedSessions?.filter(s =>
        s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
    ) || [];

    // Get live sessions
    const liveSessions = mappedSessions?.filter(s => s.status === 'live') || [];

    // Get past sessions
    const pastSessions = mappedSessions?.filter(s =>
        (s.status === 'ended' || s.status === 'completed') ||
        (s.status === 'scheduled' && new Date(s.scheduled_at) < new Date())
    ) || [];

    return (
        <div className="min-h-screen bg-slate-50">
            <Header profile={profile} />
            <div className="flex">
                <Sidebar role={profile.role} />
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
