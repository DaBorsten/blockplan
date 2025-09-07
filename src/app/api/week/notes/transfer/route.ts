import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { resolveGroupIds } from "@/utils/groups";

// Helper: count transferable notes between source and target weeks for a group
async function countTransferable(
  sourceWeekId: string,
  targetWeekId: string,
  group: number,
) {
  const groupIds = resolveGroupIds(group);
  const placeholders = groupIds.map(() => "?").join(",");
  // Count matches where target has empty notes and all fields match incl. room and same class.
  // Group must match exactly per entry; we filter by allowed set via IN and keep equality via join.
  const sql = `SELECT COUNT(*) AS transferableCount
    FROM timetable s
    JOIN timetable_group sg ON sg.timetable_id = s.id
    JOIN timetable_week sw ON sw.id = s.week_id
    JOIN timetable t ON t.week_id = ?
      AND t.day = s.day
      AND t.hour = s.hour
      AND t.subject = s.subject
      AND t.teacher = s.teacher
      AND t.room = s.room
    JOIN timetable_group ts ON ts.timetable_id = t.id AND ts.groupNumber = sg.groupNumber
    JOIN timetable_week tw ON tw.id = t.week_id AND tw.class_id = sw.class_id
    WHERE s.week_id = ?
     AND sg.groupNumber IN (${placeholders})
     AND NULLIF(TRIM(s.notes), '') IS NOT NULL
     AND NULLIF(TRIM(t.notes), '') IS NULL;`;
  const params = [targetWeekId, sourceWeekId, ...groupIds];
  const result = await turso.execute(sql, params);
  const row = result.rows?.[0] as { transferableCount?: number } | undefined;
  return Number(row?.transferableCount ?? 0);
}

// GET /api/week/notes/transfer?sourceWeekId=...&targetWeekId=...&group=...
// Returns a preview count of transferable notes based on strict matching rules.
export async function GET(req: NextRequest) {
  try {
    const sourceWeekId = req.nextUrl.searchParams.get("sourceWeekId");
    const targetWeekId = req.nextUrl.searchParams.get("targetWeekId");
    const groupParam = req.nextUrl.searchParams.get("group");
    const group = groupParam ? Number(groupParam) : undefined;

    if (
      !sourceWeekId ||
      !targetWeekId ||
      groupParam === null ||
      group === undefined
    ) {
      return NextResponse.json(
        { error: "sourceWeekId, targetWeekId and group are required" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(group) || (group as number) <= 0) {
      return NextResponse.json(
        { error: "group must be a positive number" },
        { status: 400 },
      );
    }

    const transferableCount = await countTransferable(
      sourceWeekId,
      targetWeekId,
      group,
    );
    // Also compute total notes in source week for the chosen group set
    const groupIds = resolveGroupIds(group);
    const placeholders = groupIds.map(() => "?").join(",");
    const totalSql = `SELECT COUNT(*) AS totalCount
      FROM timetable s
      JOIN timetable_group sg ON sg.timetable_id = s.id
      WHERE s.week_id = ?
        AND sg.groupNumber IN (${placeholders})
        AND NULLIF(TRIM(s.notes), '') IS NOT NULL;`;
    const totalRes = await turso.execute(totalSql, [sourceWeekId, ...groupIds]);
    const totalRow = (totalRes.rows?.[0] ?? {}) as Record<string, unknown>;
    const totalCount = Number(
      typeof totalRow.totalCount === "number"
        ? totalRow.totalCount
        : Number(totalRow.totalCount ?? 0),
    );
    return NextResponse.json({ transferableCount, totalCount });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error computing transferable notes", details: err.message },
      { status: 500 },
    );
  }
}

// POST /api/week/notes/transfer { sourceWeekId, targetWeekId, group }
// Performs the transfer using the same strict matching, updates target notes, and returns updatedCount and preview count.
export async function POST(req: NextRequest) {
  try {
    const { sourceWeekId, targetWeekId, group } = await req.json();
    if (!sourceWeekId || !targetWeekId || !group) {
      return NextResponse.json(
        { error: "sourceWeekId, targetWeekId and group are required" },
        { status: 400 },
      );
    }

    // Load source entries with notes for the group set
    const groupIds = resolveGroupIds(Number(group));
    const placeholders = groupIds.map(() => "?").join(",");
    const sourceSql = `SELECT s.day, s.hour, s.subject, s.teacher, s.room, s.notes, sw.class_id, sg.groupNumber
       FROM timetable s
       JOIN timetable_group sg ON sg.timetable_id = s.id
       JOIN timetable_week sw ON sw.id = s.week_id
       WHERE s.week_id = ?
         AND sg.groupNumber IN (${placeholders})
         AND NULLIF(TRIM(s.notes), '') IS NOT NULL;`;
    const sourceNotes = await turso.execute(sourceSql, [
      sourceWeekId,
      ...groupIds,
    ]);

    let updatedCount = 0;
    const rows = sourceNotes.rows as unknown as Record<string, unknown>[];
    for (const r of rows) {
      const class_id = String(r.class_id ?? "");
      const day = String(r.day ?? "");
      const hour = Number(r.hour ?? 0);
      const subject = String(r.subject ?? "");
      const teacher = String(r.teacher ?? "");
      const room = String(r.room ?? "");
      const notes = String(r.notes ?? "");
      const group = Number(r.groupNumber ?? 1);
      const matching = await turso.execute(
        `SELECT t.id
         FROM timetable t
         JOIN timetable_group tg ON tg.timetable_id = t.id AND tg.groupNumber = ?
         JOIN timetable_week tw ON tw.id = t.week_id
         WHERE t.week_id = ?
           AND tw.class_id = ?
           AND t.day = ?
           AND t.hour = ?
           AND t.subject = ?
           AND t.teacher = ?
           AND t.room = ?
           AND NULLIF(TRIM(t.notes), '') IS NULL
         LIMIT 1;`,
        [group, targetWeekId, class_id, day, hour, subject, teacher, room],
      );
      const target = matching.rows?.[0] as { id?: string } | undefined;
      if (target?.id) {
        await turso.execute(`UPDATE timetable SET notes = ? WHERE id = ?;`, [
          notes,
          target.id,
        ]);
        updatedCount++;
      }
    }

    const transferableCount = await countTransferable(
      sourceWeekId,
      targetWeekId,
      group,
    );
    return NextResponse.json({ updatedCount, transferableCount });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Error transferring notes", details: err.message },
      { status: 500 },
    );
  }
}
