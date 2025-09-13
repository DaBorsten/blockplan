/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as classes from "../classes.js";
import type * as defaultTeacherColors from "../defaultTeacherColors.js";
import type * as invitations from "../invitations.js";
import type * as notes from "../notes.js";
import type * as teacherColors from "../teacherColors.js";
import type * as timetable from "../timetable.js";
import type * as users from "../users.js";
import type * as weeks from "../weeks.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  classes: typeof classes;
  defaultTeacherColors: typeof defaultTeacherColors;
  invitations: typeof invitations;
  notes: typeof notes;
  teacherColors: typeof teacherColors;
  timetable: typeof timetable;
  users: typeof users;
  weeks: typeof weeks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
