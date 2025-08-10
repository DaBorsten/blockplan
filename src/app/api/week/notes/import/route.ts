import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/week/notes/import?excludeWeekId=...&specialization=...
export async function GET(req: NextRequest) {
  const excludeWeekId = req.nextUrl.searchParams.get("excludeWeekId");
  const specialization = Number(req.nextUrl.searchParams.get("specialization"));
  if (!excludeWeekId || !specialization) {
    return NextResponse.json({ error: "excludeWeekId and specialization are required" }, { status: 400 });
  }
  let specializationIds: number[];
  if (specialization === 1) {
    specializationIds = [1, 2, 3];
  } else if (specialization === 2) {
    specializationIds = [1, 2];
  } else if (specialization === 3) {
    specializationIds = [1, 3];
  } else {
    specializationIds = [specialization];
  }
  const placeholders = specializationIds.map(() => "?").join(",");
  try {
    const result = await turso.execute(
      `SELECT 
        timetable.week_id,
        timetable_specialization.specialization,
        timetable_week.week_title,
        timetable_week.class,
        COUNT(*) AS noteCount,
        TRIM(SUBSTR(
          timetable_week.week_title,
          INSTR(timetable_week.week_title, 'KW'),
          INSTR(timetable_week.week_title || ' ', '_') - INSTR(timetable_week.week_title, 'KW')
        )) AS calendarWeek
      FROM timetable
      JOIN timetable_specialization ON timetable.id = timetable_specialization.timetable_id
      JOIN timetable_week ON timetable.week_id = timetable_week.id
      WHERE 
        timetable.week_id != ? AND
        timetable_specialization.specialization IN (${placeholders}) AND
        timetable.notes IS NOT NULL AND
        TRIM(timetable.notes) != ''
      GROUP BY 
        timetable.week_id,
        timetable_specialization.specialization,
        timetable_week.week_title,
        timetable_week.class`,
      [excludeWeekId, ...specializationIds],
    );
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    return NextResponse.json({ error: "Error getting relevant weeks for notes import" }, { status: 500 });
  }
}
