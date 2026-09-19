# Projects Feature Overhaul — Handoff / Resume Notes

**Status as of stopping point:** Phase 0 and Phase 1 are fully complete and applied (code + live DB migration). Phase 2 is partially done — one item finished, one in progress, four not started.

Full original plan (context, rationale, all decisions): `C:\Users\mamid\.claude\plans\precious-dazzling-hammock.md`

**To resume:** just say "continue" or "pick up where you left off" — this file plus the plan file has everything needed to carry on without re-discovering context.

---

## What prompted this work

User asked to elevate the "Projects" feature (mentor + student dashboards) to the next level. Research (3 parallel exploration agents) found the feature was standing on a broken foundation:
- Two incompatible data models sharing the same `/api/projects/*` URL namespace — a dead "project catalog" system (archived migration) and the real, working "mentor-assignment" system.
- Five student-facing pages 100% broken (querying columns from the dead schema against the live table).
- The student Projects list page showed **hardcoded fake data** ("1,240 commits", "Top 5%", "A+ Market Readiness", canned AI quote, canned mentor feedback) — confirmed via a screenshot the user sent.
- Real bugs: heatmap color bug (every active day rendered identically), dead GitHub webhook route, no way to add students after assignment creation, no rubric visibility for students.

User approved two scope decisions before implementation:
1. **Remove the dead catalog system entirely** (not rebuild it).
2. **Add non-GitHub submission types** (file upload / link / written) alongside GitHub.

---

## ✅ Phase 0 — COMPLETE (dead code removed, real bugs fixed)

**Deleted** (verified zero remaining references before deleting each):
- `src/app/api/projects/route.ts`, `[id]/route.ts`, `submit/route.ts`, `discover/route.ts`
- `src/app/dashboard/student/discover/projects/page.tsx`, `src/components/student/ProjectDiscoveryClient.tsx`
- `src/app/dashboard/student/projects/[id]/edit/`, `repository/`, `src/`, `collaborate/` (all four sub-pages)
- `src/components/projects/RepositoryExplorer.tsx`, `SourceCodeRoadmap.tsx`, `src/components/collaboration/CollabEditor.tsx` (whole dir)
- `src/app/api/github/webhook/route.ts` (dead — referenced a `webhook_logs` table and columns that never existed)

**Live DB cleanup** (via Supabase MCP, verified against the actual live schema, not just migration files):
- Confirmed `projects` / `project_submissions` tables existed live (0 rows) but were fully orphaned after the above deletions → **dropped both tables**.

**Bug fixes:**
- `src/components/projects/ActivityHeatmap.tsx` — `getColor()` returned the same class for every non-zero commit count; now a real 4-step opacity ramp on `--cl-primary`.
- `src/app/dashboard/student/projects/page.tsx` — removed all hardcoded fake stats; now computes real aggregates from `repo_analytics` (total commits, avg score → letter grade) and shows the real latest mentor feedback (or an honest empty state). Also fixed the "Explore Your Project Code" section, which filtered on a column (`project_assignments.github_repo_url`) that doesn't exist — now correctly joins `assignment_submissions.repo_full_name`. Both dead links to the now-deleted `/src` and `/repository` sub-pages were repointed.
- `src/app/dashboard/student/projects/[id]/page.tsx` + `RepoSubmitForm.tsx` (since replaced, see Phase 1) — fixed contradictory "public repo required" vs "private repos accepted" copy.
- New `src/components/projects/StalenessBanner.tsx` — `repo_analytics.is_stale` was written but never read anywhere; added a real >6h-since-`analyzed_at` check with a "Re-analyze" action, wired into the student detail page.

---

## ✅ Phase 1 — COMPLETE (core loop gaps closed)

1. **Add students to an existing assignment** (previously impossible — only settable at creation).
   - New route: `src/app/api/project-assignments/[id]/students/route.ts` (mirrors the working `/api/tests/assign` upsert+notify pattern).
   - New UI: `src/app/dashboard/mentor/projects/[id]/AddStudentsButton.tsx`, wired into the mentor assignment detail page.

2. **Real notifications**, using the existing `notifications` table (verified live columns via Supabase MCP — the table uses `is_read`, not `read`, which several *other* pre-existing call sites in this codebase get wrong; all new inserts here use the correct column):
   - Assignment created / student added → `project_assigned`
   - Student submits → mentor notified (`project_submitted`)
   - Mentor grades/comments → student notified (`project_graded` / `project_feedback`)
   - **Deadline approaching** → new Inngest cron function `projectDeadlineReminder` in `src/inngest/functions.ts` (hourly, 24-48h window, idempotent — checks existing notifications before re-sending), registered in `src/app/api/inngest/route.ts`.

3. **Student-facing rubric visibility** — mentors could already grade against a rubric; students only ever saw one aggregate number. Added a read-only per-criterion breakdown to `src/app/dashboard/student/projects/[id]/page.tsx` (reuses `assignment_rubrics` + `rubric_scores`, same tables the mentor's `EvaluationPanel` already uses).

4. **Non-GitHub submission types** (file upload / link / written), on top of GitHub:
   - Schema: `project_assignments.submission_type` (enum), `assignment_submissions.{submission_url, submission_text, file_url, file_name, deploy_url}` — all live via the new migration (see below).
   - Mentor picks the type in `CreateAssignmentForm.tsx` when creating an assignment.
   - `src/app/api/project-assignments/[id]/submit/route.ts` rewritten to branch on `submission_type`; only GitHub submissions trigger the analysis pipeline.
   - New unified `src/app/dashboard/student/projects/[id]/SubmissionForm.tsx` replaces the old GitHub-only `RepoSubmitForm.tsx` (deleted) — renders the right input per type, reuses the existing `/api/upload` route for file uploads.
   - Student detail page (`[id]/page.tsx`) only shows the GitHub-connect UI when `submission_type === 'github'`; otherwise shows a simpler "Your Submission" card. A `deploy_url` "Visit Live Site" button is shown for **any** type when present — this is also Phase 2 item 2 ("deploy link / live preview"), done for free as part of this work.
   - Mentor's `ProjectReviewClient.tsx` only shows the GitHub-specific tabs (Commits/Files/AI Review/Quality/Timeline) when `submission_type === 'github'`; non-GitHub assignments default straight to the Evaluate tab. Mentor's `[studentId]/page.tsx` header now renders the right submission summary per type instead of assuming a repo.

---

## Migration applied to live DB

File: `supabase/migrations/ADD_PROJECT_NEXT_LEVEL.sql` (already applied live via Supabase MCP `apply_migration`, in two small batches — the file on disk is in sync with what's live). Also ran `generate_typescript_types` and overwrote `src/types/database.types.ts` (it was stale — didn't include any Projects tables at all before this).

Contains:
- `DROP TABLE project_submissions, projects` (the dead catalog system)
- `project_assignments.submission_type`
- `assignment_submissions.{submission_url, submission_text, file_url, file_name, deploy_url}`, and `repo_url` made nullable
- `repo_analytics.similarity_flags` (for Phase 2 item 4, not yet consumed)
- `repo_analytics.student_insight` (for Phase 2 item 1, in progress — see below)
- `project_evaluations.featured_on_portfolio` (for Phase 2 item 3, not yet consumed)
- `tasks.assignment_id` FK (for Phase 2 item 2 numbering below — milestones, not yet consumed)

**Important discovery for future work in this codebase:** don't trust migration files alone — this repo has real drift between migration files and the live schema in multiple places (that's exactly what caused the original bugs). Verify against the live DB directly via the Supabase MCP tools (`list_tables`, `execute_sql` against `information_schema.columns`) before writing code against any table, the same way this session did.

---

## 🔶 Phase 2 — Signature features (partially done)

Original plan had 7 items; item 2 (deploy link) is done (see above, folded into Phase 1's submission-types work). Remaining:

### 1. Real AI "what to improve next" — **IN PROGRESS, not finished**
Replaces the (already-fixed-to-be-honest-but-plain) grade card on the student list page with a genuinely AI-generated, specific coaching note.

**Done so far:**
- Added `repo_analytics.student_insight JSONB` column (separate from the existing mentor-facing `repo_analytics.ai_review`) — already live.

**Still needed:**
- A new route, e.g. `src/app/api/github/student-insight/route.ts` — modeled directly on `src/app/api/github/ai-review/route.ts` (same `getAIClients()` from `src/lib/deepseek.ts`, same DeepSeek-primary/Groq-fallback pattern, same cache-unless-force-refresh approach, same `extractJson` helper). Difference: student-authorized (not mentor-only — the student should be able to trigger this for their own submission), and the prompt should ask for a short (2-3 sentence), encouraging, *specific* coaching note built from the student's own `repo_analytics` row (scores, suspicious_flags, languages, commit stats — same context shape the mentor whole-repo review already uses), not a critique. Cache into `repo_analytics.student_insight`.
- Wire it into `src/app/dashboard/student/projects/page.tsx`'s quality-grade card — likely as a small client component that auto-fetches on mount when analytics exist and no cached insight yet, with a loading skeleton and a graceful fallback to the current plain-grade text if the call fails (don't block the page on this).

### 2. ~~Deploy link / live preview~~ — DONE (folded into Phase 1, see above)

### 3. Portfolio integration — **NOT STARTED**
`src/app/portfolio/[username]/page.tsx` is currently **broken** (separate bug found mid-session, same root cause as everything else): it queries `project_assignments` for `tech_stack`, `github_repo_url`, `live_url`, `status`, `created_by` — none of which exist on that table — and filters `.eq('created_by', user.id)` when students aren't even the `created_by` (mentors are, via `mentor_id`). It also reads `project_evaluations[0].overall_rating`, which doesn't exist (real column is `score`).
Needs: rewrite the query to go through `assignment_students` (`student_id = user.id`) → `project_assignments` → `assignment_submissions` (for repo/deploy links) → `project_evaluations` (for `score`, gated on the new `featured_on_portfolio` boolean). Also need a toggle somewhere on the student's graded-project view to opt in/out of `featured_on_portfolio` (doesn't exist yet — simple checkbox + a small API route, e.g. `PATCH /api/project-assignments/[id]/evaluate` extended to accept it, or a new tiny route).

### 4. Milestones/checkpoints — **NOT STARTED**
`tasks.assignment_id` column is live. Needs: mentor UI to create checkpoint tasks under an assignment (probably a small addition to the mentor assignment detail page), and surfacing those tasks on both the mentor and student project detail pages — likely by reusing `src/components/tasks/TaskBoard.tsx` filtered to `assignment_id`.

### 5. Cross-submission similarity check — **NOT STARTED**
`repo_analytics.similarity_flags` column is live. Needs: in `src/app/api/github/analyze/route.ts` (or a new route triggered after analysis), for GitHub submissions in the same assignment, fetch key file contents (reuse `getFileContent` from `src/lib/github.ts`) and do a simple shingling/Jaccard similarity comparison, writing flags into the new column. Surface in `SuspiciousActivityAlert.tsx` or a sibling component on the mentor side.

### 6. Leaderboard tie-in — **NOT STARTED**
**Correction to the original plan:** research assumed a `leaderboard` table existed to write into. It doesn't work that way — `src/app/api/leaderboard/route.ts` calls an RPC `calculate_leaderboard` that (per the same pattern as everything else in this codebase) is only defined in an **archived** migration and likely doesn't exist live either; the route falls back to a manual JS computation over `test_submissions` only. **Verify this live via Supabase MCP before building** (don't repeat the mistake of trusting a migration file). The real fix is almost certainly extending that manual fallback computation to also blend in average `project_evaluations.score` per student, not writing to any `leaderboard` table.

### 7. Working GitHub webhook → auto re-analysis — **NOT STARTED**
The old `api/github/webhook/route.ts` was deleted in Phase 0 (referenced a schema that never existed). Needs a proper rebuild: verify the HMAC signature (the deleted file had working signature-verification logic worth referencing from git history if needed — `git show HEAD:src/app/api/github/webhook/route.ts` before this session's changes), look up the submission by `repo_full_name` → `assignment_submissions`, re-run analysis on push, and notify the mentor via the notification system built in Phase 1.

---

## Not yet done regardless of phase

- **No end-to-end verification run yet** — haven't started the dev server or walked through either role's flow since Phase 1's submission-type changes. Do this before considering Phase 1 fully trustworthy, not just Phase 2.
- No `next build` / `next lint` pass to catch type errors from all the schema/type changes.
- The plan's verification section (in the plan file) has the full checklist — follow it.

## Untouched but worth knowing about (found during research, not this session's scope)

- The Inngest community-notification functions (`mentionNotification`, `newPostNotification`, `newCommentNotification` in `src/inngest/functions.ts`) insert `related_post_id`/`related_comment_id` into `notifications`, columns that **don't exist live** (confirmed via the same live-schema check that caught the `is_read` issue). These are currently broken and throwing on every mention/post/comment event. Not part of the Projects feature, didn't touch it, but flagging since it's the same bug class and an easy one-line fix if picked up later (swap to `related_id`/`related_type`, matching what this session's new inserts use).
- `src/app/api/tests/assign/route.ts` has the same `read: false` (should be `is_read: false`) bug — also not touched, also an easy fix if picked up.
