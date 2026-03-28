import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

    // Use admin client to bypass RLS (students can only see sessions they're invited to,
    // but the live_sessions RLS policy restricts by university which may not match)
    const admin = createAdminClient();

    // Then fetch those sessions with full details
    const { data: sessions, error: sessionsError } = await admin
        .from('live_sessions')
        .select(`
            *
        `)
        .in('id', sessionIds.length > 0 ? sessionIds : ['00000000-0000-0000-0000-000000000000'])
        .in('status', ['scheduled', 'ongoing', 'live', 'completed', 'cancelled'])
        .order('scheduled_at', { ascending: true });

    console.log('Sessions found:', sessions?.length || 0);
    console.log('Sessions error:', sessionsError);

    // Get mentor data for each session
    const sessionsWithMentor = await Promise.all(
        (sessions || []).map(async (session) => {
            const { data: mentor } = await admin
                .from('users')
                .select('id, full_name, avatar_url')
                .eq('id', (session as any).mentor_id)
                .single();

            return {
                ...session,
                host: mentor,
                room_url: (session as any).daily_room_url ?? (session as any).meeting_url ?? null,
                linked_test_id: (session as any).test_id ?? null,
            };
        })
    );

    // Map sessions — rename `mentor` relation to `host` for StudentSessionsClient,
    // and alias daily_room_url / test_id to the names the client expects
    const mappedSessions = sessionsWithMentor;

    // Get upcoming sessions
    const now = new Date().toISOString();
    const upcomingSessions = mappedSessions?.filter(s =>
        s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
    ) || [];

    // Sessions are "still live" within scheduled_at + duration + 60 min grace period
    const isStillLive = (s: any) =>
        Date.now() < new Date(s.scheduled_at).getTime() + ((s.duration_minutes ?? 60) + 60) * 60000;

    // Get live sessions (exclude stale "ongoing" sessions from past days)
    const liveSessions = mappedSessions?.filter(
        s => (s.status === 'live' || s.status === 'ongoing') && isStillLive(s)
    ) || [];

    // Get past sessions (includes overdue "ongoing" sessions stuck in DB)
    const pastSessions = mappedSessions?.filter(s =>
        s.status === 'ended' || s.status === 'completed' || s.status === 'cancelled' ||
        ((s.status === 'live' || s.status === 'ongoing') && !isStillLive(s)) ||
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
