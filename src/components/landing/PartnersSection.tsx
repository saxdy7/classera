'use client';

import { Slack, ChevronsRight, Command, Figma, Asterisk, Link, Aperture, ToggleRight, Atom } from 'lucide-react';

function PartnersSection() {
    return (
        <section className="overflow-visible max-w-7xl mx-auto pt-24 px-6 pb-64 relative">
            {/* Global Styles for Animations */}
            <style jsx global>{`
        @keyframes flow-custom {
          to {
            stroke-dashoffset: -1000;
          }
        }

        .animate-flow-custom {
          animation: flow-custom 10s linear infinite;
        }

        @keyframes scanner {
          0%, 100% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-scanner {
          animation: scanner 3s ease-in-out infinite;
        }

        /* Lottie-like Smooth Animations */
        @keyframes lottieDraw {
          0% {
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
            opacity: 0.5;
          }
          40% {
            opacity: 1;
          }
          100% {
            stroke-dasharray: 60;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes lottiePop {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        @keyframes lottieFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes lottieWiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-8deg);
          }
          75% {
            transform: rotate(8deg);
          }
        }

        @keyframes lottieRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes lottieSlideRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          50% {
            transform: translateX(4px);
            opacity: 0.8;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes lottieSwitch {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(3px);
          }
        }

        /* Class Applications */
        .lottie-stroke path,
        .lottie-stroke rect,
        .lottie-stroke circle,
        .lottie-stroke line,
        .lottie-stroke polyline {
          animation: lottieDraw 3s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
          stroke-dasharray: 60;
        }

        /* Specific Icon Behaviors */
        .anim-slack {
          animation: lottieWiggle 3s ease-in-out infinite;
        }

        .anim-chevron {
          animation: lottieSlideRight 2s ease-in-out infinite;
        }

        .anim-command {
          animation: lottiePop 2.5s ease-in-out infinite;
        }

        .anim-figma {
          animation: lottieFloat 3.5s ease-in-out infinite;
        }

        .anim-asterisk {
          animation: lottieRotate 8s linear infinite;
        }

        .anim-link {
          animation: lottiePop 3s ease-in-out infinite reverse;
        }

        .anim-aperture {
          animation: lottieRotate 12s linear infinite reverse;
        }

        .anim-toggle {
          animation: lottieSwitch 2s ease-in-out infinite;
        }
      `}</style>

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent opacity-40"></div>
                <div className="absolute top-24 left-24 h-0.5 w-0.5 bg-violet-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-48 right-1/4 h-1 w-1 bg-blue-400/20 rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-1/3 h-0.5 w-0.5 bg-fuchsia-400 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header Content */}
            <div className="relative z-10 text-center mb-20">
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    Trusted Integrations
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-slate-600 leading-relaxed">
                    Seamlessly connect with the tools you already love. Our platform integrates with leading educational technology providers.
                </p>
            </div>

            {/* Interactive Grid & Flow Visualization */}
            <div className="max-w-5xl mx-auto relative">
                {/* Flow Schema (Desktop) */}
                <svg className="absolute inset-0 -top-12 h-[1000px] w-full pointer-events-none hidden md:block overflow-visible z-0" preserveAspectRatio="none" viewBox="0 0 1000 800">
                    <defs>
                        <linearGradient id="blueFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Static faint tracks */}
                    <path d="M 125,280 C 125,550 480,500 500,680" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1"></path>
                    <path d="M 375,280 C 375,550 490,500 500,680" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1"></path>
                    <path d="M 625,280 C 625,550 510,500 500,680" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1"></path>
                    <path d="M 875,280 C 875,550 520,500 500,680" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1"></path>

                    {/* Animated Data Flow Lines (Base Gradient) */}
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="200, 400"
                        strokeDashoffset="0"
                        d="M 125,280 C 125,550 480,500 500,680"
                        fill="none"
                        stroke="url(#blueFlowGradient)"
                        strokeWidth="2"
                        style={{ animationDuration: '8s', opacity: 0.4 }}
                    />
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="200, 400"
                        strokeDashoffset="-200"
                        d="M 375,280 C 375,550 490,500 500,680"
                        fill="none"
                        stroke="url(#blueFlowGradient)"
                        strokeWidth="2"
                        style={{ animationDuration: '10s', opacity: 0.4 }}
                    />
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="200, 400"
                        strokeDashoffset="-100"
                        d="M 625,280 C 625,550 510,500 500,680"
                        fill="none"
                        stroke="url(#blueFlowGradient)"
                        strokeWidth="2"
                        style={{ animationDuration: '9s', opacity: 0.4 }}
                    />
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="200, 400"
                        strokeDashoffset="-300"
                        d="M 875,280 C 875,550 520,500 500,680"
                        fill="none"
                        stroke="url(#blueFlowGradient)"
                        strokeWidth="2"
                        style={{ animationDuration: '11s', opacity: 0.4 }}
                    />

                    {/* Animated Data Packets (Bright, Fast, Glowing) */}
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="20, 600"
                        strokeDashoffset="0"
                        d="M 125,280 C 125,550 480,500 500,680"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        filter="url(#glow)"
                        strokeLinecap="round"
                        style={{ animationDuration: '4s', opacity: 1 }}
                    />
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="20, 600"
                        strokeDashoffset="-200"
                        d="M 375,280 C 375,550 490,500 500,680"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        filter="url(#glow)"
                        strokeLinecap="round"
                        style={{ animationDuration: '5s', opacity: 1 }}
                    />
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="20, 600"
                        strokeDashoffset="-100"
                        d="M 625,280 C 625,550 510,500 500,680"
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="3"
                        filter="url(#glow)"
                        strokeLinecap="round"
                        style={{ animationDuration: '4.5s', opacity: 1 }}
                    />
                    <path
                        className="animate-flow-custom"
                        strokeDasharray="20, 600"
                        strokeDashoffset="-300"
                        d="M 875,280 C 875,550 520,500 500,680"
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="3"
                        filter="url(#glow)"
                        strokeLinecap="round"
                        style={{ animationDuration: '6s', opacity: 1 }}
                    />
                </svg>

                {/* Logo Grid */}
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 z-10 mb-20 relative">
                    {/* Row 1 */}
                    {[
                        { Icon: Slack, animation: 'anim-slack', name: 'Slack' },
                        { Icon: ChevronsRight, animation: 'anim-chevron', name: 'API' },
                        { Icon: Command, animation: 'anim-command', name: 'Command' },
                        { Icon: Figma, animation: 'anim-figma', name: 'Figma' },
                        { Icon: Asterisk, animation: 'anim-asterisk', name: 'Asterisk' },
                        { Icon: Link, animation: 'anim-link', name: 'Link' },
                        { Icon: Aperture, animation: 'anim-aperture', name: 'Aperture' },
                        { Icon: ToggleRight, animation: 'anim-toggle', name: 'Toggle' }
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="group flex transition-all duration-300 hover:bg-violet-50 hover:border-violet-400 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden bg-white w-full h-24 border-slate-200 border relative items-center justify-center rounded-lg"
                        >
                            {/* Corner Decorations */}
                            <div className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-violet-300 group-hover:w-2.5 group-hover:h-2.5 group-hover:border-violet-500 transition-all"></div>
                            <div className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-violet-300 group-hover:w-2.5 group-hover:h-2.5 group-hover:border-violet-500 transition-all"></div>
                            <div className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-violet-300 group-hover:w-2.5 group-hover:h-2.5 group-hover:border-violet-500 transition-all"></div>
                            <div className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-violet-300 group-hover:w-2.5 group-hover:h-2.5 group-hover:border-violet-500 transition-all"></div>

                            {/* Icon */}
                            <div className={item.animation}>
                                <item.Icon className="h-8 w-8 text-slate-600 group-hover:text-violet-600 transition-all duration-300 lottie-stroke" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Central Convergence Hub */}
                <div className="flex mt-32 z-20 relative justify-center">
                    <div className="flex relative items-center justify-center">
                        {/* Connection Tip & Beam */}
                        <div className="absolute -top-32 h-32 w-[2px] bg-gradient-to-b from-transparent via-violet-500/50 to-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] overflow-hidden">
                            <div className="absolute inset-0 bg-white/50 w-full h-1/2 animate-scanner blur-[2px]"></div>
                        </div>

                        {/* Core Icon Wrapper with Orbital Rings */}
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_0_50px_rgba(139,92,246,0.3)] border border-violet-300">
                            {/* Outer Spinning Ring */}
                            <div className="absolute inset-[-10px] rounded-full border border-violet-400/30 border-dashed animate-[spin_10s_linear_infinite]"></div>

                            {/* Inner Reverse Spinning Ring */}
                            <div className="absolute inset-[-4px] rounded-full border border-violet-500/40 border-dotted animate-[spin_15s_linear_infinite_reverse]"></div>

                            {/* Pulsing Glow */}
                            <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl animate-pulse"></div>

                            {/* Icon (Lottie Style) */}
                            <div className="relative z-10 animate-[pulse_3s_ease-in-out_infinite]">
                                <Atom className="h-10 w-10 text-violet-600 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] lottie-stroke" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default PartnersSection;
