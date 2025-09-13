import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getMembership, requireClassRole } from "./classes"; // reuse helpers
import { UserRole } from "@/types/roles";

const ANY_MEMBER = [
  "owner",
  "admin",
  "member",
] as const satisfies readonly UserRole[];

// List all weeks for a class the user is member of
export const listWeeks = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await getMembership(ctx, classId);
    if (!user) throw new ConvexError("Nicht berechtigt");
    const weeks = await ctx.db
      .query("weeks")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .order("asc")
      .collect();
    return weeks.map((w) => ({ _id: w._id, title: w.title }));
  },
});

// Create a new week (owner/admin/member)
export const createWeek = mutation({
  args: { classId: v.id("classes"), title: v.string() },
  handler: async (ctx, { classId, title }) => {
    await requireClassRole(ctx, classId, [...ANY_MEMBER]);
    const t = title.trim();
    if (t.length === 0) throw new ConvexError("Titel darf nicht leer sein");
    if (t.length > 120)
      throw new ConvexError("Titel ist zu lang (max. 120 Zeichen)");
    const id = await ctx.db.insert("weeks", { class_id: classId, title: t });
    return id;
  },
});

// Rename a week (owner/admin/member)
export const renameWeek = mutation({
  args: { weekId: v.id("weeks"), newTitle: v.string() },
  handler: async (ctx, { weekId, newTitle }) => {
    const week = await ctx.db.get(weekId);
    if (!week) throw new ConvexError("Woche nicht gefunden");
    await requireClassRole(ctx, week.class_id, [...ANY_MEMBER]);
    const t = newTitle.trim();
    if (t.length === 0) throw new ConvexError("Titel darf nicht leer sein");
    if (t.length > 120)
      throw new ConvexError("Titel ist zu lang (max. 120 Zeichen)");
    await ctx.db.patch(weekId, { title: t });
    return true;
  },
});

// Delete a week and cascade timetable + groups (owner/admin/member)
export const deleteWeek = mutation({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, { weekId }) => {
    const week = await ctx.db.get(weekId);
    if (!week) throw new ConvexError("Woche nicht gefunden");
    await requireClassRole(ctx, week.class_id, [...ANY_MEMBER]);
    // Load timetable entries
    const entries = await ctx.db
      .query("timetables")
      .withIndex("by_week", (q) => q.eq("week_id", weekId))
      .collect();
    for (const entry of entries) {
      const groups = await ctx.db
        .query("groups")
        .withIndex("by_timetable", (q) => q.eq("timetable_id", entry._id))
        .collect();
      for (const g of groups) await ctx.db.delete(g._id);
      await ctx.db.delete(entry._id);
    }
    await ctx.db.delete(weekId);
    return true;
  },
});
