import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/class/teacherColors?class_id=...&user_id=...
export async function GET(req: NextRequest) {
  try {
    const class_id = req.nextUrl.searchParams.get("class_id");
    const user_id = req.nextUrl.searchParams.get("user_id");
    if (!class_id || !user_id) {
      return NextResponse.json({ error: "Missing class_id or user_id" }, { status: 400 });
    }
    // membership check
    const membership = await turso.execute(
      `SELECT 1 FROM user_class WHERE class_id = ? AND user_id = ? LIMIT 1`,
      [class_id, user_id],
    );
    if (!membership.rows[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const res = await turso.execute(
      `SELECT teacher, color FROM color WHERE class_id = ? ORDER BY teacher`,
      [class_id],
    );
    return NextResponse.json({ data: res.rows });
  } catch (e) {
    console.error("GET teacherColors error", e);
    return NextResponse.json({ error: "Error fetching teacher colors" }, { status: 500 });
  }
}

// POST /api/class/teacherColors  body: { class_id, user_id, items: [{id?, teacher, color}] }
// Performs bulk upsert (insert or update). Returns updated list.
export async function POST(req: NextRequest) {
  try {
    const { class_id, user_id, items } = await req.json();
    if (!class_id || !user_id || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing class_id, user_id or items" }, { status: 400 });
    }
    // permission: must be member (any role)
    const membership = await turso.execute(
      `SELECT role FROM user_class WHERE class_id = ? AND user_id = ? LIMIT 1`,
      [class_id, user_id],
    );
    if (!membership.rows[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Upsert each item (simplistic). Could optimize with transaction once available.
    for (const item of items) {
      const teacher_code = (item.teacher || "").trim();
      const color = (item.color || "").trim();
      if (!teacher_code || !color) continue; // skip invalid
      // try update first
      if (item.id) {
        await turso.execute(
          `UPDATE teacher_color SET teacher_code = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND class_id = ?`,
          [teacher_code, color, item.id, class_id],
        );
        // If no row changed, insert new with provided id
        // libsql client doesn't expose changes easily; perform existence check
        const check = await turso.execute(
          `SELECT 1 FROM teacher_color WHERE id = ?`,
          [item.id],
        );
        if (!check.rows[0]) {
          await turso.execute(
            `INSERT INTO teacher_color (id, class_id, teacher_code, color) VALUES (?, ?, ?, ?)`,
            [item.id, class_id, teacher_code, color],
          );
        }
      } else {
        await turso.execute(
          `INSERT INTO color (class_id, teacher, color) VALUES (?, ?, ?)`,
          [class_id, teacher_code, color],
        );
      }
    }
    const res = await turso.execute(
      `SELECT teacher, color FROM color WHERE class_id = ? ORDER BY teacher`,
      [class_id],
    );
    return NextResponse.json({ data: res.rows });
  } catch (e) {
    console.error("POST teacherColors error", e);
    return NextResponse.json({ error: "Error saving teacher colors" }, { status: 500 });
  }
}

// DELETE /api/class/teacherColors?id=...&class_id=...&user_id=...
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const class_id = req.nextUrl.searchParams.get("class_id");
    const user_id = req.nextUrl.searchParams.get("user_id");
    if (!id || !class_id || !user_id) {
      return NextResponse.json({ error: "Missing id, class_id or user_id" }, { status: 400 });
    }
    const membership = await turso.execute(
      `SELECT 1 FROM user_class WHERE class_id = ? AND user_id = ? LIMIT 1`,
      [class_id, user_id],
    );
    if (!membership.rows[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await turso.execute(
      `DELETE FROM teacher_color WHERE id = ? AND class_id = ?`,
      [id, class_id],
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE teacherColors error", e);
    return NextResponse.json({ error: "Error deleting teacher color" }, { status: 500 });
  }
}
