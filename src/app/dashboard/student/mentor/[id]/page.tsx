import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Mail, GraduationCap, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MentorActions } from '@/components/student/MentorActions';

function parseExpertise(expertise: any): string {
  if (!expertise) return '';
  if (Array.isArray(expertise)) return expertise.join(', ');
  try {
    const parsed = JSON.parse(expertise);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {}
  return String(expertise);
}

export default async function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Get current user's profile
  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/student');
  }

  // Get mentor profile
  const { data: mentor } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', id)
    .eq('role', 'mentor')
    .single();

  if (!mentor) {
    redirect('/dashboard/student/find-mentors');
  }

  // Calculate years of experience
  const yearsExperience = mentor.created_at 
    ? Math.max(1, new Date().getFullYear() - new Date(mentor.created_at).getFullYear())
    : 1;

  return (
    <div className="min-h-screen bg-white">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-6 md:p-12 lg:px-16 md:ml-24">
          <div className="max-w-[1400px] mx-auto">
            {/* Back Button */}
            <Link
              href="/dashboard/student/find-mentors"
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-slate-600 hover:text-purple-600 hover:bg-white rounded-xl transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Find Mentors</span>
            </Link>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm sticky top-8">
                  {/* Profile Header */}
                  <div className="relative h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                    <div className="absolute inset-0 bg-black/5"></div>
                  </div>
                  
                  <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 mb-4">
                      {mentor.avatar_url ? (
                        <Image
                          src={mentor.avatar_url}
                          alt={mentor.full_name}
                          className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl object-cover"
                          width={112}
                          height={112}
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-3xl font-bold">
                          {mentor.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>

                    {/* Name & Title */}
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">{mentor.full_name}</h1>
                    <p className="text-purple-600 font-medium mb-4">{parseExpertise(mentor.expertise) || 'Mentor'}</p>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2 mb-6">
                      <MentorActions mentorId={mentor.id} mentorEmail={mentor.email} />
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border border-slate-100">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{yearsExperience}+</div>
                        <div className="text-xs text-slate-600">Years Exp.</div>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">-</div>
                        <div className="text-xs text-slate-600">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">-</div>
                        <div className="text-xs text-slate-600">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">Email Address</div>
                    <div className="text-sm text-slate-900 font-medium break-all">{mentor.email}</div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">University</div>
                    <div className="text-sm text-slate-900 font-medium">{mentor.universities?.name || mentor.university}</div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/30">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">Expertise</div>
                    <div className="text-sm text-slate-900 font-medium">{parseExpertise(mentor.expertise) || 'Various Subjects'}</div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    About
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Experienced mentor at <span className="font-semibold text-slate-900">{mentor.universities?.name || mentor.university}</span> specializing in <span className="font-semibold text-slate-900">{parseExpertise(mentor.expertise) || 'various subjects'}</span>. 
                    Dedicated to helping students succeed in their academic journey and providing career guidance with industry insights.
                  </p>
                </div>

                {/* Skills/Specializations */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    Specializations
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-sm font-medium">{parseExpertise(mentor.expertise) || 'General Mentorship'}</span>
                    <span className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium">Career Guidance</span>
                    <span className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-medium">Academic Support</span>
                    <span className="px-4 py-2 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl text-sm font-medium">Industry Insights</span>
                  </div>
                </div>

                {/* Available Courses */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    Available Courses
                  </h2>
                  <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">No Courses Yet</h3>
                    <p className="text-sm text-slate-500">Check back later for course offerings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
