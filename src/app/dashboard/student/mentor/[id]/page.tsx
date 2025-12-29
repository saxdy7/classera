import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Mail, GraduationCap, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MentorActions } from '@/components/student/MentorActions';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/dashboard/student/find-mentors"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Find Mentors
            </Link>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Header Background */}
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-blue-500"></div>

              {/* Profile Content */}
              <div className="px-8 pb-8">
                {/* Avatar */}
                <div className="relative -mt-16 mb-6">
                  {mentor.avatar_url ? (
                    <Image
                      src={mentor.avatar_url}
                      alt={mentor.full_name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                      width={128}
                      height={128}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                      {mentor.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name and Role */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-black mb-2">{mentor.full_name}</h1>
                  <p className="text-xl text-slate-600 mb-4">{mentor.expertise || 'Mentor'}</p>
                  
                  {/* Action Buttons */}
                  <MentorActions mentorId={mentor.id} mentorEmail={mentor.email} />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Email</p>
                      <p className="font-medium text-black">{mentor.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">University</p>
                      <p className="font-medium text-black">{mentor.university}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Expertise</p>
                      <p className="font-medium text-black">{mentor.expertise || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="border-t border-slate-200 pt-8">
                  <h2 className="text-xl font-bold text-black mb-4">About</h2>
                  <p className="text-slate-700 leading-relaxed">
                    Experienced mentor at {mentor.university} specializing in {mentor.expertise || 'various subjects'}. 
                    Available to help students with their academic journey and career guidance.
                  </p>
                </div>

                {/* Courses Section */}
                <div className="border-t border-slate-200 pt-8 mt-8">
                  <h2 className="text-xl font-bold text-black mb-4">Courses</h2>
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No courses available yet</p>
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
