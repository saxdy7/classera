'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Video,
  MessageSquare,
  BookOpen,
  Calendar,
  Settings,
  Bot,
  User,
  UsersRound,
  ClipboardCheck,
  FileText
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'mentor';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/student/courses' },
    { icon: ClipboardCheck, label: 'Tests', href: '/dashboard/student/tests' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/student/schedule' },
    { icon: Users, label: 'Find Mentors', href: '/dashboard/student/find-mentors' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/student/live-sessions' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/student/communities' },
    { icon: Bot, label: 'Roadmaps', href: '/roadmaps' },
  ];

  const aiToolsItems = [
    { icon: Bot, label: 'AI Career Coach', href: '/ai-tools/career-coach' },
    { icon: Bot, label: 'AI Roadmap', href: '/roadmaps?generate=true&format=roadmap' },
    { icon: BookOpen, label: 'AI Course', href: '/courses?generate=true&format=course' },
    { icon: FileText, label: 'AI Guide', href: '/guides?generate=true&format=guide' },
  ];

  const mentorNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/mentor' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/mentor/courses' },
    { icon: ClipboardCheck, label: 'Tests', href: '/dashboard/mentor/tests' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/mentor/schedule' },
    { icon: Users, label: 'Students', href: '/dashboard/mentor/students' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/mentor/live-sessions' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/mentor/communities' },
    { icon: Bot, label: 'Roadmaps', href: '/roadmaps' },
  ];

  const navItems = role === 'student' ? studentNavItems : mentorNavItems;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  } as const;

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    show: {
      x: 0,
      opacity: 1
    }
  } as const;

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width: isHovered ? 256 : 80
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      className="hidden md:fixed md:left-3 lg:left-4 md:top-20 md:bottom-4 md:h-auto bg-gradient-to-b from-white via-slate-50/50 to-white backdrop-blur-2xl border border-slate-200/60 rounded-3xl shadow-lg shadow-slate-900/5 z-50 overflow-hidden md:flex"
    >
      <div className="p-4 lg:p-5 h-full flex flex-col w-full relative">
        {/* Decorative gradient background */}
        <div className={`absolute inset-0 opacity-5 pointer-events-none ${role === 'student'
          ? 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500'
          : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500'
          }`} />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-4 lg:mb-6 flex justify-center relative z-10"
        >
          <Link href="/" className="flex items-center gap-3 px-2 py-2 group">
            <div className={`w-10 h-10 rounded-xl ${role === 'student'
              ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              } flex items-center justify-center shadow-md ${role === 'student'
                ? 'shadow-fuchsia-500/20'
                : 'shadow-blue-500/20'
              } group-hover:scale-110 transition-transform duration-300`}>
              <span className="text-white font-black text-lg lg:text-xl">C</span>
            </div>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-black text-lg lg:text-xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent whitespace-nowrap"
              >
                Classera
              </motion.span>
            )}
          </Link>
        </motion.div>

        <motion.nav
          className="space-y-1.5 lg:space-y-2 flex-1 overflow-y-auto scrollbar-hide relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            // For dashboard, use exact match; for others, use startsWith to highlight on child pages
            const isActive = item.href.endsWith('/student') || item.href.endsWith('/mentor')
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <motion.div
                key={item.href}
                variants={itemVariants}
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 lg:gap-4 px-2.5 lg:px-3 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-medium transition-all relative overflow-hidden group ${isActive
                    ? role === 'student'
                      ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 text-white shadow-md lg:shadow-lg shadow-fuchsia-500/30'
                      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white shadow-md lg:shadow-lg shadow-blue-500/30'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm lg:hover:shadow-md'
                    }`}
                >
                  {/* Glassmorphism effect for non-active items */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}

                  <motion.div
                    className="relative z-10 flex-shrink-0"
                    whileHover={{
                      rotate: isActive ? 0 : [0, -10, 10, -10, 0],
                      scale: isActive ? 1 : 1.1
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-md' : ''}`} />
                  </motion.div>

                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm relative z-10 whitespace-nowrap font-semibold tracking-wide"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Active indicator dot */}
                  {isActive && !isHovered && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}

          {/* AI Tools Section */}
          {role === 'student' && (
            <>
              <div className="pt-3">
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-2.5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    AI Tools
                  </motion.div>
                )}
              </div>
              {aiToolsItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <motion.div
                    key={item.href}
                    variants={itemVariants}
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 lg:gap-4 px-2.5 lg:px-3 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-medium transition-all relative overflow-hidden group ${isActive
                        ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 text-white shadow-md'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {isHovered && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-sm whitespace-nowrap font-semibold flex items-center gap-2"
                        >
                          {item.label}
                          {/* {item.isPro && (
                            <span className="text-xs px-1.5 py-0.5 bg-yellow-400 text-yellow-900 rounded font-bold">
                              Pro
                            </span>
                          )} */}
                        </motion.span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.nav>

        {/* Divider with gradient */}
        <div className={`h-px my-3 lg:my-4 ${role === 'student'
          ? 'bg-gradient-to-r from-transparent via-fuchsia-200 to-transparent'
          : 'bg-gradient-to-r from-transparent via-blue-200 to-transparent'
          } relative z-10`} />

        {/* Profile Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          <Link
            href={`/dashboard/${role}/settings`}
            className="flex items-center gap-3 lg:gap-4 px-2.5 lg:px-3 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-medium transition-all relative overflow-hidden group text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm lg:hover:shadow-md"
          >
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <motion.div
              className="relative z-10 flex-shrink-0"
              whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className={`w-9 h-9 rounded-xl ${role === 'student'
                ? 'bg-gradient-to-br from-fuchsia-100 to-purple-100'
                : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                } flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <User className={`w-4 h-4 ${role === 'student' ? 'text-fuchsia-600' : 'text-blue-600'}`} />
              </div>
            </motion.div>

            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm relative z-10 whitespace-nowrap font-semibold tracking-wide"
              >
                Profile
              </motion.span>
            )}
          </Link>
        </motion.div>
      </div>
    </motion.aside>
  );
}
