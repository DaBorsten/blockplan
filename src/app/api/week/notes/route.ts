import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// GET /api/week/notes?lessonId=...
export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json(
      { error: "lessonId is required" },
      { status: 400 },
    );
  }
  try {
    const result = await turso.execute(
      `SELECT notes from timetable WHERE id = ?;`,
      [lessonId],
    );

    if (!result) {
      return NextResponse.json({ notes: null });
    }
    return NextResponse.json({ notes: result.rows[0].notes || null });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error selecting notes", details: err.message },
      { status: 500 },
    );
  }
}

// PUT /api/week/notes
export async function PUT(req: NextRequest) {
  const { lessonId, notes } = await req.json();
  if (!lessonId) {
    return NextResponse.json(
      { error: "lessonId is required" },
      { status: 400 },
    );
  }
  try {
    const trimmedNotes = notes?.trim() ?? null;
    const changedNotes = trimmedNotes === "" ? null : trimmedNotes;
    await turso.execute(`UPDATE timetable SET notes = ? WHERE id = ?;`, [
      changedNotes,
      lessonId,
    ]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error updating notes", details: err.message },
      { status: 500 },
    );
  }
}
