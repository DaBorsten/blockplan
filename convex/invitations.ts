import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

const NEVER_EXPIRES_DATE = new Date("9999-12-31T23:59:59.000Z");
const NEVER_EXPIRES_TIMESTAMP = NEVER_EXPIRES_DATE.getTime();

// Reuse getCurrentUser logic locally (could be refactored to shared util)
async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  const tokenIdentifier = identity.tokenIdentifier;
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
  if (!user) throw new Error("USER_NOT_INITIALIZED");
  return user as Doc<"users">;
}

function genCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne I,O,1,0
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function getMembership(
  ctx: QueryCtx | MutationCtx,
  classId: Id<"classes">,
  userId: Id<"users">,
) {
  const membership = await ctx.db
    .query("user_classes")
    .withIndex("by_user_class", (q) =>
      q.eq("user_id", userId).eq("class_id", classId),
    )
    .unique();
  return membership as Doc<"user_classes"> | null;
}

// list invitations (any member may see all invitations per Anforderung B)
export const listInvitations = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await getCurrentUser(ctx);
    const membership = await getMembership(ctx, classId, user._id);
    if (!membership) throw new Error("FORBIDDEN");
    const invites = await ctx.db
      .query("invitations")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect();
    const now = Date.now();
    return invites
      .map((i) => ({
        id: i._id,
        code: i.code,
        user_id: i.user_id,
        class_id: i.class_id,
        expiration_date: new Date(i.expiration_date).toISOString(),
        active: i.expiration_date >= now,
        can_delete:
          i.user_id === user._id ||
          membership.role === "owner" ||
          membership.role === "admin",
      }))
      .sort((a, b) => b.expiration_date.localeCompare(a.expiration_date));
  },
});

// create invitation (owner/admin/member)
export const createInvitation = mutation({
  args: {
    classId: v.id("classes"),
    expires: v.boolean(),
    expirationISO: v.optional(v.string()),
  },
  handler: async (ctx, { classId, expires, expirationISO }) => {
    const user = await getCurrentUser(ctx);
    const membership = await getMembership(ctx, classId, user._id);
    if (!membership) throw new Error("FORBIDDEN");
    let exp: number;
    if (expires) {
      if (expirationISO) {
        const dt = new Date(expirationISO);
        if (isNaN(dt.getTime())) throw new Error("INVALID_EXPIRATION");
        exp = dt.getTime();
      } else {
        exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // default 30d
      }
    } else {
      exp = NEVER_EXPIRES_TIMESTAMP;
    }
    let code = "";
    for (let i = 0; i < 5; i++) {
      const c = genCode(6);
      const exists = await ctx.db
        .query("invitations")
        .withIndex("by_code", (q) => q.eq("code", c))
        .unique();
      if (!exists) {
        code = c;
        break;
      }
    }
    if (!code) throw new Error("CODE_GENERATION_FAILED");
    const id = await ctx.db.insert("invitations", {
      code,
      user_id: user._id,
      class_id: classId,
      expiration_date: exp,
    });
    return {
      id,
      code,
      class_id: classId,
      user_id: user._id,
      expiration_date: new Date(exp).toISOString(),
    };
  },
});

// delete invitation (creator OR owner/admin)
export const deleteInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, { invitationId }) => {
    const user = await getCurrentUser(ctx);
    const inv = await ctx.db.get(invitationId);
    if (!inv) throw new Error("NOT_FOUND");
    const membership = await getMembership(ctx, inv.class_id, user._id);
    if (!membership) throw new Error("FORBIDDEN");
    if (
      inv.user_id !== user._id &&
      membership.role !== "owner" &&
      membership.role !== "admin"
    )
      throw new Error("FORBIDDEN");
    await ctx.db.delete(invitationId);
    return { deleted: true };
  },
});

// check invitation (optional auth)
export const checkInvitation = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const normalizedCode = code.trim().toUpperCase();
    const inv = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .unique();
    if (!inv)
      return {
        valid: false,
        code: "",
        class_id: null,
        class_title: "",
        expires_at: null,
        isMember: false,
        owner_nickname: null,
        member_count: 0,
      };
    const cls = await ctx.db.get(inv.class_id);
    const exp = inv.expiration_date;
    const never = exp >= NEVER_EXPIRES_TIMESTAMP;
    const valid = never || exp >= Date.now();
    let isMember = false;
    let ownerNickname: string | null = null;
    let memberCount = 0;
    let identity;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch {
      /* ignore */
    }
    if (identity) {
      const tokenIdentifier = identity.tokenIdentifier;
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .unique();
      if (user) {
        const mem = await ctx.db
          .query("user_classes")
          .withIndex("by_user_class", (q) =>
            q.eq("user_id", user._id).eq("class_id", inv.class_id),
          )
          .unique();
        isMember = !!mem;
      }
    }

    // Public meta: owner nickname & member count
    try {
      if (cls) {
        const ownerUser = await ctx.db.get(cls.owner_id);
        ownerNickname = ownerUser?.nickname ?? null;
      }
      const members = await ctx.db
        .query("user_classes")
        .withIndex("by_class_user", (q) => q.eq("class_id", inv.class_id))
        .collect();
      memberCount = members.length;
    } catch {
      // ignore meta errors
    }
    return {
      valid,
      code: inv.code,
      class_id: inv.class_id,
      class_title: cls?.title ?? "",
      expires_at: never ? null : new Date(exp).toISOString(),
      isMember,
      owner_nickname: ownerNickname,
      member_count: memberCount,
    };
  },
});

// accept invitation (requires auth)
export const acceptInvitation = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const normalizedCode = code.trim().toUpperCase();
    const user = await getCurrentUser(ctx);
    const inv = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .unique();
    if (!inv) throw new Error("NOT_FOUND");
    const exp = inv.expiration_date;
    const never = exp >= NEVER_EXPIRES_TIMESTAMP;
    if (!never && exp < Date.now()) throw new Error("EXPIRED");
    const existing = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", inv.class_id),
      )
      .unique();
    if (existing) {
      const cls = await ctx.db.get(inv.class_id);
      return {
        joined: false,
        alreadyMember: true,
        class_id: inv.class_id,
        class_title: cls?.title ?? "",
      };
    }
    await ctx.db.insert("user_classes", {
      user_id: user._id,
      class_id: inv.class_id,
      role: "member",
    });
    const cls = await ctx.db.get(inv.class_id);
    return {
      joined: true,
      class_id: inv.class_id,
      class_title: cls?.title ?? "",
    };
  },
});
