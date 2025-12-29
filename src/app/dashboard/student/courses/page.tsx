import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import { CoursesDiscoveryClient } from '@/components/student/CoursesDiscoveryClient';
import Image from 'next/image';
import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';

export default async function StudentCoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/student');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-7xl mx-auto">
            {/* Hero Banner */}
            <div className="mb-8 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-blue-500 rounded-3xl p-8 md:p-12 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Left Side - Text Content */}
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Discover & Learn</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Find Your Perfect Course
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl">
                    Explore thousands of courses from top platforms like Coursera, Udemy, edX, and more.
                    Start learning today with free and paid courses tailored to your goals.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <BookOpen className="w-5 h-5" />
                      <span className="font-semibold">10+ Platforms</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">1000+ Courses</span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Icon */}
                <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
                  <div className="w-72 h-72 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-9xl">🎓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🆓</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Free Courses</p>
                    <p className="text-2xl font-bold text-slate-900">500+</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Premium Courses</p>
                    <p className="text-2xl font-bold text-slate-900">500+</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📺</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">YouTube Tutorials</p>
                    <p className="text-2xl font-bold text-slate-900">100+</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Courses Discovery */}
            <CoursesDiscoveryClient />
          </div>
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}
