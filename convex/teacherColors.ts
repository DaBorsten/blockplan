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

function groupTeacherColors(colors: Doc<"colors">[]) {
  const grouped = new Map<
    string,
    {
      id: string;
      teacher: string;
      color: string;
      subjects: { id: string; subject: string; color: string }[];
    }
  >();

  // Basisfarben (ohne subject)
  for (const c of colors) {
    if (c.subject) continue;
    grouped.set(c.teacher, {
      id: c._id,
      teacher: c.teacher,
      color: c.color,
      subjects: [],
    });
  }

  // Subjects anhängen
  for (const c of colors) {
    if (!c.subject) continue;
    const base = grouped.get(c.teacher);
    if (!base) continue;
    base.subjects.push({
      id: c._id,
      subject: c.subject,
      color: c.color,
    });
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.teacher.localeCompare(b.teacher),
  );
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

    return groupTeacherColors(colors);
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
        subjects: v.optional(
          v.array(
            v.object({
              id: v.optional(v.id("colors")),
              subject: v.string(),
              color: v.string(),
            }),
          ),
        ),
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

    for (const it of items) {
      const teacherName = it.teacher.trim();
      const teacherColor = it.color.trim();
      if (!teacherName || !teacherColor) continue;

      let baseRecordId = it.id;

      // 1. Try to find existing record by ID if provided
      if (baseRecordId) {
        const existing = await ctx.db.get(baseRecordId);
        // Check if it exists and belongs to class
        if (existing && existing.class_id === classId) {
          // Check for rename
          if (existing.teacher !== teacherName) {
            // RENAME DETECTED
            // Update all records with old name to new name
            const oldName = existing.teacher;
            const related = await ctx.db
              .query("colors")
              .withIndex("by_class_teacher", (q) =>
                q.eq("class_id", classId).eq("teacher", oldName),
              )
              .collect();

            for (const doc of related) {
              await ctx.db.patch(doc._id, { teacher: teacherName });
            }
          }
          // Update base record color
          await ctx.db.patch(baseRecordId, {
            teacher: teacherName,
            color: teacherColor,
            subject: undefined, // ensure it's a base
          });
        } else {
          // ID invalid or wrong class? Throw error
          throw new Error(`Invalid color ID ${it.id} or access forbidden`);
        }
      }

      // 2. If no ID (or invalid), try to find by name (Upsert logic)
      if (!baseRecordId) {
        const existing = await ctx.db
          .query("colors")
          .withIndex("by_class_teacher", (q) =>
            q.eq("class_id", classId).eq("teacher", teacherName),
          )
          .collect();
        const base = existing.find((c) => !c.subject);

        if (base) {
          baseRecordId = base._id;
          await ctx.db.patch(base._id, {
            teacher: teacherName,
            color: teacherColor,
            subject: undefined,
          });
        } else {
          baseRecordId = await ctx.db.insert("colors", {
            class_id: classId,
            teacher: teacherName,
            color: teacherColor,
            subject: undefined,
          });
        }
      }

      // 3. Handle Subjects
      const subjects = it.subjects ?? [];

      // Fetch all subjects for this teacher (using the NEW name)
      const currentTeacherColors = await ctx.db
        .query("colors")
        .withIndex("by_class_teacher", (q) =>
          q.eq("class_id", classId).eq("teacher", teacherName),
        )
        .collect();

      const existingSubjectColors = currentTeacherColors.filter(
        (c) => c.subject,
      );

      const providedById = new Map(
        subjects.filter((s) => s.id).map((s) => [s.id as string, s]),
      );

      // Delete removed subjects
      for (const existingSub of existingSubjectColors) {
        const match = providedById.get(existingSub._id);
        if (!match) {
          await ctx.db.delete(existingSub._id);
        }
      }

      // Upsert provided subjects
      for (const s of subjects) {
        const subjectName = s.subject.trim();
        const subjectColor = s.color.trim();
        if (!subjectName || !subjectColor) continue;

        if (s.id) {
          const subDoc = await ctx.db.get(s.id as any);
          if (subDoc) {
            await ctx.db.patch(s.id as any, {
              teacher: teacherName,
              subject: subjectName,
              color: subjectColor,
            });
          }
        } else {
          await ctx.db.insert("colors", {
            class_id: classId,
            teacher: teacherName,
            color: subjectColor,
            subject: subjectName,
          });
        }
      }
    }

    // zum Schluss aktuellen Stand zurückgeben
    const colors = await ctx.db
      .query("colors")
      .withIndex("by_class", (q) => q.eq("class_id", classId))
      .collect();

    return groupTeacherColors(colors);
  },
});

// delete color (and all associated subjects for that teacher)
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

    const teacherName = colorDoc.teacher;

    // Find all records for this teacher (base + subjects)
    const allTeacherRecords = await ctx.db
      .query("colors")
      .withIndex("by_class_teacher", (q) =>
        q.eq("class_id", classId).eq("teacher", teacherName),
      )
      .collect();

    for (const record of allTeacherRecords) {
      await ctx.db.delete(record._id);
    }

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
