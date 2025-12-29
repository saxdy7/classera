'use client';

import { ArrowRight, ArrowUpRight, GraduationCap, Sparkles } from 'lucide-react';
import { AnalyticsChart } from '@/components/ui/analytics-chart';

function FeaturesSection() {

  return (
    <section id="work" className="features-section relative min-h-screen py-32 bg-white overflow-hidden">
      <div className="features-container w-full h-full">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 leading-tight">
                Transform Your <span className="text-fuchsia-600">Teaching Experience</span>
              </h2>
              <p className="text-slate-600 text-xl leading-relaxed">
                Everything you need to create engaging, interactive learning environments. From live classrooms to AI-powered analytics.
              </p>
            </div>
            <a
              href="#"
              className="group inline-flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-fuchsia-600 hover:shadow-2xl hover:shadow-fuchsia-600/40 transition-all duration-500 ease-out hover:scale-105 shadow-lg"
            >
              Explore All Features
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Features - First Row */}
        <div className="features-row-1 flex flex-wrap justify-center gap-6 lg:gap-8 px-6 mb-12">
          {/* Feature 1 - Live Virtual Classrooms */}
          <div className="feature-box flex-shrink-0 w-full sm:w-[600px] lg:w-[650px] xl:w-[700px]">
            <div className="group cursor-pointer h-full">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 aspect-[4/3] mb-6 transition-all duration-700 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center p-12 transition-all duration-700 group-hover:from-blue-500/20 group-hover:to-indigo-500/20">
                  <div className="w-full h-full bg-cover bg-center rounded-2xl shadow-2xl border-4 border-white/50 backdrop-blur-sm" style={{backgroundImage: "url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=2000')"}}></div>
                </div>
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-bold text-blue-600 shadow-lg border border-blue-100">
                  🎓 LIVE TEACHING
                </div>
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm text-slate-600 font-medium">HD video conferencing • Screen sharing • Interactive whiteboard • Real-time polls • Breakout rooms</p>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-bold mb-2 group-hover:text-blue-600 transition-colors">Live Virtual Classrooms</h3>
                  <p className="text-slate-600 text-lg mb-2">Engage students with interactive HD video sessions</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">HD Video</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">Screen Share</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">Whiteboard</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all group-hover:scale-110">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Course Library */}
          <div className="feature-box flex-shrink-0 w-full sm:w-[450px] lg:w-[500px] xl:w-[550px]">
            <div className="group cursor-pointer h-full">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-100 to-pink-100 aspect-[3/4] mb-6 transition-all duration-700 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white p-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                    <GraduationCap className="w-32 h-32 relative z-10" />
                  </div>
                  <span className="text-6xl font-black tracking-tighter text-center leading-none mb-4">COURSE<br/>LIBRARY</span>
                  <p className="text-white/80 text-center text-sm font-medium">500+ Pre-built Templates</p>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-600 transition-colors">Rich Course Library</h3>
                  <p className="text-slate-600 mb-2">Pre-built curriculum & templates</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">500+ Courses</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:bg-purple-600 group-hover:border-purple-600 group-hover:text-white transition-all group-hover:scale-110">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features - Second Row */}
        <div className="features-row-2 flex flex-wrap justify-center gap-6 lg:gap-8 px-6">
          {/* Feature 3 - AI-Powered Grading */}
          <div className="feature-box flex-shrink-0 w-full sm:w-[550px] lg:w-[600px] xl:w-[650px]">
            <div className="group cursor-pointer h-full">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rose-100 to-orange-100 aspect-[1/1] mb-6 transition-all duration-700 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-rose-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-orange-500 flex flex-col items-center justify-center p-8 text-white">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-white/30 rounded-full blur-3xl"></div>
                    <Sparkles className="w-24 h-24 relative z-10 animate-pulse" />
                  </div>
                  <h4 className="text-5xl font-black tracking-tighter text-center leading-none mb-3">AI-POWERED<br />GRADING</h4>
                  <p className="text-white/90 text-center font-semibold">Save 10+ hours per week</p>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-rose-600 transition-colors">Smart Assessment Hub</h3>
                  <p className="text-slate-600 mb-2">AI-powered grading & instant feedback</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">Auto-Grade</span>
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">AI Feedback</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:bg-rose-600 group-hover:border-rose-600 group-hover:text-white transition-all group-hover:scale-110">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4 - Analytics Dashboard */}
          <div className="feature-box flex-shrink-0 w-full sm:w-[700px] lg:w-[750px] xl:w-[800px]">
            <div className="group cursor-pointer h-full">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-50 to-cyan-50 aspect-[16/10] mb-6 transition-all duration-700 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-teal-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-3xl"></div>
                  <div className="relative w-full h-full flex flex-col items-center justify-center -mt-16">
                    <div className="text-center relative z-10 mb-4">
                      <div className="text-white text-4xl font-black tracking-tight">Real-Time Analytics</div>
                    </div>
                    <div className="relative z-10 w-full max-w-2xl h-[280px]">
                      <AnalyticsChart />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-teal-600 transition-colors">Advanced Learning Analytics</h3>
                  <p className="text-slate-600 mb-2">Track progress, engagement & outcomes in real-time</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">Live Metrics</span>
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">Performance Insights</span>
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">Predictive AI</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:bg-teal-600 group-hover:border-teal-600 group-hover:text-white transition-all group-hover:scale-110">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
