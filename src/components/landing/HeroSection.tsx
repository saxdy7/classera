import { ArrowRight, Play, Sparkles, Users, Video, CheckCircle2 } from 'lucide-react';

/**
 * Landing hero - Classera design system v2.
 *
 * Follows the reference dashboards rather than the old marketing treatment:
 * white canvas, one black pill CTA paired with a white secondary, and a real
 * product preview built from the same tokens the app uses - so the hero shows
 * the actual interface instead of an abstract illustration.
 *
 * The previous version leaned on large fuchsia blur blobs, gradient CTAs and
 * scale-on-hover. All three are gone: this system has one action colour, no
 * gradients, and no lift.
 */
export default function HeroSection() {
  return (
    <header className="relative overflow-hidden bg-[var(--cl-canvas)] px-4 pb-16 pt-32 md:px-6 md:pt-28 lg:pb-24">
      <div className="relative z-10 mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">

          {/* Copy */}
          <div className="cl-rise text-center lg:text-left">
            <span className="mb-7 inline-flex items-center gap-2 rounded-[var(--cl-r-pill)] border border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)] px-3 py-1.5 text-[13px] font-medium text-[var(--cl-body)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Live classes and an LMS in one place
            </span>

            <h1 className="mb-6 text-[40px] font-semibold leading-[1.05] tracking-[-1.5px] text-[var(--cl-ink)] sm:text-[52px] lg:text-[64px] lg:tracking-[-2px]">
              Teach live.
              <br />
              Track everything.
            </h1>

            <p className="mx-auto mb-9 max-w-xl text-[17px] leading-[1.6] text-[var(--cl-muted)] lg:mx-0 lg:text-[18px]">
              Classera pairs live video classrooms with course building, projects,
              assessments and analytics — so you can run a cohort end to end
              without stitching five tools together.
            </p>

            <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
              <a
                href="/signin"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--cl-r-pill)] bg-[var(--cl-primary)] px-7 text-[15px] font-semibold text-[var(--cl-on-primary)] transition-colors duration-[var(--cl-dur-micro)] hover:bg-[var(--cl-primary-active)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.2)] sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform duration-[var(--cl-dur-micro)] group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <a
                href="#features"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--cl-r-pill)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] px-6 text-[15px] font-semibold text-[var(--cl-ink)] transition-colors duration-[var(--cl-dur-micro)] hover:bg-[var(--cl-canvas-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)] sm:w-auto"
              >
                <Play className="h-4 w-4 text-[var(--cl-muted)]" aria-hidden="true" />
                See how it works
              </a>
            </div>

            {/* Proof row - mono figures, per the system's rule on comparable numbers */}
            <dl className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:justify-start">
              {[
                { v: '12k+', l: 'Learners' },
                { v: '480', l: 'Mentors' },
                { v: '4.8', l: 'Avg. rating' },
              ].map((s) => (
                <div key={s.l} className="flex items-baseline gap-2">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="cl-mono text-[20px] font-medium text-[var(--cl-ink)]">{s.v}</dd>
                  <span aria-hidden="true" className="text-[14px] text-[var(--cl-muted)]">{s.l}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Product preview - built from the same tokens as the real app */}
          <div className="cl-fade relative">
            <div className="overflow-hidden rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] shadow-[var(--cl-shadow-float)]">
              {/* window chrome */}
              <div className="flex items-center gap-2 border-b border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b5a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#e8b94a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#a4d4c5]" />
                <span className="ml-3 text-[12px] text-[var(--cl-muted)]">Classera — Dashboard</span>
              </div>

              <div className="space-y-4 p-5">
                {/* stat row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Courses', v: '12', tint: 'var(--cl-tint-blue)' },
                    { l: 'Sessions', v: '34', tint: 'var(--cl-tint-mint)' },
                    { l: 'Projects', v: '08', tint: 'var(--cl-tint-lavender)' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-[var(--cl-r-md)] p-3" style={{ backgroundColor: s.tint }}>
                      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[var(--cl-body)]">{s.l}</p>
                      <p className="cl-mono mt-1 text-[22px] font-medium text-[var(--cl-ink)]">{s.v}</p>
                    </div>
                  ))}
                </div>

                {/* live session row */}
                <div className="flex items-center gap-3 rounded-[var(--cl-r-md)] border border-[var(--cl-hairline)] p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[var(--cl-r-sm)] bg-[var(--cl-surface-strong)]">
                    <Video className="h-4 w-4 text-[var(--cl-ink)]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[var(--cl-ink)]">Data Structures — Live</p>
                    <p className="text-[12px] text-[var(--cl-muted)]">Starts in 12 min</p>
                  </div>
                  <span className="rounded-[var(--cl-r-pill)] bg-[rgba(22,163,74,0.12)] px-2.5 py-1 text-[12px] font-medium text-[var(--cl-success)]">
                    Live
                  </span>
                </div>

                {/* roster rows */}
                {[
                  { n: 'Assignment reviewed', m: 'Ananya · 2m ago', done: true },
                  { n: 'New mentor request', m: 'Rahul · 18m ago', done: false },
                ].map((r) => (
                  <div key={r.n} className="flex items-center gap-3 rounded-[var(--cl-r-md)] px-1 py-1.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[var(--cl-r-pill)] bg-[var(--cl-surface-strong)]">
                      {r.done
                        ? <CheckCircle2 className="h-4 w-4 text-[var(--cl-success)]" aria-hidden="true" />
                        : <Users className="h-4 w-4 text-[var(--cl-muted)]" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[var(--cl-ink)]">{r.n}</p>
                      <p className="text-[12px] text-[var(--cl-muted)]">{r.m}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
