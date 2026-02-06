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
      const updates: Record<string, unknown> = { notes: undefined };
      await ctx.db.patch(doc._id, updates);
    }
  },
});

export const removeIsArchivedFromNotes = migrations.define({
  table: "notes",
  migrateOne: async (ctx, doc) => {
    const updates: Record<string, unknown> = {};

    // If legacy isArchived exists, migrate it to is_archived if needed
    if ("isArchived" in doc && !("is_archived" in doc)) {
      const docWithLegacy = doc as Record<string, unknown> & {
        isArchived: boolean;
      };
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

export const makeIsArchivedOptional = migrations.define({
  table: "notes",
  migrateOne: async () => {
    // This migration makes is_archived optional by doing nothing
    // It's just a schema change that allows existing docs to have is_archived
    // while new docs can omit it
  },
});

export const runMakeIsArchivedOptional = migrations.runner(
  internal.migrations.makeIsArchivedOptional,
);

export const removeIsArchivedField = migrations.define({
  table: "notes",
  migrateOne: async (ctx, doc) => {
    if ("is_archived" in doc) {
      const updates: Record<string, unknown> = { is_archived: undefined };
      await ctx.db.patch(doc._id, updates);
    }
  },
});

export const runRemoveIsArchivedField = migrations.runner(
  internal.migrations.removeIsArchivedField,
);

// Migration to add default preferences to existing users
export const addUserPreferences = migrations.define({
  table: "users",
  migrateOne: async (ctx, doc) => {
    const updates: Record<string, unknown> = {};
    
    // Set default values for new preference fields if they don't exist
    if (!("autoLatestWeek" in doc)) {
      updates.autoLatestWeek = true; // default: auto-select latest week
    }
    if (!("showSubjectColors" in doc)) {
      updates.showSubjectColors = true; // default: show subject colors
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(doc._id, updates);
    }
  },
});

export const runAddUserPreferences = migrations.runner(
  internal.migrations.addUserPreferences,
);
