import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// PUT /api/class/className
export async function PUT(req: NextRequest) {
  const { classID, newClassName } = await req.json();
  if (!classID || !newClassName) {
    return NextResponse.json({ error: "classID and newClassName are required" }, { status: 400 });
  }
  try {
    await turso.execute(
      `UPDATE class SET title = ? WHERE id = ?;`,
      [newClassName, classID],
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: "Error updating class name", details: err.message }, { status: 500 });
  }
}
