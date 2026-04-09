'use client';

import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EditCommunityForm({
    communityId,
    initialData
}: {
    communityId: string;
    initialData: {
        name: string;
        description: string;
        specialization: string;
        is_active: boolean;
    }
}) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const submitData = {
            name: formData.get('name'),
            description: formData.get('description'),
            specialization: formData.get('specialization'),
            is_active: formData.get('is_active') === 'on'
        };

        try {
            const res = await fetch(`/api/communities?id=${communityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update community');
            }

            router.push(`/dashboard/mentor/communities/${communityId}`);
            router.refresh();
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Basic Information</h2>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                            Community Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={initialData.name}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., LPU – Frontend Interview Prep"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            defaultValue={initialData.description || ''}
                            required
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder="Describe the purpose of this community..."
                        />
                    </div>

                    <div>
                        <label htmlFor="specialization" className="block text-sm font-semibold text-slate-700 mb-2">
                            Specialization (Optional)
                        </label>
                        <select
                            id="specialization"
                            name="specialization"
                            defaultValue={initialData.specialization || ''}
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

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            defaultChecked={initialData.is_active}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                            Community is active
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}