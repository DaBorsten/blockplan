import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * initUser mutation
 * - Liest die aktuelle Identity (Clerk via JWT -> tokenIdentifier)
 * - Legt bei erstem Aufruf einen User an (nickname + tokenIdentifier)
 * - Aktualisiert optional den Nickname, falls bereits vorhanden und neuer Nickname übergeben wurde
 *
 * Sicherheitsaspekt: Kein Fremd-User kann erzeugt werden, da die Clerk Identity aus dem Request kommt.
 */
export const initUser = mutation({
  args: { nickname: v.string() },
  handler: async (ctx, { nickname }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHORIZED");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("MISSING_TOKEN_IDENTIFIER");

    // Versuchen bestehenden User zu finden
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!existing) {
      const id = await ctx.db.insert("users", {
        nickname,
        tokenIdentifier,
      });
      return { id, nickname, tokenIdentifier, created: true };
    }

    // Falls Nickname anders -> updaten
    if (existing.nickname !== nickname) {
      await ctx.db.patch(existing._id, { nickname });
    }

    return {
      id: existing._id,
      nickname,
      tokenIdentifier,
      created: false,
    };
  },
});

// Query: current user profile (id + nickname) or null if not initialized
export const me = query({
  args: {} as const,
  handler: async (
    ctx,
  ): Promise<{ id: Id<"users">; nickname: string } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();
    if (!user) return null;
    return { id: user._id, nickname: user.nickname };
  },
});

// Mutation: delete user by Clerk tokenIdentifier (admin/system context only)
// This will cascade:
// - Reassign or delete owned classes (mirrors logic in removeOrLeave for owner leave)
// - Remove memberships
// - Finally delete user document
// Auth: must be called from a Convex action/mutation using an admin key (no end-user identity)
export const deleteUserByTokenIdentifier = mutation({
  args: { tokenIdentifier: v.string(), secret: v.string() },
  handler: async (ctx, { tokenIdentifier, secret }) => {
    // Authorize via shared secret (admin key). We intentionally do NOT rely on user identity here.
    const expected = process.env.CONVEX_ADMIN_KEY;
    if (!expected) {
      // In local dev or misconfiguration we don't want to 500 the webhook repeatedly; return a skipped status.
      return { deleted: false, reason: "SKIPPED_NO_SERVER_SECRET" } as const;
    }
    if (secret !== expected) throw new Error("FORBIDDEN");

    // Optional hardening: disallow calls that also include a user identity (should come from server environment only)
    const identity = await ctx.auth.getUserIdentity();
    if (identity) throw new Error("FORBIDDEN");

    const user: Doc<"users"> | null = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();
    if (!user) return { deleted: false, reason: "USER_NOT_FOUND" } as const;

    // Collect memberships
    const memberships: Doc<"user_classes">[] = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) => q.eq("user_id", user._id))
      .collect();

    // For each class where user is owner, we reuse logic similar to removeOrLeave
    for (const m of memberships.filter((m) => m.role === "owner")) {
      const classId = m.class_id;
      const others: Doc<"user_classes">[] = await ctx.db
        .query("user_classes")
        .withIndex("by_class_user", (q) => q.eq("class_id", classId))
        .collect();
      const remaining = others.filter((o) => o.user_id !== user._id);
      if (remaining.length === 0) {
        // Delete entire class cascade identical to deleteClassInternal from classes.ts
        await deleteClassCascade(ctx, classId);
        continue;
      }
      // reassign owner: prefer first admin else first remaining
      const admins = remaining.filter((r) => r.role === "admin");
      const next = admins[0] ?? remaining[0];
      if (next) {
        await ctx.db.patch(next._id, { role: "owner" });
        await ctx.db.patch(classId, { owner_id: next.user_id });
      }
    }

    // Delete all memberships for this user (after owner handover/deletions)
    for (const m of memberships) {
      // It might have been deleted already in class cascade
      const existing = await ctx.db.get(m._id);
      if (existing) await ctx.db.delete(m._id);
    }

    // Finally delete user document
    await ctx.db.delete(user._id);
    return { deleted: true } as const;
  },
});

// Internal helper (duplicate of deleteClassInternal to avoid circular import)
async function deleteClassCascade(ctx: MutationCtx, classId: Id<"classes">) {
  const memberships: Doc<"user_classes">[] = await ctx.db
    .query("user_classes")
    .withIndex("by_class_user", (q) => q.eq("class_id", classId))
    .collect();
  const colors: Doc<"colors">[] = await ctx.db
    .query("colors")
    .withIndex("by_class", (q) => q.eq("class_id", classId))
    .collect();
  const invites: Doc<"invitations">[] = await ctx.db
    .query("invitations")
    .withIndex("by_class", (q) => q.eq("class_id", classId))
    .collect();
  const weeks: Doc<"weeks">[] = await ctx.db
    .query("weeks")
    .withIndex("by_class", (q) => q.eq("class_id", classId))
    .collect();

  await Promise.all([
    ...memberships.map((m: Doc<"user_classes">) => ctx.db.delete(m._id)),
    ...colors.map((c: Doc<"colors">) => ctx.db.delete(c._id)),
    ...invites.map((inv: Doc<"invitations">) => ctx.db.delete(inv._id)),
  ]);

  const weekIds: Id<"weeks">[] = weeks.map((w: Doc<"weeks">) => w._id);
  const timetablesNested: Doc<"timetables">[][] = await Promise.all(
    weekIds.map((weekId: Id<"weeks">) =>
      ctx.db
        .query("timetables")
        .withIndex("by_week", (q) => q.eq("week_id", weekId))
        .collect(),
    ),
  );
  const timetables: Doc<"timetables">[] = timetablesNested.flat();

  const groupsNested: Doc<"groups">[][] = await Promise.all(
    timetables.map((tt: Doc<"timetables">) =>
      ctx.db
        .query("groups")
        .withIndex("by_timetable", (q) => q.eq("timetable_id", tt._id))
        .collect(),
    ),
  );
  const groups: Doc<"groups">[] = groupsNested.flat();

  await Promise.all([
    ...groups.map((g: Doc<"groups">) => ctx.db.delete(g._id)),
    ...timetables.map((tt: Doc<"timetables">) => ctx.db.delete(tt._id)),
    ...weekIds.map((wId: Id<"weeks">) => ctx.db.delete(wId)),
  ]);
  await ctx.db.delete(classId);
}
