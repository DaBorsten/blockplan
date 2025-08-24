import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// POST /api/class/stats  body: { class_ids: string[], user_id: string }
// Validates membership for each class (must be member) then returns counts.
export async function POST(req: NextRequest) {
  try {
    const { class_ids, user_id } = await req.json();
    if (!Array.isArray(class_ids) || class_ids.length === 0 || !user_id) {
      return NextResponse.json({ error: "Missing class_ids or user_id" }, { status: 400 });
    }

    // Validate membership for provided classes in one query
    const placeholders = class_ids.map(() => '?').join(',');
    const membershipRes = await turso.execute(
      `SELECT class_id FROM user_class WHERE user_id = ? AND class_id IN (${placeholders})`,
      [user_id, ...class_ids]
    );
    type RowWithClass = { class_id: string };
  const allowed = new Set(((membershipRes.rows as unknown) as RowWithClass[]).map(r => r.class_id));
    const filtered = class_ids.filter(id => allowed.has(id));
    if (filtered.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const ph2 = filtered.map(() => '?').join(',');
    // Get member counts
    const memberCountsRes = await turso.execute(
      `SELECT class_id, COUNT(*) as member_count FROM user_class WHERE class_id IN (${ph2}) GROUP BY class_id`,
      filtered
    );
    type MemberCountRow = { class_id: string; member_count: number };
    const memberCounts: Record<string, number> = {};
  for (const row of (memberCountsRes.rows as unknown as MemberCountRow[])) {
      memberCounts[row.class_id] = Number(row.member_count) || 0;
    }

    // Get week counts
    const weekCountsRes = await turso.execute(
      `SELECT class_id, COUNT(*) as week_count FROM timetable_week WHERE class_id IN (${ph2}) GROUP BY class_id`,
      filtered
    );
    type WeekCountRow = { class_id: string; week_count: number };
    const weekCounts: Record<string, number> = {};
  for (const row of (weekCountsRes.rows as unknown as WeekCountRow[])) {
      weekCounts[row.class_id] = Number(row.week_count) || 0;
    }

    const result = filtered.map(id => ({
      class_id: id,
      members: memberCounts[id] ?? 0,
      weeks: weekCounts[id] ?? 0,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error computing class stats', error);
    return NextResponse.json({ error: 'Error computing class stats' }, { status: 500 });
  }
}
