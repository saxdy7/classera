'use client';

import { Users, Bookmark, Megaphone, HelpCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface CommunitySidebarProps {
  communityId: string;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function CommunitySidebar({ communityId, activeFilter, onFilterChange }: CommunitySidebarProps) {
  const filters = [
    { id: 'all', label: 'All Posts', icon: Users },
    { id: 'saved', label: 'Saved Posts', icon: Bookmark },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 sticky top-6">
      <h3 className="font-bold text-slate-900 mb-4">Filters</h3>
      <nav className="space-y-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFilter === filter.id
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Community Info</h4>
        <div className="space-y-2 text-sm text-slate-600">
          <p>📝 Be respectful and helpful</p>
          <p>❓ Ask clear questions</p>
          <p>✅ Mark best answers</p>
          <p>🚫 No spam or harassment</p>
        </div>
      </div>
    </div>
  );
}
