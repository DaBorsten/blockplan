import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { v4 } from "uuid";

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
    const { class: className, owner_id } = await req.json();

    if (!className || !owner_id) {
      return NextResponse.json(
        { error: "Missing required fields: class, owner_id" },
        { status: 400 },
      );
    }

    const class_id = v4();

    await turso.execute(
      `INSERT INTO class (id, owner_id, title ) VALUES (?, ?, ?)`,
      [class_id, owner_id, className],
    );

    return NextResponse.json(
      { message: "Class created successfully", class_id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Error creating class" },
      { status: 500 },
    );
  }
}
