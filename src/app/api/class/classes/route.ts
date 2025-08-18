import { NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/class/classes
export async function GET() {
  try {
    const result = await turso.execute(
      `SELECT id as class_id, MIN(class_title) as class_title FROM timetable_class GROUP BY id;`,
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: "Error loading class ids", details: err.message }, { status: 500 });
  }
}
