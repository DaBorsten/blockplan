import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { requireAuthUserId } from "@/lib/auth";

// GET /api/week/weeks?class_id=... (user inferred)
export async function GET(req: NextRequest) {
  try {
  const class_id = req.nextUrl.searchParams.get("class_id");
  const userId = requireAuthUserId(req);
  if (!class_id) {
      return NextResponse.json(
    { error: "Missing required query param: class_id" },
        { status: 400 },
      );
    }

    // Validate membership
    const membership = await turso.execute(
      `SELECT 1 FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1;`,
      [userId, class_id],
    );
    if (!membership.rows || !membership.rows[0]) {
      return NextResponse.json(
        { error: "Forbidden: user is not a member of this class" },
        { status: 403 },
      );
    }

    const result = await turso.execute(
      `SELECT id as week_id, week_title FROM timetable_week WHERE class_id = ?;`,
      [class_id],
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: "Error loading week ids", details: err.message }, { status: 500 });
  }
}
