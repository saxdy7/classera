'use client';

import { Users, Bookmark, Megaphone, HelpCircle, TrendingUp, Hash, Layers } from 'lucide-react';
import Link from 'next/link';

interface CommunitySidebarProps {
  communityId: string;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function CommunitySidebar({ communityId, activeFilter, onFilterChange }: CommunitySidebarProps) {
  const filters = [
    { id: 'all', label: 'All Library', icon: Layers },
    { id: 'trending', label: 'Trending Now', icon: TrendingUp },
    { id: 'questions', label: 'Ask a Question', icon: HelpCircle },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'saved', label: 'Saved Library', icon: Bookmark },
  ];

  return (
    <div className="bg-[var(--cl-surface-card)] rounded-[2rem] p-8 border border-[var(--cl-hairline)] sticky top-6">
      <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-8 tracking-tighter italic uppercase">Navigation</h3>
      <nav className="space-y-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[var(--cl-r-xl)] transition-all active:scale-95 ${activeFilter === filter.id
                ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)] font-semibold'
                : 'bg-[var(--cl-canvas-soft)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-muted)] font-semibold border border-[var(--cl-hairline)]'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest">{filter.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-10 pt-8 border-t border-[var(--cl-hairline)]">
        <h4 className="text-xs font-semibold text-[var(--cl-muted-soft)] mb-6 uppercase tracking-[0.2em]">Community Guidelines</h4>
        <div className="space-y-4">
           {[
             { emoji: '💡', text: 'Be Respectful' },
             { emoji: '🛡️', text: 'Stay Secure' },
             { emoji: '🚀', text: 'Grow Together' }
           ].map((g, i) => (
             <div key={i} className="flex items-center gap-3 p-3 bg-[rgba(250,250,247,0.5)] rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)]">
                <span className="text-lg">{g.emoji}</span>
                <span className="text-xs font-semibold text-[var(--cl-body)] uppercase tracking-widest">{g.text}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
