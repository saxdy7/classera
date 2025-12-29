import RadialOrbitalTimelineDemo from '@/components/demo/radial-orbital-timeline-demo';

export default function StatsSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side - Stats */}
        <div className="grid grid-cols-2 gap-6 text-center animate-fade-in-up">
          <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-teal-400 mb-2">
              50+
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Happy Educators</div>
          </div>
          <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400 mb-2">
              12
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">EdTech Awards</div>
          </div>
          <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-orange-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-yellow-400 mb-2">
              ∞
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Learning Hours</div>
          </div>
          <div className="p-8 border-2 border-gray-200 rounded-3xl bg-white hover:border-lime-300 hover:shadow-2xl hover:shadow-lime-500/20 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-lime-400 to-green-400 mb-2">
              100%
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Student Success</div>
          </div>
        </div>

        {/* Right Side - Radial Timeline */}
        <div className="h-[600px] rounded-3xl overflow-hidden border-2 border-gray-200 bg-gray-50 animate-fade-in-up stagger-3">
          <RadialOrbitalTimelineDemo />
        </div>
      </div>
    </section>
  );
}
