import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { mapRows } from "@/utils/db";

// GET /api/timetable/week?weekId=...&specialization=...
export async function GET(req: NextRequest) {
  const weekId = req.nextUrl.searchParams.get("weekId");
  const specialization = Number(req.nextUrl.searchParams.get("specialization"));
  if (!weekId || !specialization) {
    return NextResponse.json(
      { error: "weekId and specialization are required" },
      { status: 400 },
    );
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
      `SELECT timetable.*, timetable_specialization.specialization
       FROM timetable 
       JOIN timetable_specialization ON timetable.id = timetable_specialization.timetable_id 
       WHERE timetable.week_id = ? AND timetable_specialization.specialization IN (${placeholders});`,
      [weekId, ...specializationIds],
    );
    const mappedRows = mapRows(result);
    return NextResponse.json({ data: mappedRows });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error loading timetable", details: err.message },
      { status: 500 },
    );
  }
}

// DELETE /api/timetable/week?weekId=...
export async function DELETE(req: NextRequest) {
  const weekID = req.nextUrl.searchParams.get("weekId");
  if (!weekID) {
    return NextResponse.json({ error: "weekId is required" }, { status: 400 });
  }
  try {
    await turso.execute(`DELETE from timetable_week where id = ?;`, [weekID]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error deleting week", details: err.message },
      { status: 500 },
    );
  }
}
