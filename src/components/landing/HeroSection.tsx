import { ArrowRight, Play, Sparkles, Code2, Star } from 'lucide-react';
import DisplayCards from '@/components/ui/display-cards';

export default function HeroSection() {
  return (
    <header className="relative pt-40 pb-20 px-6 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[50vw] h-[50vw] bg-purple-200 rounded-full blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[40vw] h-[40vw] bg-lime-200 rounded-full blur-3xl opacity-40 animate-float"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wide mb-8 hover:bg-orange-200 transition-colors cursor-default animate-fade-in-up stagger-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></span>
              Freshly Baked Learning
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.9] mb-8 text-slate-900 animate-fade-in-up stagger-2">
              We craft <br />
              <span className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text italic pr-4">
                digital learning.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed mb-12 animate-fade-in-up stagger-3">
              Classera is the learning platform for educators who refuse to be boring. We mix pedagogy with technology to build experiences that inspire.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center animate-fade-in-up stagger-4">
              <a href="/signin" className="group px-8 py-4 bg-slate-900 text-white rounded-full text-lg font-medium hover:bg-fuchsia-500 hover:scale-105 hover:shadow-2xl hover:shadow-fuchsia-500/40 transition-all duration-500 ease-out shadow-xl shadow-fuchsia-500/20 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </a>
              <button className="group px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-full text-lg font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg transition-all duration-500 ease-out flex items-center gap-2">
                <Play className="w-5 h-5 text-slate-400" />
                Platform Tour
              </button>
            </div>
          </div>

          {/* Right Content - Display Cards */}
          <div className="flex justify-center lg:justify-start lg:ml-40 -mt-8 animate-fade-in-up stagger-3">
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
  );
}
