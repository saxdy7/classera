'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  MessageSquare, 
  BookOpen, 
  Calendar,
  Settings,
  Bot
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'mentor';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/student/courses' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/student/schedule' },
    { icon: Users, label: 'Find Mentors', href: '/dashboard/student/mentors' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/student/sessions' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/student/messages' },
    { icon: Bot, label: 'AI Assistant', href: '/dashboard/student/ai-assistant' },
    { icon: Settings, label: 'Settings', href: '/dashboard/student/settings' },
  ];

  const mentorNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/mentor' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/mentor/courses' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/mentor/schedule' },
    { icon: Users, label: 'Students', href: '/dashboard/mentor/students' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/mentor/sessions' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/mentor/messages' },
    { icon: Settings, label: 'Settings', href: '/dashboard/mentor/settings' },
  ];

  const navItems = role === 'student' ? studentNavItems : mentorNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 mb-6">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            role === 'student' 
              ? 'bg-gradient-to-br from-fuchsia-500 to-purple-500' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-500'
          }`}>
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-xl text-black">Classera</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? role === 'student'
                      ? 'bg-fuchsia-50 text-fuchsia-600'
                      : 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-black'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
