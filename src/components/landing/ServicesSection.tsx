import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Check, Play } from 'lucide-react';

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 px-6 bg-slate-50 rounded-[3rem] mx-4 mb-4">
      <div className="max-w-7xl sm:px-6 lg:px-8 mx-auto pt-12 pb-12">
        {/* Main Headlines */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 animate-fade-in-up stagger-2">
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
                  <div className="absolute inset-0 pointer-events-none bg-gradient-radial"></div>
                  <div className="relative h-full w-full p-4 sm:p-5 flex flex-col">
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

                    <div className="mt-auto">
                      <div className="mt-4 h-8 w-full rounded-xl bg-gray-300 ring-1 ring-gray-400"></div>
                    </div>
                  </div>

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

            <div className="text-white bg-slate-900 rounded-3xl mt-auto p-6 space-y-4">
              <div className="mb-4 space-y-6">
                <div className="relative h-40 sm:h-48">
                  <div className="absolute -left-2 top-2 sm:-left-1 sm:top-0 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[-12deg]">
                    <Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Educator" className="w-full h-full object-cover rounded-xl" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute -right-1 top-4 sm:right-0 sm:top-2 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[12deg]">
                    <Image src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80" alt="Developer" className="w-full h-full object-cover rounded-xl" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute left-2 bottom-0 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[10deg]">
                    <Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" alt="Engineer" className="w-full h-full object-cover rounded-xl" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute right-1 bottom-1 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-gray-200 bg-white rounded-2xl p-1 shadow-xl rotate-[-8deg]">
                    <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" alt="Designer" className="w-full h-full object-cover rounded-xl" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute inset-0 w-40 h-32 sm:w-48 sm:h-36 ring-1 ring-gray-200 z-10 bg-white rounded-2xl m-auto p-1 shadow-xl">
                    <Image src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" alt="Lead educator" className="w-full h-full object-cover rounded-xl" width={192} height={144} unoptimized />
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
                  <div className="absolute inset-0 pointer-events-none bg-gradient-radial"></div>

                  <div className="relative h-full flex flex-col p-4">
                    <div className="mb-0">
                      <div className="inline-flex items-center gap-3 mb-4">
                        <h4 className="text-2xl font-light tracking-tight text-gray-900">We Teach</h4>
                      </div>
                    </div>

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
  );
}
