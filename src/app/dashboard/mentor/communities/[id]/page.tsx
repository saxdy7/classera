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
    <div className="min-h-screen bg-white">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-7xl mx-auto">
            <Link href="/dashboard/mentor/communities"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5" />Back to Communities
            </Link>

            {/* Community header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 mb-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                    {community.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {community.name}
                    </h1>
                    <p className="text-slate-600 mb-3">{community.description}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-slate-600">
                        <Users className="w-4 h-4" />{memberCount} members
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${community.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {community.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${messagingEnabled ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        💬 Messaging {messagingEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href={`/dashboard/mentor/communities/${id}/settings`}
                  className="p-3 hover:bg-slate-100 rounded-xl transition-colors">
                  <Settings className="w-6 h-6 text-slate-600" />
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
              {[
                { key: 'feed', label: 'Feed', icon: FileText },
                { key: 'chat', label: 'Chat', icon: MessageCircle },
                { key: 'members', label: 'Members', icon: Users },
              ].map(({ key, label, icon: Icon }) => (
                <Link key={key} href={`/dashboard/mentor/communities/${id}?tab=${key}`}
                  className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${tab === key ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
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
