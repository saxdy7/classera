'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
          mentor.expertise?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by expertise
    if (selectedExpertise !== 'All Expertise') {
      filtered = filtered.filter(
        (mentor) => mentor.expertise === selectedExpertise
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
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-gray-200 to-gray-100 rounded-3xl p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    Find Your Mentor 🎯
                  </h1>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                    Connect with experienced mentors from {profile.universities?.name} who can guide you in your learning journey
                  </p>
                </div>
                
                <div className="hidden lg:block flex-shrink-0">
                  <img
                    src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                    alt="Find Mentors"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search mentors by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <select 
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
                className="px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-700 min-w-[160px]"
              >
                <option>All Expertise</option>
                <option>Web Development</option>
                <option>Data Science</option>
                <option>Mobile Development</option>
                <option>UI/UX Design</option>
                <option>Cloud Computing</option>
                <option>Machine Learning</option>
              </select>
            </div>

            {/* Mentors Grid */}
            {filteredMentors && filteredMentors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {mentor.avatar_url ? (
                        <Image
                          src={mentor.avatar_url}
                          alt={mentor.full_name}
                          className="w-14 h-14 rounded-xl object-cover"
                          width={56}
                          height={56}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                          {mentor.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">
                          {mentor.full_name}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {mentor.expertise || 'Mentor'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="truncate">{mentor.universities?.name}</span>
                    </div>

                    <Link
                      href={`/dashboard/student/mentor/${mentor.id}`}
                      className="block w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-center text-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  No mentors found
                </h3>
                <p className="text-slate-600">
                  There are currently no mentors available. Check back later!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
