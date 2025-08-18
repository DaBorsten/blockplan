import { turso } from "@/lib/tursoClient";
import { NextRequest, NextResponse } from "next/server";

// GET /api/class/classes?user_id=...
export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");
    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id query parameter" },
        { status: 400 },
      );
    }

    const result = await turso.execute(
      `SELECT c.id AS class_id, c.title AS class_title
       FROM user_class uc
       JOIN class c ON uc.class_id = c.id
       WHERE uc.user_id = ?;`,
      [user_id],
    );

    return NextResponse.json({ data: result.rows });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error loading classes for user", details: err.message },
      { status: 500 },
    );
  }
}

// POST /api/class/classes  { user_id }
export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id in body" },
        { status: 400 },
      );
    }
    const result = await turso.execute(
      `SELECT c.id AS class_id, c.title AS class_title
       FROM user_class uc
       JOIN class c ON uc.class_id = c.id
       WHERE uc.user_id = ?;`,
      [user_id],
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error loading classes for user", details: err.message },
      { status: 500 },
    );
  }
}
