import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { resolveGroupIds } from "@/utils/groups";

// GET /api/week/notes/week?week_id=...&group=...
export async function GET(req: NextRequest) {
  const week_id = req.nextUrl.searchParams.get("week_id");
  const group = Number(req.nextUrl.searchParams.get("group"));
  if (!week_id || !group) {
    return NextResponse.json(
      { error: "week_id and group are required" },
      { status: 400 },
    );
  }

  const groupIds = resolveGroupIds(group);
  const placeholders = groupIds.map(() => "?").join(",");
  try {
    const result = await turso.execute(
      `SELECT timetable.day, timetable.hour, timetable.subject, timetable.teacher, timetable.notes, timetable_group.groupNumber
       FROM timetable 
       JOIN timetable_group ON timetable.id = timetable_group.timetable_id 
       WHERE timetable.week_id = ? AND timetable_group.groupNumber IN (${placeholders}) AND timetable.notes IS NOT NULL AND TRIM(timetable.notes) != '';`,
      [week_id, ...groupIds],
    );
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error loading week notes", details: err.message },
      { status: 500 },
    );
  }
}
