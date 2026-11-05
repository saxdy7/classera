import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { CommunityMembersClient } from '@/components/communities/CommunityMembersClient';
import { CommunityChat } from '@/components/communities/CommunityChat';
import { CommunityFeedClient } from '@/components/communities/CommunityFeedClient';
import { Users, ArrowLeft, MessageCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function StudentCommunityDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab: requestedTab } = await searchParams;
    const tab = requestedTab === 'members' || requestedTab === 'chat' ? requestedTab : 'feed';

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/signin');

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'student') redirect('/dashboard');

    // Verify membership
    const { data: membership } = await supabase
        .from('community_members')
        .select('status')
        .eq('community_id', id)
        .eq('student_id', user.id)
        .single();

    if (membership?.status !== 'approved') {
        redirect('/dashboard/student/communities'); // Cannot view if not approved
    }

    // Get community details
    const { data: community } = await supabase
        .from('communities')
        .select(`
      *,
      community_members(count),
      mentor:users!communities_mentor_id_fkey(full_name)
    `)
        .eq('id', id)
        .single();

    if (!community) {
        redirect('/dashboard/student/communities');
    }

    const memberCount = community.community_members?.[0]?.count || 0;

    // Check if student is muted
    const { data: muteStatus } = await supabase
        .from('community_muted_users')
        .select('muted_until')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

    const isMuted = muteStatus && (!muteStatus.muted_until || new Date(muteStatus.muted_until) > new Date());

    return (
        <div className="min-h-screen bg-card">
            <Header profile={profile} title={community.name} />
            <div className="flex">
                <Sidebar role="student" />
                <main className="flex-1 p-4 md:p-8 cl-main">
                    <div className="max-w-7xl mx-auto">
                        {/* Back Button */}
                        <Link
                            href="/dashboard/student/communities"
                            className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Communities
                        </Link>

                        <header className="mb-5 rounded-3xl border border-black/10 bg-white/75 p-5 sm:p-8">
                            <div className="flex items-start gap-4">
                                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lime-200 text-xl font-bold text-lime-950">{community.name.charAt(0)}</span>
                                <div className="min-w-0">
                                    <h1 className="break-words font-bold">{community.name}</h1>
                                    {community.description && <p className="mt-2 max-w-prose break-words text-sm text-muted-foreground">{community.description}</p>}
                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                        <span className="inline-flex items-center gap-2"><Users className="size-4" />{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                                        {community.mentor?.full_name && <span>Mentor · {community.mentor.full_name}</span>}
                                    </div>
                                </div>
                            </div>
                        </header>

                        <nav aria-label="Community sections" className="mb-6 inline-flex max-w-full gap-1 rounded-full border border-black/10 bg-white/80 p-1">
                            {([{ key: 'feed', label: 'Feed', Icon: FileText }, { key: 'chat', label: 'Chat', Icon: MessageCircle }, { key: 'members', label: 'Members', Icon: Users }]).map(({ key, label, Icon }) => (
                                <Link key={key} scroll={false} href={`/dashboard/student/communities/${id}?tab=${key}`} aria-current={tab === key ? 'page' : undefined}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors sm:px-5 ${tab === key ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                                    <Icon aria-hidden className="size-4" />{label}
                                </Link>
                            ))}
                        </nav>

                        {/* Tab Content */}
                        {tab === 'feed' && (
                            <CommunityFeedClient
                                communityId={id}
                                userId={user.id}
                                userRole="student"
                                isMentor={false}
                            />
                        )}

                        {tab === 'members' && (
                            <CommunityMembersClient communityId={id} currentUserRole="student" />
                        )}

                        {tab === 'chat' && (
                            <CommunityChat
                                communityId={id}
                                userRole="student"
                                userId={user.id}
                                isMuted={!!isMuted}
                                messagingEnabled={community.messaging_enabled ?? true}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
