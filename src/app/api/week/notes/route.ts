import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { requireAuthUserId } from "@/lib/auth";

// Helper function to check if user has access to a lesson
async function validateLessonAccess(lessonId: string, userId: string): Promise<boolean> {
  try {
    const result = await turso.execute(
      `SELECT 1 FROM timetable t
       JOIN timetable_week tw ON t.week_id = tw.id
       JOIN user_class uc ON tw.class_id = uc.class_id
       WHERE t.id = ? AND uc.user_id = ? LIMIT 1`,
      [lessonId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking lesson access:", error);
    return false;
  }
}

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
    const userId = requireAuthUserId(req);
    
    // Check if user has access to this lesson
    const hasAccess = await validateLessonAccess(lessonId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    const result = await turso.execute(
      `SELECT notes from timetable WHERE id = ?;`,
      [lessonId],
    );

    if (!result) {
      return NextResponse.json({ notes: null });
    }
    return NextResponse.json({ notes: result.rows[0].notes || null });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'Unauthenticated') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
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
    const userId = requireAuthUserId(req);
    
    // Check if user has access to this lesson
    const hasAccess = await validateLessonAccess(lessonId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    const trimmedNotes = notes?.trim() ?? null;
    const changedNotes = trimmedNotes === "" ? null : trimmedNotes;
    await turso.execute(`UPDATE timetable SET notes = ? WHERE id = ?;`, [
      changedNotes,
      lessonId,
    ]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'Unauthenticated') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error updating notes", details: err.message },
      { status: 500 },
    );
  }
}
