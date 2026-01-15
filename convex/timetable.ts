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

    // Batch fetch groups for all timetable entries using the index
    const groupsPromises = entries.map((entry) =>
      ctx.db
        .query("groups")
        .withIndex("by_timetable", (q) => q.eq("timetable_id", entry._id))
        .collect(),
    );
    const groupsResults = await Promise.all(groupsPromises);

    // Map entries to include their group numbers
    const entriesWithGroups = entries.map((entry, index) => ({
      entry,
      groupNumbers: groupsResults[index].map((g) => g.groupNumber),
    }));

    // Filtere nur Entries, die mindestens eine ausgewählte Gruppe enthalten
    const result: Array<(typeof entries)[number] & { groups: number[] }> = [];
    for (const { entry, groupNumbers } of entriesWithGroups) {
      if (groupNumbers.some((g) => groups.includes(g))) {
        result.push({ ...entry, groups: groupNumbers });
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
