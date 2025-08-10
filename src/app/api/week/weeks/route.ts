import { NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/week/weeks
export async function GET() {
  try {
    const result = await turso.execute(
      `SELECT id as week_id, MIN(week_title) as week_title FROM timetable_week GROUP BY id;`,
    );
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    return NextResponse.json({ error: "Error loading week ids" }, { status: 500 });
  }
}
