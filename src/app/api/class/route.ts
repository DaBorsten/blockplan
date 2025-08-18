import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { v4 } from "uuid";

// POST /api/class
export async function POST(req: NextRequest) {
  try {
    const { class: className, owner_id } = await req.json();
    const class_id = v4();

    await turso.execute(
      `INSERT INTO class (id, owner_id, title ) VALUES (?, ?, ?)`,
      [class_id, owner_id, className],
    );

    return NextResponse.json(
      { message: "Class created successfully" },
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
