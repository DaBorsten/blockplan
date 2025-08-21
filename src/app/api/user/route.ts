import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/user?user_id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    // Try to read user. If table or column doesn't exist yet, treat as no user configured.
    try {
      const res = await turso.execute(`SELECT id, nickname FROM user WHERE id = ? LIMIT 1`, [user_id]);
      if (res.rows.length === 0) return NextResponse.json({ data: null }, { status: 200 });
      return NextResponse.json({ data: res.rows[0] });
    } catch (innerError: unknown) {
      const msg = String((innerError as { message?: string } | undefined)?.message || innerError || "");
      // If the table doesn't exist yet, or the nickname column is missing, return as not configured
      if (msg.includes("no such table: user")) {
        return NextResponse.json({ data: null }, { status: 200 });
      }
      if (msg.includes("no such column: nickname")) {
        // Fallback: select only id to check existence
        try {
          const fallback = await turso.execute(`SELECT id FROM user WHERE id = ? LIMIT 1`, [user_id]);
          if (fallback.rows.length === 0) return NextResponse.json({ data: null }, { status: 200 });
          return NextResponse.json({ data: { id: fallback.rows[0].id, nickname: null } }, { status: 200 });
        } catch (fallbackErr) {
          console.error("Error fetching user (fallback):", fallbackErr);
          return NextResponse.json({ data: null }, { status: 200 });
        }
      }
      throw innerError;
    }
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

    // Ensure table exists (created only when POSTing) and nickname column present
    await turso.execute(
      `CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        nickname TEXT
      )`
    );
    // In case an older schema exists without nickname, add it idempotently


    // Create user row if it doesn't exist yet
    await turso.execute(`INSERT OR IGNORE INTO user (id) VALUES (?)`, [user_id]);

    // Optionally set/update nickname when provided
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
