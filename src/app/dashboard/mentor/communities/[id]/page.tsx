import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { CommunityMembersClient } from '@/components/communities/CommunityMembersClient';
import { CommunityFeedClient } from '@/components/communities/CommunityFeedClient';
import { CommunityChat } from '@/components/communities/CommunityChat';
import { Users, ArrowLeft, Settings, MessageCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CommunityDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'feed' } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') redirect('/dashboard');

  const { data: community } = await supabase
    .from('communities')
    .select('*, community_members(count)')
    .eq('id', id)
    .eq('mentor_id', user.id)
    .single();

  if (!community) redirect('/dashboard/mentor/communities');

  const memberCount = community.community_members?.[0]?.count || 0;
  const messagingEnabled = community.messaging_enabled ?? true;

  return (
    <div className="min-h-screen bg-[var(--cl-surface-card)]">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 cl-main">
          <div className="max-w-7xl mx-auto">
            <Link href="/dashboard/mentor/communities"
              className="inline-flex items-center gap-2 text-[var(--cl-body)] hover:text-[var(--cl-ink)] mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5" />Back to Communities
            </Link>

            {/* Community header */}
            <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-8 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[var(--cl-r-xl)] flex items-center justify-center text-[var(--cl-on-dark)] text-3xl font-semibold bg-[var(--cl-primary)]">
                    {community.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                      {community.name}
                    </h1>
                    <p className="text-[var(--cl-body)] mb-3">{community.description}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-[var(--cl-body)]">
                        <Users className="w-4 h-4" />{memberCount} members
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${community.is_active ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' : 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)]'}`}>
                        {community.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${messagingEnabled ? 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]' : 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]'}`}>
                        💬 Messaging {messagingEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href={`/dashboard/mentor/communities/${id}/settings`}
                  className="p-3 hover:bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-lg)] transition-colors">
                  <Settings className="w-6 h-6 text-[var(--cl-body)]" />
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--cl-hairline)]">
              {[
                { key: 'feed', label: 'Feed', icon: FileText },
                { key: 'chat', label: 'Chat', icon: MessageCircle },
                { key: 'members', label: 'Members', icon: Users },
              ].map(({ key, label, icon: Icon }) => (
                <Link key={key} href={`/dashboard/mentor/communities/${id}?tab=${key}`}
                  className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${tab === key ? 'text-[var(--cl-primary)] border-b-2 border-[var(--cl-primary)]' : 'text-[var(--cl-body)] hover:text-[var(--cl-ink)]'}`}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              ))}
            </div>

            {tab === 'feed' && (
              <CommunityFeedClient communityId={id} userId={user.id} userRole="mentor" isMentor={true} />
            )}
            {tab === 'members' && (
              <CommunityMembersClient communityId={id} currentUserRole="mentor" />
            )}
            {tab === 'chat' && (
              <CommunityChat
                communityId={id}
                userId={user.id}
                userRole="mentor"
                isMuted={false}
                messagingEnabled={messagingEnabled}
                onToggleMessaging={async (enabled) => {
                  'use server';
                  const sb = await createClient();
                  await sb.from('communities').update({ messaging_enabled: enabled }).eq('id', id);
                  revalidatePath(`/dashboard/mentor/communities/${id}`);
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
