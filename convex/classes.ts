import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { DEFAULT_TEACHER_COLORS } from "./defaultTeacherColors";

// Helper: resolve current user document by tokenIdentifier (created via initUser mutation earlier)
type GenericCtx = QueryCtx | MutationCtx;

async function getCurrentUser(ctx: GenericCtx): Promise<Doc<"users">> {
  let identity;
  try {
    identity = await ctx.auth.getUserIdentity();
  } catch (error) {
    throw new Error("AUTH_SERVICE_ERROR", { cause: error });
  }
  if (!identity) throw new Error("UNAUTHENTICATED");
  const tokenIdentifier = identity.tokenIdentifier;
  if (!tokenIdentifier) throw new Error("MISSING_TOKEN_IDENTIFIER");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
  if (!user) throw new Error("USER_NOT_INITIALIZED");
  return user;
}

// Exported helper: membership of current user in class or null
export async function getMembership(ctx: GenericCtx, classId: Id<"classes">) {
  const user = await getCurrentUser(ctx);
  const membership: Doc<"user_classes"> | null = await ctx.db
    .query("user_classes")
    .withIndex("by_user_class", (q) =>
      q.eq("user_id", user._id).eq("class_id", classId),
    )
    .unique();
  return membership;
}

// Exported helper: require certain role(s)
export async function requireClassRole(
  ctx: GenericCtx,
  classId: Id<"classes">,
  allowed: Array<Doc<"user_classes">["role"]>,
) {
  const membership = await getMembership(ctx, classId);
  if (!membership) throw new Error("FORBIDDEN");
  if (!allowed.includes(membership.role)) throw new Error("FORBIDDEN");
  return membership;
}

// Query: list classes for current user
export const listClasses = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const memberships: Doc<"user_classes">[] = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) => q.eq("user_id", user._id))
      .collect();
    if (memberships.length === 0) return [];
    const result: Array<{
      class_id: Id<"classes">;
      class_title: string;
      role: Doc<"user_classes">["role"];
    }> = [];
    for (const m of memberships) {
      const cls = await ctx.db.get(m.class_id);
      if (cls)
        result.push({
          class_id: cls._id,
          class_title: cls.title,
          role: m.role,
        });
    }
    return result;
  },
});

// Safe variant: returns null instead of throwing if user not initialized yet
export const listClassesSafe = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return { initialized: false, classes: [] } as const;
      const tokenIdentifier = identity.tokenIdentifier;
      if (!tokenIdentifier) return { initialized: false, classes: [] } as const;
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .unique();
      if (!user) return { initialized: false, classes: [] } as const;
      const memberships = await ctx.db
        .query("user_classes")
        .withIndex("by_user_class", (q) => q.eq("user_id", user._id))
        .collect();
      if (memberships.length === 0)
        return { initialized: true, classes: [] } as const;
      const out: Array<{
        class_id: Id<"classes">;
        class_title: string;
        role: Doc<"user_classes">["role"];
      }> = [];
      for (const m of memberships) {
        const cls = await ctx.db.get(m.class_id);
        if (cls)
          out.push({ class_id: cls._id, class_title: cls.title, role: m.role });
      }
      return { initialized: true, classes: out } as const;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage === "USER_NOT_INITIALIZED" ||
        errorMessage === "UNAUTHENTICATED" ||
        errorMessage === "MISSING_TOKEN_IDENTIFIER"
      ) {
        return { initialized: false, classes: [] } as const;
      }
      console.error("Unexpected error in listClassesSafe:", error);
      return { initialized: false, classes: [] } as const;
    }
  },
});

// Query: list classes with aggregated counts (weeks & members) for current user
export const listClassesWithStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const memberships: Doc<"user_classes">[] = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) => q.eq("user_id", user._id))
      .collect();
    if (memberships.length === 0) return [];

    const results: Array<{
      class_id: Id<"classes">;
      class_title: string;
      role: Doc<"user_classes">["role"];
      weeks: number;
      members: number;
    }> = [];
    for (const m of memberships) {
      const cls = await ctx.db.get(m.class_id);
      if (!cls) continue;
      // Count weeks
      const weeks = await ctx.db
        .query("weeks")
        .withIndex("by_class", (q) => q.eq("class_id", m.class_id))
        .collect();
      // Count members
      const members = await ctx.db
        .query("user_classes")
        .withIndex("by_class_user", (q) => q.eq("class_id", m.class_id))
        .collect();
      results.push({
        class_id: cls._id,
        class_title: cls.title,
        role: m.role,
        weeks: weeks.length,
        members: members.length,
      });
    }
    return results;
  },
});

// Query: get single class meta
export const getClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await getCurrentUser(ctx);
    const membership: Doc<"user_classes"> | null = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!membership) throw new Error("FORBIDDEN");
    const cls = await ctx.db.get(classId);
    if (!cls) throw new Error("NOT_FOUND");
    return { id: cls._id, title: cls.title, owner_id: cls.owner_id };
  },
});

// Mutation: create class (owner)
export const createClass = mutation({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const user = await getCurrentUser(ctx);
    const trimmed = title.trim();
    if (!trimmed) throw new Error("INVALID_TITLE");
    const classId = await ctx.db.insert("classes", {
      owner_id: user._id,
      title: trimmed,
    });
    await ctx.db.insert("user_classes", {
      user_id: user._id,
      class_id: classId,
      role: "owner",
    });
    // Seed default teacher colors (static list inside Convex folder for bundling)
    const colorInserts = DEFAULT_TEACHER_COLORS.map((tc) => ({
      teacher: tc.teacher.trim(),
      color: tc.color.trim(),
    }))
      .filter((tc) => tc.teacher && tc.color)
      .map((tc) =>
        ctx.db.insert("colors", {
          class_id: classId,
          teacher: tc.teacher,
          color: tc.color,
        }),
      );
    await Promise.all(colorInserts);

    return { class_id: classId, title: trimmed };
  },
});

// Mutation: rename class (owner or admin? original route allowed any? -> original only separate route without auth check; enforce owner/admin minimal, prefer owner similar to deletion logic)
export const renameClass = mutation({
  args: { classId: v.id("classes"), newTitle: v.string() },
  handler: async (ctx, { classId, newTitle }) => {
    const user = await getCurrentUser(ctx);
    const membership: Doc<"user_classes"> | null = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!membership) throw new Error("FORBIDDEN");
    // allow owner OR admin to rename (adjust if stricter needed)
    if (!["owner", "admin"].includes(membership.role))
      throw new Error("FORBIDDEN");
    const cls = await ctx.db.get(classId);
    if (!cls) throw new Error("NOT_FOUND");
    const trimmed = newTitle.trim();
    if (!trimmed) throw new Error("INVALID_TITLE");
    await ctx.db.patch(classId, { title: trimmed });
    return { id: classId, title: trimmed };
  },
});

// Mutation: delete class (only owner). Cascades manual.
export const deleteClass = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await getCurrentUser(ctx);
    const cls = await ctx.db.get(classId);
    if (!cls) throw new Error("NOT_FOUND");
    if (cls.owner_id !== user._id) throw new Error("FORBIDDEN");
    return await deleteClassInternal(ctx, classId);
  },
});

// Query: list members with roles + nickname
export const listMembers = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await getCurrentUser(ctx);
    // must be member
    const requester: Doc<"user_classes"> | null = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!requester) throw new Error("FORBIDDEN");
    const memberships: Doc<"user_classes">[] = await ctx.db
      .query("user_classes")
      .withIndex("by_class_user", (q) => q.eq("class_id", classId))
      .collect();
    const result: Array<{
      user_id: Id<"users">;
      role: Doc<"user_classes">["role"];
      nickname: string | null;
    }> = [];
    for (const m of memberships) {
      const u: Doc<"users"> | null = await ctx.db.get(m.user_id);
      result.push({
        user_id: m.user_id,
        role: m.role,
        nickname: u?.nickname ?? null,
      });
    }
    return { members: result, currentRole: requester.role };
  },
});

// Mutation: update member role (only owner may change roles)
export const updateMemberRole = mutation({
  args: {
    classId: v.id("classes"),
    targetUserId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, { classId, targetUserId, role }) => {
    const user = await getCurrentUser(ctx);
    const requester: Doc<"user_classes"> | null = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!requester) throw new Error("FORBIDDEN");
    if (requester.role !== "owner") throw new Error("FORBIDDEN");
    const target: Doc<"user_classes"> | null = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", targetUserId).eq("class_id", classId),
      )
      .unique();
    if (!target) throw new Error("NOT_FOUND");
    if (target.role === "owner") throw new Error("CANNOT_CHANGE_OWNER_ROLE");
    // Only allow meaningful transitions: member <-> admin
    if (role === target.role)
      return { updated: false, unchanged: true } as const;
    if (target.role === "member" && role === "admin") {
      await ctx.db.patch(target._id, { role: "admin" });
      return { updated: true };
    }
    if (target.role === "admin" && role === "member") {
      await ctx.db.patch(target._id, { role: "member" });
      return { updated: true };
    }
    // Any other combination is invalid
    throw new Error("INVALID_ROLE_TRANSITION");
  },
});

// Mutation: remove or leave
export const removeOrLeave = mutation({
  args: { classId: v.id("classes"), targetUserId: v.id("users") },
  handler: async (ctx, { classId, targetUserId }) => {
    const user = await getCurrentUser(ctx);
    const requester: Doc<"user_classes"> | null = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!requester) throw new Error("FORBIDDEN");
    const target: Doc<"user_classes"> | null = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", targetUserId).eq("class_id", classId),
      )
      .unique();
    if (!target) throw new Error("NOT_FOUND");
    // self leave
    if (user._id === targetUserId) {
      if (requester.role === "owner") {
        // reassign or delete class
        const others: Doc<"user_classes">[] = await ctx.db
          .query("user_classes")
          .withIndex("by_class_user", (q) => q.eq("class_id", classId))
          .collect();
        const remaining = others.filter((m) => m.user_id !== user._id);
        if (remaining.length === 0) {
          await deleteClassInternal(ctx, classId);
          return { left: true, deletedClass: true };
        }
        // choose next owner (prefer admins)
        const admins = remaining.filter((m) => m.role === "admin");
        const next = admins[0] ?? remaining[0];
        if (next) {
          await ctx.db.patch(next._id, { role: "owner" });
          await ctx.db.patch(classId, { owner_id: next.user_id });
        }
      }
      await ctx.db.delete(requester._id);
      return { left: true };
    }
    // administrative removal
    if (requester.role === "owner") {
      if (target.role === "owner") throw new Error("CANNOT_REMOVE_OWNER");
      await ctx.db.delete(target._id);
      return { removed: true };
    }
    if (requester.role === "admin") {
      if (target.role !== "member") throw new Error("FORBIDDEN");
      await ctx.db.delete(target._id);
      return { removed: true };
    }
    throw new Error("FORBIDDEN");
  },
});

// Internal helper for deletion reuse
async function deleteClassInternal(ctx: MutationCtx, classId: Id<"classes">) {
  const [memberships, colors, invites, weeks] = await Promise.all([
    ctx.db
      .query("user_classes")
      .withIndex("by_class_user", (q) => q.eq("class_id", classId))
      .collect(),
    ctx.db
      .query("colors")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect(),
    ctx.db
      .query("invitations")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect(),
    ctx.db
      .query("weeks")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect(),
  ]);

  await Promise.all([
    ...memberships.map((m) => ctx.db.delete(m._id)),
    ...colors.map((c) => ctx.db.delete(c._id)),
    ...invites.map((inv) => ctx.db.delete(inv._id)),
  ]);

  // Sammle alle zu löschenden IDs
  const weekIds = weeks.map((w) => w._id);
  const timetables = await Promise.all(
    weekIds.map((weekId) =>
      ctx.db
        .query("timetables")
        .withIndex("by_week", (q) => q.eq("week_id", weekId))
        .collect(),
    ),
  );
  const allTimetables = timetables.flat();

  const groups = await Promise.all(
    allTimetables.map((tt) =>
      ctx.db
        .query("groups")
        .withIndex("by_timetable", (q) => q.eq("timetable_id", tt._id))
        .collect(),
    ),
  );
  const allGroups = groups.flat();

  // Lösche alle Entities parallel
  await Promise.all([
    ...allGroups.map((g) => ctx.db.delete(g._id)),
    ...allTimetables.map((tt) => ctx.db.delete(tt._id)),
    ...weekIds.map((wId) => ctx.db.delete(wId)),
  ]);
  await ctx.db.delete(classId);
  return { deleted: true };
}
