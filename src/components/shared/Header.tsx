'use client';

import { LogOut, ChevronDown, MessageSquare, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { NotificationBell } from '@/components/shared/NotificationBell';

interface HeaderProps {
  profile: {
    id?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg md:text-xl font-bold text-black">
            {profile.role === 'student' ? 'Student' : 'Mentor'} Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Right Side Actions - Dock Style */}
          <div className="flex items-center gap-1 md:gap-2 px-2 py-1 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200">
            {/* Messages */}
            <Link
              href={`/dashboard/${profile.role}/messages`}
              className="relative p-2 rounded-xl hover:bg-white transition-all duration-300 group hover:scale-125 hover:translate-y-1"
            >
              <MessageSquare className="w-5 h-5 text-slate-600 group-hover:text-purple-600 transition-colors" />
              {/* Tooltip */}
              <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                Messages
              </span>
            </Link>

            {/* AI Assistant (only for students) */}
            {profile.role === 'student' && (
              <Link
                href="/dashboard/student/ai-assistant"
                className="relative p-2 rounded-xl hover:bg-white transition-all duration-300 group hover:scale-125 hover:translate-y-1"
              >
                <Bot className="w-5 h-5 text-slate-600 group-hover:text-purple-600 transition-colors" />
                {/* Tooltip */}
                <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                  AI Assistant
                </span>
              </Link>
            )}

            {/* Notifications - Realtime Bell */}
            {profile.id && <NotificationBell userId={profile.id} />}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-200 mx-1 md:mx-2"></div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User avatar'}
                  className="w-9 h-9 rounded-full object-cover"
                  width={36}
                  height={36}
                />
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white ${profile.role === 'student'
                  ? 'bg-gradient-to-br from-fuchsia-500 to-purple-500'
                  : 'bg-gradient-to-br from-indigo-500 to-blue-500'
                  }`}>
                  {getInitials(profile.full_name)}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-black">
                  {profile.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-black">
                    {profile.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{profile.email}</p>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
