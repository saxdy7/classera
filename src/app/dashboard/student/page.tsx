import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import Image from 'next/image';

export default async function StudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get user profile with university
  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  // Check if profile is complete
  if (!profile) {
    redirect('/onboarding/student');
  }

  if (!profile.full_name || !profile.university_id) {
    redirect('/onboarding/student');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Welcome Header Container */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-200 to-gray-100 rounded-3xl p-6 md:p-8 h-fit">
              <div className="flex items-center justify-between gap-6">
                {/* Left Side - Welcome Text */}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    Hello, Welcome back! 👋
                  </h1>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                    Good to see you again, {profile?.full_name?.split(' ')[0]}! You're currently enrolled at {profile.universities?.name}.
                    Continue your learning journey and explore your courses, connect with mentors, and stay on track with your goals.
                  </p>
                </div>

                {/* Right Side - Illustration */}
                <div className="hidden lg:block flex-shrink-0">
                  <Image
                    src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                    alt="Student Illustration"
                    width={200}
                    height={200}
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Calendar/Reminder Widget */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 h-fit">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-900">Calendar</h2>
                <span className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>

              {/* Calendar Grid */}
              <div className="mb-2">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-semibold text-slate-400 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 2; // Adjust starting position
                    const isToday = day === new Date().getDate();
                    const isValidDay = day > 0 && day <= 31;
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${isToday
                            ? 'bg-gradient-to-br from-fuchsia-500 to-purple-500 text-white font-bold'
                            : isValidDay
                              ? 'hover:bg-slate-100 text-slate-700 cursor-pointer'
                              : 'text-slate-300'
                          }`}
                      >
                        {isValidDay ? day : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Reminders */}
              <div className="border-t border-slate-200 pt-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Upcoming</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Web Dev Test</p>
                      <p className="text-xs text-slate-500">Tomorrow, 10:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Mentor Session</p>
                      <p className="text-xs text-slate-500">Dec 30, 2:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}