import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    nickname: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  classes: defineTable({
    owner_id: v.id("users"),
    title: v.string(),
  }).index("by_owner", ["owner_id"]),

  user_classes: defineTable({
    user_id: v.id("users"),
    class_id: v.id("classes"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  })
    .index("by_user_class", ["user_id", "class_id"])
    .index("by_class_user", ["class_id", "user_id"]),

  colors: defineTable({
    class_id: v.id("classes"),
    teacher: v.string(),
    color: v.string(),
  })
    .index("by_class", ["class_id"])
    .index("by_class_teacher", ["class_id", "teacher"])
    .index("by_class_teacher_color", ["class_id", "teacher", "color"]),

  invitations: defineTable({
    code: v.string(), // 6-stelliger Einladungs-Code
    user_id: v.id("users"),
    class_id: v.id("classes"),
    expiration_date: v.number(), // ms timestamp
  })
    .index("by_class", ["class_id"])
    .index("by_user", ["user_id"])
    .index("by_user_class", ["user_id", "class_id"])
    .index("by_code", ["code"]),

  weeks: defineTable({
    class_id: v.id("classes"),
    title: v.string(),
  }).index("by_class", ["class_id"]),

  timetables: defineTable({
    week_id: v.id("weeks"),
    day: v.union(
      v.literal("Montag"),
      v.literal("Dienstag"),
      v.literal("Mittwoch"),
      v.literal("Donnerstag"),
      v.literal("Freitag"),
      v.literal("Samstag"),
      v.literal("Sonntag"),
    ),
    hour: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    subject: v.string(),
    teacher: v.string(),
    room: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_week", ["week_id"])
    .index("by_week_day", ["week_id", "day"]),

  groups: defineTable({
    timetable_id: v.id("timetables"),
    groupNumber: v.number(),
  }).index("by_timetable", ["timetable_id"]),
});
