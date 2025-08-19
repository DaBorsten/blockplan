import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/class/weeks?class_id=...&user_id=...
// Requires both params; validates the user is a member of the class.
export async function GET(req: NextRequest) {
  try {
    const class_id = req.nextUrl.searchParams.get("class_id");
    const user_id = req.nextUrl.searchParams.get("user_id");

    if (!class_id || !user_id) {
      return NextResponse.json(
        { error: "Missing required query params: class_id and user_id" },
        { status: 400 },
      );
    }

    // Validate membership: user must belong to the class
    const membership = await turso.execute(
      `SELECT 1 FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1;`,
      [user_id, class_id],
    );
    if (!membership.rows || !membership.rows[0]) {
      return NextResponse.json(
        { error: "Forbidden: user is not a member of this class" },
        { status: 403 },
      );
    }

    // Fetch weeks for the class
    const result = await turso.execute(
      `SELECT id AS week_id, week_title FROM timetable_week WHERE class_id = ?;`,
      [class_id],
    );

    return NextResponse.json({ data: result.rows });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error loading weeks", details: err.message },
      { status: 500 },
    );
  }
}
