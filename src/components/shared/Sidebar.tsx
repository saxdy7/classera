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
  UsersRound
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
    { icon: Calendar, label: 'Schedule', href: '/dashboard/student/schedule' },
    { icon: Users, label: 'Find Mentors', href: '/dashboard/student/find-mentors' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/student/live-sessions' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/student/communities' },
  ];

  const mentorNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/mentor' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/mentor/courses' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/mentor/schedule' },
    { icon: Users, label: 'Students', href: '/dashboard/mentor/students' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/mentor/live-sessions' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/mentor/communities' },
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
      className="hidden md:fixed md:left-4 md:top-20 md:h-[calc(100vh-6rem)] bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden md:flex"
    >
      <div className="p-3 md:p-4 h-full flex flex-col w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-4 md:mb-6 flex justify-center"
        >
          <Link href="/" className="flex items-center gap-3 px-2 py-2 group">
            {isHovered && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg md:text-xl text-black whitespace-nowrap"
              >
                Classera
              </motion.span>
            )}
          </Link>
        </motion.div>

        <motion.nav 
          className="space-y-1 md:space-y-2 flex-1 overflow-y-auto scrollbar-hide"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

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
                  className={`flex items-center gap-3 px-2 md:px-3 py-2 md:py-3 rounded-xl font-medium transition-all relative overflow-hidden group ${
                    isActive
                      ? role === 'student'
                        ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg shadow-fuchsia-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <motion.div
                    className="relative z-10 flex-shrink-0"
                    whileHover={{ rotate: isActive ? 0 : [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.div>
                  
                  {isHovered && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm relative z-10 whitespace-nowrap font-semibold"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  
                  {!isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                        role === 'student'
                          ? 'bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10'
                          : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
                      }`}
                      style={{ zIndex: 0 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {/* Profile Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 pt-4 border-t border-slate-200"
        >
          <Link
            href={`/dashboard/${role}/settings`}
            className="flex items-center gap-3 px-2 md:px-3 py-2 md:py-3 rounded-xl font-medium transition-all relative overflow-hidden group text-slate-600 hover:bg-slate-100 hover:text-black"
          >
            <motion.div
              className="relative z-10 flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </motion.div>
            
            {isHovered && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm relative z-10 whitespace-nowrap font-semibold"
              >
                Profile
              </motion.span>
            )}
            
            <motion.div
              className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                role === 'student'
                  ? 'bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10'
                  : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
              }`}
              style={{ zIndex: 0 }}
            />
          </Link>
        </motion.div>
      </div>
    </motion.aside>
  );
}
