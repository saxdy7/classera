# Prompt — Redesign the Classera dashboard

Paste everything below the line into Claude. It is written to be self-contained:
Claude does not need the repo to produce something that will drop straight in.

---

You are designing the **main dashboard** for **Classera**, a learning platform
where university students work with mentors. Produce a **React + Tailwind
artifact** I can view and iterate on.

## Product context

Classera combines live video classrooms with an LMS. Two roles:

- **Student** — takes courses, sits proctored tests, ships projects, joins live
  sessions and communities, works with mentors.
- **Mentor** — runs tests, reviews projects, manages students and communities.

Design the **student dashboard** as the primary deliverable, then a **mentor
dashboard** using the same system.

The dashboard is the landing screen after sign-in. Its job is to answer, in
about three seconds: *what needs my attention today, and how am I tracking?*

## Design system — follow exactly, do not invent new values

This is a real, shipping system. Use these tokens verbatim (they exist as CSS
variables; write them as `var(--cl-…)`).

**Colour**
| Role | Token | Value |
|---|---|---|
| Action (the ONLY action colour) | `--cl-primary` | `#0a0a0a` |
| Action pressed | `--cl-primary-active` | `#1f1f1f` |
| Text on action | `--cl-on-primary` | `#ffffff` |
| Headings | `--cl-ink` | `#0a0a0a` |
| Body text | `--cl-body` | `#3d4046` |
| Secondary text | `--cl-muted` | `#5c6067` |
| Disabled only (never body copy) | `--cl-muted-soft` | `#7a7f87` |
| Page canvas | `--cl-canvas` | `#ffffff` |
| Recessed surface | `--cl-canvas-soft` | `#f7f8fa` |
| Card | `--cl-surface-card` | `#ffffff` |
| Chip / plate | `--cl-surface-strong` | `#f1f2f4` |
| Dark panel | `--cl-surface-inverse` | `#101114` |
| Hairline | `--cl-hairline` | `#e3e5e8` |
| Stronger hairline | `--cl-hairline-strong` | `#c9ccd1` |
| Inline link only | `--cl-text-link` | `#0d74ce` |
| Success / Error / Warning / Info | | `#16a34a` / `#ef4444` / `#ab6400` / `#0d74ce` |

**Soft tints — for category cards only** (never as button fills):
peach `#ffe8d9` · mint `#d9f0e3` · lavender `#e9e2fb` · blue `#dceafd` ·
pink `#fde3ea` · ochre `#fdf0d0`

**Radius:** 6 / 8 / **12 (controls)** / **16 (cards)** / **24 (feature cards)** / pill

**Depth:** exactly one card shadow `0 4px 12px rgba(0,0,0,0.04)`, deepening to
`0 6px 16px rgba(0,0,0,0.06)` on hover. Modals only: `0 12px 32px rgba(0,0,0,0.10)`.

**Type:** Inter. Headings **weight 500–600 only, never 700+**, with negative
tracking on display sizes. Page title 32–40px. Card titles 17–18px/600. Body
15–16px. **JetBrains Mono with tabular figures for every number that gets
compared** — scores, counts, durations, percentages.

**Motion:** 150ms micro / 250ms panels, `cubic-bezier(0.4,0,0.2,1)`. Animate
`opacity` and `transform` only. Honour `prefers-reduced-motion`.

## Hard constraints

- **Light only.** No dark mode, no `dark:` variants.
- **No gradients anywhere.** No glassmorphism, no blur washes, no glow.
- **Black is the only action colour.** No coloured CTAs. One primary per view.
- **Colour arrives as large soft surfaces**, not as accents on text or buttons.
- Controls are **44px** tall. Touch targets ≥44px.
- Body text ≥ 4.5:1 contrast. Ink on white is 19.6:1. On tinted cards use ink,
  never white.
- Visible focus ring on every interactive element: 3px `rgba(10,10,10,0.12)`.
- Shell already exists — **design the content area only**: fixed **260px** left
  sidebar, **64px** top header. Content sits to the right and below.

## Real data available — design for exactly this, invent nothing

**Student**
- `firstName`, `universityName`
- `courseCount` — enrolled courses (integer, may be `—` if unavailable)
- `sessionCount` — live sessions joined
- `submissions[]` — up to 50 test submissions: `{ percentage, score, max_score, submitted_at, test: { title } }`
- `avgScore` — mean percentage, or `null` when there are no submissions
- `scoreTrend` — last 8 submissions as `{ label, score }`
- `recentResults` — last 5 submissions, newest first
- `mentors[]` — up to 8: `{ full_name, avatar_url, specialization_board, bio }`
- `conversations[]` — up to 5: `{ user: { full_name, avatar_url }, lastMessage, time, unread }`

**Mentor**
- `liveTestsCount`, `avgScore`, `submissionsByDay`, `topStudents[]`, plus students and communities counts

Current sections (improve the arrangement, keep the substance):
Student — 4 stat cards (Courses · Tests Taken · Avg Score · Sessions), quick
actions, score-trend chart, recent results, recommended mentors, messages, calendar.
Mentor — stats, live tests, submissions, top students, communities.

**Empty states matter.** A new student has zero submissions, zero mentors and no
messages. Design that state deliberately — it is what most users see first.

## What I want you to solve

1. **Hierarchy.** Right now everything is a same-weight card. What deserves the
   top-left? What can collapse or move below the fold?
2. **A real answer to "what needs me today?"** — an upcoming session, an overdue
   test, an unread mentor reply.
3. **Make the numbers mean something.** A bare "7%" avg score is alarming with no
   context. Show trend, direction and comparison.
4. **Density.** It should feel calm at 1440px and still work at 1280px.

## Deliverable

A single React artifact, Tailwind, `lucide-react` icons, with:
- Student dashboard (default view)
- A toggle to preview the mentor dashboard
- Realistic mock data **and** an empty-state toggle
- Responsive: 1440 / 1280 / tablet / mobile
- Semantic HTML, real headings, `aria-*` where it matters

Comment any deviation from the constraints above and say why.

Design it as a calm, editorial product surface — closer to Linear or Stripe's
dashboard than to a colourful ed-tech template. Restraint over decoration.
