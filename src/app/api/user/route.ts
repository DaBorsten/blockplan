import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/user?user_id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    // Ensure nickname column exists (idempotent)
    try {
      await turso.execute(`ALTER TABLE user ADD COLUMN nickname TEXT`);
    } catch {
      // ignore if already exists
    }
    const res = await turso.execute(`SELECT id, nickname FROM user WHERE id = ? LIMIT 1`, [user_id]);
    if (res.rows.length === 0) return NextResponse.json({ data: null }, { status: 200 });
    return NextResponse.json({ data: res.rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

// POST /api/user  { user_id, nickname? }
export async function POST(req: NextRequest) {
  try {
    const { user_id, nickname } = await req.json();
    if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    await turso.execute(`INSERT OR IGNORE INTO user (id) VALUES (?)`, [user_id]);
    // Ensure nickname column exists (idempotent)
    try {
      await turso.execute(`ALTER TABLE user ADD COLUMN nickname TEXT`);
    } catch {
      // ignore if already exists
    }
    if (typeof nickname === "string" && nickname.trim().length > 0) {
      await turso.execute(`UPDATE user SET nickname = ? WHERE id = ?`, [nickname.trim(), user_id]);
    }

    const res = await turso.execute(`SELECT id, nickname FROM user WHERE id = ?`, [user_id]);
    return NextResponse.json({ data: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json({ error: "Error creating/updating user" }, { status: 500 });
  }
}
