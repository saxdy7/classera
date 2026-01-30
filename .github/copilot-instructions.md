# Copilot Instructions for Classera

## Project Overview
- **Classera** is a Next.js 16 + Supabase platform for student-mentor collaboration, featuring authentication, onboarding, dashboards, real-time messaging, AI test evaluation, and video calls.
- All data is university-isolated via Row Level Security (RLS) in Supabase.
- The codebase is 100% TypeScript, using Tailwind CSS for styling and pnpm for package management.

## Key Architecture & Patterns
- **App Router**: All routes are in `src/app/` using Next.js App Router conventions.
- **API Routes**: Serverless API endpoints live under `src/app/api/`.
- **Component Structure**: UI and shared components are in `src/components/`, organized by feature (e.g., `ui/`, `shared/`, `mentor/`).
- **Supabase Integration**: Client and server Supabase logic is in `src/lib/supabase/`.
- **Type Safety**: All DB types are defined in `src/types/database.types.ts` and used throughout.
- **RLS Enforcement**: All DB queries are filtered by `university_id` (see RLS policies and code comments).
- **Theming**: Gradients are role-based (students: purple/fuchsia, mentors: indigo/purple).
- **Optimistic UI**: Use optimistic updates for real-time features (see messaging, tasks).

## Developer Workflows
- **Install**: `pnpm install`
- **Dev Server**: `pnpm dev` (http://localhost:3000)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Type Check**: `pnpm type-check`
- **Start Prod**: `pnpm start`
- **Test Accounts**: See `README.md` for demo credentials.
- **DB Migrations**: Run SQL in `supabase/migrations/` via Supabase SQL Editor.
- **Env Vars**: Copy `.env.local.example` to `.env.local` and fill in Supabase keys.

## Project-Specific Conventions
- **University Isolation**: Always filter by `university_id` in DB queries.
- **Component Organization**: Place new UI in the relevant feature folder under `src/components/`.
- **API Usage**: Use Supabase client from `src/lib/supabase/client.ts` for browser, `server.ts` for server.
- **No direct DB access**: Always use Supabase client, never raw SQL in app code.
- **Gradient Themes**: Use Tailwind classes matching the role-based color scheme.
- **TypeScript Only**: All new code must be typed; update `database.types.ts` as needed.

## Integration Points
- **Supabase**: Auth, DB, Storage, Realtime (see `src/lib/supabase/`)
- **Daily.co**: Video calls (future phases)
- **Google Gemini**: AI test evaluation (future phases)
- **Resend**: Transactional email (future phases)

## Troubleshooting & Known Issues
- See `README.md` and `SETUP_GUIDE.md` for common issues and fixes (e.g., avatar upload, route mismatches).
- For schema changes, update both SQL migrations and TypeScript types.

## Reference Files
- `README.md`: Project overview, setup, and workflow details
- `SETUP_GUIDE.md`: Step-by-step setup and troubleshooting
- `src/types/database.types.ts`: DB schema types
- `src/lib/supabase/`: Supabase integration logic
- `src/components/`: UI and shared components
- `supabase/migrations/`: SQL migration scripts

---
For more, see the full `README.md` and `SETUP_GUIDE.md`. When in doubt, match existing patterns and reference the roadmap for feature priorities.
