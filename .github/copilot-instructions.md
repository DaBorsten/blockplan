# Blockplan - AI Coding Agent Instructions

## Architecture Overview

**Stack**: Next.js 16 (App Router) + React 19 + Convex (realtime backend) + Clerk (auth) + TailwindCSS v4 + shadcn/ui + Bun

**Data Flow**: 
- Frontend → Convex queries/mutations (live reactive, no REST)
- Authentication: Clerk sessions → Convex (`CLERK_JWT_ISSUER_DOMAIN` in `convex/auth.config.ts`)
- State: Zustand stores with localStorage persistence (`useClassStore`, `useWeekStore`, `useGroupStore`)
- Migration: Legacy Turso/libSQL removed — all data access via Convex

## Critical Development Patterns

### Running the Project
Always run **two terminals** in parallel:
```bash
bun run dev          # Terminal A: Next.js dev server
bun run convex       # Terminal B: Convex backend sync
```

Testing & quality checks:
```bash
bun test             # Run all unit tests (Bun native test runner)
bun test --watch     # Watch mode for TDD
bun x tsc --noEmit   # Type checking (no lint/build needed)
bun x eslint .       # Linting
```

### Convex Data Layer (Primary Pattern)

**Auth Helper Pattern** - Every file defines `getCurrentUser`:
```typescript
// In convex/*.ts files
async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  const user = await ctx.db.query("users")
    .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new Error("USER_NOT_INITIALIZED");
  return user;
}
```

**Permission Patterns** - Use shared helpers from `convex/classes.ts`:
```typescript
// Check membership
const membership = await getMembership(ctx, classId);
if (!membership) throw new ConvexError("Nicht berechtigt");

// Require specific role
await requireClassRole(ctx, classId, ["owner", "admin"]);
```

**Frontend Integration**:
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

// Reactive query (auto-updates on DB changes)
const weeks = useQuery(api.weeks.listWeeks, { classId });

// Mutation
const createWeek = useMutation(api.weeks.createWeek);
await createWeek({ classId, title: "KW 42" });
```

### State Management (Zustand)

**Cross-Store Communication** - Stores can call each other:
```typescript
// useClassStore.ts
setClass: (id) => {
  if (currentClassId !== id) {
    set({ classId: id });
    useWeekStore.getState().clearWeek(); // cascade reset
  }
}
```

**Persistence Keys**:
- `useClassStore`: `"class-storage"` → stores `classId`
- `useWeekStore`: `"week-storage"` → stores `weekId`
- `useGroupStore`: `"group-storage"` → stores group number (1/2/3)

**Validation Guard** - `StoresValidityGuard` validates stored IDs against DB:
- Resets invalid `classId` if class deleted/access revoked
- Resets invalid `weekId` if week deleted
- Blocks render until validation complete

### Authentication Flow

1. **Middleware** (`src/middleware-cors.ts` - no `src/middleware.ts` exists): Clerk protects routes
2. **First Login**: `/willkommen` → `initUser` mutation creates Convex user with nickname
3. **User Matching**: Clerk `tokenIdentifier` = `${CLERK_JWT_ISSUER_DOMAIN}|<clerkUserId>`
4. **Guards**: `StoresValidityGuard` in `SignedInWrapper` ensures user exists before app access

### Component Architecture

**Layout Hierarchy**:
```
app/layout.tsx (root)
├─ SignedInWrapper (authenticated users)
│  ├─ SidebarProvider + AppSidebar
│  ├─ StoresValidityGuard (validates class/week IDs)
│  └─ [protected pages]
└─ PublicPageWrapper (unauthenticated)
   └─ [public pages: /, /impressum, /datenschutzhinweis]
```

**Client Components** - Most components use `"use client"`:
- Pages: `src/app/*/page.tsx`
- Interactive UI: `src/components/`
- shadcn/ui components: `src/components/ui/`

### Schema & Relationships

From `convex/schema.ts`:
```
users (nickname, tokenIdentifier)
  ↓
user_classes (role: owner/admin/member) → classes (title, owner_id)
  ↓
weeks (title) → timetables (day, hour, subject, teacher, room)
  ↓
groups (groupNumber) — for A/B week timetable splits
```

**Roles**: owner > admin > member (permissions cascade)

## Project-Specific Conventions

### Error Handling
- Convex: `throw new ConvexError("German user message")` for client-facing errors
- Auth errors: `UNAUTHENTICATED`, `USER_NOT_INITIALIZED`, `FORBIDDEN`
- Use German for user-facing messages, English for system errors

### Testing
- Tests live next to source: `*.test.ts` files
- Example: `src/utils/colorDark.test.ts`, `src/store/useClassStore.test.ts`
- Use Bun's test API: `import { describe, test, expect } from "bun:test"`
- Test cross-store interactions (e.g., `useClassStore` resetting `useWeekStore`)

### Path Aliases
- `@/` → `src/` (configured in `tsconfig.json`)
- Convex imports: `@/../convex/_generated/api` (relative due to monorepo structure)

### Security Headers
`next.config.ts` includes strict CSP for Clerk domains, Convex endpoints, and development tools

## Key Files Reference

- **Schema**: `convex/schema.ts` - complete DB structure
- **Auth Config**: `convex/auth.config.ts` - Clerk integration
- **Stores**: `src/store/use*.ts` - state management with persistence
- **Guards**: `src/components/StoresValidityGuard.tsx` - ID validation logic
- **Helpers**: `convex/classes.ts` - `getCurrentUser`, `getMembership`, `requireClassRole`

## Migration Notes

⚠️ **No more REST API routes** - `src/app/api/**` deprecated (except webhooks). All new features use Convex queries/mutations. Check `convex/` folder before creating new data access patterns.