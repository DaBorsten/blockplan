import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { turso } from "@/lib/tursoClient";

// Helper to ensure user table exists
async function ensureTable() {
  await turso.execute(
    `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      nickname TEXT
    )`
  );
}

// GET /api/user/me -> { data: { id, nickname } | null }
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const authUserId = user.id;

    try {
  const res = await turso.execute(`SELECT id, nickname FROM user WHERE id = ? LIMIT 1`, [authUserId]);
      if (res.rows.length === 0) {
        return NextResponse.json({ data: null }, { status: 200 });
      }
      return NextResponse.json({ data: res.rows[0] }, { status: 200 });
    } catch (innerError: unknown) {
      const msg = String((innerError as { message?: string } | undefined)?.message || innerError || "");
      if (msg.includes("no such table: user")) {
        return NextResponse.json({ data: null }, { status: 200 });
      }
      if (msg.includes("no such column: nickname")) {
        try {
          const fallback = await turso.execute(`SELECT id FROM user WHERE id = ? LIMIT 1`, [authUserId]);
          if (fallback.rows.length === 0) return NextResponse.json({ data: null }, { status: 200 });
          return NextResponse.json({ data: { id: fallback.rows[0].id, nickname: null } }, { status: 200 });
        } catch {
          return NextResponse.json({ data: null }, { status: 200 });
        }
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error in GET /api/user/me:", error);
    return NextResponse.json({ error: "Error fetching profile" }, { status: 500 });
  }
}

// POST /api/user/me  { nickname } -> create/update row
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const authUserId = user.id;

    const { nickname } = await req.json().catch(() => ({}));
    const trimmed = typeof nickname === "string" ? nickname.trim() : "";
    if (!trimmed) {
      return NextResponse.json({ error: "Missing or empty nickname" }, { status: 400 });
    }

    await ensureTable();
  await turso.execute(`INSERT OR IGNORE INTO user (id) VALUES (?)`, [authUserId]);
  await turso.execute(`UPDATE user SET nickname = ? WHERE id = ?`, [trimmed, authUserId]);

  const res = await turso.execute(`SELECT id, nickname FROM user WHERE id = ? LIMIT 1`, [authUserId]);
    return NextResponse.json({ data: res.rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/user/me:", error);
    return NextResponse.json({ error: "Error updating profile" }, { status: 500 });
  }
}
