import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// PUT /api/week/weekName
export async function PUT(req: NextRequest) {
  const { weekID, newWeekName } = await req.json();
  if (!weekID || !newWeekName) {
    return NextResponse.json({ error: "weekID and newWeekName are required" }, { status: 400 });
  }
  try {
    await turso.execute(
      `UPDATE timetable_week SET week_title = ? WHERE id = ?;`,
      [newWeekName, weekID],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error updating week name" }, { status: 500 });
  }
}
