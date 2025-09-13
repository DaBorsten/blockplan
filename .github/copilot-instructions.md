# Blockplan - AI Coding Agent Instructions

## Architecture Overview

**Stack**: Next.js 15 (App Router) + Convex (realtime backend) + Clerk (auth) + TailwindCSS + shadcn/ui

**Data Flow**: 
- Frontend → Convex queries/mutations (live reactive)
- Authentication: Clerk sessions → Convex auth integration
- State: Zustand stores (`useClassStore`, `useWeekStore`, `useGroupStore`) with persistence
- Migration in progress: Legacy Turso/libSQL API routes → pure Convex backend

## Key Components & Patterns

### Authentication & Routing
- **Middleware**: `src/middleware.ts` protects routes, redirects unauthenticated to `/login`
- **Layout Split**: `SignedInWrapper` (sidebar app) vs `PublicPageWrapper` (marketing pages)
- **User Flow**: Clerk signup → `/willkommen` (nickname setup) → main app
- **Guards**: `NicknameGuard` ensures Convex user exists before accessing protected routes

### Data Layer (Convex)
- **Schema**: `convex/schema.ts` - users, classes, user_classes (roles), weeks, timetables, invitations, etc.
- **Auth Pattern**: `getCurrentUser(ctx)` helper for mutations, queries use `ctx.auth.getUserIdentity()`
- **Permissions**: Role-based (owner/admin/member) with membership checks in mutations
- **Live Queries**: Frontend uses `useQuery(api.X.Y, args)` for reactive data

### State Management
- **Class Selection**: `useClassStore` persists current class, triggers week store reset on change
- **URL State**: Migrated away from query params to Zustand stores with localStorage persistence
- **Component Sync**: `ClassRouteSync` component handles route-based class ID synchronization

### Legacy API (Being Removed)
- **Pattern**: `src/app/api/**` REST routes with `requireAuthUserId(req)` auth helper
- **Database**: Direct libSQL/Turso queries with `turso.execute()`
- **Migration Status**: Most functionality moved to Convex, API routes marked for deletion

## Development Workflows

### Local Development
```bash
bun run dev          # Next.js only
bun run convex       # Convex backend (separate terminal)
```

### Key File Patterns
- **Pages**: `src/app/*/page.tsx` - client components with `"use client"`
- **Components**: `src/components/` - reusable UI, often with `"use client"`
- **Convex**: `convex/*.ts` - queries/mutations with proper auth patterns
- **Stores**: `src/store/use*Store.ts` - Zustand with persistence middleware

### Styling
- **TailwindCSS**: Utility-first, custom theme in `tailwind.config.ts`
- **shadcn/ui**: Component library in `src/components/ui/`
- **Theming**: Dark/light mode with `next-themes`, Clerk theming integration

## Critical Patterns

### Convex Auth Integration
```typescript
// In mutations/queries
const user = await getCurrentUser(ctx); // throws if unauthenticated
// In React
const me = useQuery(api.users.me, {});
```

### Permission Checks
```typescript
// Convex mutations check membership + role
const membership = await ctx.db.query("user_classes")
  .withIndex("by_user_class", q => q.eq("user_id", user._id).eq("class_id", classId))
  .unique();
if (!membership || membership.role !== "owner") throw new Error("FORBIDDEN");
```

### State Store Updates
```typescript
// Class change triggers week reset
setClass: (id) => {
  if (currentClassId !== id) {
    set({ classId: id });
    useWeekStore.getState().clearWeek(); // cross-store communication
  }
}
```

### Component Architecture
- **Layout**: `AppShell` → `SignedInWrapper` → sidebar + main content
- **Guards**: `NicknameGuard`, `ClassRouteSync` as layout-level components
- **Modals**: `Dialog` from shadcn/ui, state managed in parent components

## Migration Context
Currently removing legacy Turso/libSQL infrastructure in favor of pure Convex. When working on data-related features, prefer Convex patterns over API routes. Check `convex/` folder first for existing queries/mutations before creating new ones.