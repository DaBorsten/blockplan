import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// POST /api/timetable/notes/copy
export async function POST(req: NextRequest) {
  const { currentWeekId, specialization, selectedWeekID } = await req.json();
  if (!currentWeekId || !specialization || !selectedWeekID) {
    return NextResponse.json(
      {
        error: "currentWeekId, specialization, and selectedWeekID are required",
      },
      { status: 400 },
    );
  }
  try {
    // 1. Einträge mit Notes aus der ausgewählten Woche + Spezialisierung laden
    const sourceNotes = await turso.execute(
      `SELECT t.*, tw.class_id
      FROM timetable t
      JOIN timetable_specialization ts ON t.id = ts.timetable_id
      JOIN timetable_week tw ON t.week_id = tw.id
      WHERE
        t.week_id = ? AND
        ts.specialization = ? AND
        NULLIF(TRIM(t.notes), '') IS NOT NULL`,
      [selectedWeekID, specialization],
    );
    let updatedCount = 0;
    for (const entry of sourceNotes.rows) {
      // 2. Entsprechenden Eintrag in der aktuellen Woche suchen
      const matchingEntry = await turso.execute(
        `SELECT t.id
        FROM timetable t
        JOIN timetable_specialization ts ON t.id = ts.timetable_id
        JOIN timetable_week tw ON t.week_id = tw.id
        WHERE
          t.week_id = ? AND
          ts.specialization = ? AND
          t.day = ? AND
          t.hour = ? AND
          tw.class_id = ? AND
          t.subject = ? AND
          t.teacher = ? AND
          NULLIF(TRIM(t.notes), '') IS NULL`,
        [
          currentWeekId,
          specialization,
          entry.day,
          entry.hour,
          entry.class_id,
          entry.subject,
          entry.teacher,
        ],
      );
      if (matchingEntry.rows && matchingEntry.rows[0]) {
        await turso.execute(
          `UPDATE timetable
          SET notes = ?
          WHERE id = ?`,
          [entry.notes, matchingEntry.rows[0].id],
        );
        updatedCount++;
      }
    }
    return NextResponse.json({ updatedCount });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Fehler beim Kopieren der Notizen", details: err.message },
      { status: 500 },
    );
  }
}
