import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getMembership } from "./classes";
import type { Id, Doc } from "./_generated/dataModel";

// Helper: clean note text (trim each line, remove empty lines only at start/end)
function cleanNoteText(text: string): string {
  const lines = text.split('\n').map(line => line.trim());
  
  // Remove empty lines from the start
  while (lines.length > 0 && lines[0] === '') {
    lines.shift();
  }
  
  // Remove empty lines from the end
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  
  return lines.join('\n');
}

// Helper: resolve group expansion (replicates legacy resolveGroupIds)
function resolveGroupIds(g: number): number[] {
  switch (g) {
    case 1:
      return [1, 2, 3];
    case 2:
      return [1, 2];
    case 3:
      return [1, 3];
    default:
      return [g];
  }
}

type GenericCtx = QueryCtx | MutationCtx;
async function ensureWeek(ctx: GenericCtx, weekId: Id<"weeks">) {
  const week = await ctx.db.get(weekId);
  if (!week) throw new Error("Woche nicht gefunden");
  const member = await getMembership(ctx, week.class_id);
  if (!member) throw new Error("Nicht berechtigt");
  return { week, member };
}

// Query: get notes of a week for a group set
export const getWeekNotes = query({
  args: { weekId: v.id("weeks"), group: v.number() },
  handler: async (ctx, { weekId, group }) => {
    const { week } = await ensureWeek(ctx, weekId);
    const groupIds = resolveGroupIds(group);
    const entries = await ctx.db
      .query("timetables")
      .withIndex("by_week", (q) => q.eq("week_id", weekId))
      .collect();
    const result: Array<{
      day: string;
      hour: number;
      subject: string;
      teacher: string;
      notes: string | null;
      groups: number[];
    }> = [];
    for (const e of entries) {
      if (!e.notes || !e.notes.trim()) continue;
      const groups = await ctx.db
        .query("groups")
        .withIndex("by_timetable", (q) => q.eq("timetable_id", e._id))
        .collect();
      const groupNums = groups.map((g) => g.groupNumber);
      if (groupNums.some((g) => groupIds.includes(g))) {
        result.push({
          day: e.day,
          hour: e.hour,
          subject: e.subject,
          teacher: e.teacher,
          notes: e.notes,
          groups: groupNums,
        });
      }
    }
    return { weekId: week._id, notes: result };
  },
});

// Mutation: update single lesson notes
export const updateLessonNotes = mutation({
  args: {
    lessonId: v.id("timetables"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { lessonId, notes }) => {
    const lesson = await ctx.db.get(lessonId);
    if (!lesson) throw new Error("Stunde nicht gefunden");
    const week = await ctx.db.get(lesson.week_id);
    if (!week) throw new Error("Woche nicht gefunden");
    const member = await getMembership(ctx, week.class_id);
    if (!member) throw new Error("Nicht berechtigt");

    // Clean the notes text if provided
    const cleanedNotes = notes ? cleanNoteText(notes) : notes;

    await ctx.db.patch(lessonId, { notes: cleanedNotes || undefined });
  },
});

// --- Class Notes (New Table) ---

export const getClassNotes = query({
  args: { 
    classId: v.id("classes"),
    noteType: v.optional(v.union(
      v.literal("homework"),
      v.literal("tests"),
      v.literal("exams"),
      v.literal("other"),
    )),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, { classId, noteType, archived }) => {
    const member = await getMembership(ctx, classId);
    if (!member) return []; // or throw, but returning empty is safer for UI

    // If both noteType and archived are specified, use the most specific index
    if (noteType !== undefined && archived !== undefined) {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_class_type_archived", (q) => 
          q.eq("class_id", classId).eq("note_type", noteType)
        )
        .filter((q) => 
          archived 
            ? q.neq(q.field("archived_at"), undefined)
            : q.eq(q.field("archived_at"), undefined)
        )
        .order("desc")
        .collect();
      return notes;
    }

    // If only noteType is specified, use by_class_type index
    if (noteType !== undefined) {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_class_type", (q) => 
          q.eq("class_id", classId).eq("note_type", noteType)
        )
        .collect();
      return notes;
    }

    // If only archived is specified, use by_class_archived index
    if (archived !== undefined) {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_class_archived", (q) => q.eq("class_id", classId))
        .filter((q) => 
          archived 
            ? q.neq(q.field("archived_at"), undefined)
            : q.eq(q.field("archived_at"), undefined)
        )
        .order("desc")
        .collect();
      return notes;
    }

    // Otherwise get all notes for the class
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect();

    return notes;
  },
});

export const addClassNote = mutation({
  // Argument validation
  args: {
    classId: v.id("classes"),
    note_type: v.union(
      v.literal("homework"),
      v.literal("tests"),
      v.literal("exams"),
      v.literal("other"),
    ),
    text: v.string(),
    archived_at: v.optional(v.number()),
  },
  handler: async (ctx, { classId, note_type, text, archived_at }) => {
    const member = await getMembership(ctx, classId);
    if (!member) throw new Error("Nicht berechtigt");

    const cleanedText = cleanNoteText(text);
    if (!cleanedText) return;

    await ctx.db.insert("notes", {
      class_id: classId,
      note_type,
      note_content: cleanedText,
      archived_at: archived_at ?? undefined,
    });
  },
});

export const updateClassNote = mutation({
  args: {
    noteId: v.id("notes"),
    text: v.string(),
  },
  handler: async (ctx, { noteId, text }) => {
    const note = await ctx.db.get(noteId);
    if (!note) throw new Error("Notiz nicht gefunden");
    const member = await getMembership(ctx, note.class_id);
    if (!member) throw new Error("Nicht berechtigt");

    const cleanedText = cleanNoteText(text);
    if (!cleanedText) return;

    await ctx.db.patch(noteId, { note_content: cleanedText });
  },
});

export const toggleArchiveClassNote = mutation({
  args: {
    noteId: v.id("notes"),
    shouldArchive: v.boolean(),
  },
  handler: async (ctx, { noteId, shouldArchive }) => {
    const note = await ctx.db.get(noteId);
    if (!note) throw new Error("Notiz nicht gefunden");
    const member = await getMembership(ctx, note.class_id);
    if (!member) throw new Error("Nicht berechtigt");

    const archived_at = shouldArchive ? Date.now() : undefined;
    await ctx.db.patch(noteId, { archived_at });
  },
});

export const deleteClassNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, { noteId }) => {
    const note = await ctx.db.get(noteId);
    if (!note) throw new Error("Notiz nicht gefunden");
    const member = await getMembership(ctx, note.class_id);
    if (!member) throw new Error("Nicht berechtigt");

    await ctx.db.delete(noteId);
  },
});

// Query: list candidate weeks for notes import (excluding one week + group filter)
export const listWeeksForNotesImport = query({
  args: { excludeWeekId: v.id("weeks"), group: v.number() },
  handler: async (ctx, { excludeWeekId, group }) => {
    const { week: excludeWeek } = await ensureWeek(ctx, excludeWeekId);
    const groupIds = resolveGroupIds(group);
    // naive scan of weeks of same class
    const weeks = await ctx.db
      .query("weeks")
      .withIndex("by_class", (q) => q.eq("class_id", excludeWeek.class_id))
      .collect();
    const results: Array<{
      week_id: Id<"weeks">;
      week_title: string;
      noteCount: number;
    }> = [];

    // Batch-Load aller Einträge für relevante Wochen
    const relevantWeeks = weeks.filter((w) => w._id !== excludeWeekId);
    const weekIds = relevantWeeks.map((w) => w._id);

    // Batch-Load mit mehreren Index-Queries
    const allEntries = [];
    for (const weekId of weekIds) {
      const weekEntries = await ctx.db
        .query("timetables")
        .withIndex("by_week", (q) => q.eq("week_id", weekId))
        .filter((q) => q.neq(q.field("notes"), undefined))
        .collect();
      allEntries.push(...weekEntries);
    }

    // Gruppiere Einträge nach week_id
    const entriesByWeek = new Map();
    for (const entry of allEntries) {
      if (!entry.notes?.trim()) continue;
      if (!entriesByWeek.has(entry.week_id)) {
        entriesByWeek.set(entry.week_id, []);
      }
      entriesByWeek.get(entry.week_id).push(entry);
    }

    // Verarbeite jede Woche
    for (const w of relevantWeeks) {
      const weekEntries = entriesByWeek.get(w._id) || [];
      let noteCount = 0;

      for (const e of weekEntries) {
        const groups = await ctx.db
          .query("groups")
          .withIndex("by_timetable", (q) => q.eq("timetable_id", e._id))
          .collect();
        if (groups.some((g) => groupIds.includes(g.groupNumber))) noteCount++;
      }

      if (noteCount > 0)
        results.push({ week_id: w._id, week_title: w.title, noteCount });
    }

    return results;
  },
});

// Mutation: copy notes from selectedWeek to currentWeek for group (fill only empty notes)
export const copyNotes = mutation({
  args: {
    currentWeekId: v.id("weeks"),
    selectedWeekId: v.id("weeks"),
    group: v.number(),
  },
  handler: async (ctx, { currentWeekId, selectedWeekId, group }) => {
    const { week: targetWeek } = await ensureWeek(ctx, currentWeekId);
    const { week: sourceWeek } = await ensureWeek(ctx, selectedWeekId);
    if (targetWeek.class_id !== sourceWeek.class_id)
      throw new Error("Klassen unterschiedlich");
    const groupIds = resolveGroupIds(group);
    const sourceEntries = await ctx.db
      .query("timetables")
      .withIndex("by_week", (q) => q.eq("week_id", selectedWeekId))
      .collect();
    const targetEntries = await ctx.db
      .query("timetables")
      .withIndex("by_week", (q) => q.eq("week_id", currentWeekId))
      .collect();
    let updated = 0;
    for (const se of sourceEntries) {
      if (!se.notes || !se.notes.trim()) continue;
      const srcGroups = await ctx.db
        .query("groups")
        .withIndex("by_timetable", (q) => q.eq("timetable_id", se._id))
        .collect();
      if (!srcGroups.some((g) => groupIds.includes(g.groupNumber))) continue;
      // find matching entry in target
      const match = targetEntries.find(
        (te) =>
          te.day === se.day &&
          te.hour === se.hour &&
          te.subject === se.subject &&
          te.teacher === se.teacher &&
          te.room === se.room &&
          !te.notes,
      );
      if (match) {
        await ctx.db.patch(match._id, { notes: se.notes });
        updated++;
      }
    }
    return { updated };
  },
});

// Helper to count transferable notes between weeks for group
async function countTransferable(
  ctx: GenericCtx,
  sourceWeekId: Id<"weeks">,
  targetWeekId: Id<"weeks">,
  group: number,
) {
  const groupIds = resolveGroupIds(group);
  const sourceEntries = await ctx.db
    .query("timetables")
    .withIndex("by_week", (q) => q.eq("week_id", sourceWeekId))
    .collect();
  const targetEntries = await ctx.db
    .query("timetables")
    .withIndex("by_week", (q) => q.eq("week_id", targetWeekId))
    .collect();
  let count = 0;
  for (const se of sourceEntries) {
    if (!se.notes || !se.notes.trim()) continue;
    const srcGroups = await ctx.db
      .query("groups")
      .withIndex("by_timetable", (q) => q.eq("timetable_id", se._id))
      .collect();
    if (!srcGroups.some((g) => groupIds.includes(g.groupNumber))) continue;
    const match = targetEntries.find(
      (te) =>
        te.day === se.day &&
        te.hour === se.hour &&
        te.subject === se.subject &&
        te.teacher === se.teacher &&
        te.room === se.room &&
        !te.notes,
    );
    if (match) count++;
  }
  return count;
}

// Query: preview transfer
export const transferPreview = query({
  args: {
    sourceWeekId: v.id("weeks"),
    targetWeekId: v.id("weeks"),
    group: v.number(),
  },
  handler: async (ctx, { sourceWeekId, targetWeekId, group }) => {
    await ensureWeek(ctx, sourceWeekId);
    await ensureWeek(ctx, targetWeekId);
    const transferableCount = await countTransferable(
      ctx,
      sourceWeekId,
      targetWeekId,
      group,
    );
    return { transferableCount };
  },
});

// Mutation: execute transfer
export const transferNotes = mutation({
  args: {
    sourceWeekId: v.id("weeks"),
    targetWeekId: v.id("weeks"),
    group: v.number(),
  },
  handler: async (ctx, { sourceWeekId, targetWeekId, group }) => {
    const { week: sourceWeek } = await ensureWeek(ctx, sourceWeekId);
    const { week: targetWeek } = await ensureWeek(ctx, targetWeekId);
    if (sourceWeek.class_id !== targetWeek.class_id)
      throw new Error("Klassen unterschiedlich");
    const groupIds = resolveGroupIds(group);
    const sourceEntries = await ctx.db
      .query("timetables")
      .withIndex("by_week", (q) => q.eq("week_id", sourceWeekId))
      .collect();
    const targetEntries = await ctx.db
      .query("timetables")
      .withIndex("by_week", (q) => q.eq("week_id", targetWeekId))
      .collect();
    let updated = 0;
    for (const se of sourceEntries) {
      if (!se.notes || !se.notes.trim()) continue;
      const srcGroups = await ctx.db
        .query("groups")
        .withIndex("by_timetable", (q) => q.eq("timetable_id", se._id))
        .collect();
      if (!srcGroups.some((g) => groupIds.includes(g.groupNumber))) continue;
      const match = targetEntries.find(
        (te) =>
          te.day === se.day &&
          te.hour === se.hour &&
          te.subject === se.subject &&
          te.teacher === se.teacher &&
          te.room === se.room &&
          !te.notes,
      );
      if (match) {
        await ctx.db.patch(match._id, { notes: se.notes });
        updated++;
      }
    }
    const transferableCount = await countTransferable(
      ctx,
      sourceWeekId,
      targetWeekId,
      group,
    );
    return { updatedCount: updated, transferableCount };
  },
});

// Mutation: create week with imported timetable (from import page)
export const importWeekWithTimetable = mutation({
  args: { classId: v.id("classes"), title: v.string(), timetable: v.any() },
  handler: async (ctx, { classId, title, timetable }) => {
    const member = await getMembership(ctx, classId);
    if (!member) throw new Error("Keine Berechtigung");
    const weekId = await ctx.db.insert("weeks", { class_id: classId, title });
    // timetable: { day -> hour -> [lessons] }
    const timetableData = timetable?.timetable || {};

    for (const day of Object.keys(timetableData)) {
      const daySchedule = timetableData[day];
      for (const hourStr of Object.keys(daySchedule)) {
        const hour = Number(hourStr);

        const lessons = daySchedule[hourStr];
        if (!lessons || !Array.isArray(lessons)) continue;
        for (const lesson of lessons) {
          if (typeof lesson !== "object" || lesson === null) continue;
          const allowedDays = new Set([
            "Montag",
            "Dienstag",
            "Mittwoch",
            "Donnerstag",
            "Freitag",
            "Samstag",
            "Sonntag",
          ]);
          const dayValue = allowedDays.has(day)
            ? (day as Doc<"timetables">["day"])
            : "Montag";
          const entryId = await ctx.db.insert("timetables", {
            week_id: weekId,
            day: dayValue,
            hour,
            subject: String(lesson.subject ?? ""),
            teacher: String(lesson.teacher ?? ""),
            room: String(lesson.room ?? ""),
          });
          const specialization = lesson.specialization;
          const groupNums = Array.isArray(specialization)
            ? specialization
            : specialization != null
              ? [specialization]
              : [];
          for (const g of groupNums) {
            if (typeof g === "number" && g > 0) {
              await ctx.db.insert("groups", {
                timetable_id: entryId,
                groupNumber: g,
              });
            }
          }
        }
      }
    }
    return { weekId };
  },
});
