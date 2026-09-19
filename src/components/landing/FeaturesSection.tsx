import {
  Brain, BookOpen, Users, Shield, Video, BarChart3, GitBranch, ClipboardCheck,
} from 'lucide-react';

/**
 * Landing features - Classera design system v2.
 *
 * Soft pastel cards on a white canvas, following the reference job/course card
 * grids: each card is one tint, tints never repeat side by side, ink text
 * throughout, generous 24px radius and no gradients or hover-lift.
 *
 * The two large cards lead because they are the product's real anchors (live
 * classrooms and analytics); the six smaller ones fill out the capability set.
 */

const LEAD = [
  {
    icon: Video,
    title: 'Live virtual classrooms',
    body: 'Run scheduled or ad-hoc sessions with recording, attendance and in-call chat. Nothing to install for students.',
    tint: 'var(--cl-tint-blue)',
    points: ['HD video + screen share', 'Automatic attendance', 'Session recordings'],
  },
  {
    icon: BarChart3,
    title: 'Analytics that mean something',
    body: 'See who is falling behind before the assessment does. Progress, engagement and score trends per learner and per cohort.',
    tint: 'var(--cl-tint-lavender)',
    points: ['Per-learner progress', 'Cohort comparisons', 'Early-risk flags'],
  },
];

const FEATURES = [
  { icon: Brain, title: 'Smart grading', description: 'AI-assisted grading returns accurate, instant feedback on every assignment.', tint: 'var(--cl-tint-mint)' },
  { icon: BookOpen, title: 'Course library', description: '500+ ready-made courses and templates across every subject.', tint: 'var(--cl-tint-peach)' },
  { icon: Users, title: 'Collaboration hub', description: 'Group projects, peer reviews and discussion forums built in.', tint: 'var(--cl-tint-pink)' },
  { icon: Shield, title: 'Enterprise security', description: 'Bank-level encryption, GDPR compliance and role-based access.', tint: 'var(--cl-tint-ochre)' },
  { icon: GitBranch, title: 'Real projects', description: 'Assign repositories, review commits and grade against a rubric.', tint: 'var(--cl-tint-blue)' },
  { icon: ClipboardCheck, title: 'Proctored tests', description: 'Timed assessments with question banks and secure delivery.', tint: 'var(--cl-tint-mint)' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-[var(--cl-canvas)] px-4 py-20 md:px-6 md:py-24">
      <div className="mx-auto max-w-[1280px]">

        <div className="mb-12 max-w-2xl">
          <span className="cl-eyebrow">Platform</span>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-[-0.8px] text-[var(--cl-ink)] md:text-[40px] md:tracking-[-1px]">
            Everything a cohort needs, in one place
          </h2>
          <p className="mt-4 text-[17px] leading-[1.6] text-[var(--cl-muted)]">
            Teach, assess, mentor and measure without moving between tools.
          </p>
        </div>

        {/* Lead cards */}
        <div className="cl-stagger mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {LEAD.map(({ icon: Icon, title, body, tint, points }) => (
            <article
              key={title}
              className="rounded-[var(--cl-r-xl)] p-8"
              style={{ backgroundColor: tint }}
            >
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[var(--cl-r-md)] bg-[var(--cl-surface-card)]">
                <Icon className="h-5 w-5 text-[var(--cl-ink)]" aria-hidden="true" />
              </span>
              <h3 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.3px] text-[var(--cl-ink)]">
                {title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[var(--cl-body)]">{body}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {points.map((p) => (
                  <li
                    key={p}
                    className="rounded-[var(--cl-r-pill)] bg-[var(--cl-surface-card)] px-3 py-1 text-[13px] font-medium text-[var(--cl-ink)]"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Capability grid */}
        <div className="cl-stagger grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, tint }) => (
            <article
              key={title}
              className="rounded-[var(--cl-r-xl)] p-6"
              style={{ backgroundColor: tint }}
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[var(--cl-r-md)] bg-[var(--cl-surface-card)]">
                <Icon className="h-4.5 w-4.5 text-[var(--cl-ink)]" aria-hidden="true" />
              </span>
              <h3 className="text-[17px] font-semibold leading-[1.4] tracking-normal text-[var(--cl-ink)]">
                {title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[var(--cl-body)]">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
