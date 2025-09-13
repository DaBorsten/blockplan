import { query } from "./_generated/server";
import { v } from "convex/values";
import { getMembership } from "./classes";

// Helper: ensure membership via week
import type { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function ensureWeekMembership(
  ctx: QueryCtx | MutationCtx,
  weekId: Id<"weeks">,
) {
  const week = await ctx.db.get(weekId);
  if (!week) throw new Error("Woche nicht gefunden");
  const member = await getMembership(ctx, week.class_id);
  if (!member) throw new Error("Nicht berechtigt");
  return week;
}

export const listTimetable = query({
  args: {
    weekId: v.id("weeks"),
    groups: v.array(v.number()), // positive group numbers
  },
  handler: async (ctx, { weekId, groups }) => {
    await ensureWeekMembership(ctx, weekId);
    if (groups.length === 0) return [];
    // Load all entries for week
    const entries = await ctx.db
      .query("timetables")
      .withIndex("by_week", (q) => q.eq("week_id", weekId))
      .collect();

    if (entries.length === 0) return [];

    // Batch-Laden aller relevanten Gruppen
    const entryIds = entries.map((e) => e._id);
    const allGroups = await ctx.db
      .query("groups")
      .withIndex("by_timetable")
      .filter((q) =>
        q.or(...entryIds.map((id) => q.eq(q.field("timetable_id"), id))),
      )
      .collect();

    // Gruppierung nach timetable_id
    const groupsByTimetable = new Map<Id<"timetables">, number[]>();
    for (const group of allGroups) {
      const existing = groupsByTimetable.get(group.timetable_id) || [];
      existing.push(group.groupNumber);
      groupsByTimetable.set(group.timetable_id, existing);
    }

    const result: Array<Record<string, unknown>> = [];
    for (const e of entries) {
      const groupNums = groupsByTimetable.get(e._id) || [];
      if (groupNums.some((g) => groups.includes(g))) {
        result.push({ ...e, _id: e._id, groups: groupNums });
      }
    }
    return result;
  },
});

// Fetch single timetable entry (for freshest notes in edit dialog)
export const getEntry = query({
  args: { entryId: v.id("timetables") },
  handler: async (ctx, { entryId }) => {
    const entry = await ctx.db.get(entryId);
    if (!entry) return null;
    // Ensure membership via its week
    try {
      await ensureWeekMembership(ctx, entry.week_id);
    } catch {
      return null;
    }
    const relatedGroups = await ctx.db
      .query("groups")
      .withIndex("by_timetable", (q) => q.eq("timetable_id", entryId))
      .collect();
    return { ...entry, groups: relatedGroups.map((g) => g.groupNumber) };
  },
});
