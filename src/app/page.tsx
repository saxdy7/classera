'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Menu, Star, Music, Play, Check, Send, Code2, ArrowUpRight, Sparkles } from 'lucide-react';
import DisplayCards from '@/components/ui/display-cards';
import RadialOrbitalTimelineDemo from '@/components/demo/radial-orbital-timeline-demo';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position for nav effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="scroll-smooth bg-white text-slate-900 antialiased selection:bg-fuchsia-300 selection:text-fuchsia-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 transition-all duration-300">
        <div
          className={`max-w-7xl mx-auto bg-white/80 backdrop-blur-md border border-slate-100 rounded-full px-6 py-4 flex justify-between items-center shadow-sm transition-all duration-300 ${
            scrollY > 50 ? 'shadow-lg bg-white/95' : ''
          }`}
        >
          {/* Logo */}
          <a href="#" className="text-2xl font-semibold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">
              C
            </div>
            Classera
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            <a href="#work" className="text-sm font-medium hover:text-fuchsia-600 transition-colors">
              Features
            </a>
            <a href="#services" className="text-sm font-medium hover:text-fuchsia-600 transition-colors">
              Services
            </a>
            <a href="#culture" className="text-sm font-medium hover:text-fuchsia-600 transition-colors">
              About
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex gap-3 items-center">
            <a
              href="/signin"
              className="px-6 py-2.5 border-2 border-black text-black rounded-full text-sm font-medium hover:bg-black hover:text-white transition-all duration-300"
            >
              Sign In
            </a>
            <a
              href="#contact"
              className="group relative px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium overflow-hidden hover:scale-105 transition-transform"
            >
              <span className="relative z-10">Let&apos;s Talk</span>
              <div className="absolute inset-0 bg-fuchsia-500 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[50vw] h-[50vw] bg-purple-200 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[40vw] h-[40vw] bg-lime-200 rounded-full blur-3xl opacity-40"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wide mb-8 hover:bg-orange-200 transition-colors cursor-default">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></span>
                Freshly Baked Learning
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.9] mb-8 text-slate-900">
                We craft <br />
                <span className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text italic pr-4">
                  digital learning.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed mb-12">
                Classera is the learning platform for educators who refuse to be boring. We mix pedagogy with technology to build experiences that inspire.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <a href="/signin" className="px-8 py-4 bg-slate-900 text-white rounded-full text-lg font-medium hover:bg-fuchsia-500 hover:scale-105 transition-all duration-300 shadow-xl shadow-fuchsia-500/20 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </a>
                <button className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-full text-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                  <Play className="w-5 h-5 text-slate-400" />
                  Platform Tour
                </button>
              </div>
            </div>

            {/* Right Content - Display Cards */}
            <div className="flex justify-center lg:justify-start lg:ml-40 -mt-8">
              <DisplayCards cards={[
                {
                  icon: <Sparkles className="size-4 text-fuchsia-600" />,
                  title: "Live Classes",
                  description: "Interactive learning sessions",
                  date: "Active now",
                  titleClassName: "text-fuchsia-600",
                  className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-3xl before:outline-gray-300 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-gray-200/30 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  icon: <Code2 className="size-4 text-purple-600" />,
                  title: "Course Builder",
                  description: "Design engaging curricula",
                  date: "Updated today",
                  titleClassName: "text-purple-600",
                  className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-3xl before:outline-gray-300 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-gray-200/30 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  icon: <Star className="size-4 text-lime-600" />,
                  title: "Analytics Hub",
                  description: "Track student progress",
                  date: "Real-time",
                  titleClassName: "text-lime-600",
                  className: "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
                },
              ]} />
            </div>
          </div>
        </div>
      </header>

      {/* Marquee Section */}
      <div className="py-12 bg-lime-300 -rotate-1 overflow-hidden border-y-2 border-black">
        <div className="whitespace-nowrap flex gap-8 animate-marquee">
          <span className="text-4xl font-bold uppercase tracking-tight text-black flex items-center gap-8">
            Live Classes <Star className="w-8 h-8 fill-black" />
            Student Management <Star className="w-8 h-8 fill-black" />
            Video Conferencing <Star className="w-8 h-8 fill-black" />
            Course Builder <Star className="w-8 h-8 fill-black" />
            Analytics <Star className="w-8 h-8 fill-black" />
            Live Classes <Star className="w-8 h-8 fill-black" />
            Student Management <Star className="w-8 h-8 fill-black" />
            Video Conferencing <Star className="w-8 h-8 fill-black" />
            Course Builder <Star className="w-8 h-8 fill-black" />
            Analytics <Star className="w-8 h-8 fill-black" />
          </span>
        </div>
      </div>

      {/* Featured Work / Key Features */}
      <section id="work" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-4">Selected Features</h2>
              <p className="text-slate-500 text-lg">Tools with purpose.</p>
            </div>
            <a
              href="#"
              className="hidden md:flex items-center gap-2 text-sm font-semibold uppercase tracking-wide border-b border-black pb-1 hover:text-fuchsia-600 hover:border-fuchsia-600 transition-colors"
            >
              View All Features
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
            {/* Feature 1 */}
            <div className="lg:col-span-8 group cursor-pointer">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-100 aspect-[4/3] mb-6 transition-transform duration-300 hover:scale-[1.02] hover:rotate-[-1deg]">
                <div className="absolute inset-0 bg-[#E9E4DE] flex items-center justify-center p-12">
                  <div className="w-full h-full bg-cover bg-center rounded-2xl shadow-lg border border-slate-200/50" style={{backgroundImage: "url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=2000')"}}></div>
                </div>
                <div className="absolute top-8 left-8 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-semibold">
                  Education
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-semibold mb-1">Live Classroom</h3>
                  <p className="text-slate-500">Interactive Sessions & Teaching Tools</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="lg:col-span-4 group cursor-pointer mt-12 md:mt-0">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-100 aspect-[3/4] mb-6 transition-transform duration-300 hover:scale-[1.02] hover:rotate-[-1deg]">
                <div className="absolute inset-0 bg-indigo-500 flex items-center justify-center text-white">
                  <Music className="w-32 h-32 opacity-20 animate-pulse" />
                  <span className="absolute text-8xl font-bold tracking-tighter opacity-10 rotate-90 top-10 -right-10">LEARN</span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-semibold mb-1">Course Library</h3>
                  <p className="text-slate-500">Curated Learning Content</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="lg:col-span-5 group cursor-pointer">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-rose-100 aspect-[1/1] mb-6 transition-transform duration-300 hover:scale-[1.02] hover:rotate-[-1deg]">
                <div className="absolute inset-0 bg-[#FF6B6B] flex flex-col items-center justify-center p-8 text-white">
                  <h4 className="text-5xl font-bold tracking-tighter text-center leading-none">SMART<br />GRADING</h4>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-semibold mb-1">Assessment Hub</h3>
                  <p className="text-slate-500">Automated Grading & Feedback</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="lg:col-span-7 group cursor-pointer">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-teal-50 aspect-[16/10] mb-6 transition-transform duration-300 hover:scale-[1.02] hover:rotate-[-1deg]">
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">⚡️</div>
                    <div className="text-white text-3xl font-semibold tracking-tight">Progress Tracking</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-semibold mb-1">Learning Analytics</h3>
                  <p className="text-slate-500">Data-Driven Insights</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Expertise / Services */}
      <section id="services" className="py-24 px-6 bg-slate-50 rounded-[3rem] mx-4 mb-4">
        <div className="max-w-7xl sm:px-6 lg:px-8 mx-auto pt-12 pb-12">
          {/* Main Headlines */}
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-tighter leading-none">
              <span className="flex items-center justify-center gap-4">
                OUR
                <span className="inline-flex bg-fuchsia-50 rounded-full p-2">
                  <ArrowUpRight className="w-6 h-6 text-fuchsia-500" />
                </span>
                EXPERTISE
              </span>
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-tighter leading-none">
              <span className="flex items-center justify-center gap-4">
                LEARNING
                <span className="inline-flex bg-fuchsia-50 rounded-full p-2">
                  <ArrowUpRight className="w-6 h-6 text-fuchsia-500" />
                </span>
                <span className="flex items-center justify-center gap-4">PLATFORM</span>
              </span>
            </h1>
          </div>

          {/* Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
            {/* Left Card */}
            <div className="lg:col-span-1">
              <div className="lg:min-h-[520px] flex flex-col ring-1 ring-gray-200 bg-gradient-to-br from-blue-50 to-white rounded-3xl p-6">
                <div className="flex items-baseline gap-2">
                  <span className="sm:text-6xl text-5xl font-light text-blue-900 tracking-tighter">50+</span>
                  <span className="text-blue-600">courses</span>
                </div>
                <p className="text-gray-700 mt-3">Learning experiences that feel intuitive. We design courses that scale and interfaces that delight learners on every click.</p>
                <p className="mt-4 italic text-blue-500">Design. Learn. Engage.</p>

                <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-gray-300">
                  <div className="relative w-full h-44 sm:h-56 bg-gradient-to-br from-white to-gray-100">
                    {/* Subtle glow and vignette */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-radial"></div>

                    {/* Content */}
                    <div className="relative h-full w-full p-4 sm:p-5 flex flex-col">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium ring-1 ring-gray-300 shadow-sm">
                            ED
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-900 text-sm sm:text-base font-medium">Course Builder</span>
                            <span className="text-xs text-gray-500">Active</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">Curriculum</span>
                      </div>

                      {/* Rows */}
                      <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gray-200 ring-1 ring-gray-300 flex items-center justify-center text-gray-700">
                            <Check className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1">
                            <div className="h-2.5 rounded-full bg-gray-300"></div>
                            <div className="mt-2 h-2.5 w-2/5 rounded-full bg-gray-200"></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gray-200 ring-1 ring-gray-300 flex items-center justify-center text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                              <path d="M8 2v4" />
                              <path d="M16 2v4" />
                              <path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
                              <path d="M3 10h18" />
                              <path d="m16 20 2 2 4-4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2.5 rounded-full bg-gray-300"></div>
                            <div className="mt-2 h-2.5 w-3/5 rounded-full bg-gray-200"></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gray-200 ring-1 ring-gray-300 flex items-center justify-center text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                              <path d="M12 6v6l4 2" />
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2.5 rounded-full bg-gray-300"></div>
                            <div className="mt-2 h-2.5 w-1/2 rounded-full bg-gray-200"></div>
                          </div>
                        </div>
                      </div>

                      {/* Footer pill */}
                      <div className="mt-auto">
                        <div className="mt-4 h-8 w-full rounded-xl bg-gray-300 ring-1 ring-gray-400"></div>
                      </div>
                    </div>

                    {/* Card outline for depth */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-gray-300"></div>
                  </div>
                </div>

                <div className="mt-5">
                  <button className="inline-flex gap-2 hover:bg-blue-700 transition-colors ring-1 ring-blue-300 text-sm font-medium text-white bg-blue-600 rounded-full py-2.5 px-4 shadow-sm items-center">
                    Build Course
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-1 lg:min-h-[520px] flex flex-col">
              {/* Subtitle + CTA */}
              <div className="text-center space-y-6 mb-8">
                <p className="sm:text-xl text-lg text-gray-700">We don&rsquo;t just make it look good. We make it work. Combining data-driven pedagogy with &ldquo;whoa, that&rsquo;s cool&rdquo; design.</p>

                <div className="flex flex-wrap gap-3 items-center justify-center">
                  <button className="inline-flex gap-2 hover:bg-slate-800 transition-colors text-sm font-medium text-white bg-slate-900 rounded-full py-2.5 px-4 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M4.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                    </svg>
                    Start Platform
                  </button>
                  <button className="inline-flex gap-2 hover:bg-gray-100 transition-colors text-sm font-medium text-black bg-white rounded-full py-2.5 px-4 items-center">
                    <Play className="w-4 h-4" />
                    Watch Demo
                  </button>
                </div>
              </div>

              {/* Bottom Card */}
              <div className="text-white bg-slate-900 rounded-3xl mt-auto p-6 space-y-4">
                <div className="mb-4 space-y-6">
                  <div className="relative h-40 sm:h-48">
                    {/* Back left */}
                    <div className="absolute -left-2 top-2 sm:-left-1 sm:top-0 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[-12deg]">
                      <Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Educator" className="w-full h-full object-cover rounded-xl" width={128} height={112} />
                    </div>
                    {/* Back right */}
                    <div className="absolute -right-1 top-4 sm:right-0 sm:top-2 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[12deg]">
                      <Image src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80" alt="Developer" className="w-full h-full object-cover rounded-xl" width={128} height={112} />
                    </div>
                    {/* Bottom left */}
                    <div className="absolute left-2 bottom-0 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[10deg]">
                      <Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" alt="Engineer" className="w-full h-full object-cover rounded-xl" width={128} height={112} />
                    </div>
                    {/* Bottom right */}
                    <div className="absolute right-1 bottom-1 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[-8deg]">
                      <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" alt="Designer" className="w-full h-full object-cover rounded-xl" width={128} height={112} />
                    </div>
                    {/* Center card */}
                    <div className="absolute inset-0 w-40 h-32 sm:w-48 sm:h-36 ring-1 ring-gray-200 z-10 bg-white rounded-2xl m-auto p-1 shadow-xl">
                      <Image src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" alt="Lead educator" className="w-full h-full object-cover rounded-xl" width={192} height={144} />
                    </div>
                  </div>
                  <p className="text-gray-300 mt-4">
                    <span className="sm:text-6xl text-5xl font-light text-gray-50 tracking-tighter">15+</span> educators
                  </p>
                </div>

                <p className="text-sm text-gray-400">Clean code, fast load times, and buttery smooth learning experiences. We build with the latest tech stack.</p>
              </div>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-1">
              <div className="lg:min-h-[520px] flex flex-col ring-1 ring-gray-200 bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Learning Strategy</h3>
                <p className="text-gray-700 mt-3 mb-8">Finding your teaching voice in a crowded space. We craft learning experiences that students remember and engage with.</p>

                <div className="flex-1 relative">
                  <div className="relative overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-gradient-to-br from-white to-gray-50 h-full">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-radial"></div>

                    {/* Main content */}
                    <div className="relative h-full flex flex-col p-4">
                      {/* Header with "We Create" */}
                      <div className="mb-0">
                        <div className="inline-flex items-center gap-3 mb-4">
                          <h4 className="text-2xl font-light tracking-tight text-gray-900">We Teach</h4>
                        </div>
                      </div>

                      {/* Service cards in grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 p-4 ring-1 ring-lime-200 hover:ring-lime-300 transition-all hover:scale-[1.02]">
                          <div className="flex gap-2 mb-2 items-center">
                            <span className="text-sm font-medium text-gray-900">Curriculum Builder</span>
                          </div>
                          <div className="space-y-1">
                            <div className="h-1.5 rounded-full bg-lime-300 w-full"></div>
                            <div className="h-1.5 rounded-full bg-lime-200 w-2/3"></div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 p-4 ring-1 ring-lime-200 hover:ring-lime-300 transition-all hover:scale-[1.02]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">Interactive Modules</span>
                          </div>
                          <div className="space-y-1">
                            <div className="h-1.5 rounded-full bg-lime-300 w-4/5"></div>
                            <div className="h-1.5 rounded-full bg-lime-200 w-full"></div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 p-4 ring-1 ring-fuchsia-200 hover:ring-fuchsia-300 transition-all hover:scale-[1.02]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">Engagement Tactics</span>
                          </div>
                          <div className="space-y-1">
                            <div className="h-1.5 rounded-full bg-fuchsia-300 w-3/4"></div>
                            <div className="h-1.5 rounded-full bg-fuchsia-200 w-1/2"></div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 p-4 ring-1 ring-fuchsia-200 hover:ring-fuchsia-300 transition-all hover:scale-[1.02]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">Assessment Design</span>
                          </div>
                          <div className="space-y-1">
                            <div className="h-1.5 rounded-full bg-fuchsia-300 w-5/6"></div>
                            <div className="h-1.5 rounded-full bg-fuchsia-200 w-3/4"></div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom visual element with progress indicator */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Learning Process</span>
                          <span className="text-xs text-gray-500">85% Complete</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Course development in progress</p>
                          </div>
                          <button className="h-8 w-8 hover:bg-fuchsia-700 flex transition-colors bg-fuchsia-600 rounded-full items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white">
                              <path d="M7 7h10v10" />
                              <path d="M7 17 17 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Stats */}
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-teal-400 mb-2">
                50+
              </div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Happy Educators</div>
            </div>
            <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400 mb-2">
                12
              </div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">EdTech Awards</div>
            </div>
            <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-yellow-400 mb-2">
                ∞
              </div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Learning Hours</div>
            </div>
            <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-lime-300 hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-lime-400 to-green-400 mb-2">
                100%
              </div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Student Success</div>
            </div>
          </div>

          {/* Right Side - Radial Timeline */}
          <div className="h-[600px] rounded-3xl overflow-hidden border-2 border-gray-200 bg-gray-50">
            <RadialOrbitalTimelineDemo />
          </div>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" className="bg-black text-white py-24 px-6 rounded-t-[3rem] mt-12 relative overflow-hidden">
        {/* Footer Blob */}
        <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-indigo-900/50 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            <div>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-none mb-8">
                Ready to <br />
                <span className="text-fuchsia-400">make magic?</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-md mb-10">
                Got a transformative learning idea? We love innovation. Drop us a line and let&apos;s build something extraordinary together.
              </p>

              <a
                href="mailto:hello@classera.io"
                className="inline-flex items-center gap-4 text-3xl font-medium border-b-2 border-white/20 pb-2 hover:border-fuchsia-400 hover:text-fuchsia-400 transition-all"
              >
                hello@classera.io
                <Send className="w-8 h-8" />
              </a>
            </div>

            {/* Contact Form */}
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-2">Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-2">Email</label>
                    <input
                      type="email"
                      placeholder="john@school.com"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    />
                  </div>
                </div>  

                <div className="space-y-4">
                  <label className="text-sm font-medium text-slate-300 ml-2">I&apos;m interested in...</label>
                  <div className="flex flex-wrap gap-3">
                    {['Course Design', 'Student Engagement', 'Platform Development'].map((interest) => (
                      <label key={interest} className="cursor-pointer">
                        <input type="checkbox" className="peer sr-only" />
                        <span className="inline-block px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-medium text-slate-300 peer-checked:bg-fuchsia-500 peer-checked:text-white peer-checked:border-fuchsia-500 transition-all hover:bg-white/20">
                          {interest}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-2">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your project..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all resize-none"
                  ></textarea>
                </div>

                <button className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-fuchsia-400 transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-slate-500">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold">
                C
              </div>
              <span className="font-semibold text-white">Classera © 2024</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Dribbble
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Marquee Animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
