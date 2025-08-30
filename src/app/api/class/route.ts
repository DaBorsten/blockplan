import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { v4 } from "uuid";
import { teacherColors as defaultTeacherColors } from "@/constants/teacherColors";
import { requireAuthUserId } from "@/lib/auth";

// GET /api/class?id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const res = await turso.execute(`SELECT id, title FROM class WHERE id = ? LIMIT 1`, [id]);
    if (res.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: res.rows[0] });
  } catch (error) {
    console.error("Error getting class:", error);
    return NextResponse.json({ error: "Error getting class" }, { status: 500 });
  }
}

// POST /api/class
export async function POST(req: NextRequest) {
  try {
  const userId = requireAuthUserId(req);
    const body = await req.json();
    const className = body?.class as string | undefined;
    if (!className) {
      return NextResponse.json(
        { error: "Missing required field: class" },
        { status: 400 },
      );
    }

    const class_id = v4();

    await turso.execute(`INSERT INTO class (id, owner_id, title ) VALUES (?, ?, ?)`, [class_id, userId, className]);
    // add owner membership row
    try {
      await turso.execute(`INSERT INTO user_class (class_id, user_id, role) VALUES (?, ?, 'owner')`, [class_id, userId]);
    } catch (e) {
      console.warn("Failed to insert owner into user_class", e);
    }

    // Seed default teacher colors with generated ids (best-effort; failures won't abort class creation)
    try {
      for (const tc of defaultTeacherColors) {
        if (!tc.teacher || !tc.color) continue;
        await turso.execute(
          `INSERT INTO color (id, class_id, teacher, color) VALUES (?, ?, ?, ?)`,
          [v4(), class_id, tc.teacher, tc.color],
        );
      }
    } catch (seedErr) {
      console.warn("Seeding teacher colors failed for class", class_id, seedErr);
    }

  return NextResponse.json({ message: "Class created successfully", class_id }, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Error creating class" },
      { status: 500 },
    );
  }
}

// DELETE /api/class?id=...
// Removes class if requester is owner. Also deletes related data (user_class, color, week, timetable rows) best-effort.
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
  const userId = requireAuthUserId(req);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // verify ownership
    const ownerRes = await turso.execute(`SELECT owner_id FROM class WHERE id = ? LIMIT 1`, [id]);
    if (ownerRes.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const owner_id = (ownerRes.rows[0] as { owner_id?: string }).owner_id;
  if (owner_id !== userId) {
      return NextResponse.json({ error: "Only owner can delete class" }, { status: 403 });
    }

    // best-effort cascading deletes (ignore errors per table)
  type Statement = { sql: string; args?: (string | null | undefined)[] };
  const tables: Statement[] = [
      { sql: `DELETE FROM user_class WHERE class_id = ?`, args: [id] },
      { sql: `DELETE FROM color WHERE class_id = ?`, args: [id] },
      { sql: `DELETE FROM week WHERE class_id = ?`, args: [id] },
      { sql: `DELETE FROM timetable WHERE class_id = ?`, args: [id] },
    ];
    for (const t of tables) {
      const argsFiltered: (string | null)[] | undefined = t.args
        ? t.args.filter((v): v is string | null => v !== undefined)
        : undefined;
      try { await turso.execute(t.sql, argsFiltered); } catch (e) { console.warn("Delete cascade failed", t.sql, e); }
    }

    await turso.execute(`DELETE FROM class WHERE id = ?`, [id]);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json({ error: "Error deleting class" }, { status: 500 });
  }
}
