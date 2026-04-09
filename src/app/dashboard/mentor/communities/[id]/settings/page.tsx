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
    if (!user) redirect('/auth/sign-in');

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
        <div className="min-h-screen bg-white">
            <Header profile={profile} />
            <div className="flex">
                <Sidebar role="mentor" />
                <main className="flex-1 p-4 md:p-8 md:ml-24">
                    <div className="max-w-4xl mx-auto">
                        {/* Back Button */}
                        <Link
                            href={`/dashboard/mentor/communities/${id}`}
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Community
                        </Link>

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Community Settings
                            </h1>
                            <p className="text-slate-600">Manage your community details and settings</p>
                        </div>

                        {/* Settings Form */}
                        <EditCommunityForm communityId={id} initialData={community} />

                        {/* Danger Zone */}
                        <div className="mt-8 bg-red-50 rounded-3xl border border-red-200 p-8">
                            <h2 className="text-2xl font-bold text-red-900 mb-4">Danger Zone</h2>
                            <p className="text-red-700 mb-6">
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
