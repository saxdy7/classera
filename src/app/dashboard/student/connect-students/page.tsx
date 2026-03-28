'use client';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ConnectStudents() {
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Fields');
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [activeChatIds, setActiveChatIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/signin';
        return;
      }

      setUserId(user.id);

      // Get current user's profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*, universities(*)')
        .eq('id', user.id)
        .single();

      if (!profileData?.university_id || !profileData?.full_name) {
        window.location.href = '/onboarding/student';
        return;
      }

      setProfile(profileData);

      // Get other students from the same university (exclude current user)
      const { data: studentsData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, specialization_board, current_semester, bio, created_at')
        .eq('role', 'student')
        .eq('university_id', profileData.university_id)
        .neq('id', user.id)
        .order('full_name');

      setStudents(studentsData || []);
      setFilteredStudents(studentsData || []);

      // Get current user's connections with other students
      const { data: connectionsData } = await supabase
        .from('student_connections')
        .select('*')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      
      setConnections(connectionsData || []);

      // Get current user's active conversations/chats
      const { data: myConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
      
      if (myConversations && myConversations.length > 0) {
        const convIds = myConversations.map(c => c.conversation_id);
        const { data: others } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .in('conversation_id', convIds)
          .neq('user_id', user.id);
        
        if (others) {
          setActiveChatIds(new Set(others.map(o => o.user_id)));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!students.length) return;

    let filtered = students;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.specialization_board?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by semester
    if (selectedSemester !== 'All Semesters') {
      filtered = filtered.filter(
        (student) => `Sem ${student.current_semester}` === selectedSemester
      );
    }

    // Filter by specialization
    if (selectedSpecialization !== 'All Fields') {
      filtered = filtered.filter(
        (student) => student.specialization_board === selectedSpecialization
      );
    }

    setFilteredStudents(filtered);
  }, [searchQuery, selectedSemester, selectedSpecialization, students]);

  const handleConnect = async (studentId: string) => {
    if (!userId) return;

    const supabase = createClient();

    // Check if connection already exists
    const existingConnection = connections.find(
      c => (c.requester_id === userId && c.recipient_id === studentId) ||
           (c.requester_id === studentId && c.recipient_id === userId)
    );

    if (existingConnection) return;

    try {
      await supabase.from('student_connections').insert({
        requester_id: userId,
        recipient_id: studentId,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      // Update local state
      setConnections([
        ...connections,
        {
          requester_id: userId,
          recipient_id: studentId,
          status: 'pending',
        }
      ]);
    } catch (error) {
      console.error('Error creating connection:', error);
    }
  };

  const isConnected = (studentId: string) => {
    return connections.some(
      c => (c.requester_id === studentId && c.recipient_id === userId && c.status === 'accepted') ||
           (c.requester_id === userId && c.recipient_id === studentId && c.status === 'accepted')
    );
  };

  const isConnectionPending = (studentId: string) => {
    return connections.some(
      c => (c.requester_id === userId && c.recipient_id === studentId && c.status === 'pending')
    );
  };

  const hasActiveChat = (studentId: string) => activeChatIds.has(studentId);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const uniqueSemesters = Array.from(new Set(students.map(s => s.current_semester))).filter(Boolean);
  const uniqueSpecializations = Array.from(new Set(students.map(s => s.specialization_board))).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-14">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-3xl p-6 md:p-8 mb-6 border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6 6 6 0 00-6 6z" />
                      </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      Connect with Students
                    </h1>
                  </div>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                    Meet and collaborate with fellow students from <span className="font-semibold text-indigo-600">{profile.universities?.name}</span>. Share ideas, form study groups, and learn together!
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                      <span className="text-2xl font-bold text-indigo-600">{filteredStudents?.length || 0}</span>
                      <span className="text-xs text-slate-600 ml-2">{searchQuery || selectedSemester !== 'All Semesters' ? 'Filtered' : 'Available'} Students</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden lg:block flex-shrink-0">
                  <img
                    src="https://illustrations.popsy.co/amber/team-collaboration.svg"
                    alt="Connect Students"
                    className="w-48 h-48 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search students by name, field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              
              <div className="relative">
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full md:w-auto pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-medium text-slate-700 appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  <option>All Semesters</option>
                  {uniqueSemesters.map((sem) => (
                    <option key={sem}>Sem {sem}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div className="relative">
                <select 
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full md:w-auto pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-medium text-slate-700 appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  <option>All Fields</option>
                  {uniqueSpecializations.map((spec) => (
                    <option key={spec}>{spec}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Students Grid */}
            {filteredStudents && filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student, index) => {
                  const cardColors = [
                    { top: 'bg-blue-50', badge: 'bg-blue-100 border-blue-200 text-blue-700', accent: '#3B82F6' },
                    { top: 'bg-cyan-50', badge: 'bg-cyan-100 border-cyan-200 text-cyan-700', accent: '#06B6D4' },
                    { top: 'bg-indigo-50', badge: 'bg-indigo-100 border-indigo-200 text-indigo-700', accent: '#6366F1' },
                    { top: 'bg-teal-50', badge: 'bg-teal-100 border-teal-200 text-teal-700', accent: '#14B8A6' },
                    { top: 'bg-sky-50', badge: 'bg-sky-100 border-sky-200 text-sky-700', accent: '#0EA5E9' },
                    { top: 'bg-slate-50', badge: 'bg-slate-100 border-slate-200 text-slate-700', accent: '#64748B' },
                  ];
                  const colorScheme = cardColors[index % cardColors.length];
                  
                  return (
                    <div
                      key={student.id}
                      className="w-full rounded-3xl shadow-sm border border-black/5 transition-transform hover:scale-[1.02] hover:shadow-md overflow-hidden"
                    >
                      {/* Top Section */}
                      <div className={`${colorScheme.top} p-5 relative`}>
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                          <svg className="absolute -top-4 -right-4 w-32 h-32" viewBox="0 0 100 100">
                            <path d="M 0,50 Q 25,25 50,50 T 100,50" stroke={colorScheme.accent} strokeWidth="2" fill="none" />
                            <path d="M 0,60 Q 25,35 50,60 T 100,60" stroke={colorScheme.accent} strokeWidth="1.5" fill="none" />
                          </svg>
                        </div>
                        
                        {/* Header with Avatar and Badge */}
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          {student.avatar_url ? (
                            <Image
                              src={student.avatar_url}
                              alt={student.full_name}
                              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-lg"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                              {student.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${colorScheme.badge}`}>
                            👨‍🎓 Student
                          </span>
                        </div>

                        {/* Name */}
                        <h3 className="text-xl font-bold leading-snug mb-3 text-gray-900 line-clamp-1 min-h-[1.75rem] relative z-10">
                          {student.full_name}
                        </h3>

                        {/* Specialization */}
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {student.specialization_board || 'Field not specified'}
                          </span>
                        </div>

                        {/* Semester Info */}
                        <div className="flex flex-wrap gap-2 min-h-[2.5rem] relative z-10">
                          {student.current_semester && (
                            <span className="px-3 py-1 rounded-full text-xs bg-white border border-black/10 text-gray-700 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Semester {student.current_semester}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bio Section */}
                      {student.bio && (
                        <div className="px-5 pt-4 bg-white">
                          <p className="text-xs text-gray-600 line-clamp-2">{student.bio}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="p-5 pt-4 bg-white border-t border-slate-100 flex gap-3">
                        {/* View Profile Link */}
                        <Link
                          href={`/dashboard/student/profile/${student.id}`}
                          className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors text-center border border-slate-300"
                        >
                          👁️ View Profile
                        </Link>

                        {/* Connection Status */}
                        {hasActiveChat(student.id) ? (
                          <Link
                            href={`/dashboard/student/messages?userId=${student.id}`}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 transition-colors text-center"
                          >
                            💬 Message
                          </Link>
                        ) : isConnected(student.id) ? (
                          <Link
                            href={`/dashboard/student/messages?userId=${student.id}`}
                            className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition-colors text-center"
                          >
                            ✓ Connected
                          </Link>
                        ) : isConnectionPending(student.id) ? (
                          <button
                            disabled
                            className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-xl text-sm cursor-not-allowed"
                          >
                            ⏳ Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnect(student.id)}
                            className="flex-1 px-4 py-2 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors"
                          >
                            + Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-3xl">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-xl font-bold text-slate-900 mb-2">No students found</p>
                <p className="text-slate-600">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
