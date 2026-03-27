'use client';

import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Briefcase, MapPin, DollarSign, Clock, Search, Filter, Sparkles, Building2, ArrowRight, Bookmark } from 'lucide-react';

const JOBS = [
  {
    id: 1,
    title: "Junior React Developer",
    company: "TechFlow Solutions",
    location: "Remote",
    salary: "$4k - $6k",
    type: "Full-time",
    match: 94,
    posted: "2d ago",
    skills: ["React", "TypeScript", "Tailwind"]
  },
  {
    id: 2,
    title: "Frontend Intern",
    company: "Nexus AI",
    location: "New York, NY",
    salary: "$25/hr",
    type: "Internship",
    match: 88,
    posted: "5h ago",
    skills: ["Next.js", "Figma", "CSS"]
  },
  {
    id: 3,
    title: "Fullstack Engineer",
    company: "Stripe",
    location: "Remote",
    salary: "$120k+",
    type: "Contract",
    match: 72,
    posted: "1w ago",
    skills: ["Node.js", "PostgreSQL", "React"]
  }
];

export default function JobPortalPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: '1', full_name: 'Student', role: 'student', avatar_url: '' }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
                  <Briefcase size={14} />
                  Clario Job Portal
                </div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Your Career starts here.</h1>
                <p className="text-slate-500 mt-2 font-medium">Personalized job matches based on your skills and project progress.</p>
              </div>
              <div className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-xl shadow-indigo-500/20 text-xs font-black uppercase tracking-widest gap-2 animate-bounce">
                <Sparkles size={14} />
                AI Matching Active
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-3 mb-10">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search jobs, companies, or skills..." 
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:border-slate-300 transition-all flex items-center gap-2 font-bold text-sm">
                <Filter size={18} />
                Filters
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Top Matches For You</h3>
                {JOBS.map(job => (
                  <div key={job.id} className="group bg-white border border-slate-200 p-5 rounded-3xl hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                          <p className="text-sm font-bold text-slate-500">{job.company}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100">
                          {job.match}% AI Match
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{job.posted}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <MapPin size={14} className="text-slate-300" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <DollarSign size={14} className="text-slate-300" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Clock size={14} className="text-slate-300" />
                        {job.type}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {job.skills.map(s => (
                          <span key={s} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase rounded-lg border border-slate-100">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-slate-400">
                          <Bookmark size={18} />
                        </button>
                        <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                          Apply Now
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Stats */}
              <div className="space-y-6">
                 <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-xl font-black italic mb-2">Market Readiness</h4>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Based on your GitHub Progress</p>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between text-xs font-black uppercase mb-2">
                            <span>Frontend Depth</span>
                            <span className="text-indigo-400">85%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-black uppercase mb-2">
                            <span>Backend Systems</span>
                            <span className="text-purple-400">42%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '42%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 p-5 bg-white/5 border border-white/10 rounded-3xl">
                        <p className="text-xs leading-relaxed text-slate-300 italic font-medium">
                          "Your recent Next.js contributions put you in the **Top 5%** of early-career developers in your region."
                        </p>
                      </div>
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Resume Health</h4>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                        A-
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score: 88/100</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Excellent Keywords</p>
                      </div>
                    </div>
                    <button className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all">
                      Scan New Resume
                    </button>
                 </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
