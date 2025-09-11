# AI Assistant Project Instructions (blockplan)

These instructions orient AI coding agents working in this repository. Focus on applying the concrete patterns below; avoid generic boilerplate.

## Architecture Overview
- Framework: Next.js App Router (React 19, `next@15.x`) with Clerk for auth and Turso (libSQL) as the database.
- Data layer: Direct SQL via `@libsql/client` (`src/lib/tursoClient.ts`). Simple helper `mapRows` in `src/utils/db.ts` converts result sets.
- Auth: Centralized helper in `src/lib/auth.ts` (`requireAuthUserId`, `getAuthUserId`). API routes (in `src/app/api/**`) call `requireAuthUserId` early.
- State management: Multiple small Zustand stores in `src/store/*` (e.g. `useClassStore`, `useWeekStore`). Stores persist via `zustand/middleware/persist` with dedicated storage keys. Changing a class resets related week state.
- UI: TailwindCSS (v4) + shadcn/radix primitives under `src/components/ui/*`. Custom higher-order components live in `src/components/` (e.g. `TeacherColorsManager`, `AppShell`).
- Routing & protection: Global `src/middleware.ts` applies Clerk auth & CORS. Protected route patterns listed in `isProtectedRoute` must redirect unauthenticated users.
- Timetable & weeks: Weeks grouped and sorted client-side in class view (`src/app/klassen/[id]/page.tsx`) using naming conventions (e.g. `10 KW12_2`). Deletion & rename use dedicated API endpoints.

## Conventions & Patterns
- API Route Layout: Each file in `src/app/api/.../route.ts` exports HTTP verb functions (GET/POST/etc). Always validate inputs & auth near the top. Return `NextResponse.json` with minimal shape `{ data }` or `{ error }`.
- Auth Errors: Throwing in `requireAuthUserId` should map to 401. Other permission failures return 403 with a concise error string.
- Invitation Logic: In `api/class/invitation/route.ts` owners create/delete; owners or admins (helper `ensureOwnerOrAdmin`) can list invites. Reuse that pattern for similar role expansions.
- Role Checks: Fetch role from `user_class` table once; prefer small helper functions rather than inlining the same query.
- UI Dialogs: Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` pattern. Avoid `window.confirm`; custom dialogs already exist (see week deletion, member removal).
- Toasts: Use `toast.success|error|info` (sonner). Provide German user-facing messages; keep them short.
- State Reset on Context Switch: When changing `classId`, immediately clear dependent week state (`useWeekStore`). Follow this cascading reset approach for any new dependent stores.
- Sorting Weeks: Client grouping logic extracts grade and KW numbers; maintain parity if adding new derived sorting (extend extractionMap rather than rewriting logic).
- Styling: Prefer Tailwind utility classes. Accent highlight: `bg-primary/10 text-primary rounded-md px-2 py-0.5` (see highlighted class title).
- Persistence Keys: Use short, kebab/flat names (`class-storage`, `week-storage`). Increment `version` when shape changes and add migration if needed.

## Workflows
- Dev server (DB + Next): `bun dev` (delegates to `turso dev` + `next dev --turbopack`). Keep that combined pattern when adjusting scripts.
- Lint: `bun run lint` (ESLint 9 + Next config). Fix only the touched code region; do not mass-format unrelated areas.
- Build: `bun run build` should remain clean; avoid adding Node APIs unsupported by Edge unless `export const runtime = "nodejs"` is present (as in invitation route).
- Database: Uses a local SQLite replica file `blockplan.db` during development spun up by Turso. Keep schema-altering SQL in dedicated migration scripts (none present yet—add under `db/migrations/` if introducing).

## Adding / Modifying API Endpoints
- Always import and call `requireAuthUserId` early.
- Validate required query/body params explicitly; return `400` if missing.
- Authorization: centralize role logic in a helper; don't scatter raw role comparisons.
- Output: Keep stable field names; clients expect `data` arrays or objects, not nested envelopes.

## Frontend Interaction Patterns
- Lists with dynamic fetch: Maintain loading + revalidation flags (e.g. `invitesSpinning`, `invitesFetching`) to prevent overlapping requests.
- Optimistic updates: Only apply when trivial; otherwise refetch via existing `fetch*` method (weeks, invites, members pattern).
- Accessibility: Buttons use `aria-label` when icon-only. Mirror existing patterns.
- Sticky Headers: Class page uses a `sticky top-0 backdrop-blur` header; match that style for other long-scroll panes.

## When Extending Features
- Reuse existing role checks & dialog UI.
- Follow German localization for user-visible text.
- Keep server messages concise; no stack traces to the client.
- Add new shared utilities under `src/utils` or `src/lib` (lib = integration clients, utils = pure helpers).

## Examples
- Auth pattern: `const userId = requireAuthUserId(req);`
- Role gate: `const auth = await ensureOwnerOrAdmin(userId, class_id); if(!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });`
- Dialog structure: See week delete confirmation in `src/app/klassen/[id]/page.tsx`.

## Do / Avoid
- Do: Keep changes minimal & scoped; reuse helpers.
- Avoid: Introducing new state containers if an existing store can extend; duplicating role SQL; raw `window.confirm`.

Provide diffs only for touched files and preserve unrelated code.
