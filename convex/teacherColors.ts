import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
// Default Farben (Frontend-Konstante auch serverseitig nutzen)
import { DEFAULT_TEACHER_COLORS } from "../src/constants/defaultTeacherColors";

// Shared helper
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

// list colors (membership required)
export const listTeacherColors = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await getCurrentUser(ctx);
    const mem = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!mem) throw new Error("FORBIDDEN");
    const colors = await ctx.db
      .query("colors")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect();
    return colors
      .map((c) => ({ id: c._id, teacher: c.teacher, color: c.color }))
      .sort((a, b) => a.teacher.localeCompare(b.teacher));
  },
});

// batch save (insert/update) teacher colors
export const saveTeacherColors = mutation({
  args: {
    classId: v.id("classes"),
    items: v.array(
      v.object({
        id: v.optional(v.id("colors")),
        teacher: v.string(),
        color: v.string(),
      }),
    ),
  },
  handler: async (ctx, { classId, items }) => {
    const user = await getCurrentUser(ctx);
    const mem = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!mem) throw new Error("FORBIDDEN");

    // Load all existing colors once
    const existingColors = await ctx.db
      .query("colors")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect();

    const colorsByTeacher = new Map(existingColors.map((c) => [c.teacher, c]));
    const colorsById = new Map(existingColors.map((c) => [c._id, c]));

    for (const it of items) {
      const teacher = it.teacher.trim();
      const color = it.color.trim();
      if (!teacher || !color) continue;
      if (it.id) {
        const existing = colorsById.get(it.id);
        if (!existing) {
          await ctx.db.insert("colors", { class_id: classId, teacher, color });
          continue;
        }
        // uniqueness check teacher within class
        if (existing.teacher !== teacher) {
          const dupe = colorsByTeacher.get(teacher);
          if (dupe && dupe._id !== it.id) throw new Error("TEACHER_DUPLICATE");
        }
        await ctx.db.patch(it.id, { teacher, color });
      } else {
        // upsert by teacher
        const existing = colorsByTeacher.get(teacher);
        if (existing) await ctx.db.patch(existing._id, { color });
        else
          await ctx.db.insert("colors", { class_id: classId, teacher, color });
      }
    }
    const colors = await ctx.db
      .query("colors")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect();
    return colors.map((c) => ({
      id: c._id,
      teacher: c.teacher,
      color: c.color,
    }));
  },
});

// delete color
export const deleteTeacherColor = mutation({
  args: { classId: v.id("classes"), colorId: v.id("colors") },
  handler: async (ctx, { classId, colorId }) => {
    const user = await getCurrentUser(ctx);
    const mem = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!mem) throw new Error("FORBIDDEN");
    const colorDoc = await ctx.db.get(colorId);
    if (!colorDoc) throw new Error("NOT_FOUND");
    if (colorDoc.class_id !== classId) throw new Error("FORBIDDEN");
    await ctx.db.delete(colorId);
    return { success: true };
  },
});

export const resetTeacherColors = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await getCurrentUser(ctx);
    const mem = await ctx.db
      .query("user_classes")
      .withIndex("by_user_class", (q) =>
        q.eq("user_id", user._id).eq("class_id", classId),
      )
      .unique();
    if (!mem) throw new Error("FORBIDDEN");
    // delete all existing colors
    const existingColors = await ctx.db
      .query("colors")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect();
    for (const c of existingColors) {
      await ctx.db.delete(c._id);
    }
    // repopulate defaults
    for (const { teacher, color } of DEFAULT_TEACHER_COLORS) {
      await ctx.db.insert("colors", { class_id: classId, teacher, color });
    }
    return { success: true, inserted: DEFAULT_TEACHER_COLORS.length };
  },
});
