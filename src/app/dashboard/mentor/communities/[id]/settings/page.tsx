import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DeleteCommunityButton } from '@/components/communities/DeleteCommunityButton';
import { EditCommunityForm } from '@/components/communities/EditCommunityForm';

export default async function CommunitySettingsPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/signin');

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'mentor') redirect('/dashboard');

    // Get community details
    const { data: community } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .eq('mentor_id', user.id)
        .single();

    if (!community) {
        redirect('/dashboard/mentor/communities');
    }

    return (
        <div className="min-h-screen bg-[var(--cl-surface-card)]">
            <Header profile={profile} />
            <div className="flex">
                <Sidebar role="mentor" />
                <main className="flex-1 p-4 md:p-8 cl-main">
                    <div className="max-w-4xl mx-auto">
                        {/* Back Button */}
                        <Link
                            href={`/dashboard/mentor/communities/${id}`}
                            className="inline-flex items-center gap-2 text-[var(--cl-body)] hover:text-[var(--cl-ink)] mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Community
                        </Link>

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                                Community Settings
                            </h1>
                            <p className="text-[var(--cl-body)]">Manage your community details and settings</p>
                        </div>

                        {/* Settings Form */}
                        <EditCommunityForm communityId={id} initialData={community} />

                        {/* Danger Zone */}
                        <div className="mt-8 bg-[rgba(239,68,68,0.12)] rounded-[var(--cl-r-xl)] border border-[var(--cl-error)] p-8">
                            <h2 className="text-2xl font-semibold text-[var(--cl-error)] mb-4">Danger Zone</h2>
                            <p className="text-[var(--cl-error)] mb-6">
                                Once you delete a community, there is no going back. All messages, members, and data will be permanently deleted.
                            </p>
                            <DeleteCommunityButton id={id} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
