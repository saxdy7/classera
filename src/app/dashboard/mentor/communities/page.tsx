import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { MentorCommunitiesLayout } from '@/components/communities/MentorCommunitiesLayout';

export default async function MentorCommunitiesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') redirect('/dashboard');

  // Get all communities
  const { data: communities } = await supabase
    .from('communities')
    .select(`
      *,
      community_members(count)
    `)
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar role="mentor" />
        <div className="flex-1 md:ml-24">
          <MentorCommunitiesLayout
            communities={communities || []}
            profile={profile}
          />
        </div>
      </div>
    </div>
  );
}
