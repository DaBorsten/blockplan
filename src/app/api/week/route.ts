import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { getTimeForHour } from "@/utils/times";
import { v4 } from "uuid";
import { Lesson } from "@/types/timetableData";

// POST /api/week
export async function POST(req: NextRequest) {
  try {
    const { timetable, week, class_id } = await req.json();
    const week_id = v4();
    const timetableData = timetable.timetable;

    await turso.execute(
      `INSERT INTO timetable_week (id, week_title, class_id) VALUES (?, ?, ?)`,
      [week_id, week, class_id],
    );

    for (const day in timetableData) {
      const daySchedule = timetableData[day];
      // Alle Lessons des Tages sammeln
      const allLessonsForDay: Lesson[] = [];
      for (const hourStr in daySchedule) {
        const lessons: Lesson[] = daySchedule[hourStr];
        if (lessons) {
          allLessonsForDay.push(
            ...lessons.map((l: Lesson) => ({
              ...l,
              hour: parseInt(hourStr, 10),
            })),
          );
        }
      }
      for (const hourStr in daySchedule) {
        const hour = parseInt(hourStr, 10);
        const lessons = daySchedule[hourStr];
        if (lessons) {
          for (const lesson of lessons) {
            const lessonId = v4();
            const timeSlot = getTimeForHour(hour, lesson, allLessonsForDay);
            await turso.execute(
              `INSERT INTO timetable (id, week_id, day, hour, startTime, endTime, subject, teacher, room, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                lessonId,
                week_id,
                day,
                hour,
                timeSlot.start,
                timeSlot.end,
                lesson.subject,
                lesson.teacher,
                lesson.room,
                null,
              ],
            );
            const group = lesson.specialization;
            const groupId = v4();
            await turso.execute(
              `INSERT INTO timetable_group (id, timetable_id, groupNumber)
                 VALUES (?, ?, ?);`,
              [groupId, lessonId, group],
            );
          }
        }
      }
    }
    return NextResponse.json({ success: true, week_id });
  } catch (error) {
    console.error("Error creating timetable data:", error);
    return NextResponse.json(
      { error: "Error creating timetable data" },
      { status: 500 },
    );
  }
}
