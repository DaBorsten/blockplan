import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/week/notes/week?week_id=...&specialization=...
export async function GET(req: NextRequest) {
  const week_id = req.nextUrl.searchParams.get("week_id");
  const specialization = Number(req.nextUrl.searchParams.get("specialization"));
  if (!week_id || !specialization) {
    return NextResponse.json({ error: "week_id and specialization are required" }, { status: 400 });
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
      `SELECT timetable.day, timetable.hour, timetable.subject, timetable.teacher, timetable.notes, timetable_specialization.specialization
       FROM timetable 
       JOIN timetable_specialization ON timetable.id = timetable_specialization.timetable_id 
       WHERE timetable.week_id = ? AND timetable_specialization.specialization IN (${placeholders}) AND timetable.notes IS NOT NULL AND TRIM(timetable.notes) != '';`,
      [week_id, ...specializationIds],
    );
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: "Error loading week notes", details: err.message }, { status: 500 });
  }
}
