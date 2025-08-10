import { NextResponse } from "next/server";
import { getAllWeekIdsWithNames } from "@/utils/db";

// GET /api/weeks
export async function GET() {
  try {
    const weeks = await getAllWeekIdsWithNames();
    return NextResponse.json({ weeks });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Wochen." }, { status: 500 });
  }
}
