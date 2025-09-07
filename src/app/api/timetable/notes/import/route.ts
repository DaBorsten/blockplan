import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { resolveGroupIds } from "@/utils/groups";

// GET /api/timetable/notes/import?excludeWeekId=...&group=...
export async function GET(req: NextRequest) {
  const excludeWeekId = req.nextUrl.searchParams.get("excludeWeekId");
  const groupParam = req.nextUrl.searchParams.get("group");
  if (!excludeWeekId || !groupParam) {
    return NextResponse.json(
      { error: "excludeWeekId and group are required" },
      { status: 400 },
    );
  }
  const group = Number(groupParam);
  if (!Number.isFinite(group) || group <= 0) {
    return NextResponse.json(
      { error: "group must be a positive number" },
      { status: 400 },
    );
  }
  const groupIds = resolveGroupIds(group);

  const placeholders = groupIds.map(() => "?").join(",");
  try {
    const result = await turso.execute(
      `SELECT 
        timetable.week_id,
        timetable_group.groupNumber,
        timetable_week.week_title,
        timetable_week.class_id,
        COUNT(*) AS noteCount,
        TRIM(SUBSTR(
          timetable_week.week_title,
          INSTR(timetable_week.week_title, 'KW'),
          INSTR(timetable_week.week_title || ' ', '_') - INSTR(timetable_week.week_title, 'KW')
        )) AS calendarWeek
      FROM timetable
      JOIN timetable_group ON timetable.id = timetable_group.timetable_id
      JOIN timetable_week ON timetable.week_id = timetable_week.id
      WHERE 
        timetable.week_id != ? AND
        timetable_group.groupNumber IN (${placeholders}) AND
        timetable.notes IS NOT NULL AND
        TRIM(timetable.notes) != ''
      GROUP BY 
        timetable.week_id,
        timetable_group.groupNumber,
        timetable_week.week_title,
        timetable_week.class_id`,
      [excludeWeekId, ...groupIds],
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      {
        error: "Error getting relevant weeks for notes import",
        details: err.message,
      },
      { status: 500 },
    );
  }
}
