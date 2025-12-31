'use client';

import { ArrowRight, BookOpen, Brain, BarChart3, Users, Zap, Shield, Globe, Sparkles, TrendingUp, Target, Award } from 'lucide-react';

function FeaturesSection() {
  return (
    <section id="features" className="relative min-h-screen py-32 bg-white overflow-hidden">
      {/* Animated Background - Subtle Purple Accents (10%) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="text-sm text-violet-700 font-medium">Powerful Features</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Everything You Need to Excel
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Transform your teaching with cutting-edge tools designed for modern education
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Feature 1 - Live Virtual Classrooms */}
          <div className="relative overflow-visible bg-white max-h-fit border-slate-200 border rounded-2xl pt-4 pr-4 pb-8 pl-4 group hover:border-violet-400 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-500">
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: `
                radial-gradient(220px 140px at 0% 100%, rgba(139,92,246,0.04), transparent 60%),
                radial-gradient(240px 160px at 100% 0%, rgba(232,121,249,0.02), transparent 70%),
                linear-gradient(180deg, rgba(139,92,246,0.01), rgba(255,255,255,0.00))
              `
            }}></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-lg tracking-tight font-semibold text-slate-900">Live Virtual Classrooms</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Engage students with HD video, interactive whiteboards, and real-time collaboration tools.</p>

              <div className="relative rounded-xl bg-slate-50 border border-slate-200 ring-1 ring-slate-100 overflow-hidden p-4 sm:p-6 mb-4">
                {/* Animated Connectors */}
                <div className="absolute inset-y-0 left-28 right-28 sm:left-36 sm:right-36 z-0 flex flex-col items-stretch justify-center gap-2 pointer-events-none">
                  <div className="h-px bg-gradient-to-r from-transparent via-violet-400/80 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 h-full" style={{ animation: 'flowLeft 2s ease-in-out infinite' }}></div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 h-full" style={{ animation: 'flowLeft 2s ease-in-out infinite 0.3s' }}></div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 h-full" style={{ animation: 'flowLeft 2s ease-in-out infinite 0.6s' }}></div>
                  </div>
                </div>

                {/* Nodes */}
                <div className="relative z-10 flex items-center justify-between">
                  {/* Left: Teacher */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200 bg-white ring-1 ring-slate-100 backdrop-blur-sm overflow-hidden">
                      <div className="absolute -left-4 top-2 w-20 h-20 rounded-full bg-gradient-to-tr from-violet-500/30 to-fuchsia-500/15 blur-2xl"></div>
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-fuchsia-400/30 to-violet-500/15 blur-xl"></div>
                      <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-gradient-to-tr from-violet-300/30 to-transparent blur-lg"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="w-12 h-12 text-violet-500" />
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Teacher</span>
                  </div>

                  {/* Right: Students */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200 bg-white ring-1 ring-slate-100 backdrop-blur-sm overflow-hidden">
                      <div className="absolute right-4 top-4 w-8 h-6 bg-gradient-to-br from-violet-400 to-fuchsia-500" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 70% 100%, 0% 100%)' }}></div>
                      <div className="absolute left-4 bottom-5 w-12 h-7 bg-gradient-to-br from-fuchsia-500 to-violet-500" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 0% 100%)' }}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Globe className="w-12 h-12 text-fuchsia-500" />
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Students</span>
                  </div>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <path d="M16 7h6v6"></path>
                    <path d="m22 7-8.5 8.5-5-5L2 17"></path>
                  </svg>
                  HD Quality
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Real-time</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Interactive</span>
              </div>
            </div>
          </div>

          {/* Feature 2 - AI-Powered Analytics */}
          <div className="relative overflow-visible bg-white max-h-fit border-slate-200 border rounded-2xl pt-4 pr-4 pb-8 pl-4 group hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: `
                radial-gradient(220px 140px at 0% 100%, rgba(59,130,246,0.04), transparent 60%),
                radial-gradient(240px 160px at 100% 0%, rgba(147,197,253,0.02), transparent 70%),
                linear-gradient(180deg, rgba(59,130,246,0.01), rgba(255,255,255,0.00))
              `
            }}></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg tracking-tight font-semibold text-slate-900">AI-Powered Analytics</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Track student progress with intelligent insights and predictive performance metrics.</p>

              {/* Analytics Visualization */}
              <div className="relative rounded-xl bg-slate-50 border border-slate-200 ring-1 ring-slate-100 overflow-hidden p-6 mb-4">
                <div className="space-y-4">
                  {/* Progress Bars */}
                  {[
                    { label: 'Engagement', value: 85, color: 'from-blue-500 to-cyan-400' },
                    { label: 'Performance', value: 92, color: 'from-violet-500 to-purple-400' },
                    { label: 'Completion', value: 78, color: 'from-fuchsia-500 to-pink-400' }
                  ].map((metric, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-600 font-medium">{metric.label}</span>
                        <span className="text-xs text-slate-900 font-semibold">{metric.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${metric.value}%`, animation: 'growWidth 1.5s ease-out' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  Predictive AI
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Real-time</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Insights</span>
              </div>
            </div>
          </div>

          {/* Feature 3 - Smart Grading */}
          <div className="relative overflow-visible bg-white max-h-fit border-slate-200 border rounded-2xl pt-4 pr-4 pb-8 pl-4 group hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500">
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: `
                radial-gradient(220px 140px at 0% 100%, rgba(16,185,129,0.04), transparent 60%),
                radial-gradient(240px 160px at 100% 0%, rgba(52,211,153,0.02), transparent 70%),
                linear-gradient(180deg, rgba(16,185,129,0.01), rgba(255,255,255,0.00))
              `
            }}></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg tracking-tight font-semibold text-slate-900">Smart Grading System</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">AI-powered auto-grading saves 10+ hours per week with instant, accurate feedback.</p>

              {/* Grading Visualization */}
              <div className="relative rounded-xl bg-slate-50 border border-slate-200 ring-1 ring-slate-100 overflow-hidden p-6 mb-4">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {/* Circular Progress */}
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="rgba(148,163,184,0.2)" strokeWidth="8" fill="none" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="351.86"
                        strokeDashoffset="70.37"
                        strokeLinecap="round"
                        style={{ animation: 'drawCircle 2s ease-out' }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">A+</span>
                      <span className="text-xs text-slate-600 font-medium">Auto-graded</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  <Zap className="w-3 h-3" />
                  Instant Feedback
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">AI-Powered</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Accurate</span>
              </div>
            </div>
          </div>

          {/* Feature 4 - Course Library */}
          <div className="relative overflow-visible bg-white max-h-fit border-slate-200 border rounded-2xl pt-4 pr-4 pb-8 pl-4 group hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500">
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: `
                radial-gradient(220px 140px at 0% 100%, rgba(245,158,11,0.04), transparent 60%),
                radial-gradient(240px 160px at 100% 0%, rgba(251,191,36,0.02), transparent 70%),
                linear-gradient(180deg, rgba(245,158,11,0.01), rgba(255,255,255,0.00))
              `
            }}></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg tracking-tight font-semibold text-slate-900">Rich Course Library</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Access 500+ pre-built courses and customizable templates across all subjects.</p>

              {/* Library Grid */}
              <div className="relative rounded-xl bg-slate-50 border border-slate-200 ring-1 ring-slate-100 overflow-hidden p-4 mb-4">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                    >
                      <BookOpen className="w-6 h-6 text-amber-600" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  <Award className="w-3 h-3" />
                  500+ Courses
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Templates</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">All Subjects</span>
              </div>
            </div>
          </div>

          {/* Feature 5 - Collaboration Tools */}
          <div className="relative overflow-visible bg-white max-h-fit border-slate-200 border rounded-2xl pt-4 pr-4 pb-8 pl-4 group hover:border-pink-400 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-500">
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: `
                radial-gradient(220px 140px at 0% 100%, rgba(236,72,153,0.04), transparent 60%),
                radial-gradient(240px 160px at 100% 0%, rgba(244,114,182,0.02), transparent 70%),
                linear-gradient(180deg, rgba(236,72,153,0.01), rgba(255,255,255,0.00))
              `
            }}></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 border border-pink-200 flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="text-lg tracking-tight font-semibold text-slate-900">Collaboration Hub</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Foster teamwork with group projects, peer reviews, and discussion forums.</p>

              {/* Collaboration Visualization */}
              <div className="relative rounded-xl bg-slate-50 border border-slate-200 ring-1 ring-slate-100 overflow-hidden p-6 mb-4">
                <div className="flex items-center justify-center gap-4">
                  {[1, 2, 3].map((user, idx) => (
                    <div
                      key={user}
                      className="relative"
                      style={{
                        marginLeft: idx > 0 ? '-12px' : '0',
                        zIndex: 3 - idx
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 border-2 border-white flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">{user}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 border-dashed flex items-center justify-center">
                    <span className="text-slate-600 text-xs font-bold">+5</span>
                  </div>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  <Users className="w-3 h-3" />
                  Team Projects
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Peer Review</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">Forums</span>
              </div>
            </div>
          </div>

          {/* Feature 6 - Security & Privacy */}
          <div className="relative overflow-visible bg-white max-h-fit border-slate-200 border rounded-2xl pt-4 pr-4 pb-8 pl-4 group hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-500">
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: `
                radial-gradient(220px 140px at 0% 100%, rgba(6,182,212,0.04), transparent 60%),
                radial-gradient(240px 160px at 100% 0%, rgba(34,211,238,0.02), transparent 70%),
                linear-gradient(180deg, rgba(6,182,212,0.01), rgba(255,255,255,0.00))
              `
            }}></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 border border-cyan-200 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="text-lg tracking-tight font-semibold text-slate-900">Enterprise Security</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Bank-level encryption, GDPR compliance, and role-based access control.</p>

              {/* Security Visualization */}
              <div className="relative rounded-xl bg-slate-50 border border-slate-200 ring-1 ring-slate-100 overflow-hidden p-6 mb-4">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-200 flex items-center justify-center">
                      <Shield className="w-12 h-12 text-cyan-600" />
                    </div>
                    {/* Animated rings */}
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s' }}></div>
                  </div>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  <Shield className="w-3 h-3" />
                  Encrypted
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">GDPR</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">SOC 2</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {/* <div className="mt-16 text-center">
          <button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full font-semibold hover:shadow-2xl hover:shadow-violet-600/50 transition-all duration-500 hover:scale-105">
            Explore All Features
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div> */}
      </div>

      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes flowLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes growWidth {
          from {
            width: 0;
          }
        }

        @keyframes drawCircle {
          from {
            stroke-dashoffset: 351.86;
          }
        }
      `}</style>
    </section>
  );
}

export default FeaturesSection;
