import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";

// Helper to get current user
async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("UNAUTHENTICATED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new Error("USER_NOT_INITIALIZED");
  }

  return user;
}

// ===== USER PREFERENCES =====

/**
 * Get user's global preferences
 */
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    return {
      autoLatestWeek: user.autoLatestWeek,
      showSubjectColors: user.showSubjectColors,
    };
  },
});

/**
 * Update user's global preferences
 */
export const updateUserPreferences = mutation({
  args: {
    autoLatestWeek: v.optional(v.boolean()),
    showSubjectColors: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const updates: Partial<Doc<"users">> = {};
    if (args.autoLatestWeek !== undefined) {
      updates.autoLatestWeek = args.autoLatestWeek;
    }
    if (args.showSubjectColors !== undefined) {
      updates.showSubjectColors = args.showSubjectColors;
    }

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

/**
 * Internal mutation to migrate localStorage data to database
 * This is called by the migration script
 */
export const migrateUserPreferences = internalMutation({
  args: {
    userId: v.id("users"),
    autoLatestWeek: v.optional(v.boolean()),
    showSubjectColors: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const updates: Partial<Doc<"users">> = {};
    if (args.autoLatestWeek !== undefined) {
      updates.autoLatestWeek = args.autoLatestWeek;
    }
    if (args.showSubjectColors !== undefined) {
      updates.showSubjectColors = args.showSubjectColors;
    }

    await ctx.db.patch(args.userId, updates);
  },
});
