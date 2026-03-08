'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function parseExpertise(expertise: any): string {
  if (!expertise) return '';
  if (Array.isArray(expertise)) return expertise.join(', ');
  try {
    const parsed = JSON.parse(expertise);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {}
  return String(expertise);
}

export default function FindMentors() {
  const [profile, setProfile] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All Expertise');
  const [loading, setLoading] = useState(true);

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

      // Get mentors from the same university
      const { data: mentorsData } = await supabase
        .from('users')
        .select('*, universities(*)')
        .eq('role', 'mentor')
        .eq('university_id', profileData.university_id)
        .order('full_name');

      setMentors(mentorsData || []);
      setFilteredMentors(mentorsData || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!mentors.length) return;

    let filtered = mentors;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (mentor) =>
          mentor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          parseExpertise(mentor.expertise).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by expertise
    if (selectedExpertise !== 'All Expertise') {
      filtered = filtered.filter(
        (mentor) => parseExpertise(mentor.expertise) === selectedExpertise
      );
    }

    setFilteredMentors(filtered);
  }, [searchQuery, selectedExpertise, mentors]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading mentors...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-14">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl p-6 md:p-8 mb-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                      Find Your Mentor
                    </h1>
                  </div>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                    Connect with experienced mentors from <span className="font-semibold text-purple-600">{profile.universities?.name}</span> who can guide you in your learning journey
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100">
                      <span className="text-2xl font-bold text-purple-600">{filteredMentors?.length || 0}</span>
                      <span className="text-xs text-slate-600 ml-2">{searchQuery || selectedExpertise !== 'All Expertise' ? 'Filtered' : 'Available'} Mentors</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden lg:block flex-shrink-0">
                  <img
                    src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                    alt="Find Mentors"
                    className="w-48 h-48 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search mentors by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <select 
                  value={selectedExpertise}
                  onChange={(e) => setSelectedExpertise(e.target.value)}
                  className="pl-10 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 font-medium text-slate-700 min-w-[180px] appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  <option>All Expertise</option>
                  <option>Web Development</option>
                  <option>Data Science</option>
                  <option>Mobile Development</option>
                  <option>UI/UX Design</option>
                  <option>Cloud Computing</option>
                  <option>Machine Learning</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Mentors Grid */}
            {filteredMentors && filteredMentors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor, index) => {
                  const cardColors = [
                    { top: 'bg-orange-50', badge: 'bg-orange-100 border-orange-200 text-orange-700', accent: '#FB923C' },
                    { top: 'bg-emerald-50', badge: 'bg-emerald-100 border-emerald-200 text-emerald-700', accent: '#34D399' },
                    { top: 'bg-purple-50', badge: 'bg-purple-100 border-purple-200 text-purple-700', accent: '#A78BFA' },
                    { top: 'bg-blue-50', badge: 'bg-blue-100 border-blue-200 text-blue-700', accent: '#60A5FA' },
                    { top: 'bg-pink-50', badge: 'bg-pink-100 border-pink-200 text-pink-700', accent: '#F472B6' },
                    { top: 'bg-gray-50', badge: 'bg-gray-100 border-gray-200 text-gray-700', accent: '#9CA3AF' },
                  ];
                  const colorScheme = cardColors[index % cardColors.length];
                  
                  return (
                    <div
                      key={mentor.id}
                      className="w-full rounded-3xl shadow-sm border border-black/5 transition-transform hover:scale-[1.02] hover:shadow-md overflow-hidden"
                    >
                      {/* Top Section - Colored Background */}
                      <div className={`${colorScheme.top} p-5 relative`}>
                        {/* Decorative curves and lines */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                          {/* Curved line top right */}
                          <svg className="absolute -top-4 -right-4 w-32 h-32" viewBox="0 0 100 100">
                            <path d="M 0,50 Q 25,25 50,50 T 100,50" stroke={colorScheme.accent} strokeWidth="2" fill="none" />
                            <path d="M 0,60 Q 25,35 50,60 T 100,60" stroke={colorScheme.accent} strokeWidth="1.5" fill="none" />
                          </svg>
                          {/* Diagonal lines */}
                          <div className="absolute top-0 right-0 w-full h-full">
                            <svg className="w-full h-full" preserveAspectRatio="none">
                              <line x1="100%" y1="0" x2="80%" y2="100%" stroke={colorScheme.accent} strokeWidth="1" />
                              <line x1="90%" y1="0" x2="70%" y2="100%" stroke={colorScheme.accent} strokeWidth="0.5" />
                            </svg>
                          </div>
                          {/* Small circles */}
                          <div className="absolute bottom-4 left-4 w-8 h-8 border-2 rounded-full" style={{ borderColor: colorScheme.accent }}></div>
                          <div className="absolute top-8 right-16 w-4 h-4 rounded-full" style={{ backgroundColor: colorScheme.accent }}></div>
                        </div>
                        
                        {/* Header with Avatar and Badge */}
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          {mentor.avatar_url ? (
                            <Image
                              src={mentor.avatar_url}
                              alt={mentor.full_name}
                              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-lg"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                              {mentor.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${colorScheme.badge}`}>
                            ⭐ Mentor
                          </span>
                        </div>

                        {/* Name and Expertise */}
                        <h3 className="text-xl font-bold leading-snug mb-3 text-gray-900 line-clamp-1 min-h-[1.75rem] relative z-10">
                          {mentor.full_name}
                        </h3>

                        {/* Expertise Tag */}
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {parseExpertise(mentor.expertise) || 'General Mentorship'}
                          </span>
                        </div>

                        {/* Stats/Info Tags */}
                        <div className="flex flex-wrap gap-2 min-h-[2.5rem] relative z-10">
                          <span className="px-3 py-1 rounded-full text-xs bg-white border border-black/10 text-gray-700 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Expert
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs bg-white border border-black/10 text-gray-700 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Available
                          </span>
                          {mentor.specialization && (
                            <span className="px-3 py-1 rounded-full text-xs bg-white border border-black/10 text-gray-700">
                              {mentor.specialization}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Section - White Background */}
                      <div className="bg-white p-5 relative">
                        {/* Decorative curves and lines */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                          {/* Curved line bottom left */}
                          <svg className="absolute -bottom-4 -left-4 w-32 h-32" viewBox="0 0 100 100">
                            <path d="M 100,50 Q 75,75 50,50 T 0,50" stroke="#E5E7EB" strokeWidth="2" fill="none" />
                            <path d="M 100,40 Q 75,65 50,40 T 0,40" stroke="#E5E7EB" strokeWidth="1.5" fill="none" />
                          </svg>
                          {/* Small shapes */}
                          <div className="absolute top-4 right-8 w-6 h-6 border-2 border-gray-200 rotate-45"></div>
                          <div className="absolute bottom-8 right-4 w-3 h-3 bg-gray-200 rounded-full"></div>
                        </div>
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="truncate font-medium">{mentor.universities?.name}</span>
                            </div>
                            <p className="text-xs text-gray-500">{mentor.email}</p>
                          </div>

                          <Link
                            href={`/dashboard/student/mentor/${mentor.id}`}
                            className="ml-3 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap shadow-lg"
                          >
                            Connect
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl p-12 text-center border border-slate-200">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No mentors found
                </h3>
                <p className="text-slate-600 mb-4">
                  {searchQuery || selectedExpertise !== 'All Expertise' 
                    ? 'Try adjusting your search filters' 
                    : 'There are currently no mentors available'}
                </p>
                {(searchQuery || selectedExpertise !== 'All Expertise') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedExpertise('All Expertise');
                    }}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/30"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
