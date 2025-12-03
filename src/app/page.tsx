'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Menu, Star, Music, Play, Check, Send, Layers, Code2, Megaphone, ArrowUpRight } from 'lucide-react';

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

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wide mb-8 hover:bg-orange-200 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></span>
            Freshly Baked Learning
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tight leading-[0.9] mb-8 text-slate-900">
            We craft <br />
            <span className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text italic pr-4">
              digital learning.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12">
            Classera is the learning platform for educators who refuse to be boring. We mix pedagogy with technology to build experiences that inspire.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
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

      {/* Services / Capabilities */}
      <section id="services" className="py-24 px-6 bg-slate-50 rounded-[3rem] mx-4 mb-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-fuchsia-600 font-semibold tracking-widest uppercase text-xs mb-4 block">
              Our Expertise
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
              We don&apos;t just make it look good. We make it work.
            </h2>
            <p className="text-slate-600 text-lg md:text-xl">
              Combining data-driven pedagogy with &quot;whoa, that&apos;s cool&quot; design.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Course Design</h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                Learning experiences that feel intuitive. We design courses that scale and interfaces that delight learners on every click.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Check className="w-4 h-4 text-blue-500" /> Curriculum Builder
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Check className="w-4 h-4 text-blue-500" /> Interactive Modules
                </li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-900 text-white p-10 rounded-[2rem] shadow-xl transform md:-translate-y-4">
              <div className="w-14 h-14 bg-fuchsia-500/20 rounded-2xl flex items-center justify-center mb-8 text-fuchsia-400">
                <Code2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Platform Development</h3>
              <p className="text-slate-400 leading-relaxed mb-8">
                Clean code, fast load times, and buttery smooth learning experiences. We build with the latest tech stack.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                  <Check className="w-4 h-4 text-fuchsia-500" /> React & Next.js
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                  <Check className="w-4 h-4 text-fuchsia-500" /> Real-Time Video
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                  <Check className="w-4 h-4 text-fuchsia-500" /> Cloud Infrastructure
                </li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-lime-100 rounded-2xl flex items-center justify-center mb-8 text-lime-600 group-hover:scale-110 transition-transform duration-300">
                <Megaphone className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Learning Strategy</h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                Finding your teaching voice in a crowded space. We craft learning experiences that students remember and engage with.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Check className="w-4 h-4 text-lime-500" /> Engagement Tactics
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Check className="w-4 h-4 text-lime-500" /> Assessment Design
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-6">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-teal-400 mb-2">
              50+
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Happy Educators</div>
          </div>
          <div className="p-6">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400 mb-2">
              12
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">EdTech Awards</div>
          </div>
          <div className="p-6">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-yellow-400 mb-2">
              ∞
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Learning Hours</div>
          </div>
          <div className="p-6">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-lime-400 to-green-400 mb-2">
              100%
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Student Success</div>
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
