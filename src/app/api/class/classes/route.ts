import { turso } from "@/lib/tursoClient";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserId } from "@/lib/auth";

// GET /api/class/classes  (authenticated user)
export async function GET(req: NextRequest) {
  try {
  const userId = requireAuthUserId(req);

    try {
      const result = await turso.execute(
        `SELECT c.id AS class_id, c.title AS class_title
         FROM user_class uc
         JOIN class c ON uc.class_id = c.id
         WHERE uc.user_id = ?;`,
        [userId],
      );
      return NextResponse.json({ data: result.rows });
    } catch (innerError: unknown) {
      const msg = String((innerError as { message?: string } | undefined)?.message || innerError || "");
      // If tables don't exist yet (first run), return an empty list instead of error
      if (msg.includes("no such table")) {
        return NextResponse.json({ data: [] }, { status: 200 });
      }
      throw innerError;
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error loading classes for user", details: err.message },
      { status: 500 },
    );
  }
}

// POST /api/class/classes  (alternative fetch via POST, no body needed)
export async function POST(req: NextRequest) {
  try {
  const userId = requireAuthUserId(req);
    try {
      const result = await turso.execute(
        `SELECT c.id AS class_id, c.title AS class_title
         FROM user_class uc
         JOIN class c ON uc.class_id = c.id
         WHERE uc.user_id = ?;`,
        [userId],
      );
      return NextResponse.json({ data: result.rows });
    } catch (innerError: unknown) {
      const msg = String((innerError as { message?: string } | undefined)?.message || innerError || "");
      if (msg.includes("no such table")) {
        return NextResponse.json({ data: [] }, { status: 200 });
      }
      throw innerError;
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error loading classes for user", details: err.message },
      { status: 500 },
    );
  }
}
