import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Check, Play } from 'lucide-react';

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 px-6 bg-[var(--cl-canvas-soft)] dark:bg-[var(--cl-surface-inverse)] rounded-[3rem] mx-4 mb-4">
      <div className="max-w-7xl sm:px-6 lg:px-8 mx-auto pt-12 pb-12">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-tighter leading-none text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">
            <span className="flex items-center justify-center gap-4">
              OUR
              <span className="inline-flex bg-[var(--cl-primary-soft)] dark:bg-[var(--cl-surface-card)] rounded-full p-2">
                <ArrowUpRight className="w-6 h-6 text-[var(--cl-primary)]" />
              </span>
              EXPERTISE
            </span>
          </h2>
          <h2 className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-tighter leading-none text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">
            <span className="flex items-center justify-center gap-4">
              LEARNING
              <span className="inline-flex bg-[var(--cl-primary-soft)] dark:bg-[var(--cl-surface-card)] rounded-full p-2">
                <ArrowUpRight className="w-6 h-6 text-[var(--cl-primary)]" />
              </span>
              PLATFORM
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Card */}
          <div className="lg:col-span-1">
            <div className="lg:min-h-[520px] flex flex-col ring-1 ring-[var(--cl-hairline)] dark:ring-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] rounded-[var(--cl-r-xl)] p-6">
              <div className="flex items-baseline gap-2">
                <span className="sm:text-6xl text-5xl font-light text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] tracking-tighter">50+</span>
                <span className="text-[var(--cl-primary)] dark:text-[var(--cl-primary)]">courses</span>
              </div>
              <p className="text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mt-3">
                Learning experiences that feel intuitive. We design courses that scale and interfaces that delight learners on every click.
              </p>

              <div className="mt-6 overflow-hidden rounded-[var(--cl-r-xl)] ring-1 ring-[var(--cl-hairline)] dark:ring-[var(--cl-hairline-strong)]">
                <div className="relative w-full h-44 sm:h-56 bg-[var(--cl-canvas-soft)] dark:bg-[var(--cl-surface-inverse)]">
                  <div className="relative h-full w-full p-4 sm:p-5 flex flex-col">
                    <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)]">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[var(--cl-primary)] text-[var(--cl-on-dark)] flex items-center justify-center text-sm font-medium">
                          ED
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] text-sm sm:text-base font-medium">Course Builder</span>
                          <span className="text-xs text-[var(--cl-muted)] dark:text-[var(--cl-muted)]">Active</span>
                        </div>
                      </div>
                      <span className="text-sm text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">Curriculum</span>
                    </div>

                    <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)] flex items-center justify-center text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">
                          <Check className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2.5 rounded-full bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)]" />
                          <div className="mt-2 h-2.5 w-2/5 rounded-full bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)]" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="mt-4 h-8 w-full rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-strong)] dark:bg-[var(--cl-surface-inverse)]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <a
                  href="/signin"
                  className="inline-flex gap-2 hover:bg-[var(--cl-primary)] transition-colors text-sm font-medium text-[var(--cl-on-dark)] bg-[var(--cl-primary)] rounded-full py-2.5 px-4 items-center"
                >
                  Build a Course
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="lg:col-span-1 lg:min-h-[520px] flex flex-col">
            <div className="text-center space-y-6 mb-8">
              <p className="sm:text-xl text-lg text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">
                We do not just make it look good, we make it work: data-driven pedagogy paired with genuinely engaging design.
              </p>

              <div className="flex flex-wrap gap-3 items-center justify-center">
                <a
                  href="/signin"
                  className="inline-flex gap-2 hover:bg-[var(--cl-primary)] transition-colors text-sm font-medium text-[var(--cl-on-dark)] bg-[var(--cl-surface-inverse)] dark:bg-[var(--cl-surface-card)] dark:text-[var(--cl-on-primary)] rounded-full py-2.5 px-4 items-center"
                >
                  Get Started
                </a>
                <button className="inline-flex gap-2 hover:bg-[var(--cl-surface-strong)] dark:hover:bg-[var(--cl-surface-inverse)] transition-colors text-sm font-medium text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] border border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] rounded-full py-2.5 px-4 items-center">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="text-[var(--cl-on-dark)] bg-[var(--cl-surface-inverse)] dark:bg-[var(--cl-surface-inverse)] rounded-[var(--cl-r-xl)] mt-auto p-6 space-y-4">
              <div className="mb-4 space-y-6">
                <div className="relative h-40 sm:h-48">
                  <div className="absolute -left-2 top-2 sm:-left-1 sm:top-0 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-1 rotate-[-12deg]">
                    <Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Educator" className="w-full h-full object-cover rounded-[var(--cl-r-lg)]" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute -right-1 top-4 sm:right-0 sm:top-2 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-1 rotate-[12deg]">
                    <Image src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80" alt="Developer" className="w-full h-full object-cover rounded-[var(--cl-r-lg)]" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute left-2 bottom-0 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-1 rotate-[10deg]">
                    <Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" alt="Engineer" className="w-full h-full object-cover rounded-[var(--cl-r-lg)]" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute right-1 bottom-1 w-28 h-24 sm:w-32 sm:h-28 ring-1 ring-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-1 rotate-[-8deg]">
                    <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" alt="Designer" className="w-full h-full object-cover rounded-[var(--cl-r-lg)]" width={128} height={112} unoptimized />
                  </div>
                  <div className="absolute inset-0 w-40 h-32 sm:w-48 sm:h-36 ring-1 ring-[var(--cl-hairline-strong)] z-10 bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] m-auto p-1">
                    <Image src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" alt="Lead educator" className="w-full h-full object-cover rounded-[var(--cl-r-lg)]" width={192} height={144} unoptimized />
                  </div>
                </div>
                <p className="text-[var(--cl-muted-soft)] mt-4">
                  <span className="sm:text-6xl text-5xl font-light text-[var(--cl-on-dark)] tracking-tighter">15+</span> educators
                </p>
              </div>

              <p className="text-sm text-[var(--cl-muted-soft)]">Clean code, fast load times, and a smooth learning experience on any device.</p>
            </div>
          </div>

          {/* Right Card */}
          <div className="lg:col-span-1">
            <div className="lg:min-h-[520px] flex flex-col ring-1 ring-[var(--cl-hairline)] dark:ring-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] rounded-[var(--cl-r-xl)] p-6">
              <h3 className="text-lg font-semibold mb-2 text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">Learning Strategy</h3>
              <p className="text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mt-3 mb-8">
                Finding your teaching voice in a crowded space. We craft learning experiences that students remember and engage with.
              </p>

              <div className="flex-1 relative">
                <div className="relative overflow-hidden rounded-[var(--cl-r-xl)] ring-1 ring-[var(--cl-hairline)] dark:ring-[var(--cl-hairline-strong)] bg-[var(--cl-canvas-soft)] dark:bg-[var(--cl-surface-inverse)] h-full">
                  <div className="relative h-full flex flex-col p-4">
                    <h4 className="text-2xl font-light tracking-tight text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] mb-4">We Teach</h4>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {['Curriculum Builder', 'Interactive Modules', 'Engagement Tactics', 'Assessment Design'].map((label) => (
                        <div
                          key={label}
                          className="group relative overflow-hidden rounded-[var(--cl-r-lg)] bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] p-4 ring-1 ring-[var(--cl-hairline)] dark:ring-[var(--cl-hairline-strong)] hover:ring-[var(--cl-primary)] dark:hover:ring-[var(--cl-primary)] transition-all hover:scale-[1.02]"
                        >
                          <span className="text-sm font-medium text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">{label}</span>
                          <div className="mt-2 space-y-1">
                            <div className="h-1.5 rounded-full bg-[var(--cl-primary)] dark:bg-[var(--cl-primary)] w-full" />
                            <div className="h-1.5 rounded-full bg-[var(--cl-primary)] dark:bg-[var(--cl-primary)] w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] uppercase tracking-wide">Learning Process</span>
                        <span className="text-xs text-[var(--cl-muted)] dark:text-[var(--cl-muted)]">85% complete</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="flex-1 text-xs text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)]">Course development in progress</p>
                        <div className="h-8 w-8 flex bg-[var(--cl-primary)] rounded-full items-center justify-center">
                          <ArrowUpRight className="w-3.5 h-3.5 text-[var(--cl-on-dark)]" />
                        </div>
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
