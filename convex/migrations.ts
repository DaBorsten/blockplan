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
