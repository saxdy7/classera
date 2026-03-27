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
    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 sticky top-6 shadow-sm">
      <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tighter italic uppercase">Navigation</h3>
      <nav className="space-y-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all active:scale-95 ${activeFilter === filter.id
                ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold border border-slate-100'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest">{filter.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-10 pt-8 border-t border-slate-100">
        <h4 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Community Guidelines</h4>
        <div className="space-y-4">
           {[
             { emoji: '💡', text: 'Be Respectful' },
             { emoji: '🛡️', text: 'Stay Secure' },
             { emoji: '🚀', text: 'Grow Together' }
           ].map((g, i) => (
             <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                <span className="text-lg">{g.emoji}</span>
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{g.text}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
