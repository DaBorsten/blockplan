import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

export const runtime = "nodejs";

// POST /api/class/invitation/accept
// body: { code, user_id }
export async function POST(req: NextRequest) {
  try {
    const { code, user_id } = await req.json();
    if (!code || !user_id) {
      return NextResponse.json({ error: "Missing code or user_id" }, { status: 400 });
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
      return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    }

    const row = (res.rows[0] as unknown) as { code: string; class_id: string; expiration_date: string; class_title: string };
    const never = row.expiration_date === "9999-12-31T23:59:59.000Z";
    const expOk = never || new Date(row.expiration_date).getTime() >= Date.now();
    if (!expOk) {
      return NextResponse.json({ error: "Code expired" }, { status: 410 });
    }

    // check membership
    const mem = await turso.execute(
      `SELECT 1 FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
      [user_id, row.class_id]
    );
    if (mem.rows.length > 0) {
      return NextResponse.json({ joined: false, alreadyMember: true, class_id: row.class_id, class_title: row.class_title });
    }

    await turso.execute(
      `INSERT INTO user_class (user_id, class_id, role) VALUES (?, ?, ?)`,
      [user_id, row.class_id, "member"],
    );

    return NextResponse.json({ joined: true, class_id: row.class_id, class_title: row.class_title });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Error accepting invitation" }, { status: 500 });
  }
}
