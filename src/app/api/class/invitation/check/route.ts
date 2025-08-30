import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { getAuthUserId } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/class/invitation/check?code=XXXXXX
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const res = await turso.execute(
      `SELECT i.id as code, i.class_id, i.expiration_date, c.title as class_title
       FROM invitation i
       JOIN class c ON c.id = i.class_id
       WHERE i.id = ?
       LIMIT 1`,
      [code]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ valid: false, reason: "not_found" });
    }

    const row = (res.rows[0] as unknown) as { code: string; class_id: string; expiration_date: string; class_title: string };
    const exp = new Date(row.expiration_date).getTime();
    const never = row.expiration_date === "9999-12-31T23:59:59.000Z";
    const valid = never || exp >= Date.now();

    let isMember = false;
  const userId = getAuthUserId(req);
  if (userId) {
      const mem = await turso.execute(
        `SELECT 1 FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
    [userId, row.class_id]
      );
      isMember = mem.rows.length > 0;
    }

    return NextResponse.json({
      valid,
      code: row.code,
      class_id: row.class_id,
      class_title: row.class_title,
      expires_at: never ? null : row.expiration_date,
      isMember,
    });
  } catch (error) {
    console.error("Error checking invitation:", error);
    return NextResponse.json({ error: "Error checking invitation" }, { status: 500 });
  }
}
