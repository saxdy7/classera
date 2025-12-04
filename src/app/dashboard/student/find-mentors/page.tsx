import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';

export default async function FindMentors() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Get current user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.university || !profile?.full_name) {
    redirect('/onboarding/student');
  }

  // Get mentors from the same university - filter by university in application
  const { data: mentors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'mentor')
    .eq('university', profile.university)
    .order('full_name');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">
                Find Mentors at {profile.university}
              </h2>
              <p className="text-slate-600">
                Connect with mentors from your university
              </p>
            </div>

            {mentors && mentors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-fuchsia-200 transition-all"
                  >
                    {/* Profile Image/Avatar */}
                    <div className="flex flex-col items-center text-center mb-4">
                      {mentor.avatar_url ? (
                        <Image
                          src={mentor.avatar_url}
                          alt={mentor.full_name}
                          className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-slate-200"
                          width={80}
                          height={80}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-2 border-slate-200">
                          {mentor.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Name */}
                      <h3 className="font-bold text-lg text-black mb-1">
                        {mentor.full_name}
                      </h3>
                      
                      {/* Expertise */}
                      <p className="text-sm text-slate-600 mb-3">
                        {mentor.expertise || 'Mentor'}
                      </p>
                      
                      {/* University */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-700 mb-4">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {mentor.university}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/dashboard/student/mentor/${mentor.id}`}
                      className="block w-full px-4 py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-center"
                    >
                      Connect
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  No mentors found
                </h3>
                <p className="text-slate-600">
                  There are currently no mentors from {profile.university}.
                  Check back later!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
