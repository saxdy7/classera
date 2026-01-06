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
    const { tab = 'feed' } = await searchParams; // Default to feed for students

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/sign-in');

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
        <div className="min-h-screen bg-white">
            <Header profile={profile} />
            <div className="flex">
                <Sidebar role="student" />
                <main className="flex-1 p-4 md:p-8 md:ml-24">
                    <div className="max-w-7xl mx-auto">
                        {/* Back Button */}
                        <Link
                            href="/dashboard/student/communities"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Communities
                        </Link>

                        {/* Community Header */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 mb-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                                        {community.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                            {community.name}
                                        </h1>
                                        <p className="text-slate-600 mb-3">{community.description}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Users className="w-4 h-4" />
                                                <span>{memberCount} members</span>
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Mentor: <span className="font-semibold text-slate-700">{community.mentor?.full_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 mb-6 border-b border-slate-200">
                            <Link
                                href={`/dashboard/student/communities/${id}?tab=feed`}
                                className={`px-6 py-3 font-semibold transition-colors ${tab === 'feed'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Feed
                                </div>
                            </Link>
                            <Link
                                href={`/dashboard/student/communities/${id}?tab=chat`}
                                className={`px-6 py-3 font-semibold transition-colors ${tab === 'chat'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5" />
                                    Chat
                                </div>
                            </Link>
                            <Link
                                href={`/dashboard/student/communities/${id}?tab=members`}
                                className={`px-6 py-3 font-semibold transition-colors ${tab === 'members'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Members
                                </div>
                            </Link>
                        </div>

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
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
