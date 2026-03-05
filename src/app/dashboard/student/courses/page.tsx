import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import FloatingAIAssistant from '@/components/shared/FloatingAIAssistant';
import { CoursesTabbedInterface } from '@/components/courses/CoursesTabbedInterface';
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
    <div className="min-h-screen bg-gradient-to-br bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-14">
          <div className="max-w-7xl mx-auto">
            {/* Hero Banner */}
            <div className="mb-8 bg-gradient-to-r bg-slate-50 rounded-3xl relative overflow-hidden shadow-lg border border-slate-200">
              {/* Modern Geometric Background Pattern */}
              <div className="absolute inset-0">
                {/* Diagonal stripes */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-full h-full" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(139,92,246,.05) 35px, rgba(139,92,246,.05) 70px)'
                  }}></div>
                </div>
                {/* Geometric shapes */}
                <div className="absolute top-10 right-20 w-32 h-32 border-2 border-purple-200 rounded-lg rotate-12"></div>
                <div className="absolute bottom-10 right-40 w-24 h-24 bg-purple-100 rounded-full"></div>
                <div className="absolute top-1/2 right-10 w-40 h-40 border-2 border-pink-200 rotate-45"></div>
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(rgba(139,92,246,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,.2) 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-6">
                {/* Left Side - Text Content */}
                <div className="flex-1 space-y-3">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700">AI-Powered Learning Platform</span>
                  </div>
                  
                  {/* Main Heading */}
                  <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-1 leading-tight text-slate-900">
                      Elevate Your
                    </h1>
                    <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                      Learning Journey
                    </h1>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-slate-700 max-w-2xl leading-relaxed">
                    Discover personalized courses in <span className="font-semibold text-purple-700">{profile.specialization || 'your field'}</span>. 
                    Master new skills, earn industry-recognized certificates, and accelerate your career growth.
                  </p>
                  
                  {/* Stats/Features */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow hover:shadow-lg hover:bg-indigo-700 transition-all">
                      <BookOpen className="w-4 h-4" />
                      <span>10+ Platforms</span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow hover:shadow-lg hover:bg-purple-700 transition-all">
                      <TrendingUp className="w-4 h-4" />
                      <span>AI Recommendations</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border-2 border-purple-300 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-50 transition-all">
                      <span>🎓</span>
                      <span>Certificates</span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Modern Illustration */}
                <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
                  <div className="relative w-40 h-40">
                    {/* Floating cards effect */}
                    <div className="absolute top-0 right-0 w-24 h-16 bg-white rounded-xl border-2 border-purple-200 shadow-lg rotate-6 flex items-center justify-center">
                      <span className="text-3xl">📚</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-24 h-16 bg-white rounded-xl border-2 border-pink-200 shadow-lg -rotate-6 flex items-center justify-center">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl border-2 border-purple-300 shadow-xl flex items-center justify-center">
                      <span className="text-4xl">🎯</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Courses Discovery */}
            <div className="mb-8">
              <CoursesTabbedInterface />
            </div>
          </div>
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}

