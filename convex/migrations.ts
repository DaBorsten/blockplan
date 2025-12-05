import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const removeStartAndEndTime = migrations.define({
  table: "timetables",
  migrateOne: async (ctx, doc) => {
    const updates: Record<string, unknown> = {};
    if ("startTime" in doc) updates.startTime = undefined;
    if ("endTime" in doc) updates.endTime = undefined;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(doc._id, updates);
    }
  },
});

export const runIt = migrations.runner(
  internal.migrations.removeStartAndEndTime,
);

export const removeNotesFromClasses = migrations.define({
  table: "classes",
  migrateOne: async (ctx, doc) => {
    if ("notes" in doc) {
      await ctx.db.patch(doc._id, { notes: undefined } as any);
    }
  },
});

export const removeIsArchivedFromNotes = migrations.define({
  table: "notes",
  migrateOne: async (ctx, doc) => {
    const updates: Record<string, unknown> = {};
    
    // If legacy isArchived exists, migrate it to is_archived if needed
    if ("isArchived" in doc && !("is_archived" in doc)) {
      const docWithLegacy = doc as Record<string, unknown> & { isArchived: boolean };
      updates.is_archived = docWithLegacy.isArchived;
    }
    
    // Remove legacy isArchived field
    if ("isArchived" in doc) {
      updates.isArchived = undefined;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(doc._id, updates);
    }
  },
});

export const runRemoveNotesFromClasses = migrations.runner(
  internal.migrations.removeNotesFromClasses,
);

export const runRemoveIsArchivedFromNotes = migrations.runner(
  internal.migrations.removeIsArchivedFromNotes,
);
