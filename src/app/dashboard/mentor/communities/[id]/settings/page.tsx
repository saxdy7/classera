import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

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
                        <form action={`/api/communities?id=${id}`} method="PATCH" className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Basic Information</h2>

                                <div className="space-y-4">
                                    {/* Community Name */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Community Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            defaultValue={community.name}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="e.g., LPU – Frontend Interview Prep"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Description *
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            defaultValue={community.description || ''}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            placeholder="Describe the purpose of this community..."
                                        />
                                    </div>

                                    {/* Specialization */}
                                    <div>
                                        <label htmlFor="specialization" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Specialization (Optional)
                                        </label>
                                        <select
                                            id="specialization"
                                            name="specialization"
                                            defaultValue={community.specialization || ''}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            <option value="">None</option>
                                            <option value="Full Stack Development">Full Stack Development</option>
                                            <option value="Cloud Computing">Cloud Computing (AWS/Azure/GCP)</option>
                                            <option value="AI & Machine Learning">AI & Machine Learning</option>
                                            <option value="DevOps & CI/CD">DevOps & CI/CD</option>
                                            <option value="Data Science">Data Science & Analytics</option>
                                            <option value="Mobile Development">Mobile Development</option>
                                            <option value="Cybersecurity">Cybersecurity</option>
                                            <option value="Blockchain">Blockchain Development</option>
                                            <option value="Game Development">Game Development</option>
                                            <option value="UI/UX Design">UI/UX Design</option>
                                        </select>
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            name="is_active"
                                            defaultChecked={community.is_active}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                                            Community is active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                                >
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </button>
                            </div>
                        </form>

                        {/* Danger Zone */}
                        <div className="mt-8 bg-red-50 rounded-3xl border border-red-200 p-8">
                            <h2 className="text-2xl font-bold text-red-900 mb-4">Danger Zone</h2>
                            <p className="text-red-700 mb-6">
                                Once you delete a community, there is no going back. All messages, members, and data will be permanently deleted.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Are you absolutely sure? This action cannot be undone.')) {
                                        // Handle delete
                                        fetch(`/api/communities?id=${id}`, { method: 'DELETE' })
                                            .then(() => window.location.href = '/dashboard/mentor/communities');
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete Community
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
