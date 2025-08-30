import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { v4 as uuid } from "uuid";
import { requireAuthUserId } from "@/lib/auth";

// GET /api/class/teacherColors?class_id=... (user inferred)
export async function GET(req: NextRequest) {
  try {
  const class_id = req.nextUrl.searchParams.get("class_id");
  const userId = requireAuthUserId(req);
  if (!class_id) return NextResponse.json({ error: "Missing class_id" }, { status: 400 });
    // membership check
    const membership = await turso.execute(
      `SELECT 1 FROM user_class WHERE class_id = ? AND user_id = ? LIMIT 1`,
      [class_id, userId],
    );
    if (!membership.rows[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const res = await turso.execute(
      `SELECT id, teacher, color FROM color WHERE class_id = ? ORDER BY teacher`,
      [class_id],
    );
    return NextResponse.json({ data: res.rows });
  } catch (e) {
    console.error("GET teacherColors error", e);
    return NextResponse.json(
      { error: "Error fetching teacher colors" },
      { status: 500 },
    );
  }
}

// POST /api/class/teacherColors  body: { class_id, items: [{ id?, teacher, color }] }
// Logic:
//  - if id present: attempt UPDATE (with optional teacher change). On unique conflict (teacher already used), respond 409.
//  - if no id: INSERT new (uuid). On conflict(class_id,teacher) -> UPDATE color.
export async function POST(req: NextRequest) {
  try {
  const { class_id, items } = await req.json();
  const userId = requireAuthUserId(req);
    if (!class_id || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing class_id or items" }, { status: 400 });
    }
    // permission: must be member (any role)
    const membership = await turso.execute(
      `SELECT role FROM user_class WHERE class_id = ? AND user_id = ? LIMIT 1`,
      [class_id, userId],
    );
    if (!membership.rows[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    for (const raw of items as Array<{ id?: string; teacher?: string; color?: string }>) {
      const teacher = (raw.teacher || "").trim();
      const color = (raw.color || "").trim();
      if (!teacher || !color) continue;
      if (raw.id) {
        try {
          // Update existing by id. If teacher changed we must ensure no duplicate.
          const existing = await turso.execute(
            `SELECT teacher FROM color WHERE id = ? AND class_id = ? LIMIT 1`,
            [raw.id, class_id],
          );
          if (!existing.rows[0]) {
            // treat as insert fallback
            await turso.execute(
              `INSERT INTO color (id, class_id, teacher, color) VALUES (?, ?, ?, ?)`,
              [raw.id, class_id, teacher, color],
            );
            continue;
          }
          const oldTeacher = (existing.rows[0] as { teacher?: string }).teacher;
          if (oldTeacher !== teacher) {
            // Check uniqueness
            const dupe = await turso.execute(
              `SELECT id FROM color WHERE class_id = ? AND teacher = ? AND id <> ? LIMIT 1`,
              [class_id, teacher, raw.id],
            );
            if (dupe.rows[0]) {
              return NextResponse.json(
                { error: `Teacher Kürzel '${teacher}' ist bereits vergeben.` },
                { status: 409 },
              );
            }
          }
          await turso.execute(
            `UPDATE color SET teacher = ?, color = ? WHERE id = ? AND class_id = ?`,
            [teacher, color, raw.id, class_id],
          );
        } catch (inner) {
          console.warn("Update color entry failed", { raw, inner });
        }
      } else {
        try {
          await turso.execute(
            `INSERT INTO color (id, class_id, teacher, color) VALUES (?, ?, ?, ?) ON CONFLICT(class_id, teacher) DO UPDATE SET color=excluded.color`,
            [uuid(), class_id, teacher, color],
          );
        } catch (inner) {
          console.warn("Insert color entry failed", { raw, inner });
        }
      }
    }
    const res = await turso.execute(
      `SELECT id, teacher, color FROM color WHERE class_id = ? ORDER BY teacher`,
      [class_id],
    );
    return NextResponse.json({ data: res.rows });
  } catch (e) {
    console.error("POST teacherColors error", e);
    return NextResponse.json(
      { error: "Error saving teacher colors" },
      { status: 500 },
    );
  }
}

// DELETE /api/class/teacherColors?id=...&class_id=...
export async function DELETE(req: NextRequest) {
  try {
  const id = req.nextUrl.searchParams.get("id");
  const class_id = req.nextUrl.searchParams.get("class_id");
  const userId = requireAuthUserId(req);
    if (!id || !class_id) return NextResponse.json({ error: "Missing id or class_id" }, { status: 400 });
    const membership = await turso.execute(
      `SELECT 1 FROM user_class WHERE class_id = ? AND user_id = ? LIMIT 1`,
      [class_id, userId],
    );
    if (!membership.rows[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await turso.execute(
      `DELETE FROM color WHERE id = ? AND class_id = ?`,
      [id, class_id],
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE teacherColors error", e);
    return NextResponse.json(
      { error: "Error deleting teacher color" },
      { status: 500 },
    );
  }
}
