import {
  DayScheduleForImport,
  LessonForImport,
  TimetableForClassForImport,
  TimetableForImport,
} from "@/types/timetableData";
import { turso } from "@/lib/tursoClient";
import { getTimeForHour } from "./times";
import { v4 } from "uuid";
import { ResultSet } from "@libsql/client";

export async function InitializeDatabase(): Promise<{
  dbInitialized: boolean;
}> {
  try {
    await turso.execute(`
    CREATE TABLE IF NOT EXISTS timetable_week (
      id TEXT PRIMARY KEY NOT NULL,
      week_title TEXT NOT NULL,
      class TEXT NOT NULL
    );`);

    await turso.execute(`
        CREATE TABLE IF NOT EXISTS timetable (
          id TEXT PRIMARY KEY NOT NULL, 
          week_id TEXT NOT NULL,
          day TEXT NOT NULL,
          hour INT NOT NULL,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          subject TEXT NOT NULL,
          teacher TEXT NOT NULL,
          room TEXT NOT NULL,
          notes TEXT,
          FOREIGN KEY (week_id) REFERENCES timetable_week(id) ON DELETE CASCADE
        );`);

    await turso.execute(`
        CREATE TABLE IF NOT EXISTS timetable_specialization (
          id TEXT PRIMARY KEY NOT NULL,
          timetable_id TEXT NOT NULL,
          specialization INTEGER NOT NULL,
          FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE,
          UNIQUE(timetable_id, specialization)
        );`);

    await turso.execute("PRAGMA foreign_keys = ON");

    return { dbInitialized: true };
  } catch (error) {
    console.error("Error initializing database:", error);
    return { dbInitialized: false };
  }
}

export async function CreateTimetable(
  timetable: TimetableForImport,
  week: string,
) {
  try {
    const week_id = v4();
    const className = timetable.class;
    const timetableData = timetable.timetable;

    await turso.execute(
      `INSERT INTO timetable_week (id, week_title, class) VALUES (?, ?, ?)`,
      [week_id, week, className],
    );

    for (const day in timetableData) {
      const daySchedule =
        timetableData[day as keyof TimetableForClassForImport];

      // Alle Lessons des Tages sammeln
      type LessonWithHour = LessonForImport & { hour: number };

      const allLessonsForDay: LessonWithHour[] = [];

      for (const hourStr in daySchedule) {
        const lessons = daySchedule[hourStr as keyof DayScheduleForImport];
        if (lessons) {
          allLessonsForDay.push(
            ...lessons.map((l) => ({ ...l, hour: parseInt(hourStr, 10) })),
          );
        }
      }

      for (const hourStr in daySchedule) {
        const hour = parseInt(hourStr, 10);
        const lessons = daySchedule[hourStr as keyof DayScheduleForImport];

        if (lessons) {
          for (const lesson of lessons) {
            const lessonId = v4();

            const timeSlot = getTimeForHour(hour, lesson, allLessonsForDay);

            // Haupteintrag in timetable Tabelle
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

            // Spezialisierungen in separate Tabelle
            const specialization = lesson.specialization;

            const specializationId = v4();

            await turso.execute(
              `INSERT INTO timetable_specialization (id, timetable_id, specialization)
                 VALUES (?, ?, ?);`,
              [specializationId, lessonId, specialization],
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error creating timetable data:", error);
  }
}

export function mapRows(result: ResultSet) {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]])),
  );
}
