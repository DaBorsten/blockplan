import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { mapRows } from "@/utils/db";
import { resolveGroupIds } from "@/utils/groups";

// GET /api/timetable/week?weekId=...&group=...
export async function GET(req: NextRequest) {
  const weekId = req.nextUrl.searchParams.get("weekId");
  const groupParam = req.nextUrl.searchParams.get("group");
  if (!weekId || !groupParam) {
    return NextResponse.json(
      { error: "weekId and group are required" },
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
      `SELECT timetable.*, timetable_group.groupNumber
       FROM timetable
       JOIN timetable_group ON timetable.id = timetable_group.timetable_id
       WHERE timetable.week_id = ? AND timetable_group.groupNumber IN (${placeholders});`,
      [weekId, ...groupIds],
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
