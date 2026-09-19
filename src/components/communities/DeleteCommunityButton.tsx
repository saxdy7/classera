'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DeleteCommunityButton({ id }: { id: string }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm('Are you absolutely sure? This action cannot be undone.')) {
            try {
                await fetch(`/api/communities?id=${id}`, { method: 'DELETE' });
                router.push('/dashboard/mentor/communities');
                router.refresh();
            } catch (error) {
                console.error('Failed to delete community:', error);
                alert('Failed to delete community. Please try again.');
            }
        }
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--cl-error)] hover:bg-[var(--cl-error)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-semibold transition-colors"
        >
            <Trash2 className="w-5 h-5" />
            Delete Community
        </button>
    );
}